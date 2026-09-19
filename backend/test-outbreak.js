// Test script for Outbreak Detection Engine

const outbreakEngine = require('./services/outbreakEngine');

console.log('=== Testing Outbreak Detection Engine ===\n');

// Test 1: No outbreak (low frequency)
console.log('Test 1: Low Frequency (No Outbreak)');
const lowFreqCases = [
    {
        id: '1',
        timestamp: '2026-02-17T10:00:00Z',
        patient: { symptoms: ['fever', 'cough'] }
    },
    {
        id: '2',
        timestamp: '2026-02-17T11:00:00Z',
        patient: { symptoms: ['headache'] }
    },
    {
        id: '3',
        timestamp: '2026-02-17T12:00:00Z',
        patient: { symptoms: ['fatigue'] }
    }
];

const result1 = outbreakEngine.analyzeOutbreak(lowFreqCases);
console.log('Outbreak Detected:', result1.outbreakDetected);
console.log('Alerts:', result1.alerts.length);
console.log('Expected: false, 0 alerts\n');

// Test 2: Moderate outbreak (5-9 cases)
console.log('Test 2: Moderate Outbreak (5-9 cases of fever)');
const moderateCases = [
    ...Array(7).fill(null).map((_, i) => ({
        id: `mod-${i}`,
        timestamp: '2026-02-17T10:00:00Z',
        patient: { symptoms: ['fever', 'cough'] }
    })),
    {
        id: 'mod-8',
        timestamp: '2026-02-17T11:00:00Z',
        patient: { symptoms: ['headache'] }
    }
];

const result2 = outbreakEngine.analyzeOutbreak(moderateCases);
console.log('Outbreak Detected:', result2.outbreakDetected);
console.log('Alerts:', result2.alerts);
console.log('Expected: true, fever=7 (Moderate), cough=7 (Moderate)\n');

// Test 3: High outbreak (10-19 cases)
console.log('Test 3: High Outbreak (10-19 cases of fever)');
const highCases = Array(12).fill(null).map((_, i) => ({
    id: `high-${i}`,
    timestamp: '2026-02-17T10:00:00Z',
    patient: { symptoms: ['fever', 'breathlessness'] }
}));

const result3 = outbreakEngine.analyzeOutbreak(highCases);
console.log('Outbreak Detected:', result3.outbreakDetected);
console.log('Alerts:', result3.alerts);
console.log('Expected: true, fever=12 (High), breathlessness=12 (High)\n');

// Test 4: Critical outbreak (20+ cases)
console.log('Test 4: Critical Outbreak (20+ cases of fever)');
const criticalCases = Array(25).fill(null).map((_, i) => ({
    id: `crit-${i}`,
    timestamp: '2026-02-17T10:00:00Z',
    patient: { symptoms: ['fever'] }
}));

const result4 = outbreakEngine.analyzeOutbreak(criticalCases);
console.log('Outbreak Detected:', result4.outbreakDetected);
console.log('Alerts:', result4.alerts);
console.log('Expected: true, fever=25 (Critical)\n');

// Test 5: Multiple dates
console.log('Test 5: Multiple Dates');
const multiDateCases = [
    ...Array(6).fill(null).map((_, i) => ({
        id: `d1-${i}`,
        timestamp: '2026-02-17T10:00:00Z',
        patient: { symptoms: ['fever'] }
    })),
    ...Array(8).fill(null).map((_, i) => ({
        id: `d2-${i}`,
        timestamp: '2026-02-16T10:00:00Z',
        patient: { symptoms: ['cough'] }
    }))
];

const result5 = outbreakEngine.analyzeOutbreak(multiDateCases);
console.log('Outbreak Detected:', result5.outbreakDetected);
console.log('Alerts:', result5.alerts);
console.log('Expected: true, 2 alerts (fever on 2/17, cough on 2/16)\n');

// Test 6: Outbreak Summary
console.log('Test 6: Outbreak Summary');
const summary = outbreakEngine.getOutbreakSummary(result4);
console.log('Summary:', summary);
console.log('Expected: 1 critical alert, 1 top symptom (fever)\n');

// Test 7: Outbreak Trend
console.log('Test 7: Outbreak Trend (7 days)');
const trendCases = [
    ...Array(3).fill(null).map((_, i) => ({
        id: `t1-${i}`,
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        patient: { symptoms: ['fever'] }
    })),
    ...Array(8).fill(null).map((_, i) => ({
        id: `t2-${i}`,
        timestamp: new Date().toISOString(),
        patient: { symptoms: ['fever'] }
    }))
];

const trend = outbreakEngine.getOutbreakTrend(trendCases, 7);
console.log('Trend:', trend.trending);
console.log('Daily Counts:', trend.dailyCounts);
console.log('Expected: increasing trend\n');

// Test 8: Edge cases
console.log('Test 8: Edge Cases');
console.log('Empty array:', outbreakEngine.analyzeOutbreak([]));
console.log('Null:', outbreakEngine.analyzeOutbreak(null));
console.log('No symptoms:', outbreakEngine.analyzeOutbreak([{ id: '1', patient: {} }]));
console.log('Expected: All should return { outbreakDetected: false, alerts: [] }\n');

console.log('=== All Tests Complete ===');
