// Debug script to test all engines
const riskEngine = require('./backend/services/riskEngine');
const maternalRiskEngine = require('./backend/services/maternalRiskEngine');
const escalationEngine = require('./backend/services/escalationEngine');
const summaryEngine = require('./backend/services/summaryEngine');
const confidenceEngine = require('./backend/services/confidenceEngine');

const age = 30;
const safeSymptoms = ['fever', 'cough'];
const severity = 'Medium';
const duration = 3;
const vitals = { bp_systolic: 120, bp_diastolic: 80, heart_rate: 80, temperature: 38.5 };
const medicalHistory = [];
const allergies = [];
const currentMedications = [];

try {
    console.log('--- Testing riskEngine.evaluateBaseRisk ---');
    const baseRisk = riskEngine.evaluateBaseRisk({
        age, symptoms: safeSymptoms, severity, duration: Number(duration),
        vitals, currentMedications, allergies, medicalHistory
    });
    console.log('OK. score:', baseRisk.score, 'condition:', baseRisk.condition);

    console.log('--- Testing maternalRiskEngine.evaluateMaternalRisk ---');
    const maternalRisk = maternalRiskEngine.evaluateMaternalRisk({
        age, symptoms: safeSymptoms, medicalHistory, vitals
    });
    console.log('OK. isMaternal:', maternalRisk.isMaternal);

    console.log('--- Testing escalationEngine.determineEscalation ---');
    const escalation = escalationEngine.determineEscalation(baseRisk, maternalRisk, {
        symptoms: safeSymptoms, severity, vitals
    });
    console.log('OK. riskColor:', escalation.riskColor, 'urgency:', escalation.urgency);

    console.log('--- Testing confidenceEngine.calculateConfidence ---');
    const confidenceResult = confidenceEngine.calculateConfidence(
        { age, symptoms: safeSymptoms, vitals },
        baseRisk, maternalRisk, escalation
    );
    console.log('OK. confidenceScore:', confidenceResult.confidenceScore);

    console.log('--- Testing riskEngine.getDifferentialDiagnosis ---');
    const diff = riskEngine.getDifferentialDiagnosis(safeSymptoms);
    console.log('OK. diff count:', diff.length);

    console.log('--- Testing summaryEngine.generateClinicalSummary ---');
    const summary = summaryEngine.generateClinicalSummary({
        patientData: {
            age, symptoms: safeSymptoms,
            bp: vitals.bp_systolic && vitals.bp_diastolic ? `${vitals.bp_systolic}/${vitals.bp_diastolic}` : null,
            temperature: vitals.temperature,
            pulse: vitals.heart_rate,
            hemoglobin: vitals.hemoglobin,
            comorbidities: medicalHistory,
            allergies,
            currentMedications
        },
        generalRisk: {
            category: escalation.riskColor === 'Red' ? 'High' : escalation.riskColor === 'Amber' ? 'Medium' : 'Low',
            score: escalation.finalScore
        },
        maternalRisk: null,
        escalationResult: null
    });
    console.log('OK. summaryText length:', summary.summaryText.length);

    console.log('\n=== ALL ENGINES PASSED ===');
} catch (e) {
    console.error('\n=== ENGINE FAILURE ===');
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
}
