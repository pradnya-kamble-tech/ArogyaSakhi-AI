const fs = require('fs');
const path = require('path');

const files = ['en.json', 'hi.json', 'mr.json'];
const baseDir = path.join(__dirname, 'frontend', 'i18n');

console.log('--- Diagnostic: Checking JSON files ---');

files.forEach(file => {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
        console.error(`ERROR: File not found: ${filePath}`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        console.log(`\nChecking ${file}:`);
        console.log(`- Total keys: ${Object.keys(data).length}`);

        const checkKeys = [
            'summary_header',
            'soap.presentation',
            'soap.age',
            'soap.individual',
            'soap.complaints'
        ];

        checkKeys.forEach(k => {
            if (data[k]) {
                console.log(`  ✓ Found "${k}": "${data[k]}"`);
            } else {
                console.error(`  ✗ MISSING: "${k}"`);
            }
        });
    } catch (e) {
        console.error(`ERROR: Failed to parse ${file}: ${e.message}`);
    }
});

console.log('\n--- Done ---');
