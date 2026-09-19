// Advanced Rule-based AI engine for healthcare decision support
// Includes: symptom analysis, vitals assessment, drug interactions, treatment recommendations

// Knowledge base for conditions
const CONDITIONS_DB = {
  respiratory_infection: {
    name: 'Respiratory infection (possible pneumonia/COVID)',
    triggers: [['fever', 'cough', 'breathlessness'], ['fever', 'cough', 'chest_pain']],
    treatments: ['Rest and hydration', 'Antipyretics (Paracetamol)', 'Monitor oxygen levels', 'Consider antibiotics if bacterial'],
    labTests: ['Complete Blood Count', 'Chest X-ray', 'COVID-19 test', 'Sputum culture'],
    urgency: 'high'
  },
  infectious_exanthem: {
    name: 'Infectious exanthem',
    triggers: [['fever', 'rash']],
    treatments: ['Symptomatic treatment', 'Antihistamines for itching', 'Hydration'],
    labTests: ['Complete Blood Count', 'Viral panel'],
    urgency: 'medium'
  },
  acute_gastroenteritis: {
    name: 'Acute gastroenteritis',
    triggers: [['diarrhea', 'vomiting'], ['diarrhea', 'fever'], ['vomiting', 'abdominal_pain']],
    treatments: ['Oral rehydration therapy', 'BRAT diet', 'Antiemetics if needed', 'Monitor for dehydration'],
    labTests: ['Stool examination', 'Electrolytes panel'],
    urgency: 'medium'
  },
  cardiorespiratory_concern: {
    name: 'Cardiorespiratory concern (possible ischemia or PE)',
    triggers: [['chest_pain', 'breathlessness'], ['chest_pain', 'sweating'], ['chest_pain', 'arm_pain']],
    treatments: ['IMMEDIATE MEDICAL ATTENTION', 'Aspirin if not contraindicated', 'Oxygen supplementation', 'ECG monitoring'],
    labTests: ['Troponin', 'D-Dimer', 'ECG', 'Chest X-ray', 'CT-PA if PE suspected'],
    urgency: 'critical'
  },
  possible_systemic_infection: {
    name: 'Possible systemic infection or meningismus',
    triggers: [['headache', 'fever', 'neck_stiffness'], ['headache', 'fever', 'photophobia']],
    treatments: ['Urgent evaluation', 'Antipyretics', 'IV fluids if dehydrated', 'Empiric antibiotics if meningitis suspected'],
    labTests: ['Complete Blood Count', 'Blood cultures', 'Lumbar puncture if indicated', 'CRP/Procalcitonin'],
    urgency: 'critical'
  },
  urinary_tract_infection: {
    name: 'Urinary tract infection',
    triggers: [['dysuria', 'frequency'], ['dysuria', 'fever'], ['back_pain', 'fever', 'dysuria']],
    treatments: ['Antibiotics (Nitrofurantoin/Trimethoprim)', 'Increased fluid intake', 'Urinary analgesics'],
    labTests: ['Urinalysis', 'Urine culture', 'Renal function tests'],
    urgency: 'medium'
  },
  hypertensive_emergency: {
    name: 'Hypertensive emergency',
    triggers: [['headache', 'blurred_vision'], ['chest_pain', 'headache']],
    treatments: ['IMMEDIATE BP control', 'IV antihypertensives', 'Close monitoring', 'Identify and treat cause'],
    labTests: ['Renal function', 'ECG', 'Fundoscopy', 'CT head if neurological signs'],
    urgency: 'critical'
  },
  diabetic_emergency: {
    name: 'Diabetic emergency (DKA/HHS)',
    triggers: [['vomiting', 'abdominal_pain', 'confusion'], ['excessive_thirst', 'frequent_urination']],
    treatments: ['IV fluids', 'Insulin therapy', 'Electrolyte replacement', 'Monitor glucose frequently'],
    labTests: ['Blood glucose', 'ABG', 'Electrolytes', 'Ketones', 'Renal function'],
    urgency: 'critical'
  },
  allergic_reaction: {
    name: 'Allergic reaction',
    triggers: [['rash', 'swelling'], ['breathlessness', 'rash'], ['swelling', 'difficulty_swallowing']],
    treatments: ['Antihistamines', 'Epinephrine if severe', 'Corticosteroids', 'Remove allergen'],
    labTests: ['Tryptase if anaphylaxis suspected', 'IgE levels'],
    urgency: 'high'
  },
  musculoskeletal_pain: {
    name: 'Musculoskeletal pain',
    triggers: [['joint_pain'], ['back_pain'], ['muscle_pain']],
    treatments: ['NSAIDs/Paracetamol', 'Rest', 'Ice/Heat therapy', 'Physical therapy referral'],
    labTests: ['X-ray if trauma', 'ESR/CRP if inflammatory'],
    urgency: 'low'
  },
  anxiety_panic: {
    name: 'Anxiety/Panic disorder',
    triggers: [['palpitations', 'sweating', 'trembling'], ['breathlessness', 'chest_tightness']],
    treatments: ['Reassurance', 'Breathing exercises', 'Consider anxiolytics', 'Mental health referral'],
    labTests: ['Thyroid function', 'ECG to rule out cardiac cause'],
    urgency: 'low'
  },
  migraine: {
    name: 'Migraine',
    triggers: [['headache', 'nausea'], ['headache', 'photophobia'], ['headache', 'aura']],
    treatments: ['Triptans if appropriate', 'NSAIDs', 'Rest in dark room', 'Hydration', 'Antiemetics'],
    labTests: ['CT/MRI if first severe headache or red flags'],
    urgency: 'low'
  },
  common_illness: {
    name: 'Common illness/non-specific',
    triggers: [],
    treatments: ['Symptomatic treatment', 'Rest and hydration', 'Follow-up if worsening'],
    labTests: ['Consider basic blood work if persistent'],
    urgency: 'low'
  },
  undifferentiated: {
    name: 'Undifferentiated complaint',
    triggers: [],
    treatments: ['Clinical observation', 'Supportive care', 'Further history and examination'],
    labTests: ['Based on clinical findings'],
    urgency: 'low'
  }
};

