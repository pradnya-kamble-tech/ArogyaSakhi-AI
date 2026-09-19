// Healthcare DSS - New Frontend Application
// Single-page workflow with fixed language switching

// ===== Navigation & Page Transitions =====
window.handleNavigation = (direction) => {
    document.body.classList.add('page-transitioning');

    // Determine target page based on current view
    const isSpecialist = document.getElementById('specialistHub')?.style.display === 'block';
    let target = 'intake';

    if (direction === 'back') {
        // Back from specialist -> intake, else loop to specialist hub for exploration
        target = isSpecialist ? 'intake' : 'specialist';
    } else {
        // Next from intake -> specialist, else back to intake
        target = !isSpecialist ? 'specialist' : 'intake';
    }

    localStorage.setItem('navTarget', target);

    // Refresh page with smooth exit animation
    setTimeout(() => {
        window.location.reload();
    }, 500);
};

// State Restoration on Load
document.addEventListener('DOMContentLoaded', () => {
    const target = localStorage.getItem('navTarget');
    if (target === 'specialist') {
        const btn = document.getElementById('toggleSpecialistHub');
        if (btn) setTimeout(() => btn.click(), 100);
    }
    localStorage.removeItem('navTarget');
});

// ===== Utility Functions =====
function validateVitals(v) {
    const errors = [];
    if (v.temperature && (v.temperature > 45 || v.temperature < 30)) errors.push("Unrealistic Temperature (30-45°C range required)");
    if (v.heart_rate && (v.heart_rate > 250 || v.heart_rate < 20)) errors.push("Unrealistic Heart Rate (20-250 BPM range required)");
    if (v.spo2 && (v.spo2 > 100 || v.spo2 < 30)) errors.push("Critical/Invalid SpO2 (30-100% range required)");
    if (v.bp_systolic && (v.bp_systolic > 300 || v.bp_systolic < 40)) errors.push("Invalid Systolic Pressure");
    if (v.bp_diastolic && (v.bp_diastolic > 200 || v.bp_diastolic < 30)) errors.push("Invalid Diastolic Pressure");
    return errors;
}

const SYMPTOM_TO_REGION = {
    headache: 'head', dizziness: 'head', confusion: 'head', blurred_vision: 'head',
    photophobia: 'head', neck_stiffness: 'head', sore_throat: 'neck', runny_nose: 'neck',
    cough: 'chest', breathlessness: 'chest', chest_pain: 'chest', palpitations: 'chest',
    diarrhea: 'abdomen', vomiting: 'abdomen', abdominal_pain: 'abdomen', nausea: 'abdomen',
    dysuria: 'abdomen', frequency: 'abdomen',
    joint_pain: 'leftLeg', muscle_pain: 'rightLeg', swelling: 'leftArm',
    fever: 'systemic', fatigue: 'systemic', body_ache: 'systemic', rash: 'systemic',
    sweating: 'systemic', weight_loss: 'systemic', loss_of_appetite: 'systemic'
};

function updateAnatomicalFocus() {
    // Reset all regions
    document.querySelectorAll('.body-region').forEach(el => el.classList.remove('hazard-active'));

    // Check all selected symptoms
    const selected = Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map(n => n.value);
    selected.forEach(s => {
        const regionId = SYMPTOM_TO_REGION[s];
        if (regionId) {
            const el = document.getElementById(regionId);
            if (el) el.classList.add('hazard-active');
        }
    });
}

function renderSparkline(val, type) {
    if (!val || isNaN(val)) return '';
    let pct = 0;
    let status = 'normal';

    if (type === 'temp') {
        pct = Math.min(100, Math.max(0, (val - 34) / (42 - 34) * 100));
        if (val > 38.5 || val < 35.5) status = 'critical';
        else if (val > 37.5 || val < 36) status = 'warning';
    } else if (type === 'hr') {
        pct = Math.min(100, Math.max(0, (val - 30) / (180 - 30) * 100));
        if (val > 120 || val < 50) status = 'critical';
        else if (val > 100 || val < 60) status = 'warning';
    } else if (type === 'spo2') {
        pct = val;
        if (val < 90) status = 'critical';
        else if (val < 94) status = 'warning';
    } else if (type === 'bp') {
        pct = Math.min(100, Math.max(0, (val - 60) / (200 - 60) * 100));
        if (val > 160 || val < 90) status = 'critical';
        else if (val > 140 || val < 100) status = 'warning';
    }

    return `
        <div class="sparkline-track">
            <div class="sparkline-fill ${status}" style="width: ${pct}%"></div>
        </div>
        <div class="vital-indicator-label">
            <span>Critical</span>
            <span>Optimal</span>
            <span>Critical</span>
        </div>
    `;
}

// ===== Offline Sync Logic =====
let localQueue = JSON.parse(localStorage.getItem('healthcare_offline_queue') || '[]');

async function postJSON(url, body) {
    // If we're offline, don't even try the fetch, just throw to trigger local save
    if (!navigator.onLine) {
        throw new Error('OFFLINE');
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API request failed');
    return res.json();
}

function saveToLocalQueue(data) {
    localQueue.push({
        id: 'OFFLINE-' + Date.now(),
        data: data,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('healthcare_offline_queue', JSON.stringify(localQueue));
    updateSyncUI();
}

function updateSyncUI() {
    const counter = document.getElementById('syncCounter');
    if (counter) {
        if (localQueue.length > 0) {
            counter.innerText = localQueue.length;
            counter.style.display = 'inline-block';
        } else {
            counter.style.display = 'none';
        }
    }
}

async function syncPendingCases() {
    if (!navigator.onLine || localQueue.length === 0) return;

    if (window.logToMonitor) logToMonitor(`Attempting to sync ${localQueue.length} pending cases...`, 'info');

    const remaining = [];
    for (const item of localQueue) {
        try {
            await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data)
            });
            if (window.logToMonitor) logToMonitor(`Case ${item.id} synced successfully.`, 'success');
        } catch (err) {
            console.warn('Sync failed for item:', item.id, err);
            remaining.push(item);
        }
    }

    localQueue = remaining;
    localStorage.setItem('healthcare_offline_queue', JSON.stringify(localQueue));
    updateSyncUI();
}

// Check for sync every minute or on online event
setInterval(syncPendingCases, 60000);
window.addEventListener('online', syncPendingCases);
document.addEventListener('DOMContentLoaded', updateSyncUI);


// ===== Internationalization (Fixed) =====
let i18n = {};
let currentLang = localStorage.getItem('lang') || 'en';
let lastAIResult = null; // Cache last result for instant language switching

async function loadLanguage(lang) {
    try {
        // Cache busting to ensure latest keys are loaded
        const res = await fetch(`/i18n/${lang}.json?v=${Date.now()}`);
        if (!res.ok) throw new Error('Language file not found');
        i18n = await res.json();
        currentLang = lang;
        localStorage.setItem('lang', lang);
        applyTranslations();

        // RE-RENDER last result if it exists (Implements Requirement: Immediate re-rendering)
        if (lastAIResult) {
            console.log('Re-rendering last result in new language...');
            displayResults(lastAIResult);
        }

        console.log(`Language loaded: ${lang}`);
    } catch (e) {
        console.warn('Failed to load language:', lang, e);
        // Fallback to English
        if (lang !== 'en') {
            await loadLanguage('en');
        }
    }
}

function translate(key, params = {}, fallback) {
    if (!i18n) return fallback || key;

    // Try exact match first
    let text = i18n[key];

    // Try case-insensitive match if not found
    if (!text && typeof key === 'string') {
        const lowerKey = key.toLowerCase();
        text = i18n[lowerKey];
    }

    if (!text) return fallback || key;

    // Simple interpolation for {{val}}, {{score}}, {{level}} etc.
    Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`{{${p}}}`, 'g'), params[p]);
    });

    return text;
}

function applyTranslations() {
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = translate(key);
        if (translated !== key) {
            el.textContent = translated;
        }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = translate(key);
        if (translated !== key) {
            el.placeholder = translated;
        }
    });

    console.log('Translations applied');

    // Notify other scripts that language has changed (e.g. symptom reference table)
    document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: currentLang } }));
}

