// Healthcare DSS - New Frontend Application
// Single-page workflow with fixed language switching

// ===== Utility Functions =====
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API request failed');
  return res.json();
}

// ===== Internationalization (Fixed) =====
let i18n = {};
let currentLang = localStorage.getItem('lang') || 'en';

async function loadLanguage(lang) {
  try {
    const res = await fetch(`/i18n/${lang}.json`);
    if (!res.ok) throw new Error('Language file not found');
    i18n = await res.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
    console.log(`Language loaded: ${lang}`);
  } catch (e) {
    console.warn('Failed to load language:', lang, e);
    // Fallback to English
    if (lang !== 'en') {
      await loadLanguage('en');
    }
  }
}

function translate(key, fallback) {
  return (i18n && i18n[key]) ? i18n[key] : (fallback || key);
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

// ===== User Info =====
const userName = localStorage.getItem('userName');
const userInfoEl = document.getElementById('userInfo');
if (userInfoEl && userName) {
  userInfoEl.textContent = '👤 ' + userName;
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
  });
}

// ===== Voice Recognition (Symptom Mapping) =====
const SYMPTOM_KEYWORDS = {
  fever: ['fever', 'ताप', 'बुखार'],
  cough: ['cough', 'खोकला', 'खांसी', 'खासी'],
  breathlessness: ['breathlessness', 'shortness of breath', 'दम लागणे', 'सांस फूलना', 'दम फूलना'],
  chest_pain: ['chest pain', 'छातीत दुखणे', 'सीने में दर्द'],
  headache: ['headache', 'डोकेदुखी', 'सिरदर्द'],
  rash: ['rash', 'पुरळ', 'चकत्ते', 'रॅश'],
  diarrhea: ['diarrhea', 'जुलाब', 'दस्त'],
  vomiting: ['vomiting', 'उलट्या', 'उल्टी'],
  abdominal_pain: ['abdominal pain', 'stomach pain', 'पोटदुखी', 'पेट दर्द'],
  fatigue: ['fatigue', 'weakness', 'थकवा', 'थकान'],
  body_ache: ['body ache', 'अंगदुखी', 'बदन दर्द'],
  sore_throat: ['sore throat', 'घसा खवखवणे', 'गला खराब'],
  joint_pain: ['joint pain', 'सांधेदुखी', 'जोड़ों में दर्द'],
  nausea: ['nausea', 'मळमळ', 'मिचली'],
  dizziness: ['dizziness', 'चक्कर', 'चक्कर आना'],
  confusion: ['confusion', 'गोंधळ', 'भ्रम'],
  swelling: ['swelling', 'सूज', 'सूजन'],
  palpitations: ['palpitations', 'धडधड', 'घबराहट']
};

let recognition = null;
let isRecording = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isRecording = true;
    document.getElementById('micIcon').textContent = '⏹️';
    document.getElementById('micBtn').classList.add('recording-active');
    document.getElementById('voiceStatus').classList.add('show');
    document.getElementById('voiceStatus').textContent = '🎙️ Listening... (Speak now)';
  };

  recognition.onend = () => {
    // Auto-restart if user hasn't manually stopped it
    if (isRecording) {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Recognition restart failed:', e);
      }
    } else {
      document.getElementById('micIcon').textContent = '🎤';
      document.getElementById('micBtn').classList.remove('recording-active');
      document.getElementById('voiceStatus').classList.remove('show');
      document.getElementById('voiceStatus').textContent = '🎙️ Listening...';
    }
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    document.getElementById('voicePreview').textContent = transcript;
    mapTranscriptToSymptoms(transcript.toLowerCase());
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    stopRecording();
    if (event.error === 'not-allowed') {
      alert('❌ Microphone access denied. Please enable it in browser settings.');
    }
  };
} else {
  console.warn('Speech Recognition not supported in this browser.');
  const micBtn = document.getElementById('micBtn');
  if (micBtn) {
    micBtn.title = 'Speech Recognition not supported';
    micBtn.style.opacity = '0.5';
    micBtn.disabled = true;
  }
}