// Drug interaction database (simplified)
const DRUG_INTERACTIONS = {
  'aspirin': ['warfarin', 'ibuprofen', 'clopidogrel'],
  'warfarin': ['aspirin', 'nsaids', 'antibiotics'],
  'metformin': ['contrast_dye', 'alcohol'],
  'ace_inhibitors': ['potassium', 'nsaids', 'lithium'],
  'ssri': ['maoi', 'tramadol', 'triptans'],
  'statins': ['grapefruit', 'fibrates', 'macrolides']
};

// Vital signs normal ranges
const VITAL_RANGES = {
  bp_systolic: { low: 90, normal_low: 100, normal_high: 130, high: 140, critical_high: 180 },
  bp_diastolic: { low: 60, normal_low: 65, normal_high: 85, high: 90, critical_high: 120 },
  heart_rate: { low: 50, normal_low: 60, normal_high: 100, high: 110, critical_high: 150 },
  temperature: { low: 35.5, normal_low: 36.1, normal_high: 37.2, high: 38, critical_high: 40 },
  spo2: { critical_low: 90, low: 94, normal: 95 },
  respiratory_rate: { low: 10, normal_low: 12, normal_high: 20, high: 25, critical_high: 30 }
};

// Analyze vitals and return risk factors
function analyzeVitals(vitals = {}) {
  const findings = [];
  let vitalScore = 0;

  if (vitals.bp_systolic) {
    if (vitals.bp_systolic >= VITAL_RANGES.bp_systolic.critical_high) {
      findings.push('CRITICAL: Severely elevated blood pressure');
      vitalScore += 40;
    } else if (vitals.bp_systolic >= VITAL_RANGES.bp_systolic.high) {
      findings.push('Elevated blood pressure');
      vitalScore += 15;
    } else if (vitals.bp_systolic < VITAL_RANGES.bp_systolic.low) {
      findings.push('Low blood pressure - possible hypotension');
      vitalScore += 20;
    }
  }

  if (vitals.heart_rate) {
    if (vitals.heart_rate >= VITAL_RANGES.heart_rate.critical_high) {
      findings.push('CRITICAL: Severe tachycardia');
      vitalScore += 35;
    } else if (vitals.heart_rate >= VITAL_RANGES.heart_rate.high) {
      findings.push('Tachycardia (elevated heart rate)');
      vitalScore += 15;
    } else if (vitals.heart_rate < VITAL_RANGES.heart_rate.low) {
      findings.push('Bradycardia (low heart rate)');
      vitalScore += 20;
    }
  }

  if (vitals.temperature) {
    if (vitals.temperature >= VITAL_RANGES.temperature.critical_high) {
      findings.push('CRITICAL: High fever (hyperpyrexia)');
      vitalScore += 35;
    } else if (vitals.temperature >= VITAL_RANGES.temperature.high) {
      findings.push('Fever present');
      vitalScore += 10;
    } else if (vitals.temperature < VITAL_RANGES.temperature.low) {
      findings.push('Hypothermia');
      vitalScore += 25;
    }
  }

  if (vitals.spo2) {
    if (vitals.spo2 < VITAL_RANGES.spo2.critical_low) {
      findings.push('CRITICAL: Severe hypoxia - immediate oxygen needed');
      vitalScore += 50;
    } else if (vitals.spo2 < VITAL_RANGES.spo2.low) {
      findings.push('Low oxygen saturation - supplemental oxygen may be needed');
      vitalScore += 25;
    }
  }

  if (vitals.respiratory_rate) {
    if (vitals.respiratory_rate >= VITAL_RANGES.respiratory_rate.critical_high) {
      findings.push('CRITICAL: Severe tachypnea');
      vitalScore += 30;
    } else if (vitals.respiratory_rate >= VITAL_RANGES.respiratory_rate.high) {
      findings.push('Elevated respiratory rate');
      vitalScore += 15;
    }
  }

  return { findings, vitalScore };
}

