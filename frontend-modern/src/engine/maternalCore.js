// Offline maternal-risk core: Random-Forest inference + clinical rule layer.
// Pure functions, no imports, no network. Safe to run in the browser.

const LEVEL_ORDER = { Green: 0, Yellow: 1, Red: 2 };
const LABEL_TO_LEVEL = { 'low risk': 'Green', 'mid risk': 'Yellow', 'high risk': 'Red' };
const maxLevel = (a, b) => (LEVEL_ORDER[a] >= LEVEL_ORDER[b] ? a : b);

export function createPredictor(model) {
    const { trees, features, labels } = model;

    function walk(tree, x) {
        let node = 0;
        while (tree.left[node] !== -1) {
            // scikit-learn compares in float32, so do the same to get identical results
            node = Math.fround(x[tree.feature[node]]) <= tree.threshold[node] ? tree.left[node] : tree.right[node];
        }
        return tree.value[node];
    }

    // x: array in the same order as model.features
    function predictProba(x) {
        const acc = new Array(labels.length).fill(0);
        for (const t of trees) {
            const p = walk(t, x);
            for (let i = 0; i < acc.length; i++) acc[i] += p[i];
        }
        return acc.map((v) => v / trees.length);
    }

    return { predictProba, features, labels, importances: model.importances };
}

// The UCI dataset stores temperature in Fahrenheit and blood sugar in mmol/L.
// The app works in Celsius and mg/dL, so convert here.
export function toModelInput({ age, sbp, dbp, bloodSugarMgDl, tempC, hr }) {
    return [age, sbp, dbp, bloodSugarMgDl / 18, (tempC * 9) / 5 + 32, hr];
}

const DANGER = {
    vaginal_bleeding: 'Red',
    convulsions: 'Red',
    severe_headache: 'Red',
    blurred_vision: 'Red',
    reduced_fetal_movement: 'Red',
    breathless_at_rest: 'Red',
    severe_abdominal_pain: 'Red',
    swelling_face_hands: 'Yellow',
    fever: 'Yellow',
};

const DANGER_TEXT = {
    vaginal_bleeding: 'Vaginal bleeding reported',
    convulsions: 'Convulsions / fits reported',
    severe_headache: 'Severe headache reported',
    blurred_vision: 'Blurred vision reported',
    reduced_fetal_movement: 'Reduced fetal movement reported',
    breathless_at_rest: 'Breathlessness at rest reported',
    severe_abdominal_pain: 'Severe abdominal pain reported',
    swelling_face_hands: 'Swelling of face or hands reported',
    fever: 'Fever reported',
};

// Screening thresholds. Must be reviewed by a clinician before any real use.
function ruleLayer({ vitals, dangerSigns = [], hb }) {
    let level = 'Green';
    const reasons = [];
    const add = (lvl, code, text) => {
        level = maxLevel(level, lvl);
        reasons.push({ code, level: lvl, text });
    };
    const { sbp, dbp, tempC, hr, bloodSugarMgDl } = vitals;

    if (sbp >= 160 || dbp >= 110) add('Red', 'severe_bp', `Severe-range blood pressure ${sbp}/${dbp} mmHg`);
    else if (sbp >= 140 || dbp >= 90) add('Yellow', 'high_bp', `Raised blood pressure ${sbp}/${dbp} mmHg (140/90 or above)`);

    if (hb != null && hb !== '') {
        if (hb < 7) add('Red', 'severe_anaemia', `Severe anaemia: Hb ${hb} g/dL (below 7)`);
        else if (hb < 11) add('Yellow', 'anaemia', `Anaemia: Hb ${hb} g/dL (below 11)`);
    }
    if (tempC >= 38) add('Yellow', 'fever_temp', `Temperature ${tempC} \u00b0C (fever)`);
    if (hr > 120 || hr < 50) add('Yellow', 'abnormal_hr', `Abnormal heart rate ${hr} bpm`);
    if (bloodSugarMgDl >= 200) add('Yellow', 'high_sugar', `High blood sugar ${bloodSugarMgDl} mg/dL`);

    for (const d of dangerSigns) {
        if (DANGER[d]) add(DANGER[d], `danger_${d}`, DANGER_TEXT[d]);
    }
    // swelling together with raised BP is a pre-eclampsia warning pattern
    if (dangerSigns.includes('swelling_face_hands') && (sbp >= 140 || dbp >= 90)) {
        add('Red', 'preeclampsia_pattern', 'Swelling with raised blood pressure: possible pre-eclampsia pattern');
    }
    return { level, reasons };
}

export function createMaternalAssessor(model) {
    const predictor = createPredictor(model);

    return function assessMaternal({ vitals, dangerSigns = [], hb }) {
        const needed = ['age', 'sbp', 'dbp', 'bloodSugarMgDl', 'tempC', 'hr'];
        const missing = needed.filter((k) => vitals[k] == null || Number.isNaN(Number(vitals[k])));

        const rules = ruleLayer({ vitals, dangerSigns, hb });

        let ml = null;
        if (missing.length === 0) {
            const probs = predictor.predictProba(toModelInput(vitals));
            const bestIdx = probs.indexOf(Math.max(...probs));
            ml = {
                label: predictor.labels[bestIdx],
                level: LABEL_TO_LEVEL[predictor.labels[bestIdx]],
                confidence: Number(probs[bestIdx].toFixed(3)),
                probabilities: Object.fromEntries(predictor.labels.map((l, i) => [l, Number(probs[i].toFixed(3))])),
            };
        }

        // Rules can only RAISE the level, never lower the model's output.
        let finalLevel = ml ? maxLevel(rules.level, ml.level) : rules.level;

        const reasons = [...rules.reasons];
        // Never show a reassuring Green when key measurements are missing.
        if (missing.length > 0) {
            finalLevel = maxLevel(finalLevel, 'Yellow');
            reasons.push({
                code: 'insufficient_data',
                level: 'Yellow',
                text: `Not enough measurements to rule out risk (missing: ${missing.join(', ')})`,
            });
        }
        if (ml) {
            reasons.push({
                code: 'ml_pattern',
                level: ml.level,
                text: `Vitals pattern matches "${ml.label}" in the training data (model confidence ${Math.round(ml.confidence * 100)}%)`,
            });
        }

        return {
            level: finalLevel,
            escalation: { Green: 'Routine care and follow-up', Yellow: 'Visit PHC / doctor review within 24 hours', Red: 'Refer immediately' }[finalLevel],
            ml,
            ruleLevel: rules.level,
            reasons,
            // low confidence or missing inputs are surfaced honestly
            insufficientData: missing.length > 0,
            missingInputs: missing,
            lowConfidence: ml ? ml.confidence < 0.5 : false,
            disclaimer: 'Decision support, not a diagnosis. Not clinically validated.',
        };
    };
}
