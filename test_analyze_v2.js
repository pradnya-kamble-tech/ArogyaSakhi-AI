const http = require('http');

const data = JSON.stringify({
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
