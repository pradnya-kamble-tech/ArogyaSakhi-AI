# 🏥 Healthcare DSS — Complete Tech Stack & Engine Documentation

**Project:** Healthcare Decision Support System (Healthcare DSS)
**Version:** 2.0.0
**Type:** AI-based Clinical Decision Support System for Primary Healthcare Workers (PHC)
**Date:** March 2026

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Runtime](#technology-runtime)
3. [NPM Packages (Dependencies)](#npm-packages-dependencies)
4. [Node.js Built-in Modules Used](#nodejs-built-in-modules-used)
5. [AI & Decision Engines](#ai--decision-engines)
6. [Backend Modules](#backend-modules)
7. [Frontend Technologies](#frontend-technologies)
8. [Internationalization (i18n)](#internationalization-i18n)
9. [Data Storage](#data-storage)
10. [Deployment](#deployment)
11. [Architecture Diagram](#architecture-diagram)

---

## 🌐 Project Overview

Healthcare DSS is a prototype AI-powered **Clinical Decision Support System** built to assist **Primary Care Workers (PCW)** in rural/underserved areas. It takes patient symptoms, vitals, age, and medical history as input and runs multiple custom AI engines to generate a risk assessment, suggest escalation levels (Green / Amber / Red), recommend lab tests and treatments, and detect outbreak trends across cases.

---

## ⚙️ Technology Runtime

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 16.x | Server-side JavaScript runtime; executes the Express backend |
| **JavaScript (ES6+)** | — | Primary language for both backend and frontend logic |
| **HTML5** | — | Frontend markup and page structure |
| **CSS3** | — | Frontend styling and animations |

---

## 📦 NPM Packages (Dependencies)

These are the **only three external npm packages** used. All AI logic is built in-house (no third-party AI/ML libraries).

### `express` — `^4.18.2`
**Purpose:** Web application framework for Node.js  
**Used in:** `backend/server.js`  
**Why:** Provides the HTTP server, REST API routing, and static file serving. All API endpoints (`/analyze`, `/cases`, `/patients`, `/analytics`, `/auth/*`, `/admin/*`) are built using Express routes.

```js
const app = express();
app.post('/analyze', handler);
app.get('/cases', handler);
```

---

### `body-parser` — `^1.20.2`
**Purpose:** Middleware to parse incoming JSON request bodies  
**Used in:** `backend/server.js`  
**Why:** Allows the server to read `req.body` from POST requests (e.g., patient case submissions). Configured with a 10 MB limit to support base64 image attachments.

```js
app.use(bodyParser.json({ limit: '10mb' }));
```

---

### `cors` — `^2.8.5`
**Purpose:** Cross-Origin Resource Sharing (CORS) middleware  
**Used in:** `backend/server.js`  
**Why:** Allows the frontend (which can be served from a different origin during development or Vercel deployment) to communicate with the backend API without browser security blocks.

```js
app.use(cors());
```

---

## 🔧 Node.js Built-in Modules Used

These are **standard Node.js core modules** — no installation needed.

| Module | Used In | Purpose |
|---|---|---|
| `fs` | `auth.js`, `dataStore.js`, `server.js` | Read/write JSON files (users, patients, cases) for persistent file-based storage |
| `path` | `server.js`, `auth.js`, `dataStore.js` | Resolve file paths in a cross-platform way |
| `crypto` | `auth.js` | Generate cryptographically secure random tokens for session management |

---

## 🧠 AI & Decision Engines

All engines are **custom-built rule-based AI systems** — no third-party ML/AI libraries are used. They live in `backend/services/`.

---

### 1. 🔬 `riskEngine.js` — Base Risk Engine
**File:** `backend/services/riskEngine.js`  
**Size:** ~600 lines  
**Purpose:** The **core clinical reasoning engine**. Takes patient data as input and produces a risk score (0–100) with detailed reasoning.

**What it does:**
- **Condition Matching:** Contains a `CONDITIONS_DB` — a knowledge base of 15+ medical conditions (respiratory infection, cardiac emergency, gastroenteritis, UTI, hypertensive emergency, diabetic emergency, anaphylaxis, migraine, etc.). Each condition has trigger symptom patterns, treatments, and lab tests.
- **Symptom Scoring:** Assigns weighted points to each symptom (e.g., `chest_pain` = 15 pts, `confusion` = 15 pts, `fever` = 12 pts).
- **Vital Sign Analysis (`analyzeVitals`):** Evaluates BP, heart rate, temperature, SpO2, and respiratory rate against clinical normal ranges defined in `VITAL_RANGES`.
- **Red Flag Detection:** Special high-weight modifiers for critical symptoms (chest pain +25, confusion +35, severe bleeding +40).
- **Demographic Sensitivity:** Extra risk points for elderly (65–74: +20, 75+: +35), pediatric (<2y: +30), and maternal patients.
- **Comorbidity Weights:** Adds risk for known conditions (heart disease +20, immunocompromised +25, cancer +15).
- **Symptom Cluster Bonuses:** Fires bonus points when a full cluster is present (e.g., ACS cluster: chest pain + breathlessness + sweating = +20).
- **Severity Multiplier:** Applies a 1.20x multiplier for "Severe" severity.
- **Drug Interaction Checker (`checkDrugInteractions`):** Checks patient's current medications against proposed treatments using a `DRUG_INTERACTIONS` map.
- **Differential Diagnosis (`getDifferentialDiagnosis`):** Returns top 3 possible diagnoses based on symptom overlap.
- **Reasoninglog:** Generates a structured explainability log documenting every score modifier applied.

**Key exports:** `evaluateBaseRisk`, `analyzeVitals`, `getDifferentialDiagnosis`, `CONDITIONS_DB`, `VITAL_RANGES`

---

### 2. 👩‍🍼 `maternalRiskEngine.js` — Maternal Health Risk Engine
**File:** `backend/services/maternalRiskEngine.js`  
**Size:** ~107 lines  
**Purpose:** Dedicated engine for **pregnancy-related risk assessment**.

**What it does:**
- Detects if a patient is pregnant (via `medicalHistory` containing `'pregnancy'` or `'pregnant'`).
- Applies maternal-specific risk modifiers:
  - Age < 18 or > 35: +15 points (high-risk pregnancy age)
  - BP ≥ 140/90: +30 points (pre-eclampsia risk)
- Provides a second function `calculateMaternalRiskScore` which accounts for pregnancy weeks, hemoglobin (anemia screening), previous complications, and maternal-risk symptoms (swelling, severe headache, blurred vision).
- Returns `isMaternal` flag and `riskScoreModifier` which feeds into the Escalation Engine.

**Key exports:** `evaluateMaternalRisk`, `calculateMaternalRiskScore`

---

### 3. 🚨 `escalationEngine.js` — Escalation Decision Engine
**File:** `backend/services/escalationEngine.js`  
**Size:** ~374 lines  
**Purpose:** Determines the **final risk level (Green / Amber / Red)**, urgency, and recommended care actions. The "final judge" after all other engines have run.

**What it does:**
- Combines the base risk score with maternal risk modifiers and image triage modifiers.
- Implements a **priority-based escalation waterfall:**
  1. **Score = 100 (Critical Override):** → Immediate Red/Emergency
  2. **Severe symptoms present** (chest pain, breathlessness, seizures, confusion): → Context-aware Red or Amber
  3. **High maternal risk** (modifier ≥ 25): → Red + Specialist (OB/GYN referral)
  4. **High general risk** (score ≥ 70): → Red/Emergency
  5. **Medium general risk** (score 35–69): → Amber/Primary evaluation
  6. **Low risk** (score < 35): → Green/Routine care
- **Escalation Stability Guard:** Prevents accidental Red escalation from stacked minor modifiers — Red must be confirmed by a critical trigger symptom OR a score > 85.
- Generates suggested action keys (e.g., `action.emergency_transport`, `action.monitor_vitals`).
- Also exposes `intelligentEscalation` as a standalone function for granular calls.

**Key exports:** `determineEscalation`, `intelligentEscalation`

---

### 4. 📊 `confidenceEngine.js` — Diagnostic Certainty Index (DCI) Engine
**File:** `backend/services/confidenceEngine.js`  
**Size:** ~94 lines  
**Purpose:** Calculates a **Diagnostic Certainty Index (DCI)** — a confidence score (0–100%) for the AI's decision.

**What it does:**
Calculates DCI as a weighted composite of four components:

| Component | Weight | Description |
|---|---|---|
| Data Completeness | 40% | How many key fields are provided (age, BP, heart rate, temperature) |
| Symptom Coherence | 30% | Whether symptoms form a recognized clinical cluster |
| Vital Alignment | 20% | Whether vitals are consistent with the stated risk level |
| Conflict Penalty | 10% max | Deducted when contradictions exist (e.g., "fever" reported but temp is normal) |

**Formula:** `DCI = (completeness × 0.40) + (coherence × 0.30) + (alignment × 0.20) - conflictPenalty`

Output labels: **Low** (≤40%), **Moderate** (41–70%), **High** (≥71%)

**Key exports:** `calculateConfidence`

---

### 5. 🖼️ `imageTriageEngine.js` — Image Triage Engine
**File:** `backend/services/imageTriageEngine.js`  
**Size:** ~107 lines  
**Purpose:** Evaluates **visual/image attachments** submitted with a case to detect visual clinical markers and adjust the escalation score.

**What it does:**
- If no attachment is present → returns safe defaults with zero escalation modifier.
- If an attachment is present, applies rules:
  - **Neural Scan Findings:** If `inflammation_detected` is flagged → +15 escalation modifier, urgent specialist alert.
  - **Spectral Shift:** If `spectral_shift_detected` → +8 escalation modifier.
  - **Symptom-based Visual Recommendation:** If symptoms include "wound" or "infection" → recommends visual inspection by doctor.
  - **Legacy High-Risk Rule:** If base score > 70 and no visual detection → +5 modifier.
- Returns `escalationModifier` (number added to risk score), `recommendation` (text), and `neuralAnalysis` metadata.
- Operates in a **sandboxed, stateless manner** — does not write files, does not modify other engines.

**Key exports:** `evaluateImageTriage`

---

### 6. 🦠 `outbreakEngine.js` — Outbreak Detection Engine
**File:** `backend/services/outbreakEngine.js`  
**Size:** ~193 lines  
**Purpose:** Performs **epidemiological surveillance** by analyzing patterns across all cases to detect potential disease outbreaks.

**What it does:**
- Groups all cases by date and symptom, counting symptom frequency per day.
- **Outbreak Threshold:** ≥5 cases of the same symptom on the same day triggers an alert.
- **Severity Levels:**
  - ≥5 cases → Moderate
  - ≥10 cases → High
  - ≥20 cases → Critical
- Sorts alerts from most critical to least.
- `getOutbreakTrend()`: Analyzes 7-day trend (increasing / stable / decreasing) by comparing case counts between the first and second half of the period.
- Report is appended to every `/cases` API response.

**Key exports:** `analyzeOutbreak`, `getOutbreakSummary`, `getOutbreakTrend`

---

### 7. 📝 `summaryEngine.js` — Clinical Summary Engine
**File:** `backend/services/summaryEngine.js`  
**Size:** ~70 lines  
**Purpose:** Generates a structured **clinical summary object** from aggregated analysis data that the frontend can render in any language.

**What it does:**
- Takes patient data, general risk result, maternal risk result, and escalation result.
- Instead of producing English text strings (which would be hard to translate), it produces **structured i18n-compatible keys** — e.g., `risk.category.high`, `urgency.critical`, `action.emergency_eval`.
- Uses `analyzeVitalsForSummary()` to flag vital abnormalities: high/low BP, temperature, pulse, and hemoglobin (anemia).
- Output contains: `presentation`, `vitals`, `assessment`, and `plan` sections.
- The frontend reads this structured object and renders it using the loaded i18n translation file.

**Key exports:** `generateClinicalSummary`

---

## 🗄️ Backend Modules

These are support modules in the `backend/` directory (not AI engines but essential services).

### `server.js` — Main Application Server
**File:** `backend/server.js`  
**Size:** ~607 lines  
**Purpose:** The **entry point** of the application. Wires all engines and modules into a REST API.

**API Endpoints Provided:**

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Authenticate user, return session token |
| POST | `/auth/logout` | Invalidate session token |
| GET | `/auth/me` | Validate token and return current user info |
| POST | `/analyze` | **Core endpoint** — run all AI engines on patient case |
| GET | `/cases` | List all cases with filtering + outbreak report |
| GET | `/cases/:id` | Get single case by ID |
| POST | `/second-opinion` | Escalate or doctor-review a case |
| POST | `/patients` | Create patient record |
| GET | `/patients` | List / search patients |
| GET | `/patients/:id` | Get patient profile |
| PUT | `/patients/:id` | Update patient |
| GET | `/patients/:id/history` | Get patient's case history |
| POST | `/patients/:id/follow-ups` | Add follow-up appointment |
| PUT | `/patients/:id/follow-ups/:fid` | Update follow-up |
| GET | `/follow-ups/pending` | Get upcoming follow-ups |
| GET | `/analytics` | Dashboard statistics and KPIs |
| GET | `/audit-log` | Queryable audit trail |
| GET | `/admin/users` | List users (admin) |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/reference/conditions` | Get all conditions from DB |
| GET | `/reference/vital-ranges` | Get vital sign normal ranges |
| GET | `/reference/symptoms` | Get full symptom list |
| GET | `/health` | Health check endpoint |

---

### `auth.js` — Authentication Module
**File:** `backend/auth.js`  
**Purpose:** Token-based session authentication for the prototype.

**Key features:**
- **Users stored in** `users.json` (file-based), loaded on startup.
- Default roles: `PCW` (Primary Care Worker), `DOCTOR`, `SPECIALIST`, `ADMIN`, `AUDITOR`.
- Uses Node's `crypto.randomBytes(32)` to generate secure 64-character hex tokens.
- Sessions are stored **in-memory** (JS `Map`) with 8-hour expiry.
- Provides an Express `authMiddleware` for role-based route protection.
- **Note:** No bcrypt hashing used (prototype only — suitable for hackathon demo).

---

### `analytics.js` — Analytics Module
**File:** `backend/analytics.js`  
**Purpose:** Generates all **dashboard statistics and reporting data** from the case database.

**What it computes:**
- Total cases, patients, cases today / this week / this month.
- Status distribution: AI_REVIEWED, ESCALATED, DOCTOR_REVIEWED, CLOSED.
- Risk distribution: Green / Amber / Red counts.
- Condition distribution and top 5 conditions.
- Age group distribution (0–5, 6–12, 13–18, 19–40, 41–60, 60+).
- Severity distribution (Low / Medium / High).
- Top 10 most frequent symptoms.
- 7-day trend data (daily case counts by risk level).
- Hourly and daily distribution of cases (for heat maps).
- Escalation rate and average processing time (creation to doctor review).
- Queryable **audit log** with filters by date, actor, and action type.

---

### `patients.js` — Patient Record Manager
**File:** `backend/patients.js`  
**Purpose:** CRUD operations for **patient records** with longitudinal health tracking.

**Features:**
- Create, read, update patient profiles.
- Search patients by name.
- Link case IDs to a patient record.
- Store and manage scheduled follow-up appointments.
- Return full patient history with linked cases.

---

### `dataStore.js` — In-Memory + File Persistence Store
**File:** `backend/dataStore.js`  
**Purpose:** Simple **data persistence layer** for case storage.

**Features:**
- Keeps all cases in memory (array) for fast access.
- Periodically saves to `cases.json` for persistence across restarts.
- Provides: `saveCase`, `allCases`, `getById`, `updateCase`.

---

## 🎨 Frontend Technologies

The frontend is a **vanilla HTML/CSS/JavaScript** single-page application — no frontend frameworks used.

### Pages

| File | Purpose |
|---|---|
| `frontend/index.html` | Main case entry form + AI results display (PCW portal) — 2978 lines |
| `frontend/analytics.html` | Analytics dashboard with charts and KPIs |
| `frontend/admin.html` | Admin panel for user management |
| `frontend/login.html` | Login page |
| `frontend/doctor.html` | Doctor review portal |
| `frontend/voice-assistant-standalone.html` | Standalone voice assistant demo page |

### JavaScript Files

| File | Purpose |
|---|---|
| `frontend/app.js` | Core app logic: form handling, API calls, result rendering |
| `frontend/app-new.js` | Enhanced version of app.js (82 KB) with advanced features |
| `frontend/voice-handler.js` | **Web Speech API** integration — voice input for symptom capture |
| `frontend/sw.js` | **Service Worker** — enables PWA (Progressive Web App) offline caching |

### Key Frontend Features

| Feature | Technology Used |
|---|---|
| **Voice Input** | Web Speech API (`SpeechRecognition`) — browser native, no library needed |
| **Animations** | CSS keyframe animations (`fadeIn`, `pulse`, `pulse-grow`, `spin`, `region-pulse`) |
| **Body Map** | Inline SVG with reactive region highlighting |
| **Vital Sparklines** | CSS progress bars with gradient fills |
| **Service Worker** | `sw.js` for PWA offline capability |
| **Fetch API** | Native browser `fetch()` for all REST API calls |
| **LocalStorage** | Stores auth token and user session |

### Styling

| File | Purpose |
|---|---|
| `frontend/style.css` | Global CSS resets and shared styles |
| Inline `<style>` in HTML | Component-specific styles per page |

**Design system:** Uses `Segoe UI` font family, indigo/purple gradient (`#667eea → #764ba2`) as primary color, card-based layout with box shadows, responsive grid.

---

## 🌍 Internationalization (i18n)

The system supports multiple languages for clinical outputs.

| Language | File | Size |
|---|---|---|
| English | `frontend/i18n/en.json` | 18 KB |
| Spanish | `frontend/i18n/es.json` | 2.3 KB |
| Hindi | `frontend/i18n/hi.json` | 32 KB |
| Marathi | `frontend/i18n/mr.json` | 32 KB |

**How it works:**
- The backend loads all i18n files at startup and can use them for server-side localization.
- The `summaryEngine.js` returns structured i18n key objects (not raw strings).
- The frontend reads the user's selected language (`<select>` dropdown), loads the corresponding JSON, and uses it to render condition names, urgency levels, action recommendations, and clinical summaries.
- Translation keys follow a namespace convention: `condition.*`, `urgency.*`, `action.*`, `maternal.*`, `risk.*`, `vitals.*`, `lab.*`, `treatment.*`.

---

## 💾 Data Storage

| Data | Storage Method | File |
|---|---|---|
| Cases | JSON file (via `dataStore.js`) | `backend/cases.json` |
| Patients | JSON file (via `patients.js`) | `backend/patients.json` |
| Users | JSON file (via `auth.js`) | `backend/users.json` |
| Sessions | In-memory (`Map`) | — |

> ⚠️ **Note:** All storage is file-based JSON for hackathon prototype purposes. Production deployments should use a proper database (MongoDB, PostgreSQL, etc.).

---

## ☁️ Deployment

| File | Purpose |
|---|---|
| `vercel.json` | Vercel deployment configuration — routes all requests to the Express server |
| `.vercel/` | Vercel project metadata |
| `run.bat` | Windows batch script to start the server locally |
| `run.ps1` | PowerShell script to start the server locally |

**Deployment target:** [Vercel](https://vercel.com)  
**Start command:** `node backend/server.js`  
**Default port:** `5000` (or `process.env.PORT` on cloud)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                    │
│   index.html  ·  app.js  ·  voice-handler.js  ·  sw.js      │
│   analytics.html  ·  admin.html  ·  login.html               │
│          (Fetch API → REST calls → Backend)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND — Express Server (server.js)           │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  auth.js   │  │  patients.js │  │    analytics.js      │ │
│  │ Token auth │  │ Patient CRUD │  │  Stats & Audit log   │ │
│  └────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              AI ENGINE PIPELINE                        │  │
│  │  POST /analyze runs ALL engines in sequence:           │  │
│  │                                                        │  │
│  │  1. maternalRiskEngine  →  Pregnancy risk modifier     │  │
│  │  2. riskEngine          →  Base score + reasoning      │  │
│  │  3. imageTriageEngine   →  Visual marker detection     │  │
│  │  4. escalationEngine    →  Final Red/Amber/Green       │  │
│  │  5. confidenceEngine    →  DCI confidence score        │  │
│  │  6. summaryEngine       →  i18n clinical summary       │  │
│  │  7. riskEngine.getDiff  →  Differential diagnosis      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              SURVEILLANCE                              │  │
│  │    outbreakEngine  →  Disease outbreak detection        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Read/Write
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA LAYER (JSON Files)                     │
│     cases.json  ·  patients.json  ·  users.json             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Summary Table — All Engines at a Glance

| Engine | File | Input | Output | Purpose |
|---|---|---|---|---|
| **Risk Engine** | `riskEngine.js` | Age, symptoms, vitals, meds, history | Risk score 0–100, conditions, treatments, reasoning log | Core clinical risk scoring |
| **Maternal Risk Engine** | `maternalRiskEngine.js` | Age, symptoms, vitals, medical history | isMaternal flag, riskScoreModifier | Pregnancy-specific risk |
| **Escalation Engine** | `escalationEngine.js` | Base risk + maternal + imageTriage | Red/Amber/Green, urgency, actions | Final escalation decision |
| **Confidence Engine** | `confidenceEngine.js` | Patient data, risk results | DCI score 0–100, level, components | AI confidence scoring |
| **Image Triage Engine** | `imageTriageEngine.js` | Attachments, symptoms, visual findings | escalationModifier, recommendation | Visual/image analysis |
| **Outbreak Engine** | `outbreakEngine.js` | All cases array | outbreak alerts, trends | Epidemic surveillance |
| **Summary Engine** | `summaryEngine.js` | All analysis results | Structured i18n clinical summary | Multilingual reporting |

---

## 📦 Complete Package.json

```json
{
  "name": "healthcare-dss",
  "version": "1.0.0",
  "description": "Prototype AI-based decision support system for primary healthcare workers (hackathon)",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5"
  }
}
```

---

*Document generated on 2026-03-26 | Healthcare DSS v2.0*