function startRecording() {
  if (!recognition) return;
  try {
    // Set language based on current selection
    if (currentLang === 'hi') recognition.lang = 'hi-IN';
    else if (currentLang === 'mr') recognition.lang = 'mr-IN';
    else recognition.lang = 'en-US';

    recognition.start();
  } catch (e) {
    console.error('Failed to start recognition:', e);
  }
}

function stopRecording() {
  if (recognition) recognition.stop();
}

function toggleRecording() {
  if (isRecording) stopRecording();
  else startRecording();
}

function mapTranscriptToSymptoms(transcript) {
  const symptoms = document.querySelectorAll('input[name="symptom"]');
  symptoms.forEach(checkbox => {
    const val = checkbox.value;
    const keywords = SYMPTOM_KEYWORDS[val] || [];

    const matches = keywords.some(keyword => transcript.includes(keyword.toLowerCase()));
    if (matches) {
      checkbox.checked = true;
      // Visual feedback for auto-selected symptom
      checkbox.parentElement.style.backgroundColor = '#ecfdf5';
      setTimeout(() => {
        checkbox.parentElement.style.backgroundColor = '';
      }, 2000);
    }
  });
}

const micBtn = document.getElementById('micBtn');
if (micBtn) {
  micBtn.addEventListener('click', toggleRecording);
}

// ===== Form Submission =====
const form = document.getElementById('caseForm');
const inputForm = document.getElementById('inputForm');
const loadingState = document.getElementById('loadingState');
const resultsContainer = document.getElementById('resultsContainer');
let currentCase = null;

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

  // Collect form data
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

  // Show loading, hide form
  inputForm.classList.add('hidden');
  loadingState.classList.remove('hidden');
  resultsContainer.classList.remove('show');

  try {
    // Call API
    const kase = await postJSON('/analyze', {
      age,
      gender,
      symptoms,
      severity,
      duration,
      vitals,
      lang: currentLang,
      medicalHistory,
      allergies,
      currentMedications
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
    alert('❌ Error: Could not analyze case. Please try again.');
  }
});

// ===== Display Results =====
function displayResults(kase) {
  const ai = kase.ai;
  const riskClass = ai.risk.toLowerCase();

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
  riskBadge.textContent = ai.risk;

  // Diagnosis
  const diagnosisText = document.getElementById('diagnosisText');
  const conditionLabel = ai.conditionCode ? translate('condition.' + ai.conditionCode, ai.condition) : ai.condition;
  diagnosisText.textContent = conditionLabel;

  // Confidence metrics
  const confidenceMetrics = document.getElementById('confidenceMetrics');
  confidenceMetrics.innerHTML = `
    <strong>Diagnostic Certainty Index (DCI):</strong> ${ai.confidence}/100 &nbsp;·&nbsp; 
    <strong>Structured Risk Score:</strong> ${ai.score}/100 &nbsp;·&nbsp; 
    <strong>Triage Urgency:</strong> ${ai.urgency || 'Normal'}
  `;

  // Risk Heatmap
  displayHeatmap(ai);

  // Clinical Summary
  if (ai.clinicalSummary && ai.clinicalSummary.summaryText) {
    document.getElementById('clinicalSummary').textContent = ai.clinicalSummary.summaryText;
  } else {
    document.getElementById('clinicalSummarySection').classList.add('hidden');
  }

  // Analysis Reasoning
  const analysisReasoning = document.getElementById('analysisReasoning');
  if (ai.explanation && ai.explanation.reasons) {
    analysisReasoning.innerHTML = ai.explanation.reasons.map(r => `<p>• ${r}</p>`).join('');
  }

  // Recommendations
  displayRecommendations(ai);

  // Differential Diagnosis
  if (ai.differentialDiagnosis && ai.differentialDiagnosis.length > 0) {
    displayDifferential(ai.differentialDiagnosis);
  } else {
    document.getElementById('differentialSection').classList.add('hidden');
  }

  // Explainability Panel
  renderExplainabilityPanel(ai);

  // Setup action buttons
  setupActionButtons(kase);
}

