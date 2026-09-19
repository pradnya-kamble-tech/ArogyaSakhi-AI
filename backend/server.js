const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const db = require('./db');
const { analyzeVitals, CONDITIONS_DB, VITAL_RANGES } = require('./services/riskEngine');
const riskEngine = require('./services/riskEngine');
const maternalRiskEngine = require('./services/maternalRiskEngine');
const escalationEngine = require('./services/escalationEngine');
const summaryEngine = require('./services/summaryEngine');
const confidenceEngine = require('./services/confidenceEngine');
const store = require('./dataStore');
const auth = require('./auth');
const patients = require('./patients');
const { getAnalytics, getAuditLog, getCasesByFilter } = require('./analytics');
const outbreakEngine = require('./services/outbreakEngine');
const { evaluateImageTriage } = require('./services/imageTriageEngine');

// Load translation files from frontend/i18n for server-side localization
const I18N = {};
try {
  const i18nDir = path.join(__dirname, '..', 'frontend', 'i18n');
  fs.readdirSync(i18nDir).forEach(fn => {
    if (fn.endsWith('.json')) {
      try {
        const key = path.basename(fn, '.json');
        const data = JSON.parse(fs.readFileSync(path.join(i18nDir, fn), 'utf8'));
        I18N[key] = data;
      } catch (e) {
        console.warn('Failed to load translation', fn, e);
      }
    }
  });
} catch (e) {
  console.warn('No i18n directory found for server localization');
}

function translate(lang, key) {
  if (!lang || !key) return null;
  const dict = I18N[lang];
  if (!dict) return null;
  return dict[key] || null;
}

function renderTemplate(tpl, vars) {
  if (!tpl) return '';
  return tpl.replace(/{{\s*(\w+)\s*}}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: '10mb' }));

// Serve legacy static frontend files
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));
app.use('/modern', express.static(path.join(__dirname, '..', 'frontend-modern', 'dist')));

// Primary route - ensure index.html is the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/modern/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend-modern', 'dist', 'index.html'));
});

db.init().catch((err) => {
  console.warn('Database initialization finished with warnings:', err?.message || err);
});

// Simple helper to create IDs
function makeId() {
  return 'case_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ============== AUTHENTICATION ENDPOINTS ==============

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const result = auth.login(username, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json(result);
});

// POST /auth/logout
app.post('/auth/logout', (req, res) => {
  const token = req.headers['x-auth-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (token) {
    auth.logout(token);
  }
  res.json({ success: true });
});

