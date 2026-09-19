// Test script for Outbreak Integration in GET /cases endpoint

const http = require('http');

console.log('=== Testing Outbreak Integration ===\n');

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    try {
        console.log('Step 1: Creating test cases with fever outbreak...\n');

        // Create 7 cases with fever (should trigger Moderate outbreak)
        for (let i = 0; i < 7; i++) {
            const caseData = {
                age: 30 + i,
                gender: 'Male',
                symptoms: ['fever', 'cough'],
                severity: 'Medium',
                duration: 2,
                vitals: { temperature: 38.5 }
            };

            const result = await makeRequest('/analyze', 'POST', caseData);
            console.log(`Created case ${i + 1}: ${result.id}`);
        }

        console.log('\nStep 2: Fetching all cases with outbreak report...\n');

        const response = await makeRequest('/cases');

        console.log('Response structure:');
        console.log('- Has "cases" array:', Array.isArray(response.cases));
        console.log('- Has "outbreakReport" object:', typeof response.outbreakReport === 'object');
        console.log('- Number of cases:', response.cases ? response.cases.length : 0);

        if (response.outbreakReport) {
            console.log('\nOutbreak Report:');
            console.log('- Outbreak Detected:', response.outbreakReport.outbreakDetected);
            console.log('- Number of Alerts:', response.outbreakReport.alerts.length);

            if (response.outbreakReport.alerts.length > 0) {
                console.log('\nAlerts:');
                response.outbreakReport.alerts.forEach((alert, idx) => {
                    console.log(`  ${idx + 1}. ${alert.symptom}: ${alert.count} cases on ${alert.date} (${alert.severity})`);
                });
            }
        }

        console.log('\n✅ Integration test complete!');
        console.log('\nExpected behavior:');
        console.log('- Response should have { cases: [...], outbreakReport: {...} }');
        console.log('- outbreakReport.outbreakDetected should be true');
        console.log('- Should show fever and cough alerts (Moderate severity)');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\nMake sure the server is running: node backend/server.js');
    }
}

// Wait a bit for server to be ready, then run tests
setTimeout(runTests, 1000);
