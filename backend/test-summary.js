// Test script for generateClinicalSummary
const { generateClinicalSummary } = require('./services/summaryEngine');

console.log('=== Testing Clinical Summary Generation ===\n');

// Test Case 1: High-risk patient with abnormal vitals
console.log('Test 1: High-Risk Patient with Abnormal Vitals');
const test1 = generateClinicalSummary({
    patientData: {
        age: 68,
        symptoms: ['chest pain', 'breathlessness', 'sweating'],
        bp: '165/100',
        temperature: 98.6,
        pulse: 125,
        comorbidities: ['diabetes', 'hypertension']
    },
    generalRisk: { category: 'High', score: 85 },
    maternalRisk: null,
    escalationResult: {
        escalationRequired: true,
        escalationLevel: 'Emergency',
        urgency: 'Critical',
        recommendedAction: 'Call emergency services immediately'
    }
});
console.log(JSON.stringify(test1, null, 2));
console.log('\n---\n');

// Test Case 2: High-risk pregnancy
console.log('Test 2: High-Risk Pregnancy');
const test2 = generateClinicalSummary({
    patientData: {
        age: 38,
        pregnancyWeeks: 32,
        symptoms: ['severe headache', 'blurred vision', 'swelling'],
        bp: '148/96',
        hemoglobin: 9.2,
        comorbidities: []
    },
    generalRisk: { category: 'Medium', score: 45, risk: 'Amber' },
    maternalRisk: { maternalRiskLevel: 'maternal.level.high', maternalScore: 80 },
    escalationResult: {
        escalationRequired: true,
        escalationLevel: 'Specialist',
        urgency: 'High',
        actionKey: 'action.urgent_obgyn'
    }
});
console.log(JSON.stringify(test2, null, 2));
console.log('\n---\n');

// Test Case 3: Low-risk patient
console.log('Test 3: Low-Risk Patient');
const test3 = generateClinicalSummary({
    patientData: {
        age: 32,
        symptoms: ['mild headache', 'fatigue'],
        bp: '118/76',
        temperature: 98.4,
        pulse: 72
    },
    generalRisk: { category: 'Low', score: 15, risk: 'Green' },
    maternalRisk: null,
    escalationResult: {
        escalationRequired: false,
        escalationLevel: 'None',
        urgency: 'Low',
        actionKey: 'action.routine_care'
    }
});
console.log(JSON.stringify(test3, null, 2));
console.log('\n---\n');

// Test Case 4: Moderate maternal risk
console.log('Test 4: Moderate Maternal Risk');
const test4 = generateClinicalSummary({
    patientData: {
        age: 36,
        pregnancyWeeks: 24,
        symptoms: ['fatigue'],
        bp: '132/84',
        hemoglobin: 10.5
    },
    generalRisk: { category: 'Low', score: 20, risk: 'Green' },
    maternalRisk: { maternalRiskLevel: 'maternal.level.moderate', maternalScore: 35 },
    escalationResult: {
        escalationRequired: true,
        escalationLevel: 'Primary',
        urgency: 'Medium',
        actionKey: 'action.prenatal_followup'
    }
});
console.log(JSON.stringify(test4, null, 2));
console.log('\n---\n');

console.log('=== All Tests Complete ===');