// Check for drug interactions
function checkDrugInteractions(currentMedications = [], proposedTreatments = []) {
  const warnings = [];
  const meds = currentMedications.map(m => m.toLowerCase());
  
  for (const med of meds) {
    const interactions = DRUG_INTERACTIONS[med] || [];
    for (const treatment of proposedTreatments) {
      const treatmentLower = treatment.toLowerCase();
      for (const interaction of interactions) {
        if (treatmentLower.includes(interaction)) {
          warnings.push(`Potential interaction: ${med} with ${treatment}`);
        }
      }
    }
  }
  
  return warnings;
}

// Match symptoms to conditions
function matchCondition(symptoms) {
  const s = new Set(symptoms || []);
  
  for (const [code, data] of Object.entries(CONDITIONS_DB)) {
    for (const trigger of data.triggers) {
      if (trigger.every(t => s.has(t))) {
        return { code, ...data };
      }
    }
  }
  
  // Default conditions based on symptom presence
  if (s.has('fever') && s.has('cough')) {
    return { code: 'respiratory_infection', ...CONDITIONS_DB.respiratory_infection };
  }
  if (s.has('headache') && s.has('fever')) {
    return { code: 'possible_systemic_infection', ...CONDITIONS_DB.possible_systemic_infection };
  }
  if (s.size > 0) {
    return { code: 'common_illness', ...CONDITIONS_DB.common_illness };
  }
  
  return { code: 'undifferentiated', ...CONDITIONS_DB.undifferentiated };
}

