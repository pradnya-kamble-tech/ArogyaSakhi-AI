const http = require('http');

const data = JSON.stringify({
    age: 28,
    symptoms: ['headache', 'swelling'],
    severity: 'Medium',
    duration: 3,
    vitals: {
        bp: '145/95',
        heart_rate: 88,
        temperature: 37.2,
        bp_systolic: 145,
        bp_diastolic: 95
    },
    medicalHistory: ['pregnant'],
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
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