function displayHeatmap(ai) {
  const heatmap = document.getElementById('heatmap');

  // Determine risk levels for heatmap
  const generalRisk = ai.generalRiskDetails?.score || ai.score || 0;
  const maternalRisk = ai.maternalRiskDetails?.maternalScore || 0;
  const confidenceScore = ai.confidenceDetails?.confidenceScore || ai.confidence || 0;

  const getRiskClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  };

  heatmap.innerHTML = `
    <div class="heatmap-item ${getRiskClass(generalRisk)}">
      <div class="label">Structured Risk Score</div>
      <div class="value">${generalRisk}</div>
    </div>
    <div class="heatmap-item ${getRiskClass(maternalRisk)}">
      <div class="label">Maternal Risk</div>
      <div class="value">${maternalRisk}</div>
    </div>
    <div class="heatmap-item ${getRiskClass(confidenceScore)}">
      <div class="label">DCI Score</div>
      <div class="value">${confidenceScore}</div>
    </div>
    <div class="heatmap-item ${ai.risk === 'Red' ? 'high' : ai.risk === 'Amber' ? 'medium' : 'low'}">
      <div class="label">Triage Level</div>
      <div class="value">${ai.risk}</div>
    </div>
  `;
}

function renderExplainabilityPanel(ai) {
  // Triggered Symptoms
  const symptomsEl = document.getElementById('explainTriggeredSymptoms');
  if (symptomsEl) {
    const symptoms = ai.explanation?.symptoms || [];
    if (symptoms.length > 0) {
      symptomsEl.innerHTML = `
                <strong style="font-size:13px;color:#1e293b;">📋 Triggered Symptoms</strong>
                <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;">
                    ${symptoms.map(s => `<span style="background:#eff6ff;color:#1d4ed8;padding:3px 10px;border-radius:12px;font-size:12px;">✅ ${s.replace(/_/g, ' ')}</span>`).join('')}
                </div>`;
    } else {
      symptomsEl.innerHTML = `<strong style="font-size:13px;color:#1e293b;">📋 Triggered Symptoms</strong><p style="color:#94a3b8;font-size:13px;margin:4px 0;">No specific symptom pattern matched.</p>`;
    }
  }

  // Triggered Vitals
  const vitalsEl = document.getElementById('explainTriggeredVitals');
  if (vitalsEl) {
    const vitalFindings = ai.vitalFindings || [];
    if (vitalFindings.length > 0) {
      vitalsEl.innerHTML = `
                <strong style="font-size:13px;color:#1e293b;">📊 Triggered Vital Sign Findings</strong>
                <div style="margin-top:6px;">
                    ${vitalFindings.map(v => `<p style="margin:3px 0;font-size:13px;color:#475569;">🔴 ${v}</p>`).join('')}
                </div>`;
    } else {
      vitalsEl.innerHTML = `<strong style="font-size:13px;color:#1e293b;">📊 Triggered Vital Sign Findings</strong><p style="color:#94a3b8;font-size:13px;margin:4px 0;">Vitals within normal parameters or not recorded.</p>`;
    }
  }

  // Risk Thresholds
  const threshEl = document.getElementById('explainRiskThresholds');
  if (threshEl) {
    const reasons = ai.explanation?.reasons || [];
    if (reasons.length > 0) {
      threshEl.innerHTML = `
                <strong style="font-size:13px;color:#1e293b;">⚠️ Risk Thresholds Crossed</strong>
                <div style="margin-top:6px;">
                    ${reasons.map(r => `<p style="margin:3px 0;font-size:13px;color:#475569;">• ${r}</p>`).join('')}
                </div>`;
    }
  }

  // Pattern Logic
  const patternEl = document.getElementById('explainPatternLogic');
  if (patternEl && ai.condition) {
    const matchPct = ai.confidence || 0;
    patternEl.innerHTML = `
            <strong style="font-size:13px;color:#1e293b;">🔍 Pattern Logic Used</strong>
            <p style="margin:4px 0;font-size:13px;color:#475569;">Primary condition matched: <strong>${ai.condition}</strong>. Symptom-pattern match strength: <strong>${matchPct}%</strong>. Urgency classification: <strong>${ai.urgency || 'Low'}</strong>.</p>`;
  }

  // DCI
  const dciEl = document.getElementById('explainDCI');
  if (dciEl) {
    const dci = ai.confidenceDetails?.confidenceScore || ai.confidence || 0;
    const dciLevel = dci >= 71 ? 'HIGH' : dci >= 41 ? 'MODERATE' : 'LOW';
    const dciColor = dci >= 71 ? '#166534' : dci >= 41 ? '#92400e' : '#991b1b';
    const dciReasons = ai.confidenceDetails?.reasoning || [];
    dciEl.innerHTML = `
            <strong style="font-size:13px;color:#1e293b;">🎯 Diagnostic Certainty Index (DCI)</strong>
            <div style="margin-top:6px;background:#f8fafc;padding:10px;border-radius:6px;">
                <span style="font-size:18px;font-weight:700;color:${dciColor};">${dci} / 100 — ${dciLevel}</span>
                ${dciReasons.length > 0 ? '<div style="margin-top:6px;">' + dciReasons.map(r => `<p style="margin:2px 0;font-size:12px;color:#64748b;">• ${r}</p>`).join('') + '</div>' : ''}
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
        <h4>💊 Suggested Treatments</h4>
        <ul>${ai.treatments.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    `;
  }

  // Lab Tests
  if (ai.labTests && ai.labTests.length > 0) {
    container.innerHTML += `
      <div class="info-card info">
        <h4>🧪 Recommended Lab Tests</h4>
        <ul>${ai.labTests.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    `;
  }

  // Warnings
  if (ai.warnings && ai.warnings.length > 0) {
    container.innerHTML += `
      <div class="info-card warning">
        <h4>⚠️ Warnings</h4>
        <ul>${ai.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
      </div>
    `;
  }

  // Suggested Actions
  if (ai.suggestedActions && ai.suggestedActions.length > 0) {
    container.innerHTML += `
      <div class="info-card">
        <h4>📝 Suggested Actions</h4>
        <ul>${ai.suggestedActions.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
    `;
  }
}

