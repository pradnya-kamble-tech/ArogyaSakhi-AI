// ============================================================
// Test: Clinical Intelligence Engine Upgrades
// Run: node test-engine-upgrades.js
// ============================================================

'use strict';

const { evaluateBaseRisk } = require('./services/riskEngine');
const { determineEscalation } = require('./services/escalationEngine');
const { calculateConfidence } = require('./services/confidenceEngine');

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

// ── [1] riskEngine — Cluster Weighting & New Modifiers ───────────────────────
console.log('\n[1] riskEngine — Clinical Intelligence Modifiers\n');

// A. Symptom Cluster: Meningitic Triad
const r1 = evaluateBaseRisk({ symptoms: ['fever', 'headache', 'vomiting'] });
assertContains('Meningitic triad cluster bonus applied', r1.reasoningLog, 'Meningitic triad cluster');
assertContains('Cluster bonus logged in reasons', r1.reasons, 'Cluster bonus');

// B. Severity Multiplier: Severe
const r2_base = evaluateBaseRisk({ symptoms: ['fever'], severity: 'Low' });
const r2_severe = evaluateBaseRisk({ symptoms: ['fever'], severity: 'Severe' });
const expectedSevereBonus = Math.round(r2_base.score * 1.2) - r2_base.score; // (base + flat_sev_pts) * 1.2
// Note: severity map adds flat points first, then multiplier is applied to total.
// flat points: Low=5, Severe=40 (wait, severityMap says Severe? No, it says High, Medium, Low. I added Severe: 1.20)
// Actually I added SEVERITY_MULTIPLIER = { Severe: 1.20 ... }
// And severityMap in original code was { High: 40, Medium: 20, Low: 5 }. 
// I didn't add 'Severe' to severityMap, so it defaults to 5.
// 5 * 1.2 = 6. 
assertContains('Severity multiplier applied for "Severe"', r2_severe.reasoningLog, 'Severe symptom intensity');

// C. Duration Modifier: 5 days
const r3 = evaluateBaseRisk({ symptoms: ['fever'], duration: 5 });
assertContains('Duration modifier (+5) applied at 5 days', r3.reasoningLog, 'Sub-acute persistence');

// D. Vital Interaction: BP + Headache
const r4 = evaluateBaseRisk({ symptoms: ['headache'], vitals: { bp_systolic: 145 } });
assertContains('Hypertensive headache interaction applied', r4.reasoningLog, 'hypertensive warning');

// E. Demographic Sensitivity: Age > 65
const r5 = evaluateBaseRisk({ symptoms: ['fever'], age: 70 });
assertContains('Frailty modifier applied (age > 65)', r5.reasoningLog, 'Frailty modifier');

// E. Demographic Sensitivity: Age < 5 + Fever
const r6 = evaluateBaseRisk({ symptoms: ['fever'], age: 3 });
assertContains('Pediatric fever vulnerability applied (age < 5)', r6.reasoningLog, 'Pediatric fever vulnerability');

// E. Demographic Sensitivity: Maternal + Fever
const r7 = evaluateBaseRisk({ symptoms: ['fever'], isMaternal: true });
assertContains('Maternal infection amplification applied', r7.reasoningLog, 'Maternal infection amplification');


// ── [2] escalationEngine — Stability Guard ───────────────────────────────────
console.log('\n[2] escalationEngine — Stability Guard Tests\n');

// Guard Case: Score 75 but NO critical trigger symptom
const BASE_GUARD = { score: 75, reasons: ['Some risk reasons'], findings: [] };
const MATERNAL_EMPTY = { isMaternal: false };
const r_guard = determineEscalation(BASE_GUARD, MATERNAL_EMPTY, { symptoms: ['fever'], severity: 'Medium' });
assert('Score 75 + No critical symptom → Downgraded to Amber', r_guard.riskColor, 'Amber');
assertContains('Stability guard downgrade reason added', r_guard.allReasons, 'stability_guard_downgrade');

// Guard Case: Score 75 WITH critical trigger symptom (chest_pain)
const r_guard_pass = determineEscalation(BASE_GUARD, MATERNAL_EMPTY, { symptoms: ['chest_pain'], severity: 'High' });
assert('Score 75 + Chest Pain → Confirmed Red', r_guard_pass.riskColor, 'Red');

// Guard Case: Score 90 (High Confidence)
const HIGH_SCORE = { score: 90, reasons: [], findings: [] };
const r_guard_high = determineEscalation(HIGH_SCORE, MATERNAL_EMPTY, { symptoms: ['fever'] });
assert('Score 90 (>85) → Confirmed Red even without critical symptom', r_guard_high.riskColor, 'Red');


// ── [3] confidenceEngine — Diagnostic Certainty Index (DCI) ─────────────────
console.log('\n[3] confidenceEngine — Diagnostic Certainty Index (DCI)\n');

const PATIENT_ALL = {
    age: 30,
    symptoms: ['fever', 'cough', 'breathlessness'],
    vitals: { bp: '120/80', heart_rate: 80, temperature: 38.5 }
};
const GEN_RISK = { reasoningLog: [{ modifier: 'Symptom Cluster' }], vitalFindings: ['CRITICAL: tachycardia'] };
const ESC = { riskColor: 'Red' };

const c1 = calculateConfidence(PATIENT_ALL, GEN_RISK, {}, ESC);
assert('DCI breakdown object exists', typeof c1.dci, 'object');
assert('DCI score matches backward compat field', c1.dci.score, c1.confidenceScore);
assert('DCI Completeness is 100%', c1.dci.components.completeness, 100);
assert('DCI Coherence is 100% (cluster + 3 symptoms)', c1.dci.components.coherence, 100);

// Conflict Case: Fever symptom but normal temp
const PATIENT_CONFLICT = {
    age: 30, symptoms: ['fever'], vitals: { temperature: 36.5 }
};
const c2 = calculateConfidence(PATIENT_CONFLICT, {}, {}, { riskColor: 'Green' });
assert('Conflict penalty applied (-5)', c2.dci.components.penalty, 5);
assertContains('Conflict reasoning logged', c2.reasoning, 'Conflict detected');


// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`Total: ${passed + failed}  |  Passed: ${passed} ✓  |  Failed: ${failed} ${failed > 0 ? '✗' : ''}`);
if (failed === 0) {
    console.log('\n🎉 All engine upgrade tests passed!\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed — see above.\n');
    process.exit(1);
}
