const fs = require('fs');
const path = require('path');

// Simple JSON file datastore. Keeps a memory copy and persists on each write.
const FILE = path.join(__dirname, 'cases.json');

let db = { cases: [] };

function load() {
  try {
    if (fs.existsSync(FILE)) {
      const raw = fs.readFileSync(FILE, 'utf8');
      db = JSON.parse(raw || '{"cases":[] }');
    } else {
      persist();
    }
  } catch (e) {
    console.error('Failed to load datastore', e);
    db = { cases: [] };
  }
}

// Cloud-safe persistence: Attempt local write, but don't crash if read-only (like Vercel)
function persist() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.warn('Persistence warning: Could not write to local filesystem. State will remain in-memory only.', e.message);
    // In Vercel, state is transient per cold-start. 
    // For a real production app, use KV or MongoDB here.
  }
}

function allCases() {
  return db.cases;
}

function getById(id) {
  return db.cases.find(c => c.id === id);
}

function saveCase(caseObj) {
  db.cases.push(caseObj);
  persist();
  return caseObj;
}

function updateCase(id, patch) {
  const idx = db.cases.findIndex(c => c.id === id);
  if (idx === -1) return null;
  db.cases[idx] = { ...db.cases[idx], ...patch };
  persist();
  return db.cases[idx];
}

// initialize
load();

module.exports = { allCases, getById, saveCase, updateCase };
