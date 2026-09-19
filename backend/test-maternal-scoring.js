// Test script for calculateMaternalRiskScore function
const { calculateMaternalRiskScore } = require('./services/maternalRiskEngine');

console.log('=== Testing Maternal Risk Scoring System ===\n');

// Test Case 1: Normal pregnancy
console.log('Test 1: Normal Pregnancy');
const test1 = calculateMaternalRiskScore({
    pregnancyWeeks: 20,
    bp: '115/75',
    hemoglobin: 12.5,
    age: 28,
    previousComplications: false,
    symptoms: []
});
console.log(test1);
console.log('Expected: Normal risk level, score 0\n');

// Test Case 2: Moderate Risk - Advanced maternal age + anemia
console.log('Test 2: Moderate Risk - Advanced Age + Anemia');
const test2 = calculateMaternalRiskScore({
    pregnancyWeeks: 24,
    bp: '125/80',
    hemoglobin: 9.5,
    age: 38,
    previousComplications: false,
    symptoms: ['fatigue']
});
console.log(test2);
console.log('Expected: Moderate Risk, score 35 (Age:15 + Hemoglobin:20)\n');

// Test Case 3: High Risk - Multiple factors
console.log('Test 3: High Risk Pregnancy - Multiple Factors');
const test3 = calculateMaternalRiskScore({
    pregnancyWeeks: 32,
    bp: '145/95',
    hemoglobin: 9.0,
    age: 40,
    previousComplications: true,
    symptoms: ['severe headache', 'swelling', 'blurred vision']
});
console.log(test3);
console.log('Expected: High Risk Pregnancy, score 100 (Age:15 + BP:20 + Hb:20 + PrevComp:25 + Symptoms:20)\n');

// Test Case 4: Young maternal age with complications
console.log('Test 4: Young Maternal Age with Complications');
const test4 = calculateMaternalRiskScore({
    pregnancyWeeks: 28,
    bp: '142/88',
    hemoglobin: 11.0,
    age: 17,
    previousComplications: true,
    symptoms: ['headache']
});
console.log(test4);
console.log('Expected: High Risk Pregnancy, score 80 (Age:15 + BP:20 + PrevComp:25 + Symptoms:20)\n');

// Test Case 5: Threshold testing
console.log('Test 5: Threshold Testing');
const test5 = calculateMaternalRiskScore({
    pregnancyWeeks: 30,
    bp: '140/90',
    hemoglobin: 10,
    age: 35,
    previousComplications: false,
    symptoms: []
});
console.log(test5);
console.log('Expected: Moderate Risk, score 20 (BP at threshold:20, age at 35 not >35, hemoglobin at 10 not <10)\n');

console.log('=== All Tests Complete ===');
