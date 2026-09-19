const fetch = require('node-fetch');

async function testAnalyze() {
    const payload = {
        age: 45,
        symptoms: ['chest_pain', 'breathlessness'],
        severity: 'High',
        duration: 2,
        vitals: {
            bp: '160/100',
            heart_rate: 110,
            temperature: 38.5
        },
        medicalHistory: ['hypertension'],
        allergies: [],
        currentMedications: []
    };

    try {
        const res = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testAnalyze();
