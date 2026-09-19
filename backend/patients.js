// Patient management module
const fs = require('fs');
const path = require('path');

const PATIENTS_FILE = path.join(__dirname, 'patients.json');

let patientsDb = { patients: [] };

function load() {
  try {
    if (fs.existsSync(PATIENTS_FILE)) {
      patientsDb = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf8'));
    } else {
      persist();
    }
  } catch (e) {
    console.error('Failed to load patients', e);
    patientsDb = { patients: [] };
  }
}

function persist() {
  try {
    fs.writeFileSync(PATIENTS_FILE, JSON.stringify(patientsDb, null, 2), 'utf8');
  } catch (e) {
    console.warn('Persistence warning: Could not save patients to local filesystem. Patient database will exist in-memory only.', e.message);
  }
}

function generateId() {
  return 'pat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

function createPatient(data) {
  const patient = {
    id: generateId(),
    // Demographics
    name: data.name || 'Anonymous',
    age: data.age,
    gender: data.gender || 'Unknown',
    dateOfBirth: data.dateOfBirth || null,
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    village: data.village || '',
    district: data.district || '',
    state: data.state || '',
    pincode: data.pincode || '',

    // Identification
    aadharLast4: data.aadharLast4 || '',
    healthId: data.healthId || '',

    // Medical info
    bloodGroup: data.bloodGroup || '',
    allergies: data.allergies || [],
    chronicConditions: data.chronicConditions || [],
    currentMedications: data.currentMedications || [],
    familyHistory: data.familyHistory || [],

    // Emergency contact
    emergencyContact: {
      name: data.emergencyContactName || '',
      phone: data.emergencyContactPhone || '',
      relation: data.emergencyContactRelation || ''
    },

    // Insurance
    insuranceProvider: data.insuranceProvider || '',
    insurancePolicyNumber: data.insurancePolicyNumber || '',

    // System
    caseIds: [],
    followUps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: data.createdBy || 'System'
  };

  patientsDb.patients.push(patient);
  persist();
  return patient;
}

function getPatient(id) {
  return patientsDb.patients.find(p => p.id === id);
}

function updatePatient(id, updates) {
  const idx = patientsDb.patients.findIndex(p => p.id === id);
  if (idx === -1) return null;

  const patient = patientsDb.patients[idx];
  const allowed = [
    'name', 'age', 'gender', 'dateOfBirth', 'phone', 'email', 'address',
    'village', 'district', 'state', 'pincode', 'aadharLast4', 'healthId',
    'bloodGroup', 'allergies', 'chronicConditions', 'currentMedications',
    'familyHistory', 'emergencyContact', 'insuranceProvider', 'insurancePolicyNumber'
  ];

  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) {
      patient[key] = updates[key];
    }
  }
  patient.updatedAt = new Date().toISOString();

  patientsDb.patients[idx] = patient;
  persist();
  return patient;
}

function deletePatient(id) {
  const idx = patientsDb.patients.findIndex(p => p.id === id);
  if (idx === -1) return false;
  patientsDb.patients.splice(idx, 1);
  persist();
  return true;
}

function searchPatients(query) {
  const q = (query || '').toLowerCase();
  if (!q) return patientsDb.patients.slice(0, 50);

  return patientsDb.patients.filter(p => {
    return (p.name && p.name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.healthId && p.healthId.toLowerCase().includes(q)) ||
      (p.aadharLast4 && p.aadharLast4.includes(q)) ||
      (p.id && p.id.includes(q));
  });
}

function getAllPatients() {
  return patientsDb.patients;
}

function linkCaseToPatient(patientId, caseId) {
  const patient = getPatient(patientId);
  if (!patient) return null;

  if (!patient.caseIds.includes(caseId)) {
    patient.caseIds.push(caseId);
    patient.updatedAt = new Date().toISOString();
    persist();
  }
  return patient;
}

function addFollowUp(patientId, followUp) {
  const patient = getPatient(patientId);
  if (!patient) return null;

  const fu = {
    id: 'fu_' + Date.now().toString(36),
    scheduledDate: followUp.scheduledDate,
    reason: followUp.reason || '',
    caseId: followUp.caseId || null,
    status: 'SCHEDULED', // SCHEDULED, COMPLETED, MISSED, CANCELLED
    notes: followUp.notes || '',
    createdAt: new Date().toISOString(),
    createdBy: followUp.createdBy || 'System'
  };

  patient.followUps = patient.followUps || [];
  patient.followUps.push(fu);
  patient.updatedAt = new Date().toISOString();
  persist();

  return fu;
}

function updateFollowUp(patientId, followUpId, updates) {
  const patient = getPatient(patientId);
  if (!patient || !patient.followUps) return null;

  const idx = patient.followUps.findIndex(f => f.id === followUpId);
  if (idx === -1) return null;

  const allowed = ['scheduledDate', 'reason', 'status', 'notes', 'completedAt'];
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) {
      patient.followUps[idx][key] = updates[key];
    }
  }

  persist();
  return patient.followUps[idx];
}

function getPatientHistory(patientId, caseStore) {
  const patient = getPatient(patientId);
  if (!patient) return null;

  const cases = patient.caseIds.map(cid => caseStore.getById(cid)).filter(Boolean);

  return {
    patient,
    cases: cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    followUps: (patient.followUps || []).sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
  };
}

function getPendingFollowUps(daysAhead = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const results = [];
  for (const patient of patientsDb.patients) {
    for (const fu of (patient.followUps || [])) {
      if (fu.status === 'SCHEDULED') {
        const fuDate = new Date(fu.scheduledDate);
        if (fuDate <= cutoff) {
          results.push({
            ...fu,
            patientId: patient.id,
            patientName: patient.name,
            patientPhone: patient.phone
          });
        }
      }
    }
  }

  return results.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
}

// Initialize
load();

module.exports = {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getAllPatients,
  linkCaseToPatient,
  addFollowUp,
  updateFollowUp,
  getPatientHistory,
  getPendingFollowUps
};
