// Test script for calculateWeightedRiskScore function
const { calculateWeightedRiskScore } = require('./services/riskEngine');

console.log('=== Testing Weighted Risk Scoring System ===\n');

// Test Case 1: Low Risk
console.log('Test 1: Low Risk Patient');
const test1 = calculateWeightedRiskScore({
    bp: '120/80',
    temperature: 98.6,
    pulse: 75,
    age: 35,
    symptoms: ['headache'],
    comorbidities: []
});
console.log(test1);
console.log('Expected: Low category, score 0\n');

// Test Case 2: Medium Risk
console.log('Test 2: Medium Risk Patient');
const test2 = calculateWeightedRiskScore({
    bp: '155/95',
    temperature: 99.5,
    pulse: 85,
    age: 65,
    symptoms: ['fever', 'cough'],
    comorbidities: ['diabetes']
});
console.log(test2);
console.log('Expected: Medium category, score 45 (BP:25 + Age:10 + Comorbidity:10)\n');

// Test Case 3: High Risk
console.log('Test 3: High Risk Patient');
const test3 = calculateWeightedRiskScore({
    bp: '165/100',
    temperature: 102.5,
    pulse: 120,
    age: 70,
    symptoms: ['chest pain', 'breathlessness'],
    comorbidities: ['hypertension', 'diabetes']
});
console.log(test3);
console.log('Expected: High category, score 95 (BP:25 + Temp:20 + Pulse:15 + Age:10 + Symptoms:25 + Comorbidity:10)\n');

// Test Case 4: Edge case - exactly at threshold
console.log('Test 4: Threshold Testing');
const test4 = calculateWeightedRiskScore({
    bp: '150/90',
    temperature: 101,
    pulse: 110,
    age: 60,
    symptoms: ['breathing difficulty'],
    comorbidities: ['diabetes']
});
console.log(test4);
console.log('Expected: High category, score 95 (all thresholds met)\n');

console.log('=== All Tests Complete ===');
