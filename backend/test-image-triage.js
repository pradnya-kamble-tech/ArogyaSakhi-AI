// ============================================================
// Test: Image Triage Engine + Escalation Integration
// Run: node test-image-triage.js
// ============================================================

'use strict';

const { evaluateImageTriage } = require('./services/imageTriageEngine');
const { determineEscalation } = require('./services/escalationEngine');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.log(`  ✗ ${label}`);
        console.log(`      Expected: ${JSON.stringify(expected)}`);
        console.log(`      Got:      ${JSON.stringify(actual)}`);
        failed++;
    }
}

function assertTruthy(label, value) {
    if (value) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.log(`  ✗ ${label} (got falsy: ${value})`);
        failed++;
    }
}

// ── imageTriageEngine tests ─────────────────────────────────────────────────
console.log('\n[1] imageTriageEngine — evaluateImageTriage()\n');

// Case 1: No attachments → default safe result
const r1 = evaluateImageTriage({});
assert('No attachments → imageReviewed: false', r1.imageReviewed, false);
assert('No attachments → recommendation: null', r1.recommendation, null);
assert('No attachments → escalationModifier: 0', r1.escalationModifier, 0);

// Case 2: Attachment present, normal symptom
const r2 = evaluateImageTriage({ attachments: [{ filename: 'img.jpg' }], symptoms: ['fever'], baseRiskScore: 40 });
assert('Attachment + normal symptom → imageReviewed: true', r2.imageReviewed, true);
assert('Attachment + normal symptom → recommendation: null', r2.recommendation, null);
assert('Attachment + normal symptom → escalationModifier: 0', r2.escalationModifier, 0);

// Case 3: Attachment + wound symptom → recommendation
const r3 = evaluateImageTriage({ attachments: [{ filename: 'img.png' }], symptoms: ['wound'], baseRiskScore: 30 });
assert('wound symptom → imageReviewed: true', r3.imageReviewed, true);
assert('wound symptom → recommendation set', r3.recommendation, 'Visual inspection recommended by doctor.');
assert('wound symptom + low risk → escalationModifier still 0', r3.escalationModifier, 0);

// Case 4: Attachment + infection symptom → recommendation
const r4 = evaluateImageTriage({ attachments: [{ filename: 'img.jpg' }], symptoms: ['skin infection'], baseRiskScore: 50 });
assert('infection symptom → recommendation set', r4.recommendation, 'Visual inspection recommended by doctor.');

// Case 5: Attachment + high risk (>70) → escalationModifier: 5
const r5 = evaluateImageTriage({ attachments: [{ filename: 'img.jpg' }], symptoms: ['fever'], baseRiskScore: 75 });
assert('baseRiskScore 75 → escalationModifier: 5', r5.escalationModifier, 5);

// Case 6: Attachment + high risk + wound → both fire
const r6 = evaluateImageTriage({ attachments: [{ filename: 'img.jpg' }], symptoms: ['wound'], baseRiskScore: 80 });
assert('wound + risk>70 → recommendation set', r6.recommendation, 'Visual inspection recommended by doctor.');
assert('wound + risk>70 → escalationModifier: 5', r6.escalationModifier, 5);

// Case 7: undefined/null-safe guards
const r7 = evaluateImageTriage(undefined);
assert('undefined input → safe default', r7.imageReviewed, false);

const r8 = evaluateImageTriage({ attachments: null, symptoms: null, baseRiskScore: null });
assert('null fields → safe default', r8.imageReviewed, false);

// ── escalationEngine integration tests ────────────────────────────────────
console.log('\n[2] escalationEngine — determineEscalation with imageTriage\n');

const BASE_RISK = {
    score: 60,
    reasons: ['reason.fever'],
    conditionCode: 'FEVER',
    treatments: [],
    labTests: []
};
const MATERNAL = { isMaternal: false };

// Case A: no imageTriage passed (3-arg call) → should still work (backward compat)
const rA = determineEscalation(BASE_RISK, MATERNAL, { symptoms: ['fever'], severity: 'Medium', vitals: {} });
assertTruthy('3-arg call still works — finalScore is a number', typeof rA.finalScore === 'number');
assert('3-arg → finalScore unchanged at 60', rA.finalScore, 60);

// Case B: imageTriage with modifier 0 → score unchanged
const rB = determineEscalation(BASE_RISK, MATERNAL,
    { symptoms: ['fever'], severity: 'Medium', vitals: {} },
    { escalationModifier: 0 }
);
assert('imageTriage modifier 0 → finalScore unchanged', rB.finalScore, 60);

// Case C: imageTriage modifier 5 → score becomes 65, still Medium
const rC = determineEscalation(BASE_RISK, MATERNAL,
    { symptoms: ['fever'], severity: 'Medium', vitals: {} },
    { escalationModifier: 5 }
);
assert('imageTriage modifier 5 → finalScore 65', rC.finalScore, 65);
assert('finalScore 65 → riskColor Amber', rC.riskColor, 'Amber');
assertTruthy('image_triage_modifier reason added', rC.allReasons.includes('escalation.reason.image_triage_modifier'));

function assertContains(label, array, partialContent) {
    const found = array.some(item => JSON.stringify(item).includes(partialContent));
    if (found) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.log(`  ✗ ${label} (not found: "${partialContent}")`);
        failed++;
    }
}

// Case D: score 66 + modifier 5 → pushes past 70 → Amber (Guarded)
const HIGH_BASE = { ...BASE_RISK, score: 66 };
const rD = determineEscalation(HIGH_BASE, MATERNAL,
    { symptoms: ['fever'], severity: 'Medium', vitals: {} },
    { escalationModifier: 5 }
);
assert('score 66 + modifier 5 = 71 → finalScore 71', rD.finalScore, 71);
assert('finalScore 71 (no critical symptom) → Amber (Guarded)', rD.riskColor, 'Amber');
assertContains('Stability guard reason logged', rD.allReasons, 'stability_guard_downgrade');

// Case E: clamp at 100
const MAX_BASE = { ...BASE_RISK, score: 98 };
const rE = determineEscalation(MAX_BASE, MATERNAL,
    { symptoms: [], severity: 'Low', vitals: {} },
    { escalationModifier: 5 }
);
assert('98 + 5 clamped to 100', rE.finalScore, 100);

// Case F: imageTriage = {} (empty object default) → safe
const rF = determineEscalation(BASE_RISK, MATERNAL,
    { symptoms: [], severity: 'Low', vitals: {} }, {}
);
assert('empty imageTriage → modifier 0, score unchanged', rF.finalScore, 60);

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`Total: ${passed + failed}  |  Passed: ${passed} ✓  |  Failed: ${failed} ${failed > 0 ? '✗' : ''}`);
if (failed === 0) {
    console.log('\n🎉 All image triage tests passed!\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed — see above.\n');
    process.exit(1);
}
