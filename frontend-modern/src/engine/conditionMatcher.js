// conditionMatcher.js
// Rule-based top 3 conditions: respiratory, infection, gastro, cardiac, maternal

const conditionRules = [
    {
        condition: 'Respiratory Tract Infection',
        category: 'respiratory',
        keywords: ['cough', 'fever', 'shortness of breath', 'wheezing', 'chest pain', 'sputum']
    },
    {
        condition: 'General Infection / Viral Illness',
        category: 'infection',
        keywords: ['fever', 'chills', 'fatigue', 'body ache', 'weakness', 'headache']
    },
    {
        condition: 'Gastroenteritis',
        category: 'gastro',
        keywords: ['nausea', 'vomiting', 'diarrhea', 'abdominal pain', 'loss of appetite']
    },
    {
        condition: 'Cardiac Issue / Hypertension',
        category: 'cardiac',
        keywords: ['chest pain', 'palpitations', 'dizziness', 'shortness of breath', 'sweating']
    },
    {
        condition: 'Maternal Complication (e.g., Eclampsia/Anemia)',
        category: 'maternal',
        keywords: ['swelling', 'blurred vision', 'severe headache', 'bleeding', 'reduced fetal movement', 'pallor', 'weakness']
    }
];

export function matchConditions(symptoms, isPregnant) {
    const matches = conditionRules.map(rule => {
        let score = 0;
        // Skip maternal conditions if not pregnant
        if (rule.category === 'maternal' && !isPregnant) {
            return { condition: rule.condition, score: -1 };
        }

        rule.keywords.forEach(kw => {
            if (symptoms.some(sym => sym.toLowerCase().includes(kw.toLowerCase()))) {
                score += 10;
            }
        });

        return { condition: rule.condition, score };
    });

    return matches
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(m => m.condition);
}