// Main analyze function
function analyze({ age, symptoms = [], severity = 'Low', duration = 0, vitals = {}, currentMedications = [], allergies = [], medicalHistory = [] }) {
  const s = new Set(symptoms || []);
  const reasons = [];
  const warnings = [];

  // Match condition from symptoms
  const matched = matchCondition(symptoms);
  let condition = matched.name;
  let conditionCode = matched.code;
  let treatments = [...(matched.treatments || [])];
  let labTests = [...(matched.labTests || [])];
  let urgency = matched.urgency || 'low';

  // Add symptom-based reasoning
  if (s.size > 0) {
    reasons.push(`Symptoms (${Array.from(s).join(', ')}) suggest ${condition}`);
  }

  // Risk scoring
  let score = 0;
  
  // Severity base score
  if (severity === 'High') {
    score += 50;
    reasons.push('High severity reported by healthcare worker');
  } else if (severity === 'Medium') {
    score += 25;
  } else {
    score += 5;
  }

  // Age-based risk
  if (age !== undefined && age !== null) {
    if (age >= 70) {
      score += 30;
      reasons.push('Advanced age (70+) significantly increases risk');
    } else if (age >= 60) {
      score += 20;
      reasons.push('Older age (60+) increases risk');
    } else if (age < 5) {
      score += 25;
      reasons.push('Very young age (<5 years) increases vulnerability');
    } else if (age < 12) {
      score += 10;
      reasons.push('Pediatric patient - consider age-appropriate care');
    }
  }

  // High-risk symptoms
  if (s.has('breathlessness')) {
    score += 25;
    reasons.push('Breathlessness is a high-priority symptom');
  }
  if (s.has('chest_pain')) {
    score += 30;
    reasons.push('Chest pain requires urgent cardiac evaluation');
  }
  if (s.has('confusion') || s.has('altered_consciousness')) {
    score += 35;
    reasons.push('Altered mental status is a red flag');
  }
  if (s.has('severe_bleeding')) {
    score += 40;
    reasons.push('Severe bleeding requires immediate attention');
  }

  // Duration factor
  if (duration >= 14) {
    score += 15;
    reasons.push('Prolonged duration (>2 weeks) warrants investigation');
  } else if (duration >= 7) {
    score += 10;
    reasons.push('Duration >7 days suggests need for further evaluation');
  }

  // Analyze vitals
  const vitalAnalysis = analyzeVitals(vitals);
  score += vitalAnalysis.vitalScore;
  reasons.push(...vitalAnalysis.findings);

  // Medical history risk factors
  const highriskHistory = ['diabetes', 'heart_disease', 'hypertension', 'copd', 'asthma', 'immunocompromised', 'cancer', 'kidney_disease'];
  for (const condition of medicalHistory) {
    if (highriskHistory.includes(condition.toLowerCase())) {
      score += 10;
      reasons.push(`Pre-existing condition (${condition}) increases risk`);
    }
  }

  // Check for drug interactions
  const drugWarnings = checkDrugInteractions(currentMedications, treatments);
  warnings.push(...drugWarnings);

  // Check allergies
  for (const allergy of allergies) {
    for (const treatment of treatments) {
      if (treatment.toLowerCase().includes(allergy.toLowerCase())) {
        warnings.push(`ALLERGY ALERT: Patient allergic to ${allergy} - avoid ${treatment}`);
        treatments = treatments.filter(t => !t.toLowerCase().includes(allergy.toLowerCase()));
      }
    }
  }

  // Clamp score
  score = Math.min(score, 100);

  // Determine risk label
  let risk = 'Green';
  if (score >= 70 || urgency === 'critical') {
    risk = 'Red';
  } else if (score >= 35 || urgency === 'high') {
    risk = 'Amber';
  }

  // Calculate confidence
  let confidence = Math.min(95, 35 + (s.size * 12) + (severity === 'High' ? 15 : 0) + (Object.keys(vitals).length * 5));
  if (s.size === 0) confidence = 25;
  if (vitalAnalysis.findings.length > 0) confidence += 10;
  confidence = Math.min(confidence, 95);

  // Suggested actions based on risk
  const suggestedActions = [];
  if (risk === 'Red') {
    suggestedActions.push('URGENT: Immediate medical attention required');
    suggestedActions.push('Consider emergency transport');
    suggestedActions.push('Start basic life support measures if needed');
  } else if (risk === 'Amber') {
    suggestedActions.push('Expedited medical review recommended');
    suggestedActions.push('Monitor vital signs closely');
    suggestedActions.push('Prepare for possible escalation');
  } else {
    suggestedActions.push('Standard care pathway');
    suggestedActions.push('Schedule follow-up appointment');
    suggestedActions.push('Provide patient education materials');
  }

  const explanation = {
    reasons,
    summary: `Condition: ${condition}. Risk: ${risk}. Confidence: ${confidence}%`,
  };

  return {
    condition,
    conditionCode,
    risk,
    confidence,
    score,
    urgency,
    explanation,
    treatments,
    labTests,
    suggestedActions,
    warnings,
    vitalFindings: vitalAnalysis.findings,
    timestamp: new Date().toISOString()
  };
}

// Differential diagnosis - returns top 3 possible conditions
function getDifferentialDiagnosis(symptoms = []) {
  const s = new Set(symptoms);
  const matches = [];

  for (const [code, data] of Object.entries(CONDITIONS_DB)) {
    let matchScore = 0;
    for (const trigger of data.triggers) {
      const matched = trigger.filter(t => s.has(t)).length;
      const ratio = matched / trigger.length;
      if (ratio > matchScore) matchScore = ratio;
    }
    if (matchScore > 0) {
      matches.push({ code, name: data.name, matchScore, urgency: data.urgency });
    }
  }

  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

module.exports = { analyze, analyzeVitals, checkDrugInteractions, getDifferentialDiagnosis, CONDITIONS_DB, VITAL_RANGES };
