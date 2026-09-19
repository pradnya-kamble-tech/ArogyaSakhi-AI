// Test script for intelligentEscalation function
const { intelligentEscalation } = require('./services/escalationEngine');

console.log('=== Testing Intelligent Escalation Logic ===\n');

// Test Case 1: Severe symptoms override (highest priority)
console.log('Test 1: Severe Symptoms Override');
const test1 = intelligentEscalation({
    generalRisk: { category: 'Low', score: 20 },
    maternalRisk: null,
    symptoms: ['chest pain', 'fever']
});
console.log(JSON.stringify(test1, null, 2));
console.log('Expected: Emergency escalation with Critical urgency\n');

// Test Case 2: High-risk pregnancy
console.log('Test 2: High-Risk Pregnancy');
const test2 = intelligentEscalation({
    generalRisk: { category: 'Low', score: 15 },
    maternalRisk: { maternalRiskLevel: 'High Risk Pregnancy', maternalScore: 85 },
    symptoms: ['headache']
});
console.log(JSON.stringify(test2, null, 2));
console.log('Expected: Specialist (Obstetrician) with High urgency\n');

// Test Case 3: High general risk
console.log('Test 3: High General Risk');
const test3 = intelligentEscalation({
    generalRisk: { category: 'High', score: 75 },
    maternalRisk: null,
    symptoms: ['fever', 'cough']
});
console.log(JSON.stringify(test3, null, 2));
console.log('Expected: Emergency escalation with Critical urgency\n');

// Test Case 4: Medium general risk
console.log('Test 4: Medium General Risk');
const test4 = intelligentEscalation({
    generalRisk: { category: 'Medium', score: 45 },
    maternalRisk: null,
    symptoms: ['fatigue']
});
console.log(JSON.stringify(test4, null, 2));
console.log('Expected: Primary Doctor with Medium urgency\n');

// Test Case 5: Moderate maternal risk
console.log('Test 5: Moderate Maternal Risk');
const test5 = intelligentEscalation({
    generalRisk: { category: 'Low', score: 10 },
    maternalRisk: { maternalRiskLevel: 'Moderate Risk', maternalScore: 40 },
    symptoms: []
});
console.log(JSON.stringify(test5, null, 2));
console.log('Expected: Primary Doctor with Medium urgency\n');

// Test Case 6: Low risk - no escalation
console.log('Test 6: Low Risk - No Escalation');
const test6 = intelligentEscalation({
    generalRisk: { category: 'Low', score: 5 },
    maternalRisk: null,
    symptoms: []
});
console.log(JSON.stringify(test6, null, 2));
console.log('Expected: No escalation required\n');

// Test Case 7: Severe symptom overrides high maternal risk
console.log('Test 7: Severe Symptom Overrides High Maternal Risk');
const test7 = intelligentEscalation({
    generalRisk: { category: 'Medium', score: 40 },
    maternalRisk: { maternalRiskLevel: 'High Risk Pregnancy', maternalScore: 90 },
    symptoms: ['seizures', 'headache']
});
console.log(JSON.stringify(test7, null, 2));
console.log('Expected: Emergency (not Specialist) - severe symptoms override everything\n');

console.log('=== All Tests Complete ===');
