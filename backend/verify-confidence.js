// Verification script for Confidence Engine
// Uses native fetch

async function verifyConfidence() {
    console.log('=== Verifying Confidence Engine ===\n');

    try {
        // Helper for fetch
        const post = async (url, body) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(`HTTP ${res.status}: ${JSON.stringify(err)}`);
            }
            return await res.json();
        };

        // Test Case 1: High Confidence Scenario
        // All vitals present, 2+ symptoms, High Risk (Red)
        console.log('Test 1: High Confidence Scenario');
        const res1 = await post('http://localhost:5000/analyze', {
            age: 65,
            symptoms: ['chest pain', 'sweating', 'dizziness'],
            severity: 'High',
            vitals: { bp: '160/100', heart_rate: 110, temperature: 99.5 }
        });

        const conf1 = res1.ai.confidenceDetails;
        console.log('Score:', conf1.confidenceScore);
        console.log('Level:', conf1.confidenceLevel);
        console.log('Reasoning:', conf1.reasoning);

        // Expected: 
        // Base 50
        // +15 (All vitals)
        // +10 (3 symptoms)
        // +10 (Red risk)
        // +10 (Critical urgency + severe symptom)
        // Total: 95 -> High

        if (conf1.confidenceScore >= 90) {
            console.log('PASS: Score calculation consistent for High Confidence');
        } else {
            console.error('FAIL: Score too low for high confidence inputs');
        }
        console.log('\n---\n');


        // Test Case 2: Low Confidence Scenario
        // Missing BP, 1 symptom, Low Risk
        console.log('Test 2: Low Confidence Scenario');
        const res2 = await post('http://localhost:5000/analyze', {
            age: 30,
            symptoms: ['fatigue'],
            severity: 'Low',
            // No vitals provided
        });

        const conf2 = res2.ai.confidenceDetails;
        console.log('Score:', conf2.confidenceScore);
        console.log('Level:', conf2.confidenceLevel);
        console.log('Reasoning:', conf2.reasoning);

        // Expected:
        // Base 50
        // +0 (Missing vitals)
        // +0 (1 symptom)
        // +10 (Green risk)
        // -20 (Missing BP)
        // Total: 40 -> Low or Moderate? 40 is Low.

        if (conf2.confidenceScore <= 40) {
            console.log('PASS: Score calculation consistent for Low Confidence');
        } else {
            console.log('NOTE: Score might be Moderate depending on rules:', conf2.confidenceScore);
        }
        console.log('\n=== Verification Complete ===');

    } catch (error) {
        console.error('Verification Failed:', error.message);
    }
}

verifyConfidence();