function displayDifferential(differential) {
  const list = document.getElementById('differentialList');
  list.innerHTML = differential.map(d => `
    <div style="display: flex; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px;">
      <span style="font-weight: 500;">${d.name}</span>
      <span style="color: #64748b;">${Math.round(d.matchScore * 100)}% match</span>
    </div>
  `).join('');
}

function setupActionButtons(kase) {
  // New Case
  document.getElementById('newCaseBtn').addEventListener('click', () => {
    form.reset();
    inputForm.classList.remove('hidden');
    resultsContainer.classList.remove('show');
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
    escalateBtn.textContent = '✅ Already Escalated';
    escalateBtn.disabled = true;
  } else {
    escalateBtn.addEventListener('click', async () => {
      try {
        await postJSON('/second-opinion', { caseId: kase.id, action: 'escalate' });
        escalateBtn.textContent = '✅ Escalated';
        escalateBtn.disabled = true;
        alert('✅ Case escalated to doctor for review');
      } catch (err) {
        alert('❌ Failed to escalate case');
      }
    });
  }
}
// ===== Doctor Dashboard Logic =====
if (document.getElementById('cases')) {
  const mount = document.getElementById('cases');
  const refreshBtn = document.getElementById('refreshBtn');

  async function loadEscalated() {
    mount.innerHTML = translate('loading', 'Loading...');
    try {
      const res = await fetch('/cases');
      const data = await res.json();
      const cases = data.cases || [];
      const escalated = cases.filter(c => c.status === 'ESCALATED');

      if (escalated.length === 0) {
        mount.innerHTML = `<div style="text-align:center;padding:40px;color:#64748b;">${translate('no_escalated', 'No escalated cases pending review.')}</div>`;
        return;
      }

      mount.innerHTML = '';
      escalated.forEach(kase => {
        const el = document.createElement('div');
        el.className = 'section';
        el.style.borderLeft = '6px solid #f59e0b';

        const riskClass = kase.ai.risk ? kase.ai.risk.toLowerCase() : 'green';
        const conditionLabel = kase.ai.conditionCode ? translate('condition.' + kase.ai.conditionCode, kase.ai.condition) : kase.ai.condition;
        const vitalsHtml = kase.vitals ? `
                    <div style="background:#f8fafc;padding:12px;border-radius:6px;margin:12px 0;font-size:13px;">
                        <strong>📊 Vitals:</strong> BP: ${kase.vitals.bp_systolic || '-'}/${kase.vitals.bp_diastolic || '-'} · HR: ${kase.vitals.heart_rate || '-'} · Temp: ${kase.vitals.temperature || '-'}°C
                    </div>` : '';

        el.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <strong style="color:#64748b;">Case ID: ${kase.id}</strong>
                        <span class="risk-badge ${riskClass}">${kase.ai.risk || 'Low'}</span>
                    </div>
                    <div style="font-size:18px;font-weight:700;margin-bottom:8px;">${conditionLabel}</div>
                    <div style="font-size:14px;color:#475569;margin-bottom:12px;">
                        Patient: ${kase.patient.age}y ${kase.patient.gender} · Severity: ${kase.severity} · Duration: ${kase.duration}d
                    </div>
                    ${vitalsHtml}
                    <div style="margin-bottom:12px;">
                        <strong>Clinical Reasoning:</strong> ${kase.ai.explanation.reasons.join('. ')}
                    </div>
                    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin-top:16px;">
                        <h4 style="margin:0 0 12px 0;">👨‍⚕️ Official Review</h4>
                        <div class="form-grid" style="grid-template-columns:1fr 1fr;">
                            <div class="form-field">
                                <label>Doctor Name</label>
                                <input type="text" class="doctor-name" placeholder="Dr. Name">
                            </div>
                            <div class="form-field">
                                <label>Recommendation</label>
                                 <select class="doctor-rec">
                                     <option>Agree with Clinical Assessment</option>
                                     <option>Modify: Suggest different diagnosis</option>
                                     <option>Refer to specialist</option>
                                     <option>Prescribe medication</option>
                                     <option>Order additional investigations</option>
                                 </select>
                            </div>
                        </div>
                        <div class="form-field" style="margin-top:12px;">
                            <label>Clinical Notes</label>
                            <textarea class="doctor-comments" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:6px;height:60px;"></textarea>
                        </div>
                        <div style="margin-top:12px;text-align:right;">
                            <button class="action-btn primary btn-review">Submit Final Review</button>
                        </div>
                    </div>
                `;

        const btn = el.querySelector('.btn-review');
        btn.addEventListener('click', async () => {
          const doctorName = el.querySelector('.doctor-name').value || 'Doctor';
          const recommendation = el.querySelector('.doctor-rec').value;
          const comments = el.querySelector('.doctor-comments').value;

          btn.disabled = true;
          btn.textContent = 'Submitting...';

          try {
            await postJSON('/second-opinion', {
              caseId: kase.id,
              action: 'review',
              doctorName,
              doctorRecommendation: recommendation,
              comments
            });
            btn.textContent = '✅ Reviewed';
            setTimeout(() => loadEscalated(), 1000);
          } catch (e) {
            alert('❌ Error submitting review');
            btn.disabled = false;
            btn.textContent = 'Submit Final Review';
          }
        });

        mount.appendChild(el);
      });
    } catch (err) {
      mount.innerHTML = `<div style="color:#dc2626;">❌ Error loading cases.</div>`;
    }
  }

  // Initialize
  loadEscalated();
  if (refreshBtn) refreshBtn.addEventListener('click', loadEscalated);
  setInterval(loadEscalated, 30000); // Poll every 30s
}