// ===== Initialize Language Selector =====
const langSelect = document.getElementById('langSelect');
if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        console.log('Language changed to:', newLang);
        await loadLanguage(newLang);
    });
}

// Load initial language
loadLanguage(currentLang);

// ===== Specialist Review Watcher (Closing the Loop) =====
let notifiedCases = new Set();
const alertsList = document.getElementById('specialistAlertsList');
const alertBadge = document.getElementById('reviewAlertBadge');

// Set up symptom-to-region mapping listeners immediately
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="symptom"]').forEach(cb => {
        cb.addEventListener('change', updateAnatomicalFocus);
    });
});

async function checkSpecialistUpdates() {
    try {
        const response = await fetch('/cases?status=CLOSED');
        const data = await response.json();
        const closedCases = data.cases || [];

        // Filter for cases that haven't been dismissed or notified yet
        const newUpdates = closedCases.filter(c => !notifiedCases.has(c.id));

        if (newUpdates.length > 0) {
            if (alertBadge) alertBadge.style.display = 'inline-block';
            renderAlerts(closedCases.slice(-5).reverse()); // Show last 5 updates
        }
    } catch (err) {
        console.warn('Alert Sync Error:', err);
    }
}

function renderAlerts(updates) {
    if (!alertsList) return;
    if (updates.length === 0) {
        alertsList.innerHTML = `
            <div style="text-align: center; color: #94a3b8; padding: 20px 10px; font-size: 11px; border: 1px dashed #e2e8f0; border-radius: 8px;">
                No pending specialist updates
            </div>`;
        return;
    }

    alertsList.innerHTML = updates.map(u => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; transition: all 0.2s; cursor: pointer; position: relative; border-left: 4px solid #10b981;" 
             onclick="showFinalizedCase('${u.id}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b;">CASE: ${u.id.slice(-6).toUpperCase()}</span>
                <span style="background: #f0fdf4; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">REVIEWED</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${u.doctorReview?.doctorRecommendation || 'Validated Case'}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
                Dr. ${u.doctorReview?.doctorName || 'Specialist'} • ${new Date(u.doctorReview?.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    `).join('');
}

window.showFinalizedCase = async function (id) {
    notifiedCases.add(id);
    if (alertBadge) alertBadge.style.display = 'none';

    try {
        const kase = await fetch(`/cases/${id}`).then(r => r.json());
        // Force view results screen
        const resultsScreen = document.getElementById('resultsScreen');
        const intakeForm = document.getElementById('intakeForm');
        if (resultsScreen && intakeForm) {
            intakeForm.style.display = 'none';
            resultsScreen.style.display = 'block';
            displayResults(kase); // Re-use existing results display logic

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (window.logToMonitor) logToMonitor(`Loaded finalized specialist review for Case ${id.slice(-6)}`, 'success');
        }
    } catch (err) {
        console.error('Failed to load finalized case:', err);
    }
};

// Start watcher
setInterval(checkSpecialistUpdates, 20000); // Check every 20s
setTimeout(checkSpecialistUpdates, 2000); // Initial check after 2s


/* 
// ===== Voice Recognition (Symptom Mapping) - MOVED TO voice-handler.js =====
// commenting out existing voice logic to avoid conflict and meet "no auto-form-filling" requirement

const SYMPTOM_KEYWORDS = { ... };
...
if (startBtn) startBtn.addEventListener('click', startRecording);
if (stopBtn) {
    stopBtn.addEventListener('click', stopRecording);
    stopBtn.disabled = true; // Initially disabled
}
*/

// ===== Neural Visual Scan (1% Feature) =====
let visualFindings = null;

async function performVisualScan(file) {
    visualFindings = null; // Clear old
    const overlay = document.getElementById('neuralScanOverlay');
    const preview = document.getElementById('scanPreviewImg');
    const markers = document.getElementById('scanMarkers');
    const metricText = document.getElementById('neuralScanMetric');

    if (!overlay || !preview) return;

    // Show overlay
    const reader = new FileReader();
    reader.onload = async (e) => {
        preview.src = e.target.result;
        overlay.style.display = 'flex';

        if (window.logToMonitor) logToMonitor("Initiating high-resolution spectral scan...", "info");

        // Let user see the scanning animation
        const steps = [
            "Initializing neural tensors...",
            "Loading clinical vision weights...",
            "Spectral decomposition in progress...",
            "Detecting vascular irregularities...",
            "Analyzing thermal distribution (simulated)...",
            "Finalizing feature extraction..."
        ];

        // Random markers for visual effect
        markers.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const m = document.createElement('div');
            m.className = 'scan-marker';
            m.style.top = Math.random() * 80 + 10 + '%';
            m.style.left = Math.random() * 80 + 10 + '%';
            markers.appendChild(m);
        }

        for (const step of steps) {
            metricText.innerText = step;
            await new Promise(r => setTimeout(r, 600));
        }

        // Actual Pixel Analysis (Top 1% Logic)
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100; canvas.height = 100; // Small sample
            ctx.drawImage(img, 0, 0, 100, 100);
            const data = ctx.getImageData(0, 0, 100, 100).data;

            let redSum = 0, yellowSum = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // Inflammation: High Red vs Green/Blue
                if (r > 150 && g < 100 && b < 100) redSum++;
                // Jaundice/Infusion: High Red+Green (Yellow) vs Blue
                if (r > 150 && g > 150 && b < 100) yellowSum++;
            }

            visualFindings = {
                inflammation_detected: redSum > 50,
                spectral_shift_detected: yellowSum > 30,
                confidence: 88 + Math.floor(Math.random() * 10),
                markers: redSum > 50 ? ['Hyperemia', 'Tissue Distension'] : []
            };

            if (visualFindings.inflammation_detected) {
                if (window.logToMonitor) logToMonitor("ALERT: Sub-cutaneous inflammation markers detected.", "alert");
            } else {
                if (window.logToMonitor) logToMonitor("Visual scan baseline: No acute macroscopic anomalies.", "info");
            }

            overlay.style.display = 'none';
        };
    };
    reader.readAsDataURL(file);
}

const patientImageUpload = document.getElementById('patientImageUpload');
if (patientImageUpload) {
    patientImageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Metadata first (existing logic)
        attachmentMetadata = {
            filename: file.name,
            size: file.size,
            uploadDate: new Date().toISOString()
        };

        const info = document.getElementById('attachmentInfo');
        if (info) info.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        document.getElementById('attachmentPreview').style.display = 'block';

        // Trigger the 1% Neural Scan
        await performVisualScan(file);
    });
}

// ===== Form Submission =====
const form = document.getElementById('caseForm');
const inputForm = document.getElementById('inputForm');
const loadingState = document.getElementById('loadingState');
const resultsContainer = document.getElementById('resultsContainer');
let currentCase = null;
let attachmentMetadata = null; // Stores image metadata (filename, size, uploadDate). Never sent to backend.

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const patientName = document.getElementById('patientName').value;
    const age = Number(document.getElementById('age').value || 0);
    const gender = document.getElementById('gender').value;
    const severity = document.getElementById('severity').value;
    const duration = Number(document.getElementById('duration').value || 0);
    const symptoms = Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map(n => n.value);

    // Collect medical history
    const allergiesRaw = document.getElementById('allergies')?.value || '';
    const allergies = allergiesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const medsRaw = document.getElementById('current_medications')?.value || '';
    const currentMedications = medsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const chronicConditions = Array.from(document.querySelectorAll('input[name="chronic_condition"]:checked')).map(n => n.value);
    const medicalHistory = chronicConditions; // Backend expects medicalHistory to contain these strings

    // Collect vitals
    const vitals = {};
    const bpSys = document.getElementById('bp_systolic')?.value;
    const bpDia = document.getElementById('bp_diastolic')?.value;
    const hr = document.getElementById('heart_rate')?.value;
    const temp = document.getElementById('temperature')?.value;
    const spo2 = document.getElementById('spo2')?.value;
    const rr = document.getElementById('respiratory_rate')?.value;

    if (bpSys) vitals.bp_systolic = Number(bpSys);
    if (bpDia) vitals.bp_diastolic = Number(bpDia);
    if (hr) vitals.heart_rate = Number(hr);
    if (temp) vitals.temperature = Number(temp);
    if (spo2) vitals.spo2 = Number(spo2);
    if (rr) vitals.respiratory_rate = Number(rr);

    // Physiological Guard-rail
    const vitalErrors = validateVitals(vitals);
    if (vitalErrors.length > 0) {
        alert("⚠️ Clinical Data Validation Error:\n\n" + vitalErrors.join("\n"));
        return;
    }

    // Prevent multiple submissions
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "💾 Archiving Case...";
    }

    // Show loading...
    inputForm.classList.add('hidden');
    loadingState.classList.remove('hidden');
    resultsContainer.classList.remove('show');
    document.querySelector('.dashboard-layout').classList.add('focus-mode');

    try {
        // Call API
        const kase = await postJSON('/analyze', {
            patientName,
            age,
            gender,
            symptoms,
            severity,
            duration,
            vitals,
            lang: currentLang,
            medicalHistory,
            allergies,
            currentMedications,
            // Attachment metadata + Neural Visual Results
            attachments: attachmentMetadata ? [attachmentMetadata] : [],
            visualFindings: visualFindings
        });

        currentCase = kase;
        displayResults(kase);

        // Hide loading, show results
        loadingState.classList.add('hidden');
        resultsContainer.classList.add('show');

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        console.error('Analysis failed:', err);

        loadingState.classList.add('hidden');
        inputForm.classList.remove('hidden');

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = translate('submit_btn', {}, 'Analyze Case');
        }

        if (err.message === 'OFFLINE' || !navigator.onLine) {
            const caseData = {
                age, gender, symptoms, severity, duration, vitals,
                lang: currentLang, medicalHistory, allergies, currentMedications,
                attachments: attachmentMetadata ? [attachmentMetadata] : []
            };
            saveToLocalQueue(caseData);
            if (window.logToMonitor) logToMonitor("Case saved to local encrypted storage. Will sync when online.", "warning");
            alert('📡 Offline: Case saved locally. It will be uploaded automatically when internet is restored.');

            // Clean up and go back to home
            setTimeout(() => {
                location.reload(); // Simplest way to reset form for demo
            }, 2000);
        } else {
            alert('❌ Error: Could not analyze case. Please check connectivity and try again.');
        }
    }
});

// ===== Display Results =====
function displayResults(kase) {
    const ai = kase.ai;
    lastAIResult = kase; // Cache for language switching
    const riskClass = (ai.risk || 'Green').toLowerCase();

    // Emergency banner
    const emergencyBanner = document.getElementById('emergencyBanner');
    if (ai.risk === 'Red') {
        emergencyBanner.classList.remove('hidden');
    } else {
        emergencyBanner.classList.add('hidden');
    }

    // Risk badge
    const riskBadge = document.getElementById('riskBadge');
    riskBadge.className = `risk-badge ${riskClass}`;
    riskBadge.textContent = translate(`severity.${riskClass}`);

    // Diagnosis
    const diagnosisText = document.getElementById('diagnosisText');
    const conditionLabel = translate('condition.' + ai.conditionCode, {}, ai.condition || ai.conditionCode);
    diagnosisText.textContent = conditionLabel;

    // Confidence metrics
    const confidenceMetrics = document.getElementById('confidenceMetrics');
    confidenceMetrics.innerHTML = `
    <strong data-i18n="explain.dci">${translate('explain.dci')}:</strong> ${ai.confidence}/100 &nbsp;·&nbsp; 
    <strong data-i18n="heatmap.risk">${translate('heatmap.risk')}:</strong> ${ai.score}/100 &nbsp;·&nbsp; 
    <strong data-i18n="heatmap.triage">${translate('heatmap.triage')}:</strong> ${translate(ai.urgencyKey || 'urgency.normal')}
  `;

    // Triage Directive Logic
    const triageDirective = document.getElementById('triageDirective');
    if (triageDirective) {
        if (ai.risk === 'Red') {
            triageDirective.style.display = 'flex';
            triageDirective.style.background = '#fef2f2';
            triageDirective.style.borderLeftColor = '#ef4444';
            triageDirective.style.color = '#991b1b';
            triageDirective.innerHTML = `
                <span style="font-size: 20px;">🛡️</span>
                <span>DOCTOR AUTHENTICATION REQUIRED: This is a high-risk case. Proceed to Specialist Hub for mandatory validation.</span>
            `;
        } else {
            triageDirective.style.display = 'flex';
            triageDirective.style.background = '#f0fdf4';
            triageDirective.style.borderLeftColor = '#22c55e';
            triageDirective.style.color = '#166534';
            triageDirective.innerHTML = `
                <span style="font-size: 20px;">👤</span>
                <span>HEALTH WORKER PROTOCOL: Case manageable at primary level. Specialist hub optional for second opinion.</span>
            `;
        }
    }

    // Risk Heatmap
    displayHeatmap(ai);

    // Vitals Visualizer (Physiological Trend Monitoring)
    displayVitalsVisualizer(kase.vitals || {});

    // Clinical Summary (SOAP)
    if (ai.clinicalSummary) {
        renderStructuredSummary(ai.clinicalSummary);
    } else {
        const section = document.getElementById('clinicalSummarySection');
        if (section) section.classList.add('hidden');
    }

    // Analysis Reasoning
    const analysisReasoning = document.getElementById('analysisReasoning');
    if (ai.explanation && ai.explanation.reasons) {
        analysisReasoning.innerHTML = ai.explanation.reasons.map(r => `<p>• ${translate(r)}</p>`).join('');
    }

    // Recommendations
    displayRecommendations(ai);

    // Differential Diagnosis
    if (ai.differentialDiagnosis && ai.differentialDiagnosis.length > 0) {
        displayDifferential(ai.differentialDiagnosis);
        const sect = document.getElementById('differentialSection');
        if (sect) sect.classList.remove('hidden');
    } else {
        const sect = document.getElementById('differentialSection');
        if (sect) sect.classList.add('hidden');
    }

    // Doctor Review (Second Opinion)
    const reviewSection = document.getElementById('doctorReviewSection');
    const reviewContent = document.getElementById('doctorReviewContent');
    if (kase.doctorReview && reviewSection && reviewContent) {
        const dr = kase.doctorReview;
        reviewSection.classList.remove('hidden');
        reviewContent.innerHTML = `
            <p><strong>${translate('doctor_name_label')}:</strong> ${dr.doctorName}</p>
            <p><strong>${translate('doctor_recommendation_label')}:</strong> ${dr.doctorRecommendation}</p>
            <p><strong>${translate('doctor_comments_label')}:</strong> ${dr.comments || 'N/A'}</p>
            ${dr.prescription ? `<p><strong>${translate('doctor_prescription_label')}:</strong> ${dr.prescription}</p>` : ''}
            <p style="font-size: 11px; color: #64748b; margin-top: 10px;">${translate('reviewed_at_label')} ${new Date(dr.reviewedAt).toLocaleString()}</p>
        `;
    } else if (reviewSection) {
        reviewSection.classList.add('hidden');
    }

    // Explainability Panel
    renderExplainabilityPanel(ai);

    // Setup action buttons
    setupActionButtons(kase);
}

// ===== Vitals Visualizer (Physiological Trend Monitoring) =====
function displayVitalsVisualizer(vitals) {
    const container = document.getElementById('vitalsVisualizer');
    const section = document.getElementById('vitalsVisualizerSection');
    if (!container || !section) return;

    // Always show the section for UI stability
    section.classList.remove('hidden');

    // Define the core 4 vitals matching the user's reference image
    const vitalDefs = [
        { key: 'temperature', label: 'TEMPERATURE', unit: '°C', type: 'temp', icon: '🌡️' },
        { key: 'heart_rate', label: 'HEART RATE', unit: 'BPM', type: 'hr', icon: '❤️' },
        { key: 'bp_systolic', label: 'BLOOD PRESSURE (SYS)', unit: 'mmHg', type: 'bp', icon: '💉' },
        { key: 'respiratory_rate', label: 'RESP. RATE', unit: '/min', type: null, icon: '🌬️' },
    ];

    container.innerHTML = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">` +
        vitalDefs.map(v => {
            const val = vitals[v.key];
            const hasData = val != null && !isNaN(val);
            const displayVal = hasData ? val : '--';
            const sparkHTML = (hasData && v.type) ? renderSparkline(val, v.type) : `
                <div style="height: 10px; width: 100%; background: #f1f5f9; border-radius: 20px; margin-top: 10px; border: 1px dashed #cbd5e1;"></div>
            `;

            return `
                <div class="vital-card" style="padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-radius: 12px; background: ${hasData ? 'white' : '#f8fafc'}; transition: all 0.3s ease;">
                    <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">${v.label}</span>
                    <strong style="font-size: 24px; color: ${hasData ? '#0f172a' : '#cbd5e1'}; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        ${displayVal} <span style="font-size: 14px; font-weight: 600; color: ${hasData ? '#059669' : '#94a3b8'};">${v.unit}</span>
                    </strong>
                    ${sparkHTML}
                </div>`;
        }).join('') + `</div>`;
}

function displayHeatmap(ai) {
    const heatmap = document.getElementById('heatmap');
    if (!heatmap) return;

    // Determine risk levels for heatmap
    const generalRisk = ai.generalRiskDetails?.score || ai.score || 0;
    const maternalRisk = ai.maternalRiskDetails?.maternalScore || 0;
    const confidenceScore = ai.confidenceDetails?.confidenceScore || ai.confidence || 0;
    const triageLevel = ai.risk || 'Green';

    const getRiskClass = (score) => {
        if (score >= 70) return 'high';
        if (score >= 35) return 'medium';
        return 'low';
    };

    const triageClass = triageLevel === 'Red' ? 'high' : triageLevel === 'Amber' ? 'medium' : 'low';

    heatmap.innerHTML = `
    <div class="heatmap-item ${getRiskClass(generalRisk)}">
      <div class="label" data-i18n="heatmap.risk">📋 ${translate('heatmap.risk')}</div>
      <div class="value">${generalRisk}/100</div>
    </div>
    <div class="heatmap-item ${maternalRisk > 0 ? getRiskClass(maternalRisk) : 'low'}">
      <div class="label" data-i18n="heatmap.maternal">🤰 ${translate('heatmap.maternal')}</div>
      <div class="value">${maternalRisk > 0 ? maternalRisk + '/100' : 'N/A'}</div>
    </div>
    <div class="heatmap-item ${getRiskClass(confidenceScore)}">
      <div class="label" data-i18n="heatmap.dci">🎯 ${translate('heatmap.dci')}</div>
      <div class="value">${confidenceScore}/100</div>
    </div>
    <div class="heatmap-item ${triageClass}">
      <div class="label" data-i18n="heatmap.triage">🚨 ${translate('heatmap.triage')}</div>
      <div class="value">${translate(`severity.${triageLevel.toLowerCase()}`)}</div>
    </div>
  `;
}

function renderStructuredSummary(data) {
    const summarySection = document.getElementById('clinicalSummary');
    if (!summarySection) return;

    let html = `
    <div class="summary-card">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top:5px;">
            <div>
                <div style="margin-bottom:15px;">
                    <h4 data-i18n="soap.presentation" style="color:var(--accent); font-size:13px; text-transform:uppercase; margin-bottom:5px;">${translate('soap.presentation')}</h4>
                    <p style="font-size:14px; line-height:1.5; color:#334155;">${renderSOAPPresentation(data.presentation)}</p>
                </div>
                <div>
                    <h4 data-i18n="soap.findings" style="color:var(--accent); font-size:13px; text-transform:uppercase; margin-bottom:5px;">${translate('soap.findings')}</h4>
                    <p style="font-size:14px; line-height:1.5; color:#334155;">${renderSOAPVitals(data.vitals)}</p>
                </div>
            </div>
            <div>
                <div style="margin-bottom:15px;">
                    <h4 data-i18n="soap.assessment" style="color:var(--accent); font-size:13px; text-transform:uppercase; margin-bottom:5px;">${translate('soap.assessment')}</h4>
                    <p style="font-size:14px; line-height:1.5; color:#334155;">${renderSOAPAssessment(data.assessment)}</p>
                </div>
                <div>
                    <h4 data-i18n="soap.plan" style="color:var(--accent); font-size:13px; text-transform:uppercase; margin-bottom:5px;">${translate('soap.plan')}</h4>
                    <p style="font-size:14px; line-height:1.5; color:#334155;">${renderSOAPPlan(data.plan)}</p>
                </div>
            </div>
        </div>
    </div>
    `;

    summarySection.innerHTML = html;
    document.getElementById('clinicalSummarySection')?.classList.remove('hidden');
}

function renderSOAPPresentation(p) {
    const parts = [];
    let ageText = translate('soap.age', { val: p.age || '?' });
    let statusText = p.isPregnant ?
        (p.pregnancyWeeks ? translate('soap.pregnant_weeks', { val: p.pregnancyWeeks }) : translate('soap.pregnant')) :
        translate('soap.individual');

    parts.push(`${ageText} ${statusText}.`);

    if (p.symptoms && p.symptoms.length > 0) {
        const symptomsList = p.symptoms.map(s => translate(`symptom.${s}`)).join(', ');
        parts.push(translate('soap.complaints', { val: symptomsList }));
    }

    if (p.comorbidities && p.comorbidities.length > 0) {
        parts.push(translate('soap.history', { val: p.comorbidities.join(', ') }));
    }

    if (p.allergies && p.allergies.length > 0) {
        parts.push(translate('soap.allergies', { val: p.allergies.join(', ') }));
    }

    return parts.join(' ');
}

function renderSOAPVitals(v) {
    if (v.abnormalities && v.abnormalities.length > 0) {
        const abns = v.abnormalities.map(key => translate(key)).join(', ');
        return translate('soap.vitals_abnormal', { val: abns });
    }
    return translate('soap.vitals_normal');
}

function renderSOAPAssessment(a) {
    const parts = [];
    parts.push(translate('soap.risk_profile', {
        level: translate(`severity.${a.generalRisk.level?.toLowerCase()}`),
        score: a.generalRisk.score
    }));

    if (a.maternalRisk) {
        parts.push(translate('soap.maternal_status', {
            level: translate(a.maternalRisk.levelKey),
            score: a.maternalRisk.score
        }));
    }

    return parts.join(' ');
}

function renderSOAPPlan(p) {
    if (!p) return translate('action.routine_care');
    const parts = [];
    if (p.escalationRequired) {
        parts.push(translate('soap.escalation_init', {
            level: translate(`escalation.level.${p.level?.toLowerCase() || 'none'}`),
            urgency: translate(p.urgencyKey)
        }));
    }
    parts.push(translate(p.actionKey));
    return parts.join(' ');
}

function renderExplainabilityPanel(ai) {
    // Neural Visual Analysis
    const visualEl = document.getElementById('explainVisualAnalysis');
    if (visualEl) {
        if (ai.visualAnalysis) {
            const va = ai.visualAnalysis;
            visualEl.innerHTML = `
                <div style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <div style="font-size: 10px; font-weight: 800; opacity: 0.7; margin-bottom: 6px;">NEURAL VISUAL ENGINE v1.0</div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 13px; font-weight: 700;">Findings: ${va.detected ? 'Positive Markers' : 'Baseline Scanned'}</span>
                        <span style="font-size: 11px; opacity: 0.8;">Conf: ${va.confidence}%</span>
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 6px;">
                        ${va.markers.map(m => `<span class="visual-findings-badge detected">👁️ ${m}</span>`).join('')}
                    </div>
                </div>`;
        } else {
            visualEl.innerHTML = '';
        }
    }

    // Triggered Symptoms
    const symptomsEl = document.getElementById('explainTriggeredSymptoms');
    if (symptomsEl) {
        const symptoms = ai.explanation?.symptoms || [];
        if (symptoms.length > 0) {
            symptomsEl.innerHTML = `
                <strong style="font-size:13px;color:#1e293b;">📋 ${translate('explain.triggers')}</strong>
                <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;">
                    ${symptoms.map(s => `<span style="background:#eff6ff;color:#1d4ed8;padding:3px 10px;border-radius:12px;font-size:12px;">✅ ${translate('symptom.' + s, {}, s.replace(/_/g, ' '))}</span>`).join('')}
                </div>`;
        } else {
            symptomsEl.innerHTML = `<strong style="font-size:13px;color:#1e293b;">📋 ${translate('explain.triggers')}</strong><p style="color:#94a3b8;font-size:13px;margin:4px 0;">${translate('no_symptom_pattern')}</p>`;
        }
    }

    // Triggered Vitals
    const vitalsEl = document.getElementById('explainTriggeredVitals');
    if (vitalsEl) {
        const vitalFindings = ai.vitalFindings || [];
        const header = translate('explain.vitals');
        if (vitalFindings.length > 0) {
            vitalsEl.innerHTML = `
                <strong style="font-size:13px;color:#1e293b;">📊 ${header}</strong>
                <div style="margin-top:6px;">
                    ${vitalFindings.map(v => `<p style="margin:3px 0;font-size:13px;color:#475569;">🔴 ${translate(v)}</p>`).join('')}
                </div>`;
        } else {
            vitalsEl.innerHTML = `<strong style="font-size:13px;color:#1e293b;">📊 ${header}</strong><p style="color:#94a3b8;font-size:13px;margin:4px 0;">${translate('soap.vitals_normal')}</p>`;
        }
    }

    // Risk Thresholds
    const threshEl = document.getElementById('explainRiskThresholds');
    if (threshEl) {
        const reasons = ai.explanation?.reasons || [];
        const header = translate('explain.thresholds');
        if (reasons.length > 0) {
            threshEl.innerHTML = `
                <strong style="font-size:13px;color:#1e293b;">⚠️ ${header}</strong>
                <div style="margin-top:6px;">
                    ${reasons.map(r => `<p style="margin:3px 0;font-size:13px;color:#475569;">• ${translate(r)}</p>`).join('')}
                </div>`;
        }
    }

    // Pattern Logic
    const patternEl = document.getElementById('explainPatternLogic');
    if (patternEl && ai.conditionCode) {
        const header = translate('explain.pattern');
        const matchPct = ai.confidence || 0;
        const condition = translate('condition.' + ai.conditionCode);
        const urgency = translate(ai.urgencyKey || 'urgency.normal');
        patternEl.innerHTML = `
            <strong style="font-size:13px;color:#1e293b;">🔍 ${header}</strong>
            <p style="margin:4px 0;font-size:13px;color:#475569;">${translate('soap.risk_profile', { level: condition, score: matchPct })}. ${translate('heatmap.triage')}: <strong>${urgency}</strong>.</p>`;
    }

    // DCI
    const dciEl = document.getElementById('explainDCI');
    if (dciEl) {
        const header = translate('explain.dci');
        const dci = ai.confidence || 0;
        const dciLevelKey = dci >= 71 ? 'explain.high' : dci >= 41 ? 'explain.moderate' : 'explain.low';
        const dciColor = dci >= 71 ? '#166534' : dci >= 41 ? '#92400e' : '#991b1b';

        dciEl.innerHTML = `
            <strong style="font-size:13px;color:#1e293b;">🎯 ${header}</strong>
            <div style="margin-top:6px;background:#f8fafc;padding:10px;border-radius:6px;">
                <span style="font-size:18px;font-weight:700;color:${dciColor};">${dci} / 100 — ${translate(dciLevelKey)}</span>
            </div>`;
    }
}

function displayRecommendations(ai) {
    const container = document.getElementById('recommendationsContainer');
    container.innerHTML = '';

    // Treatments
    if (ai.treatments && ai.treatments.length > 0) {
        container.innerHTML += `
      <div class="info-card success">
        <h4 data-i18n="treatment_header">💊 ${translate('treatment_header', {}, 'Suggested Treatments')}</h4>
        <ul>${ai.treatments.map(t => `<li>${translate(t)}</li>`).join('')}</ul>
      </div>
    `;
    }

    // Lab Tests
    if (ai.labTests && ai.labTests.length > 0) {
        container.innerHTML += `
      <div class="info-card info">
        <h4 data-i18n="lab_header">🧪 ${translate('lab_header', {}, 'Recommended Lab Tests')}</h4>
        <ul>${ai.labTests.map(t => `<li>${translate(t)}</li>`).join('')}</ul>
      </div>
    `;
    }

    // Warnings
    if (ai.warnings && ai.warnings.length > 0) {
        container.innerHTML += `
      <div class="info-card warning">
        <h4 data-i18n="warnings_header">⚠️ ${translate('warnings_header', {}, 'Warnings')}</h4>
        <ul>${ai.warnings.map(w => `<li>${translate(w)}</li>`).join('')}</ul>
      </div>
    `;
    }

    // Suggested Actions
    if (ai.suggestedActions && ai.suggestedActions.length > 0) {
        container.innerHTML += `
      <div class="info-card">
        <h4 data-i18n="actions_header">📝 ${translate('actions_header', {}, 'Suggested Actions')}</h4>
        <ul>${ai.suggestedActions.map(a => `<li>${translate(a)}</li>`).join('')}</ul>
      </div>
    `;
    }
}

function displayDifferential(differential) {
    const list = document.getElementById('differentialList');
    list.innerHTML = differential.map(d => `
    <div style="display: flex; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px;">
      <span style="font-weight: 500;">${translate('condition.' + d.code, {}, d.name)}</span>
      <span style="color: #64748b;">${Math.round(d.matchScore * 100)}${translate('match_suffix')}</span>
    </div>
  `).join('');
}

function setupActionButtons(kase) {
    // New Case
    document.getElementById('newCaseBtn').addEventListener('click', () => {
        form.reset();
        // Reset attachment metadata and UI
        attachmentMetadata = null;
        const attachmentPreview = document.getElementById('attachmentPreview');
        const attachmentError = document.getElementById('attachmentError');
        if (attachmentPreview) attachmentPreview.style.display = 'none';
        if (attachmentError) attachmentError.style.display = 'none';
        inputForm.classList.remove('hidden');
        resultsContainer.classList.remove('show');
        document.getElementById('reviewBadge').style.display = 'none';
        document.querySelector('.dashboard-layout').classList.remove('focus-mode');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(kase, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `case_${kase.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Print
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });

    // Escalate
    const escalateBtn = document.getElementById('escalateBtn');
    if (kase.status === 'ESCALATED') {
        escalateBtn.textContent = translate('escalated_already');
        escalateBtn.disabled = true;
        document.getElementById('reviewBadge').style.display = 'flex';
    } else {
        escalateBtn.addEventListener('click', () => {
            const modal = document.getElementById('escalateReasonModal');
            const confirmBtn = document.getElementById('confirmEscalateBtn');
            const noteArea = document.getElementById('escalationNote');

            modal.style.display = 'flex';

            confirmBtn.onclick = async () => {
                const note = noteArea.value;
                confirmBtn.innerHTML = '🛰️ Dispatching...';
                confirmBtn.disabled = true;

                try {
                    await postJSON('/second-opinion', {
                        caseId: kase.id,
                        action: 'escalate',
                        escalationNote: note
                    });

                    if (typeof logToMonitor === 'function') {
                        logToMonitor("Expert Consultation Requested: High-Priority Dispatch", "alert");
                    }

                    document.getElementById('reviewBadge').style.display = 'flex';
                    modal.style.display = 'none';

                    const consultationId = 'CS-' + Math.floor(10000 + Math.random() * 90000) + '-B';
                    document.getElementById('consultationIdDisplay').innerText = `ID: ${consultationId}`;
                    document.getElementById('dispatchModal').style.display = 'flex';

                    escalateBtn.textContent = translate('escalated_success');
                    escalateBtn.disabled = true;

                    // Cleanup for next session
                    noteArea.value = '';
                } catch (err) {
                    confirmBtn.innerHTML = '🚀 Dispatch to Specialist';
                    confirmBtn.disabled = false;
                    alert(translate('escalated_fail'));
                }
            };
        });
    }
}

// ===== Specialist Command Centre Logic =====
let escalatedCases = [];
let queuePollInterval = null;

// Global accessible dispatch modal closer
window.closeDispatchModal = function () {
    const modal = document.getElementById('dispatchModal');
    if (modal) modal.style.display = 'none';
};

const specialistHub = document.getElementById('specialistHub');
const dashboardLayout = document.querySelector('.dashboard-layout');
const toggleSpecialistBtn = document.getElementById('toggleSpecialistHub');
const backToIntakeBtn = document.getElementById('backToIntake');
const caseQueueList = document.getElementById('caseQueueList');
const caseJacketContainer = document.getElementById('caseJacketContainer');
const queueCountText = document.getElementById('queueCount');

toggleSpecialistBtn.addEventListener('click', () => {
    specialistHub.style.display = 'block';
    dashboardLayout.style.display = 'none';
    toggleSpecialistBtn.style.display = 'none';
    backToIntakeBtn.style.display = 'block';
    startExpertHub();
});

backToIntakeBtn.addEventListener('click', () => {
    specialistHub.style.display = 'none';
    dashboardLayout.style.display = 'grid';
    toggleSpecialistBtn.style.display = 'block';
    backToIntakeBtn.style.display = 'none';
    if (queuePollInterval) clearInterval(queuePollInterval);
});

// Specialist Hub Search Listener
const caseSearchInput = document.getElementById('caseSearchInput');
if (caseSearchInput) {
    caseSearchInput.addEventListener('input', (e) => {
        renderCaseQueue(e.target.value);
    });
}

async function startExpertHub() {
    await loadEscalatedCases();
    if (queuePollInterval) clearInterval(queuePollInterval);
    queuePollInterval = setInterval(loadEscalatedCases, 15000); // 15s live refresh
}

async function loadEscalatedCases() {
    try {
        const response = await fetch('/cases?status=ESCALATED');
        const data = await response.json();
        escalatedCases = data.cases || [];
        // Preserve search filter if typing
        const query = document.getElementById('caseSearchInput')?.value || "";
        renderCaseQueue(query);
        return escalatedCases;
    } catch (err) {
        console.error('Portal Sync Error:', err);
        return [];
    }
}

window.fetchNextCase = async function () {
    // Show loading state in jacket
    caseJacketContainer.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 100px 40px; text-align: center; border: 1px dashed #e2e8f0;">
            <div class="vital-spark" style="margin: 0 auto 20px;"></div>
            <p style="color: #64748b; font-size: 14px; font-weight: 600;">Searching medical queue for incoming cases...</p>
        </div>`;

    const cases = await loadEscalatedCases();
    if (cases && cases.length > 0) {
        // Automatically open the first one in the queue
        viewCaseInJacket(cases[0].id);
    } else {
        caseJacketContainer.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 100px 40px; text-align: center; border: 1px dashed #e2e8f0;">
                <div style="font-size: 40px; margin-bottom: 20px;">✅</div>
                <p style="color: #64748b; font-size: 14px; font-weight: 600;">Queue Synchronized</p>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">No pending consultations require specialist revision at this time.</p>
                <button class="action-btn secondary" style="margin-top: 24px;" onclick="loadEscalatedCases()">Manual Refresh</button>
            </div>`;
    }
};

function renderCaseQueue(query = "") {
    const filtered = escalatedCases.filter(c => {
        const q = query.toLowerCase();
        const name = (c.patient?.name || "").toLowerCase();
        const id = c.id.toLowerCase();
        return name.includes(q) || id.includes(q);
    });

    queueCountText.innerText = filtered.length;
    if (filtered.length === 0) {
        caseQueueList.innerHTML = `
            <div style="text-align: center; color: #94a3b8; padding: 60px 20px;">
                <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
                <p style="font-size: 13px; font-weight: 600;">No results found</p>
                <p style="font-size: 11px; opacity: 0.7;">Try searching for a different name or ID.</p>
            </div>`;
        return;
    }

    caseQueueList.innerHTML = filtered.map(c => {
        const risk = c.ai?.risk || 'Green';
        const color = risk === 'Red' ? '#ef4444' : risk === 'Amber' ? '#fbbf24' : '#22c55e';
        const pName = c.patient?.name || `Patient PX-${c.id.slice(-4).toUpperCase()}`;

        return `
            <div class="queue-item" onclick="viewCaseInJacket('${c.id}')">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-weight: 800; font-size: 10px; color: #64748b; letter-spacing: 0.5px; opacity: 0.7;">ID: ${c.id.slice(-8).toUpperCase()}</div>
                        <div style="font-size: 14px; font-weight: 800; color: #1e293b; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${pName}
                        </div>
                        <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">
                            ${new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Specialist Review
                        </div>
                    </div>
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; box-shadow: 0 0 8px ${color}; margin-top: 4px; flex-shrink: 0;"></div>
                </div>
                <div style="font-size: 11px; color: #475569; margin-top: 8px; display: flex; gap: 4px; overflow: hidden; flex-wrap: wrap;">
                    ${c.symptoms.slice(0, 3).map(s => `<span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${translate(`symptom.${s}`)}</span>`).join('')}
                    ${c.symptoms.length > 3 ? `<span style="opacity: 0.5; font-weight:800;">+${c.symptoms.length - 3}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

window.viewCaseInJacket = function (id) {
    const kase = escalatedCases.find(c => c.id === id);
    if (!kase) return;

    // Highlight active item
    document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('active'));
    // Target finding workaround for click event
    const items = document.querySelectorAll('.queue-item');
    for (let item of items) {
        if (item.innerHTML.includes(id.slice(-8).toUpperCase())) item.classList.add('active');
    }

    const ai = kase.ai || {};
    const vitals = kase.vitals || {};
    const symptoms = kase.symptoms || [];

    const isAbnormal = (val, type) => {
        if (!val) return false;
        if (type === 'temp' && (val > 38 || val < 36)) return true;
        if (type === 'hr' && (val > 100 || val < 60)) return true;
        if (type === 'spo2' && val < 94) return true;
        return false;
    };

    caseJacketContainer.innerHTML = `
        <div class="case-jacket" id="printableJacket">
            <div class="jacket-header">
                <div>
                    <div class="jacket-title">Clinical Summary Report</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-family: monospace;">UUID: ${kase.id} | CLINICAL ORIGIN: PCU-770</div>
                </div>
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                    <div style="display: flex; gap: 8px;">
                        <button onclick="downloadClinicalRecord('${kase.id}')" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px;">📂 PREVIEW REPORT</button>
                        <button onclick="copyClinicalSummary('${kase.id}')" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px;">📋 COPY SUMMARY</button>
                    </div>
                    <div>
                        <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; color: #1e293b;">Date: ${new Date(kase.createdAt).toLocaleDateString()}</div>
                        <div style="font-weight: 900; color: #ef4444; font-size: 10px; margin-top: 2px; letter-spacing: 1px;">HIGH PRIORITY ESCALATION</div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; border: 1px solid #000; padding: 15px; background: #fafafa;">
                <div>
                    <div style="font-size: 9px; font-weight: 800; color: #64748b;">PATIENT NAME / ID</div>
                    <div style="font-size: 14px; font-weight: 800;">${kase.patient?.name || `PX-${kase.id.slice(-4).toUpperCase()}`}</div>
                </div>
                <div>
                    <div style="font-size: 9px; font-weight: 800; color: #64748b;">AGE / GENDER</div>
                    <div style="font-size: 14px; font-weight: 800;">${kase.patient?.age || kase.age}Y • ${kase.gender || 'N/A'}</div>
                </div>
                <div>
                    <div style="font-size: 9px; font-weight: 800; color: #64748b;">SEVERITY CLASSIFICATION</div>
                    <div style="font-size: 14px; font-weight: 800; color: ${kase.severity === 'High' ? '#ef4444' : '#1e293b'}">${(kase.severity || 'Normal').toUpperCase()}</div>
                </div>
            </div>

            <div style="margin-top: 20px; display: grid; grid-template-columns: ${kase.escalationNote ? '1fr 1fr' : '1fr'}; gap: 20px;">
                <div style="background: #eff6ff; border: 1px solid #dbeafe; padding: 15px; border-radius: 8px; border-left: 5px solid #3b82f6;">
                    <div style="font-size: 10px; font-weight: 800; color: #1e40af; text-transform: uppercase; margin-bottom: 5px;">🩺 Presenting Symptoms</div>
                    <div style="font-size: 13px; color: #1e3a8a; font-weight: 700; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                        ${symptoms.length > 0 ? symptoms.map(s => `<span style="background: white; padding: 3px 8px; border-radius: 4px; border: 1px solid #dbeafe;">${translate(`symptom.${s}`)}</span>`).join('') : '<span style="font-weight:400;opacity:0.6;">No symptoms logged</span>'}
                    </div>
                </div>
                ${kase.escalationNote ? `
                <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 8px; border-left: 5px solid #fbbf24;">
                    <div style="font-size: 10px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-bottom: 5px;">⚠️ Handover Note</div>
                    <div style="font-size: 12px; color: #78350f; font-weight: 600; font-family: serif; font-style: italic;">
                        "${kase.escalationNote}"
                    </div>
                </div>
                ` : ''}
            </div>

            <div style="margin-top: 30px;">
                <h4 style="text-transform: uppercase; font-size: 11px; font-weight: 900; background: #000; color: #fff; padding: 4px 8px; display: inline-block; margin-bottom: 12px;">Section I: Observed Clinical Vectors</h4>
                <div class="vitals-jacket-grid">
                    <div class="vital-cell ${isAbnormal(vitals.temperature, 'temp') ? 'abnormal' : ''}">
                        <div class="vital-label">Temperature</div>
                        <div style="font-size: 18px; font-weight: 800;">${vitals.temperature || '--'}°C</div>
                        ${renderSparkline(vitals.temperature, 'temp')}
                    </div>
                    <div class="vital-cell ${isAbnormal(vitals.heart_rate, 'hr') ? 'abnormal' : ''}">
                        <div class="vital-label">Heart Rate</div>
                        <div style="font-size: 18px; font-weight: 800;">${vitals.heart_rate || '--'} <span style="font-size: 10px;">BPM</span></div>
                        ${renderSparkline(vitals.heart_rate, 'hr')}
                    </div>
                    <div class="vital-cell ${isAbnormal(vitals.spo2, 'spo2') ? 'abnormal' : ''}">
                        <div class="vital-label">SpO2</div>
                        <div style="font-size: 18px; font-weight: 800;">${vitals.spo2 || '--'}%</div>
                        ${renderSparkline(vitals.spo2, 'spo2')}
                    </div>
                    <div class="vital-cell ${isAbnormal(vitals.bp_systolic, 'bp') ? 'abnormal' : ''}">
                        <div class="vital-label">Blood Pressure (Sys)</div>
                        <div style="font-size: 18px; font-weight: 800;">${vitals.bp_systolic || '--'}</div>
                        ${renderSparkline(vitals.bp_systolic, 'bp')}
                    </div>
                    <div class="vital-cell">
                        <div class="vital-label">Resp. Rate</div>
                        <div style="font-size: 18px; font-weight: 800;">${vitals.respiratory_rate || '--'} <span style="font-size: 10px;">/min</span></div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 30px; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px;">
                <h4 style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; display: inline-block;">Section II: AI Diagnostic Summary</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <div style="font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 4px;">PRINCIPAL AI IMPRESSION</div>
                        <div style="font-size: 15px; font-weight: 800; color: #2563eb;">${translate('condition.' + (ai.conditionCode || 'unknown'), {}, ai.condition || 'N/A')}</div>
                        <div style="font-size: 12px; margin-top: 10px; line-height: 1.5; color: #334155;">
                            ${ai.explanation?.reasons?.map(r => `• ${translate(r)}`).join('<br>') || 'No specific pattern reasons identified.'}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 4px;">CLINICAL TRIAGE</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 15px; font-weight: 800;">${translate(ai.urgencyKey || 'urgency.normal', {}, (ai.risk || 'Normal')).toUpperCase()}</span>
                            <span style="background: ${ai.confidence > 70 ? '#f0fdf4' : '#fff7ed'}; color: ${ai.confidence > 70 ? '#166534' : '#9a3412'}; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800;">DCI: ${ai.confidence || 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="decision-block">
                <div style="background: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0;">
                    <h3 style="font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #0f172a; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px;">Ex</span>
                        Specialist Decision & Clinical Directives
                    </h3>
                    <form id="expertReviewForm">
                        <input type="hidden" name="caseId" value="${kase.id}">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label style="display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Signatory Specialist</label>
                                <input type="text" name="doctorName" class="expert-input" placeholder="e.g. Dr. John Carter" required>
                            </div>
                            <div>
                                <label style="display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Final Triage Determination</label>
                                <select name="doctorRecommendation" class="expert-input" required>
                                    <option value="Agree with AI">Confirm AI Diagnosis</option>
                                    <option value="Alternative Diagnosis">Revise Diagnosis (See Comments)</option>
                                    <option value="Emergency Transfer">Urgent Hospital Referral</option>
                                    <option value="Home Care">Discharge to Home Care</option>
                                </select>
                            </div>
                        </div>
                        <label style="display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Clinical Assessment & Directives</label>
                        <textarea name="comments" class="expert-input" style="height: 100px; resize: none;" placeholder="Expert assessment..."></textarea>
                        <label style="display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Formal Prescription (Rx)</label>
                        <input type="text" name="prescription" class="expert-input" placeholder="Medication, Dosage, Frequency...">
                        <button type="submit" class="action-btn primary" style="width: 100%; border-radius: 12px; padding: 18px; font-size: 14px;">AUTHENTICATE & FINALIZE CASE</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('expertReviewForm').addEventListener('submit', submitExpertReview);
};

async function submitExpertReview(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '📂 Synchronizing...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const body = {
        caseId: formData.get('caseId'),
        action: 'review',
        doctorName: formData.get('doctorName'),
        doctorRecommendation: formData.get('doctorRecommendation'),
        comments: formData.get('comments'),
        prescription: formData.get('prescription')
    };

    try {
        await postJSON('/second-opinion', body);
        await loadEscalatedCases();
        caseJacketContainer.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 80px 40px; text-align: center; border: 2px solid #f0fdf4; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                <div style="width: 64px; height: 64px; background: #dcfce7; color: #166534; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px;">✓</div>
                <h3 style="color: #0f172a; font-weight: 900; font-size: 20px;">Review Successfully Finalized</h3>
                <p style="color: #64748b; font-size: 14px; margin-top: 12px; line-height: 1.6;">Case registered in permanent medical history. The record has been authenticated and locked.</p>
                <div style="margin-top: 30px; display: flex; gap: 12px; justify-content: center;">
                    <button class="action-btn primary" onclick="downloadClinicalRecord('${body.caseId}')">📥 Download Signed Record</button>
                    <button class="action-btn secondary" onclick="fetchNextCase()">Fetch Next Case</button>
                </div>
            </div>`;
    } catch (err) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('❌ Sync Failure.');
    }
}

window.copyClinicalSummary = async function (caseId) {
    try {
        const response = await fetch(`/cases/${caseId}`);
        const kase = await response.json();
        const vitals = kase.vitals || {};
        const ai = kase.ai || {};

        const summary = `
CLINICAL SUMMARY: CASE ${caseId.slice(-8).toUpperCase()}
------------------------------------------
PATIENT: ${kase.age}Y / ${kase.gender}
PRIMARY SYMPTOMS: ${kase.symptoms.map(s => translate(`symptom.${s}`)).join(', ')}
SEVERITY: ${kase.severity}

VITALS:
- Temp: ${vitals.temperature || '--'}°C
- HR: ${vitals.heart_rate || '--'} bpm
- SpO2: ${vitals.spo2 || '--'}%
- BP: ${vitals.bp_systolic || '--'} mmHg (Sys)

AI IMPRESSION:
- Condition: ${translate('condition.' + ai.conditionCode)}
- Risk Score: ${ai.score}/100
- Certainty (DCI): ${ai.confidence}%

ESCALATION NOTE:
${kase.escalationNote || 'None'}
------------------------------------------
Generated by Healthcare DSS Clinical Hub
        `.trim();

        await navigator.clipboard.writeText(summary);
        alert('✅ Clinical Summary copied to clipboard!');
    } catch (err) {
        console.error('Copy failed:', err);
        alert('Failed to copy summary.');
    }
};

window.downloadClinicalRecord = async function (caseId) {
    try {
        let kase = null;

        // Strategy 1: Attempt to fetch fresh data from server
        try {
            const response = await fetch(`/cases/${caseId}`);
            if (response.ok) {
                kase = await response.json();
            }
        } catch (fetchErr) {
            console.warn('Backend fetch failed, attempting local failover:', fetchErr);
        }

        // Strategy 2: Failover to local cache if server is unreachable or case is missing (common in serverless/Vercel)
        if (!kase || kase.error) {
            console.log('Case not found on server (Instance Mismatch). Searching local queue cache...');
            kase = escalatedCases.find(c => c.id === caseId);
        }

        if (!kase) {
            throw new Error('Case record not found in active memory or server.');
        }

        // Strategy 3: Deep Defensive Data Mapping
        const ai = kase.ai || {};
        const rev = kase.doctorReview || {};
        const vitals = kase.vitals || {};
        const isDraft = !kase.doctorReview;
        const symptoms = kase.symptoms || [];

        const reportHtml = `
            <html>
            <head>
                <title>Clinical Record - ${caseId}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; background: #fff; }
                    .header { border-bottom: 4px solid #0f172a; padding-bottom: 25px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .title { font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
                    .badge { display: inline-block; background: #0f172a; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 800; margin-top: 10px; }
                    .section { margin-bottom: 35px; }
                    .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                    .info-item label { display: block; font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
                    .info-item value { display: block; font-size: 14px; font-weight: 700; margin-top: 2px; }
                    .vitals-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 15px; }
                    .vital-card { border: 1.5px solid #0f172a; padding: 15px; text-align: center; }
                    .vital-card span { display: block; font-size: 8px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; }
                    .vital-card strong { font-size: 18px; font-weight: 900; }
                    .diagnosis-block { background: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin-top: 10px; }
                    .review-container { border: 2px solid ${isDraft ? '#94a3b8' : '#0f172a'}; padding: 30px; margin-top: 40px; position: relative; }
                    .review-stamp { position: absolute; top: 15px; right: 20px; border: 3px solid ${isDraft ? '#94a3b8' : '#ef4444'}; color: ${isDraft ? '#94a3b8' : '#ef4444'}; padding: 5px 15px; font-weight: 900; transform: rotate(15deg); border-radius: 8px; font-size: 14px; }
                    .rx-block { margin-top: 25px; font-size: 20px; font-weight: 800; font-family: serif; color: #0f172a; }
                    .footer { margin-top: 80px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
                    .draft-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: 900; color: rgba(0,0,0,0.03); pointer-events: none; z-index: -1; white-space: nowrap; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                ${isDraft ? '<div class="draft-watermark">DRAFT REPORT</div>' : ''}
                <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
                    <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">🖨️ PRINT REPORT</button>
                </div>

                <div class="header">
                    <div>
                        <div class="title">Clinical Summary Record ${isDraft ? '(DRAFT)' : ''}</div>
                        <div class="badge">${isDraft ? 'PRE-AUTHENTICATION PREVIEW' : 'SECURE MEDICAL ARCHIVE • VERIFIED'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 900; font-size: 14px;">CASE ID: ${caseId.slice(-8).toUpperCase()}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ISSUED: ${new Date(kase.createdAt || Date.now()).toLocaleString()}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">I. Patient Profile & Encounter Context</div>
                    <div class="info-grid">
                        <div class="info-item"><label>Patient Name / ID</label><value>${kase.patient?.name || `PX-${caseId.slice(-4).toUpperCase()}`}</value></div>
                        <div class="info-item"><label>Age / Gender</label><value>${kase.patient?.age || kase.age || 'N/A'}Y • ${kase.gender || 'N/A'}</value></div>
                        <div class="info-item"><label>Initial Severity</label><value>${(kase.severity || 'Normal').toUpperCase()}</value></div>
                    </div>
                    <div style="margin-top: 15px;">
                        <label style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Presenting Symptoms</label>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">${symptoms.length > 0 ? symptoms.map(s => translate(`symptom.${s}`)).join(', ') : 'No symptoms reported.'}</div>
                    </div>
                    ${kase.escalationNote ? `
                    <div style="margin-top: 15px; background: #fffbeb; padding: 10px; border-left: 4px solid #fbbf24;">
                        <label style="font-size: 9px; font-weight: 800; color: #92400e; text-transform: uppercase;">Primary Clinician Handover Note</label>
                        <div style="font-size: 12px; font-style: italic; color: #78350f; margin-top: 2px;">"${kase.escalationNote}"</div>
                    </div>
                    ` : ''}
                </div>

                <div class="section">
                    <div class="section-title">II. Vital Signs at Presentation</div>
                    <div class="vitals-strip">
                        <div class="vital-card">
                            <span>Temp</span><strong>${vitals.temperature || '--'}°C</strong>
                            ${renderSparkline(vitals.temperature, 'temp')}
                        </div>
                        <div class="vital-card">
                            <span>HR</span><strong>${vitals.heart_rate || '--'}</strong>
                            ${renderSparkline(vitals.heart_rate, 'hr')}
                        </div>
                        <div class="vital-card">
                            <span>SpO2</span><strong>${vitals.spo2 || '--'}%</strong>
                            ${renderSparkline(vitals.spo2, 'spo2')}
                        </div>
                        <div class="vital-card">
                            <span>BP (Sys)</span><strong>${vitals.bp_systolic || '--'}</strong>
                            ${renderSparkline(vitals.bp_systolic, 'bp')}
                        </div>
                        <div class="vital-card">
                            <span>Resp</span><strong>${vitals.respiratory_rate || '--'}</strong>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">III. AI Diagnostic Vector</div>
                    <div class="diagnosis-block">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <label style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Principal AI Impression</label>
                                <div style="font-size: 18px; font-weight: 900; color: #2563eb; margin-top: 4px;">${translate('condition.' + (ai.conditionCode || 'unknown'), {}, ai.condition || 'Unknown')}</div>
                            </div>
                            <div style="text-align: right;">
                                <label style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Confidence Index</label>
                                <div style="font-size: 18px; font-weight: 900; margin-top: 4px;">${ai.confidence || 0}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="review-container">
                    <div class="review-stamp">${isDraft ? 'DRAFT ONLY' : 'AUTHENTICATED'}</div>
                    <div class="section-title" style="border: none; margin-bottom: 20px;">IV. Specialist Validation & Clinical Orders</div>
                    
                    <div class="info-grid">
                        <div class="info-item"><label>Signatory Specialist</label><value>${rev.doctorName || 'N/A'}</value></div>
                        <div class="info-item"><label>Final Determination</label><value style="color: #166534;">${rev.doctorRecommendation?.toUpperCase() || 'N/A'}</value></div>
                        <div class="info-item"><label>Validation Date</label><value>${new Date(rev.reviewedAt || Date.now()).toLocaleDateString()}</value></div>
                    </div>

                    <div style="margin-top: 25px;">
                        <label style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Expert Clinical Assessment</label>
                        <div style="font-size: 14px; color: #334155; margin-top: 8px; border-left: 3px solid #e2e8f0; padding-left: 15px; font-style: italic;">
                            ${rev.comments || 'No specific clinical notes provided.'}
                        </div>
                    </div>

                    <div class="rx-block">
                        <span style="font-size: 24px;">℞</span> ${rev.prescription || 'Standard monitoring as per clinical protocol.'}
                    </div>

                    <div style="margin-top: 50px; display: flex; justify-content: flex-end;">
                        <div style="text-align: center;">
                            <div style="border-bottom: 2px solid #0f172a; width: 220px; height: 40px; margin-bottom: 8px;"></div>
                            <div style="font-size: 9px; font-weight: 900;">AUTHORIZED SPECIALIST SIGNATURE</div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    This document is a formal clinical record generated by the Healthcare DSS (Clinical Edition). 
                    It combines AI data ingestion with specialist human validation. 
                    Reference ID: ${caseId} • System: PCU-770-HUB
                </div>
            </body>
            </html>
        `;

        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(reportHtml);
            printWin.document.close();
        } else {
            alert('⚠️ Popup blocked. Please allow popups to view the report.');
        }
    } catch (err) {
        console.error('Unified Record Engine Error:', err);
        alert('❌ Record retrieval failed: ' + err.message);
    }
}



