// Simplified test for intelligentEscalation
const { intelligentEscalation } = require('./services/escalationEngine');

console.log('Test 1: Severe Symptoms');
const t1 = intelligentEscalation({
    generalRisk: { category: 'Low', score: 20 },
    symptoms: ['chest pain']
});
console.log('Level:', t1.escalationLevelKey, '| Urgency:', t1.urgency);
console.log('Reasoning:', t1.reasoningKeys[0]);
console.log();

console.log('Test 2: High-Risk Pregnancy');
const t2 = intelligentEscalation({
    generalRisk: { category: 'Low', score: 15 },
    maternalRisk: { maternalRiskLevel: 'maternal.level.high', maternalScore: 85 },
    symptoms: []
});
console.log('Level:', t2.escalationLevelKey, '| Urgency:', t2.urgency);
console.log('Reasoning:', t2.reasoningKeys[0]);
console.log();

console.log('Test 3: High General Risk');
const t3 = intelligentEscalation({
    generalRisk: { category: 'High', score: 75 },
    symptoms: []
});
console.log('Level:', t3.escalationLevelKey, '| Urgency:', t3.urgency);
console.log('Reasoning:', t3.reasoningKeys[0]);
console.log();

console.log('Test 4: Medium Risk');
const t4 = intelligentEscalation({
    generalRisk: { category: 'Medium', score: 45 },
    symptoms: []
});
console.log('Level:', t4.escalationLevelKey, '| Urgency:', t4.urgency);
console.log('Reasoning:', t4.reasoningKeys[0]);
console.log();

console.log('Test 5: Low Risk');
const t5 = intelligentEscalation({
    generalRisk: { category: 'Low', score: 5 },
    symptoms: []
});
console.log('Required:', t5.escalationRequired, '| Level:', t5.escalationLevelKey);
console.log('Reasoning:', t5.reasoningKeys[0]);
console.log();

console.log('All tests completed successfully!');
