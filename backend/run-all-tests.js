// Master Test Runner for Healthcare DSS
// Runs all test files sequentially and provides summary report

const { spawn } = require('child_process');
const path = require('path');

const tests = [
    { name: 'Risk Engine (Weighted Scoring)', file: 'test-weighted-scoring.js' },
    { name: 'Maternal Risk Engine', file: 'test-maternal-scoring.js' },
    { name: 'Escalation Engine', file: 'test-escalation-simple.js' },
    { name: 'Summary Engine', file: 'test-summary.js' },
    { name: 'Confidence Engine', file: 'verify-confidence.js' },
    { name: 'Full System Integration', file: 'verify-refactor.js' }
];

const results = [];
let currentTest = 0;

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║   Healthcare DSS - Master Test Runner                ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');
console.log(`Running ${tests.length} test suites...\n`);

function runTest(index) {
    if (index >= tests.length) {
        printSummary();
        return;
    }

    const test = tests[index];
    console.log(`\n[${index + 1}/${tests.length}] Running: ${test.name}`);
    console.log('─'.repeat(60));

    const testProcess = spawn('node', [path.join(__dirname, test.file)], {
        stdio: 'inherit',
        shell: true
    });

    const startTime = Date.now();

    testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        const status = code === 0 ? 'PASS' : 'FAIL';

        results.push({
            name: test.name,
            status,
            duration,
            exitCode: code
        });

        console.log(`\n${status === 'PASS' ? '✓' : '✗'} ${test.name} - ${status} (${duration}ms)`);

        // Run next test
        runTest(index + 1);
    });

    testProcess.on('error', (err) => {
        console.error(`Error running ${test.name}:`, err.message);
        results.push({
            name: test.name,
            status: 'ERROR',
            duration: 0,
            error: err.message
        });
        runTest(index + 1);
    });
}

function printSummary() {
    console.log('\n\n╔═══════════════════════════════════════════════════════╗');
    console.log('║   Test Summary                                        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const errors = results.filter(r => r.status === 'ERROR').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    results.forEach((result, i) => {
        const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⚠';
        const color = result.status === 'PASS' ? '' : '';
        console.log(`${icon} ${result.name.padEnd(40)} ${result.status.padEnd(6)} ${result.duration}ms`);
    });

    console.log('\n' + '─'.repeat(60));
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed} ✓`);
    if (failed > 0) console.log(`Failed: ${failed} ✗`);
    if (errors > 0) console.log(`Errors: ${errors} ⚠`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('─'.repeat(60));

    if (passed === results.length) {
        console.log('\n🎉 All tests passed! System is healthy.\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.\n');
        process.exit(1);
    }
}

// Start running tests
runTest(0);
