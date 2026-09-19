const http = require('http');

const data = JSON.stringify({
    age: 30,
    gender: 'Male',
    symptoms: ['fever', 'cough'],
    severity: 'Medium',
    duration: 2,
    vitals: {
        bp_systolic: 120,
        bp_diastolic: 80,
        heart_rate: 72,
        temperature: 37,
        spo2: 98,
        respiratory_rate: 16
    },
    lang: 'en',
    medicalHistory: ['Diabetes'],
    allergies: [],
    currentMedications: []
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/analyze',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let responseBody = '';
    res.on('data', (d) => {
        responseBody += d;
    });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(responseBody);
            console.log('Response Keys:', Object.keys(parsed));
            console.log('AI Results:', JSON.stringify(parsed.ai, null, 2));
        } catch (e) {
            console.log('Full Response:', responseBody);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(data);
req.end();
