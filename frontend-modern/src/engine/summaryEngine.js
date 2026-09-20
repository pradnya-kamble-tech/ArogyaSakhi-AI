// Summary Engine
// Generates professional clinical summaries from patient data and risk assessments

function generateClinicalSummary({ patientData, generalRisk, maternalRisk = null, escalationResult }) {
    // Instead of pre-joining strings, return structured markers
    // The frontend will use these to build the summary in the selected language
    return {
        presentation: {
            age: patientData.age,
            gender: patientData.gender,
            isPregnant: !!(maternalRisk && maternalRisk.maternalRiskLevel),
            pregnancyWeeks: patientData.pregnancyWeeks,
            symptoms: patientData.symptoms || [],
            comorbidities: patientData.comorbidities || [],
            allergies: patientData.allergies || [],
            medications: patientData.currentMedications || []
        },
        vitals: {
            bp: patientData.bp,
            temp: patientData.temperature,
            pulse: patientData.pulse,
            hb: patientData.hemoglobin,
            abnormalities: analyzeVitalsForSummary(patientData)
        },
        assessment: {
            generalRisk: {
                level: generalRisk.risk, // Red/Amber/Green
                score: generalRisk.score,
                categoryKey: `risk.category.${(generalRisk.category || 'unknown').toLowerCase().replace(/\s+/g, '_')}`
            },
            maternalRisk: maternalRisk ? {
                levelKey: maternalRisk.maternalRiskLevel,
                score: maternalRisk.maternalScore
            } : null
        },
        plan: escalationResult ? {
            escalationRequired: escalationResult.escalationRequired,
            level: escalationResult.escalationLevel,
            urgencyKey: `urgency.${(escalationResult.urgency || 'normal').toLowerCase()}`,
            actionKey: escalationResult.recommendedActionKey || 'action.standard_followup'
        } : null
    };
}

function analyzeVitalsForSummary(data) {
    const abnormalities = [];
    if (data.bp) {
        const parts = data.bp.split('/');
        if (parts.length === 2) {
            const s = parseInt(parts[0]);
            if (s >= 140) abnormalities.push('vitals.bp_high');
            else if (s < 90) abnormalities.push('vitals.bp_low');
        }
    }
    const t = parseFloat(data.temperature);
    if (!isNaN(t)) {
        const celsius = t > 45 ? (t - 32) * 5 / 9 : t;
        if (celsius >= 38) abnormalities.push('vitals.temp_high');
        else if (celsius < 35.5) abnormalities.push('vitals.temp_low');
    }
    if (data.pulse) {
        if (data.pulse >= 110) abnormalities.push('vitals.pulse_high');
        else if (data.pulse < 50) abnormalities.push('vitals.pulse_low');
    }
    if (data.hemoglobin && data.hemoglobin < 10) abnormalities.push('vitals.hb_low');
    return abnormalities;
}

export { generateClinicalSummary };
