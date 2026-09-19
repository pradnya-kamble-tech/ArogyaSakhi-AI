const { evaluateBaseRisk } = require('./backend/services/riskEngine');
const { determineEscalation } = require('./backend/services/escalationEngine');

const cases = [
    {
        name: "Case 1: Fever + Cough + 6 Days (Duration Modifier)",
        input: {
            age: 30,
            symptoms: ['fever', 'cough'],
            duration: 6,
            severity: 'Low'
        }
    },
    {
        name: "Case 2: 18mo + Diarrhea + Vomiting (Pediatric Cluster)",
        input: {
            age: 1.5,
            symptoms: ['diarrhea', 'vomiting'],
            duration: 1,
            severity: 'Medium'
        }
    },
    {
        name: "Case 3: High BP + Headache (Vital Interaction)",
        input: {
            age: 45,
            symptoms: ['headache'],
            vitals: { bp_systolic: 145 },
            duration: 2,
            severity: 'Low'
        }
    }
];

const fs = require('fs');
const results = [];

cases.forEach(c => {
    const result = evaluateBaseRisk(c.input);
    const finalEscalation = determineEscalation(result, null, c.input);

    results.push({
        name: c.name,
        baseScore: result.score,
        finalRisk: finalEscalation.risk,
        reasons: result.reasons,
        reasoningLog: result.reasoningLog
    });
});

fs.writeFileSync('debug_results.json', JSON.stringify(results, null, 2));
console.log('Results written to debug_results.json');
