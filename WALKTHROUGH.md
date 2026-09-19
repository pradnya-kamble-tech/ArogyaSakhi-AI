# 🏥 Healthcare DSS — Complete System Walkthrough
> **Version:** 2.0 Clinical Edition  
> **Last Updated:** February 2026  
> **Purpose:** Step-by-step journey through every feature and screen

---

## 📋 TABLE OF CONTENTS
1. [Starting the System](#1-starting-the-system)
2. [Login Screen](#2-login-screen)
3. [Main Dashboard Layout](#3-main-dashboard-layout)
4. [Left Panel — Anatomical Body Map](#4-left-panel--anatomical-body-map)
5. [Center Panel — Patient Intake Form](#5-center-panel--patient-intake-form)
6. [Voice Clinical Assistant](#6-voice-clinical-assistant)
7. [Submitting a Case — What Happens Behind the Scenes](#7-submitting-a-case--what-happens-behind-the-scenes)
8. [Results Screen — Reading the AI Output](#8-results-screen--reading-the-ai-output)
9. [Escalating a Case to a Specialist](#9-escalating-a-case-to-a-specialist)
10. [Right Panel — Clinical Reasoning Monitor](#10-right-panel--clinical-reasoning-monitor)
11. [Specialist Hub — Doctor's Workflow](#11-specialist-hub--doctors-workflow)
12. [Specialist Alert Watcher](#12-specialist-alert-watcher)
13. [Analytics Dashboard](#13-analytics-dashboard)
14. [Admin Panel](#14-admin-panel)
15. [Language Switching (i18n)](#15-language-switching-i18n)
16. [Export & Print Reports](#16-export--print-reports)

---

## 1. Starting the System

**Who starts it:** Anyone with Node.js installed on the server machine.

```
Step 1 → Double-click run.bat  (Windows)
         OR run: node backend/server.js

Step 2 → Server starts on http://localhost:5000
         Console shows:
         ========================================
         Healthcare DSS v2.0 - Enhanced Edition
         ========================================
         Default Logins:
           PCW:     pcw1    / pcw123
           Doctor:  doctor1 / doc123
           Admin:   admin   / admin123
```

**What's running:**
- Express.js server serving the frontend + handling all API calls
- 6 AI engines loaded into memory
- Translation files (en/hi/mr) loaded from `frontend/i18n/`
- JSON data stores initialized (cases, patients, users)

---

## 2. Login Screen

**URL:** `http://localhost:5000/login.html`

```
┌─────────────────────────────────┐
│      🏥 Healthcare DSS          │
│   Clinical Decision Support     │
│                                 │
│   Username: [____________]      │
│   Password: [____________]      │
│                                 │
│         [ LOGIN ]               │
└─────────────────────────────────┘
```

**Step-by-step:**
1. Enter your username and password
2. System calls `POST /auth/login`
3. On success → receives an auth token stored in browser session
4. Redirected to `index.html` (main clinical dashboard)

**3 Roles available:**
| Role | What they can do |
|---|---|
| **PCW** (Primary Care Worker) | Enter cases, use voice assistant, escalate to specialist |
| **Doctor** | Access Specialist Hub, review escalated cases, write prescriptions |
| **Admin** | Manage users, view analytics, full audit log |

> ⚠️ Note: Auth currently works without enforcing role-based UI locks (prototype stage).

---

## 3. Main Dashboard Layout

Once logged in, the screen is split into **3 columns**:

```
┌──────────────────┬───────────────────────────┬──────────────────┐
│                  │                           │                  │
│  LEFT PANEL      │    CENTER PANEL           │  RIGHT PANEL     │
│                  │                           │                  │
│  👤 Anatomical   │  📝 Patient Intake Form   │  💻 Clinical     │
│  Body Map        │       OR                  │  Reasoning       │
│                  │  📊 Results Screen        │  Monitor         │
│  (SVG clickable  │                           │  (Live log)      │
│   body diagram)  │                           │                  │
└──────────────────┴───────────────────────────┴──────────────────┘
```

**Top bar elements:**
- 🌐 Language selector (English / हिन्दी / मराठी)
- 👨‍⚕️ **Specialist Hub** button — switches to doctor's queue view
- 🏠 **Intake Home** button — returns from specialist view

**Focus Mode:** When a case is being analyzed or results are shown, the two side panels collapse and the center expands for focus. They return when "New Case" is clicked.

---

## 4. Left Panel — Anatomical Body Map

**Purpose:** Visually shows which body regions are affected based on selected symptoms.

```
         ┌───┐
         │ ● │  ← HEAD  (headache, dizziness, confusion, blurred vision)
         └─┬─┘
           │    ← NECK  (sore throat, runny nose)
       ┌───┴───┐
       │ CHEST │ ← CHEST (cough, breathlessness, chest pain, palpitations)
       └───┬───┘
       ┌───┴───┐
       │  ABD  │ ← ABDOMEN (diarrhea, vomiting, abdominal pain, nausea)
       └───┬───┘
      ┌────┴────┐
     LEG      LEG   ← LEGS (joint pain, muscle pain)
                        ARM  ← swelling
                       (GEN) ← systemic (fever, fatigue, body ache, rash)
```

**How it works — step by step:**
1. User ticks a symptom checkbox (e.g., "Fever")
2. `updateAnatomicalFocus()` fires automatically (on `change` event)
3. It looks up `SYMPTOM_TO_REGION` map → finds `fever → 'systemic'`
4. The SVG element with `id="systemic"` gets class `hazard-active`
5. That element pulses red with a glowing animation

**SYMPTOM → REGION mapping:**
```
Head:    headache, dizziness, confusion, blurred_vision, photophobia, neck_stiffness
Neck:    sore_throat, runny_nose
Chest:   cough, breathlessness, chest_pain, palpitations
Abdomen: diarrhea, vomiting, abdominal_pain, nausea, dysuria, frequency
Legs:    joint_pain, muscle_pain
Arms:    swelling
Systemic:fever, fatigue, body_ache, rash, sweating, weight_loss, loss_of_appetite
```

**Anatomy Popup (Interactive):**
1. User clicks directly on any body region in the SVG
2. A popup appears centered on the body panel
3. Shows checkboxes for symptoms relevant to that region
4. User selects symptoms → clicks **"Confirm Selection"**
5. The main form checkboxes are auto-updated
6. Body map updates to show active region

---

## 5. Center Panel — Patient Intake Form

**Filled out by:** PCW (Primary Care Worker)

### Section A — Patient Information
```
Age (years):   [  30  ]    Gender: [ Male ▼ ]
Duration (days): [  1  ]   Severity: [ Medium ▼ ]
```
- **Age** → drives pediatric (<2y, <5y, <12y) and elderly (65+, 75+) risk modifiers
- **Duration** → drives chronicity scoring (5d, 7d, 14d thresholds)
- **Severity** → Low (+5), Medium (+15), High (+35) base score

---

### Section B — Symptoms (19 checkboxes)
```
☑ 🌡️ Fever         ☐ 😷 Cough          ☐ 😮‍💨 Breathlessness
☐ 💔 Chest Pain    ☐ 🤕 Headache        ☐ 🔴 Rash
☐ 💩 Diarrhea      ☐ 🤮 Vomiting        ☐ 🤢 Abdominal Pain
☐ 😴 Fatigue       ☐ 💪 Body Ache       ☐ 🗣️ Sore Throat
☐ 🦴 Joint Pain    ☐ 😵 Nausea          ☐ 💫 Dizziness
☐ 😵‍💫 Confusion   ☐ 🎈 Swelling         ☐ ❤️ Palpitations
☐ 📈 High BP
```
- Each tick simultaneously updates the anatomical body map
- Also detectable via Voice Assistant

---

### Section C — Vital Signs (all optional)
```
BP Systolic (mmHg):   [120]    BP Diastolic (mmHg): [80]
Heart Rate (bpm):      [72]    Temperature (°C):    [37.0]
SpO2 (%):              [98]    Resp. Rate (/min):   [16]
```

**Guardrail validation (before submission):**
```
Temperature:     30–45°C  (outside = blocked)
Heart Rate:      20–250 bpm
SpO2:            30–100%
BP Systolic:     40–300 mmHg
BP Diastolic:    30–200 mmHg
```
> Submitting unrealistic values shows an alert and **prevents** the case from being sent.

---

### Section D — Medical History
```
Allergies (comma-separated): [ Penicillin, Aspirin ]
Current Medications:         [ Metformin, Aspirin ]

Chronic Conditions:
☑ Diabetes   ☐ Hypertension   ☐ Heart Disease
☐ Asthma/COPD ☐ Kidney Disease  ☐ Cancer  ☑ Pregnancy
```
- Allergies → automatically **removed** from suggested treatments
- Medications → checked against drug interaction database
- Pregnancy checkbox → activates the **Maternal Risk Engine**

---

### Section E — Image Upload (Optional)
```
📎 Upload Patient Image (JPG / PNG only)
[  Choose File  ]
```
- Only **filename, size, and upload date** are captured (metadata only)
- File is **never read, uploaded, or stored** (privacy-safe by design)
- Metadata feeds into the **Image Triage Engine** which can nudge the escalation score

---

### Section F — Submit Button
```
[ 🔍 Submit for Clinical Assessment ]
```
1. Form validation runs
2. Vital guardrails check
3. Button disables ("💾 Archiving Case...")
4. Side panels collapse (focus mode)
5. Spinning loading indicator appears

---

## 6. Voice Clinical Assistant

**Purpose:** Let PCWs describe symptoms verbally instead of clicking checkboxes.

### Starting a session:
```
Step 1 → Click [ 🎤 Start Recording ]
Step 2 → Browser requests microphone permission
Step 3 → Canvas waveform visualizer begins animating (indigo bars)
Step 4 → Status shows: "🎙️ Listening..."
Step 5 → Speak naturally in English, Hindi, or Marathi
```

### Live transcript display:
```
┌────────────────────────────────────────────┐
│ LIVE TRANSCRIPT                            │
│ "Patient has fever since two days and..."  │
└────────────────────────────────────────────┘
```

### Automatic keyword detection:
The engine scans every recognized sentence for:

**Symptoms — Examples:**
```
English  → "fever", "headache", "stomach ache"
Hindi    → "बुखार", "सिर दर्द", "पेट दर्द"
Marathi  → "ताप", "डोकेदुखी", "पोटदुखी"
```

**Duration — Examples:**
```
"3 days", "two weeks", "तीन दिन", "दोन आठवडे"
→ Parsed to: 3 days, 14 days, 3 days, 14 days
```

### Review card appears automatically:
```
┌──────────────────────────────────────┐
│ 💡 Suggested Form Updates            │
│                                      │
│ Detected Symptoms:                   │
│ [✅ Fever] [✅ Headache] [✅ Cough]  │
│                                      │
│ Detected Duration:                   │
│ ⏳ 3 days                            │
│                                      │
│ [ Apply Updates ]  [ Discard ]        │
└──────────────────────────────────────┘
```

### Applying suggestions:
- **Apply** → ticks the relevant checkboxes, sets duration field, body map updates
- **Discard** → clears session, nothing is applied
- **RESET** → clears full transcript history

### Stopping:
```
Click [ ⏹️ Stop Recording ]
→ Mic stream stopped
→ Visualizer animation stopped
→ Status returns to "System Standby"
```

---

## 7. Submitting a Case — What Happens Behind the Scenes

When the PCW clicks Submit, the following **6-engine pipeline** runs server-side:

```
Form Data
    │
    ▼
① MATERNAL RISK ENGINE
   └── Is patient pregnant? → Calculate maternal score
    │
    ▼
② BASE RISK ENGINE
   ├── Match symptoms to 14 conditions database
   ├── Score: severity + symptoms + vitals + age + clusters
   ├── Apply drug interaction warnings
   ├── Filter allergies from treatments
   └── Generate reasoning log
    │
    ▼
③ IMAGE TRIAGE ENGINE
   └── Metadata present? → Apply escalation modifier
    │
    ▼
④ ESCALATION ENGINE
   ├── Combine base + maternal + image scores
   ├── Intelligent scenario matching:
   │     Chest pain alone + young + no vital issues → Amber
   │     Seizures / confusion → Always Red
   │     Breathlessness + stable vitals → Amber
   │     Score > 85 with no critical trigger → Red → Amber (guard)
   └── Output: Green / Amber / Red + urgency level
    │
    ▼
⑤ CONFIDENCE ENGINE (DCI)
   └── How complete is the data? → Returns 0–100 score
    │
    ▼
⑥ SUMMARY ENGINE
   └── Generates structured SOAP note
    │
    ▼
Case saved to cases.json
Response JSON returned to browser
```

**Case Status assigned automatically:**
```
urgency === 'Critical' OR 'High' → status = 'ESCALATED'
everything else                  → status = 'AI_REVIEWED'
```

---

## 8. Results Screen — Reading the AI Output

After submission (~1-2s), results appear in the center panel. Side panels return.

### 8.1 — Emergency Banner (conditional)
```
🚨 URGENT: High-risk case — seek immediate medical attention!
```
Only appears when `risk = 'Red'`. Flashing red background.

---

### 8.2 — Main Diagnosis Block
```
🎯 Clinical Assessment Result           [🔴 HIGH RISK]

Cardiorespiratory Concern
DCI: 78/100  ·  Risk Score: 85/100  ·  Triage: Critical
```
- Risk badge color: 🟢 Green / 🟡 Amber / 🔴 Red
- DCI = Diagnostic Certainty Index (data completeness)
- Risk Score = final weighted score from all engines
- Triage = urgency label (Low / Medium / High / Critical)

---

### 8.3 — Physiological Trend Monitoring (NEW)
```
📊 Physiological Trend Monitoring

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🌡️ Temp  │ │ ❤️ HR    │ │ 🫁 SpO2  │ │ 💉 BP    │
│  38.5°C  │ │  105bpm  │ │  96%     │ │  145mmHg │
│[==⚠️===] │ │[===⚠️==] │ │[====✅=] │ │[====⚠️=] │
│Crit Opt  │ │Crit Opt  │ │Crit Opt  │ │Crit Opt  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```
- Only shown if vitals were entered
- Each bar is colored: 🟢 Normal / 🟡 Warning / 🔴 Critical
- Hidden automatically if no vitals were entered

---

### 8.4 — Risk Stratification Heatmap
```
📈 Structured Risk Stratification Heatmap

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📋 Risk      │ │ 🤰 Maternal  │ │ 🎯 DCI       │ │ 🚨 Triage    │
│   85/100     │ │    N/A       │ │   78/100     │ │   Critical   │
│  [RED]       │ │  [LOW]       │ │  [HIGH]      │ │  [RED]       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

### 8.5 — SOAP Clinical Summary
```
📋 Clinical Summary

PRESENTATION              │  ASSESSMENT
─────────────────────     │  ─────────────────────
35yo male patient.        │  High general risk (85/100)
Complaints: chest pain,   │  No maternal risk detected.
breathlessness,sweating.  │
No comorbidities noted.   │  PLAN
No known allergies.       │  ─────────────────────
                          │  Escalation initiated (Emergency).
FINDINGS                  │  Urgency: Critical.
─────────────────────     │  Action: Call Emergency Services.
Fever present.            │
Elevated heart rate.      │
```

---

### 8.6 — Clinical Reasoning Trail
```
🧠 Clinical Reasoning Trail

📋 Triggered Symptoms:
[✅ Chest Pain] [✅ Breathlessness] [✅ Sweating]

📊 Triggered Vital Findings:
🔴 CRITICAL: Severe tachycardia
🔴 Elevated blood pressure

⚠️ Risk Thresholds:
• Acute chest pain detected
• Respiratory distress / Dyspnea
• Palpitations with associated cardiac symptoms
• Cluster bonus: ACS symptom cluster (+20)

🔍 Pattern Logic:
Cardiorespiratory Concern (78% match). Triage: Critical.

🎯 Diagnostic Certainty Index:
78 / 100 — High
```

---

### 8.7 — Recommendations
```
💊 Suggested Treatments
  • Urgent attention required
  • Aspirin (if no allergy)
  • Oxygen administration
  • ECG monitoring

🧪 Recommended Lab Tests
  • Troponin
  • D-Dimer
  • ECG
  • Chest X-Ray
  • CT-PA

⚠️ Warnings
  • Potential interaction: aspirin with warfarin

📝 Suggested Actions
  • Call Emergency Services
  • Emergency transport
  • Basic Life Support measures
```

---

### 8.8 — Differential Diagnosis
```
🧠 Differential Diagnosis (DDx)

Cardiorespiratory Concern    100% match
Anxiety / Panic Disorder      67% match
Anaphylaxis                   50% match
```

---

## 9. Escalating a Case to a Specialist

> Available on the results screen after a case is analyzed.

```
Step 1 → Click [ 🚀 Escalate to Specialist ]

Step 2 → Modal appears:
         ┌─────────────────────────────────┐
         │  📋 Escalation Note (Optional)  │
         │  [________________________]     │
         │  [                        ]     │
         │                                 │
         │  [ 🚀 Dispatch to Specialist ]  │
         └─────────────────────────────────┘

Step 3 → PCW types clinical handover note (optional)

Step 4 → Click Dispatch

Step 5 → Backend called: POST /second-opinion
         { action: "escalate", escalationNote: "..." }
         Case status → ESCALATED

Step 6 → Dispatch confirmation modal:
         ┌─────────────────────────────────┐
         │ 🏥 Consultation Dispatched      │
         │                                 │
         │ ID: CS-47291-B                  │
         │                                 │
         │ Expert consultation initiated.  │
         │ Pending specialist assignment.  │
         │                                 │
         │         [ Close ]               │
         └─────────────────────────────────┘

Step 7 → Escalate button becomes disabled:
         "✅ Dispatched to Specialist"

Step 8 → Review badge appears at top of results:
         [● Consultation Pending Review]
```

---

## 10. Right Panel — Clinical Reasoning Monitor

```
┌────────────────────────────────┐
│ 💻 CLINICAL REASONING MONITOR  │
│ ● SYSTEM ONLINE                │
│ ─────────────────────────────  │
│ 00:01  AI Analysis complete    │
│ 00:02  Risk score: 85          │
│ 00:03  Condition matched: ACS  │
│ 00:04  Escalation: CRITICAL ▌  │
└────────────────────────────────┘
```
- Dark terminal theme with monospace font
- Entries added via `logToMonitor(message, type)`
- Types: `info` (white), `success` (green), `alert` (red)
- Blinking block cursor `▌` on the active line
- Remains visible during the entire session

---

## 11. Specialist Hub — Doctor's Workflow

**Access:** Click **[ 👨‍⚕️ Specialist Hub ]** in the top navigation bar.

```
The main dashboard slides away.
The Specialist Hub takes full screen.
```

### Left column — Case Queue:
```
┌────────────────────────┐
│  📋 CASE QUEUE   [3]   │
│ ─────────────────────  │
│ 4A9F · 14:32          🔴│
│  fever, chest pain...  │
│                        │
│ B82C · 13:45          🟡│
│  headache, vomiting... │
│                        │
│ 1D3E · 12:20          🟢│
│  fatigue, body ache... │
└────────────────────────┘
```
- Auto-refreshes every **15 seconds**
- Color dots = Red/Amber/Green triage level

### Right column — Case Jacket (opens on click):
```
Click any case in the queue →

┌──────────────────────────────────────────────┐
│  CLINICAL SUMMARY REPORT                     │
│  UUID: case_1708... | CLINICAL ORIGIN: PCU-770│
│                              Date: 22/02/2026 │
│                         HIGH PRIORITY ESCAL.  │
│ ─────────────────────────────────────────── │
│ PATIENT IDENTIFIER │ AGE/GENDER │ SEVERITY   │
│   PX-A9F2          │  35Y • M   │  HIGH      │
│ ─────────────────────────────────────────── │
│ ⚠️ PRIMARY CLINICIAN HANDOVER NOTE           │
│ "Patient was anxious, BP very high..."       │
│ ─────────────────────────────────────────── │
│ VITAL SIGNS AT PRESENTATION                  │
│ [Temp: 38.5°C] [HR: 105] [SpO2: 96%]       │
│ [BP: 145mmHg ] [Resp: 20]                   │
│ ─────────────────────────────────────────── │
│ AI DIAGNOSTIC VECTOR                         │
│ Cardiorespiratory Concern     78% confidence │
│ ─────────────────────────────────────────── │
│ SPECIALIST REVIEW FORM                       │
│ Doctor Name:     [____________________]      │
│ Recommendation:  [____________________]      │
│ Clinical Notes:  [____________________]      │
│ Prescription ℞:  [____________________]      │
│                                              │
│ [ ✅ Finalize & Authenticate Review ]        │
└──────────────────────────────────────────────┘
```

### Submitting a doctor review:
```
Step 1 → Fill in: Doctor Name, Recommendation, Comments, Prescription
Step 2 → Click [ ✅ Finalize & Authenticate Review ]
Step 3 → Backend: POST /second-opinion { action: "review", ... }
Step 4 → Case status → CLOSED
Step 5 → Success screen shown with options:
         [ 📥 Download Signed Record ] [ Fetch Next Case ]
```

### Downloading the signed clinical record:
```
Step 1 → Click [ 📥 Download Signed Record ]
Step 2 → System fetches full case from GET /cases/:id
Step 3 → A formatted HTML document opens in a new tab:

┌────────────────────────────────────────┐
│  CLINICAL SUMMARY RECORD               │
│  SECURE MEDICAL ARCHIVE • VERIFIED     │
│                     CASE ID: A9F24B01  │
│ ─────────────────────────────────────  │
│  I. Patient Profile & Encounter Context│
│  II. Vital Signs at Presentation       │
│  III. AI Diagnostic Vector             │
│  IV. Specialist Validation & Orders    │
│                                        │
│  Signatory: Dr. Sharma                 │
│  Final Determination: ADMIT            │
│  Prescription: IV Fluids, ECG Monitor  │
│                                        │
│  ____________________________          │
│  AUTHORIZED SPECIALIST SIGNATURE       │
│                   [ 🖨️ PRINT REPORT ]  │
└────────────────────────────────────────┘

Step 4 → Click PRINT REPORT → browser print dialog
```

---

## 12. Specialist Alert Watcher

**Runs in the background automatically** (no user action needed).

```
Every 20 seconds:
  GET /cases?status=CLOSED

If new reviewed cases found:
  → Alert badge appears in right sidebar
  → Last 5 reviewed cases shown:

┌───────────────────────────────┐
│ CASE: A9F24B                  [REVIEWED] │
│ Cardiorespiratory emergency...           │
│ Dr. Sharma • 14:45                       │
└───────────────────────────────┘

Click the case →
  → Results screen loads with specialist review section visible
  → Doctor's name, recommendation, comments, prescription shown
```

---

## 13. Analytics Dashboard

**URL:** `http://localhost:5000/analytics.html`

```
What's shown:
  - Total cases processed
  - Cases by risk level (Green / Amber / Red)
  - Symptom frequency distribution
  - Escalation rate
  - Cases per day (trend chart)
  - Outbreak alert panel (if 5+ same-symptom cases/day detected)
  - Patient demographics summary
```

**Outbreak detection logic:**
```
≥ 5 cases same symptom same day → "Moderate" outbreak alert
≥ 10 cases                      → "High" outbreak alert
≥ 20 cases                      → "Critical" outbreak alert

Trend analysis:
  Compare first half vs second half of 7-day window
  Second half > 120% of first half → "Increasing"
  Second half < 80%  of first half → "Decreasing"
  Otherwise                        → "Stable"
```

---

## 14. Admin Panel

**URL:** `http://localhost:5000/admin.html`

```
Sections:
  👥 User Management
     → Create / Edit / Delete users
     → Assign roles: pcw / doctor / admin

  📋 Audit Log
     → Every action logged with actor, timestamp, payload
     → Filterable by: date range, actor, action type
     → Actions include: analyze, escalate, doctor_review, action_taken

  ⚙️ System Settings (reference data)
     → View all 14 recognized conditions
     → View all 29 symptoms with categories
     → View vital sign normal ranges
```

---

## 15. Language Switching (i18n)

**Located:** Top-left of every screen.

```
Step 1 → Click language dropdown:
         [ 🌐 Language: English ▼ ]
         → English
         → हिन्दी (Hindi)
         → मराठी (Marathi)

Step 2 → Selected language file fetched:
         GET /i18n/hi.json?v=1708591234567
         (cache-busted on every switch)

Step 3 → All UI labels update instantly:
         "Fever" → "बुखार" / "ताप"
         "Submit" → "जमा करें" / "सादर करा"

Step 4 → If results are currently showing:
         They re-render IMMEDIATELY in the new language
         (cached in lastAIResult variable)
```

**What gets translated:**
- All form labels and placeholders
- Symptom names
- Risk badge labels
- SOAP summary text
- Recommendations, treatments, lab tests
- Action buttons
- Clinical reasoning trail

---

## 16. Export & Print Reports

### Export as JSON:
```
Step 1 → On results screen, click [ 📥 Export JSON ]
Step 2 → Full case JSON downloads as: case_XXXXXXXX.json
         Includes: patient data, vitals, AI output,
                   reasoning log, escalation details,
                   doctor review (if present)
```

### Print Results:
```
Step 1 → Click [ 🖨️ Print ]
Step 2 → Browser print dialog opens
Step 3 → Side panels and UI chrome are hidden
         Only clinical content is printed
```

### Download Signed Clinical Record (from Specialist Hub):
```
→ Full formatted HTML medical document
→ Opens in new tab
→ Contains all 4 sections (Profile, Vitals, AI, Specialist)
→ Includes AUTHENTICATED stamp and signature line
→ Print-ready (no-print elements hidden via CSS)
```

---

## 🔄 Complete User Journey — Quick Summary

```
PCW Login
   ↓
Open Patient Intake Form
   ↓
[Optional] Click body region on anatomy map → select symptoms via popup
   ↓
[Optional] Use Voice Assistant → speak symptoms in EN/HI/MR → Apply
   ↓
Fill: Age, Gender, Severity, Duration
Fill: Vitals (BP, HR, Temp, SpO2, Resp Rate)
Fill: Medical History (Allergies, Meds, Chronic Conditions, Pregnancy)
[Optional] Attach image metadata
   ↓
Click Submit → 6-engine AI pipeline runs → Case saved
   ↓
Results Screen:
  ├── Emergency banner (if Red)
  ├── Risk badge (Green/Amber/Red)
  ├── Vitals sparklines
  ├── Risk heatmap (4 tiles)
  ├── SOAP clinical summary
  ├── Clinical reasoning trail
  ├── Treatments, Labs, Warnings
  └── Differential diagnosis (top 3)
   ↓
[If needed] Click Escalate → note → dispatch → consultation ID assigned
   ↓
Doctor logs into Specialist Hub
   ↓
Sees queue with Red/Amber cases → Opens case jacket
   ↓
Reviews: AI assessment + vitals + handover note
   ↓
Fills: Name + Recommendation + Notes + Prescription
   ↓
Clicks Finalize → Case status = CLOSED
   ↓
PCW's screen gets alert (within 20s) → taps case → sees doctor review
   ↓
PCW exports / prints for medical records
```

---

*Healthcare DSS v2.0 — Clinical Edition | AISSMS Project*