// GET /auth/me - get current user info
app.get('/auth/me', (req, res) => {
  const token = req.headers['x-auth-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = auth.validateToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  res.json({ user: session });
});

// API auth alias
app.get('/api/auth/me', auth.authMiddleware(), (req, res) => {
  res.json({ user: req.user });
});

// ============== CASE ANALYSIS ENDPOINTS ==============

// POST /analyze - receive a case, run AI analysis, store it
app.post('/analyze', (req, res) => {
  try {
    const { patientName, age, symptoms, severity, duration, lang, vitals, patientId, currentMedications, allergies, medicalHistory } = req.body || {};

    console.log(`[Analyze] Starting analysis for Age: ${age}, Severity: ${severity}`);

    // Input safety: ensure symptoms is always an array
    const safeSymptoms = Array.isArray(symptoms) ? symptoms : [];

    if (age === undefined || !severity) {
      return res.status(400).json({ error: 'Missing required fields: age, severity' });
    }

    // Run enhanced AI analysis using services
    console.log('[Analyze] Running Maternal Risk Engine...');
    const maternalRisk = maternalRiskEngine.evaluateMaternalRisk({
      age,
      symptoms: safeSymptoms,
      medicalHistory: medicalHistory || [],
      vitals: vitals || {}
    });

    console.log('[Analyze] Running Base Risk Engine...');
    const baseRisk = riskEngine.evaluateBaseRisk({
      age,
      symptoms: safeSymptoms,
      severity,
      duration: Number(duration || 0),
      vitals: vitals || {},
      currentMedications: currentMedications || [],
      allergies: allergies || [],
      medicalHistory: medicalHistory || [],
      isMaternal: maternalRisk.isMaternal  // NEW: flows into demographic sensitivity rules
    });

    console.log('[Analyze] Running Image Triage Engine...');
    const imageTriage = evaluateImageTriage({
      attachments: req.body.attachments || [],
      symptoms: safeSymptoms,
      baseRiskScore: baseRisk.score || 0,
      visualFindings: req.body.visualFindings || null
    });
    console.log('[Analyze] Image Triage:', imageTriage);

    console.log('[Analyze] Determining Escalation...');
    const escalation = escalationEngine.determineEscalation(baseRisk, maternalRisk, {
      symptoms: safeSymptoms,
      severity,
      vitals: vitals || {}
    }, imageTriage);  // imageTriage.escalationModifier applied inside engine

    console.log('[Analyze] Calculating Confidence...');
    const confidenceResult = confidenceEngine.calculateConfidence(
      { age, symptoms: safeSymptoms, vitals: vitals || {} },
      baseRisk,
      maternalRisk,
      escalation
    );

    // Construct final AI result object
    const ai = {
      conditionCode: baseRisk.conditionCode || baseRisk.key,
      risk: escalation.riskColor,
      confidence: confidenceResult.dci.score, // CRITICAL: Use DCI as primary confidence score
      score: escalation.finalScore,
      dci: confidenceResult.dci,
      urgencyKey: escalation.urgencyKey,
      explanation: {
        reasons: escalation.allReasons,
        reasoningLog: baseRisk.reasoningLog,
        symptoms: safeSymptoms,
        summaryKey: 'summary_template'
      },
      treatments: baseRisk.treatments,
      labTests: baseRisk.labTests,
      suggestedActions: escalation.suggestedActions,
      warnings: baseRisk.warnings,
      vitalFindings: baseRisk.vitalFindings,
      timestamp: new Date().toISOString(),
      generalRiskDetails: baseRisk,
      maternalRiskDetails: maternalRisk,
      escalationDetails: escalation,
      confidenceDetails: confidenceResult,
      // 1% Feature: Visual Analysis Log
      visualAnalysis: imageTriage.neuralAnalysis || null
    };

    console.log('[Analyze] Getting Differential Diagnosis...');
    ai.differentialDiagnosis = riskEngine.getDifferentialDiagnosis(safeSymptoms);

    console.log('[Analyze] Generating Clinical Summary...');
    ai.clinicalSummary = summaryEngine.generateClinicalSummary({
      patientData: {
        age,
        symptoms: safeSymptoms,
        bp: vitals?.bp || (vitals?.bp_systolic && vitals?.bp_diastolic ? `${vitals.bp_systolic}/${vitals.bp_diastolic}` : null),
        temperature: vitals?.temperature,
        pulse: vitals?.heart_rate,
        hemoglobin: vitals?.hemoglobin,
        comorbidities: medicalHistory || [],
        allergies: allergies || [],
        currentMedications: currentMedications || []
      },
      generalRisk: { score: escalation.finalScore, risk: escalation.riskColor, category: (escalation.finalScore >= 70 ? 'High' : escalation.finalScore >= 35 ? 'Medium' : 'Low') },
      maternalRisk: maternalRisk && maternalRisk.isMaternal ? {
        maternalRiskLevel: (escalation.riskColor === 'Red' ? 'maternal.level.high' : 'maternal.level.moderate'),
        maternalScore: maternalRisk.riskScoreModifier || 0
      } : null,
      escalationResult: {
        escalationRequired: escalation.escalationRequired,
        escalationLevel: (escalation.urgency === 'Critical' ? 'Emergency' : escalation.urgency === 'High' ? 'Specialist' : 'Primary'),
        urgency: escalation.urgency,
        urgencyKey: escalation.urgencyKey,
        actionKey: escalation.recommendedActionKey || 'action.routine_care'
      }
    });

    const id = makeId();
    const now = new Date().toISOString();

    let status = 'AI_REVIEWED';
    if (escalation.urgency === 'Critical' || escalation.urgency === 'High') {
      status = 'ESCALATED';
    }

    const kase = {
      id,
      createdAt: now,
      patientId: patientId || null,
      patient: { age, name: patientName },
      symptoms: safeSymptoms,
      severity,
      duration,
      vitals: vitals || {},
      currentMedications: currentMedications || [],
      allergies: allergies || [],
      medicalHistory: medicalHistory || [],
      attachments: req.body.attachments || [],
      imageTriage,
      reasoningLog: baseRisk.reasoningLog, // Attached at caseData level as requested
      ai,
      status,
      audit: [
        { actor: 'AI', action: 'analyze', payload: { condition: ai.condition, risk: ai.risk, confidence: ai.confidence }, timestamp: now }
      ],
      doctorReview: null
    };

    console.log('[Analyze] Saving Case...');
    store.saveCase(kase);

    if (patientId) {
      patients.linkCaseToPatient(patientId, id);
    }

    console.log('[Analyze] Success!');
    res.json(kase);
  } catch (error) {
    console.error('[Analyze] CRITICAL ERROR:', error);
    res.status(500).json({ error: 'Analysis engine failure', details: error.message });
  }
});

// GET /cases - list all cases with optional filters
app.get('/cases', (req, res) => {
  const cases = store.allCases();
  const { status, risk, search, startDate, endDate, minAge, maxAge, severity } = req.query;

  const filtered = getCasesByFilter(cases, {
    status,
    risk,
    search,
    startDate,
    endDate,
    minAge: minAge ? Number(minAge) : undefined,
    maxAge: maxAge ? Number(maxAge) : undefined,
    severity
  });

  // Analyze outbreak patterns on all cases (not just filtered)
  const outbreakReport = outbreakEngine.analyzeOutbreak(cases);

  // Return cases with outbreak report appended
  res.json({
    cases: filtered,
    outbreakReport: outbreakReport
  });
});

// GET /cases/:id - get single case
app.get('/cases/:id', (req, res) => {
  const kase = store.getById(req.params.id);
  if (!kase) {
    return res.status(404).json({ error: 'Case not found' });
  }
  res.json(kase);
});

// POST /second-opinion - escalation and doctor reviews
app.post('/second-opinion', (req, res) => {
  const { caseId, action } = req.body || {};
  if (!caseId || !action) return res.status(400).json({ error: 'caseId and action required' });

  const kase = store.getById(caseId);
  if (!kase) return res.status(404).json({ error: 'Case not found' });

  const now = new Date().toISOString();

  if (action === 'escalate') {
    const { reason, priority, escalationNote } = req.body || {};
    const updated = store.updateCase(caseId, {
      status: 'ESCALATED',
      escalationPriority: priority || 'normal',
      escalationNote: escalationNote || reason || 'Manual escalation requested'
    });

    updated.audit = updated.audit || [];
    updated.audit.push({
      actor: 'PCW',
      action: 'escalate',
      reason: escalationNote || reason || 'Manual escalation requested',
      timestamp: now
    });
    store.updateCase(caseId, { audit: updated.audit });
    return res.json(updated);
  }

  if (action === 'review') {
    const { doctorName, doctorRecommendation, comments, prescription, followUpDate } = req.body || {};
    if (!doctorName || !doctorRecommendation) {
      return res.status(400).json({ error: 'doctorName and doctorRecommendation required' });
    }

    const review = {
      doctorName,
      doctorRecommendation,
      comments: comments || '',
      prescription: prescription || '',
      reviewedAt: now
    };

    const patched = store.updateCase(caseId, { doctorReview: review, status: 'CLOSED' });
    patched.audit = patched.audit || [];
    patched.audit.push({
      actor: doctorName,
      action: 'doctor_review',
      payload: { recommendation: doctorRecommendation, hasPrescription: !!prescription },
      timestamp: now
    });
    store.updateCase(caseId, patched);

    // Create follow-up if requested and patient exists
    if (followUpDate && kase.patientId) {
      patients.addFollowUp(kase.patientId, {
        scheduledDate: followUpDate,
        reason: `Follow-up for case ${caseId}`,
        caseId: caseId,
        createdBy: doctorName
      });
    }

    return res.json(patched);
  }

  if (action === 'action_taken') {
    const { actionName, actor } = req.body || {};
    const updated = store.getById(caseId);
    if (!updated) return res.status(404).json({ error: 'Case not found' });
    updated.audit = updated.audit || [];
    updated.audit.push({ actor: actor || 'PCW', action: actionName || 'action_taken', timestamp: now });
    store.updateCase(caseId, { audit: updated.audit });
    return res.json({ success: true, audit: updated.audit });
  }

  return res.status(400).json({ error: 'Unknown action' });
});

// ============== PATIENT MANAGEMENT ENDPOINTS ==============

// POST /patients - create patient
app.post('/patients', (req, res) => {
  const patient = patients.createPatient(req.body);
  res.json(patient);
});

// GET /patients - list/search patients
app.get('/patients', (req, res) => {
  const { search } = req.query;
  const results = search ? patients.searchPatients(search) : patients.getAllPatients();
  res.json(results);
});

// GET /patients/:id - get patient details
app.get('/patients/:id', (req, res) => {
  const patient = patients.getPatient(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(patient);
});

// PUT /patients/:id - update patient
app.put('/patients/:id', (req, res) => {
  const patient = patients.updatePatient(req.params.id, req.body);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(patient);
});

// GET /patients/:id/history - get patient history with cases
app.get('/patients/:id/history', (req, res) => {
  const history = patients.getPatientHistory(req.params.id, store);
  if (!history) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(history);
});

// POST /patients/:id/follow-ups - add follow-up
app.post('/patients/:id/follow-ups', (req, res) => {
  const followUp = patients.addFollowUp(req.params.id, req.body);
  if (!followUp) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(followUp);
});

// PUT /patients/:patientId/follow-ups/:followUpId - update follow-up
app.put('/patients/:patientId/follow-ups/:followUpId', (req, res) => {
  const followUp = patients.updateFollowUp(req.params.patientId, req.params.followUpId, req.body);
  if (!followUp) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }
  res.json(followUp);
});

// GET /follow-ups/pending - get pending follow-ups
app.get('/follow-ups/pending', (req, res) => {
  const days = req.query.days ? Number(req.query.days) : 7;
  const pending = patients.getPendingFollowUps(days);
  res.json(pending);
});

// ============== ANALYTICS ENDPOINTS ==============

// GET /analytics - get dashboard analytics
app.get('/analytics', (req, res) => {
  const cases = store.allCases();
  const allPatients = patients.getAllPatients();
  const analytics = getAnalytics(cases, allPatients);
  res.json(analytics);
});

// API alias for modern frontend compatibility
app.get('/api/analytics', auth.authMiddleware(), (req, res) => {
  const cases = store.allCases();
  const allPatients = patients.getAllPatients();
  const analytics = getAnalytics(cases, allPatients);
  res.json({
    ...analytics,
    totalUsers: auth.getAllUsers().length,
    engineStatus: 'online',
    lastSync: new Date().toISOString(),
    recommendationsGenerated: analytics.recommendationsGenerated || 0,
    recentAlerts: analytics.recentAlerts || []
  });
});

app.get('/api/patients', auth.authMiddleware(), (req, res) => {
  const { search } = req.query;
  const results = search ? patients.searchPatients(search) : patients.getAllPatients();
  res.json(results);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /audit-log - get audit log
app.get('/audit-log', (req, res) => {
  const cases = store.allCases();
  const { startDate, endDate, actor, action, limit } = req.query;
  const audits = getAuditLog(cases, {
    startDate,
    endDate,
    actor,
    action,
    limit: limit ? Number(limit) : 100
  });
  res.json(audits);
});

// ============== ADMIN ENDPOINTS ==============

// GET /admin/users - list all users (admin only)
app.get('/admin/users', (req, res) => {
  const users = auth.getAllUsers();
  res.json(users);
});

// POST /admin/users - create user
app.post('/admin/users', (req, res) => {
  const user = auth.createUser(req.body);
  res.json(user);
});

// PUT /admin/users/:id - update user
app.put('/admin/users/:id', (req, res) => {
  const user = auth.updateUser(req.params.id, req.body);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// DELETE /admin/users/:id - delete user
app.delete('/admin/users/:id', (req, res) => {
  const success = auth.deleteUser(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true });
});

// ============== REFERENCE DATA ENDPOINTS ==============

// GET /reference/conditions - get all conditions
app.get('/reference/conditions', (req, res) => {
  res.json(CONDITIONS_DB);
});

// GET /reference/vital-ranges - get vital sign ranges
app.get('/reference/vital-ranges', (req, res) => {
  res.json(VITAL_RANGES);
});

// GET /reference/symptoms - get symptom list
app.get('/reference/symptoms', (req, res) => {
  const symptoms = [
    { id: 'fever', name: 'Fever', category: 'general' },
    { id: 'cough', name: 'Cough', category: 'respiratory' },
    { id: 'breathlessness', name: 'Breathlessness', category: 'respiratory' },
    { id: 'chest_pain', name: 'Chest Pain', category: 'cardiac' },
    { id: 'rash', name: 'Rash', category: 'skin' },
    { id: 'diarrhea', name: 'Diarrhea', category: 'gi' },
    { id: 'vomiting', name: 'Vomiting', category: 'gi' },
    { id: 'headache', name: 'Headache', category: 'neurological' },
    { id: 'abdominal_pain', name: 'Abdominal Pain', category: 'gi' },
    { id: 'fatigue', name: 'Fatigue', category: 'general' },
    { id: 'body_ache', name: 'Body Ache', category: 'general' },
    { id: 'sore_throat', name: 'Sore Throat', category: 'ent' },
    { id: 'runny_nose', name: 'Runny Nose', category: 'ent' },
    { id: 'joint_pain', name: 'Joint Pain', category: 'musculoskeletal' },
    { id: 'back_pain', name: 'Back Pain', category: 'musculoskeletal' },
    { id: 'muscle_pain', name: 'Muscle Pain', category: 'musculoskeletal' },
    { id: 'nausea', name: 'Nausea', category: 'gi' },
    { id: 'dizziness', name: 'Dizziness', category: 'neurological' },
    { id: 'confusion', name: 'Confusion', category: 'neurological' },
    { id: 'swelling', name: 'Swelling', category: 'general' },
    { id: 'dysuria', name: 'Painful Urination', category: 'urinary' },
    { id: 'frequency', name: 'Frequent Urination', category: 'urinary' },
    { id: 'palpitations', name: 'Palpitations', category: 'cardiac' },
    { id: 'sweating', name: 'Excessive Sweating', category: 'general' },
    { id: 'weight_loss', name: 'Weight Loss', category: 'general' },
    { id: 'loss_of_appetite', name: 'Loss of Appetite', category: 'general' },
    { id: 'blurred_vision', name: 'Blurred Vision', category: 'eyes' },
    { id: 'photophobia', name: 'Light Sensitivity', category: 'eyes' },
    { id: 'neck_stiffness', name: 'Neck Stiffness', category: 'neurological' }
  ];
  res.json(symptoms);
});

// ============== UTILITY ENDPOINTS ==============

// POST /import-cases - import cases
app.post('/import-cases', (req, res) => {
  const list = req.body && Array.isArray(req.body.cases) ? req.body.cases : null;
  if (!list) return res.status(400).json({ error: 'cases array required' });

  const imported = [];
  list.forEach((c) => {
    const id = makeId();
    const now = new Date().toISOString();
    const toSave = { ...c, id, createdAt: now };
    store.saveCase(toSave);
    imported.push(toSave);
  });

  res.json({ imported });
});

// GET /health - health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Export app for Vercel
module.exports = app;

// Start server locally if not imported as a module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Healthcare DSS v2.0 - Enhanced Edition`);
    console.log(`========================================`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`\nDefault Login Credentials:`);
    console.log(`  PCW:     pcw1 / pcw123`);
    console.log(`  Doctor:  doctor1 / doc123`);
    console.log(`  Admin:   admin / admin123`);
    console.log(`========================================\n`);
  });
}
