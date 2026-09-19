// Healthcare DSS Frontend Application
// Supports: Case Entry, Doctor Dashboard, Analytics, Admin

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

// --- Internationalization ---
let i18n = {};
let currentLang = localStorage.getItem('lang') || 'en';

async function loadLang(lang) {
  try {
    const res = await fetch(`/i18n/${lang}.json`);
    i18n = await res.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
  } catch (e) {
    console.warn('Failed to load lang', lang, e);
  }
}

function t(key, fallback) { 
  return (i18n && i18n[key]) ? i18n[key] : (fallback || key); 
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

// bind language selectors
const langSelect = document.getElementById('langSelect');
if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener('change', (e) => loadLang(e.target.value));
}

// initial load language
loadLang(currentLang);

// --- PCW page logic ---
if (document.getElementById('caseForm')) {
  const form = document.getElementById('caseForm');
  const result = document.getElementById('result');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');
  const stats = document.getElementById('stats');

  async function refreshStats() {
    try {
      const res = await fetch('/cases');
      const list = await res.json();
      const counts = { Green:0, Amber:0, Red:0 };
      list.forEach(c => counts[c.ai && c.ai.risk ? c.ai.risk : 'Green'] = (counts[c.ai && c.ai.risk ? c.ai.risk : 'Green']||0)+1);
      stats.innerHTML = `Cases: ${list.length} · <span style="color:green">Green ${counts.Green}</span> · <span style="color:orange">Amber ${counts.Amber}</span> · <span style="color:red">Red ${counts.Red}</span>`;
    } catch (e) { stats.innerText = 'Stats unavailable'; }
  }

  // initialize stats periodically
  refreshStats();
  setInterval(refreshStats, 30_000);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const age = Number(document.getElementById('age').value || 0);
    const severity = document.getElementById('severity').value;
    const duration = Number(document.getElementById('duration').value || 0);
    const symptoms = Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map(n => n.value);
    const patientId = document.getElementById('patientId')?.value || null;
    
    // Gather vitals
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
    
    // Gather medical history
    const allergiesInput = document.getElementById('allergies')?.value || '';
    const allergies = allergiesInput.split(',').map(s => s.trim()).filter(Boolean);
    
    const medsInput = document.getElementById('medications')?.value || '';
    const currentMedications = medsInput.split(',').map(s => s.trim()).filter(Boolean);
    
    const medicalHistory = Array.from(document.querySelectorAll('input[name="history"]:checked')).map(n => n.value);

    result.classList.remove('hidden');
    result.innerHTML = '<div style="text-align:center;padding:20px;">🔄 Analyzing case with AI...</div>';

    // optional attachment as base64
    const attachInput = document.getElementById('attachment');
    const attachments = [];
    if (attachInput && attachInput.files && attachInput.files[0]) {
      const file = attachInput.files[0];
      const data = await new Promise((resolve) => {
        const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file);
      });
      attachments.push({ name: file.name, data });
    }

    try {
      const kase = await postJSON('/analyze', { 
        age, 
        symptoms, 
        severity, 
        duration, 
        attachments, 
        lang: currentLang,
        patientId,
        vitals,
        allergies,
        currentMedications,
        medicalHistory
      });
      showResult(kase);
      refreshStats();
    } catch (err) {
      result.innerHTML = '<div class="emergency">❌ Error contacting server. Please try again.</div>';
    }
  });

  // export
  exportBtn.addEventListener('click', async () => {
    const res = await fetch('/cases');
    const list = await res.json();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cases_export.json'; a.click(); URL.revokeObjectURL(url);
  });

  // import
  importFile.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const txt = await f.text();
    try {
      const parsed = JSON.parse(txt);
      // send to server import endpoint
      await postJSON('/import-cases', { cases: parsed });
      alert('Imported');
      refreshStats();
    } catch (err) { alert('Import failed'); }
  });

  function showResult(kase) {
    result.classList.remove('hidden');
    const riskClass = kase.ai.risk.toLowerCase();
    const riskEl = `<span class="risk ${riskClass}">${kase.ai.risk}</span>`;
    const conditionLabel = kase.ai.conditionCode ? t('condition.' + kase.ai.conditionCode, kase.ai.condition) : kase.ai.condition;

    // Emergency banner
    const emergency = kase.ai.risk === 'Red' ? `
      <div class="emergency" style="background:#fef2f2;border-left:6px solid #ef4444;padding:12px;margin:12px 0;border-radius:6px;">
        <strong>🚨 ${t('emergency', 'URGENT: High-risk case - seek immediate medical attention!')}</strong>
      </div>` : '';

    // Vitals display
    const vitalsHtml = kase.vitals && Object.keys(kase.vitals).length ? `
      <div style="background:#f0f9ff;padding:12px;border-radius:6px;margin:12px 0;">
        <strong>📊 Recorded Vitals:</strong> 
        BP: ${kase.vitals.bp_systolic||'-'}/${kase.vitals.bp_diastolic||'-'} mmHg · 
        HR: ${kase.vitals.heart_rate||'-'} bpm · 
        Temp: ${kase.vitals.temperature||'-'}°C · 
        SpO2: ${kase.vitals.spo2||'-'}%
      </div>` : '';

    // Treatments
    const treatmentsHtml = kase.ai.treatments && kase.ai.treatments.length ? `
      <div class="treatments-list" style="background:#ecfdf5;border-left:4px solid #16a34a;padding:12px;border-radius:6px;margin:12px 0;">
        <strong>💊 Suggested Treatments:</strong>
        <ul style="margin:8px 0 0 20px;">${kase.ai.treatments.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>` : '';

    // Lab tests
    const labTestsHtml = kase.ai.labTests && kase.ai.labTests.length ? `
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px;border-radius:6px;margin:12px 0;">
        <strong>🧪 Recommended Lab Tests:</strong>
        <ul style="margin:8px 0 0 20px;">${kase.ai.labTests.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>` : '';

    // Warnings
    const warningsHtml = kase.ai.warnings && kase.ai.warnings.length ? `
      <div class="warnings-list" style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:6px;margin:12px 0;">
        <strong>⚠️ Warnings:</strong>
        <ul style="margin:8px 0 0 20px;">${kase.ai.warnings.map(w => `<li style="color:#92400e;">${w}</li>`).join('')}</ul>
      </div>` : '';

    // Suggested actions
    const actionsHtml = kase.ai.suggestedActions && kase.ai.suggestedActions.length ? `
      <div style="background:#faf5ff;border-left:4px solid #8b5cf6;padding:12px;border-radius:6px;margin:12px 0;">
        <strong>📝 Suggested Actions:</strong>
        <ul style="margin:8px 0 0 20px;">${kase.ai.suggestedActions.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>` : '';

    // Differential diagnosis
    const diffHtml = kase.ai.differentialDiagnosis && kase.ai.differentialDiagnosis.length ? `
      <div class="differential" style="background:#f8fafc;padding:12px;border-radius:6px;margin:12px 0;">
        <strong>🧠 Differential Diagnosis:</strong>
        <div style="margin-top:8px;">
          ${kase.ai.differentialDiagnosis.map(d => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;">
              <span>${d.name}</span>
              <span style="color:var(--muted);">${Math.round(d.matchScore * 100)}% match</span>
            </div>
          `).join('')}
        </div>
      </div>` : '';

    // Attachments
    const att = (kase.attachments && kase.attachments.length) ? 
      `<div style="margin:12px 0;"><strong>📎 Attachments:</strong> ${kase.attachments.map(a=>a.name).join(', ')}</div>` : '';

    result.innerHTML = `
      <div class="case" style="border:2px solid ${riskClass === 'red' ? '#ef4444' : riskClass === 'amber' ? '#f59e0b' : '#16a34a'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <strong style="font-size:18px;">${t('ai_suggestion', 'AI Analysis Result')}</strong>
          </div>
          ${riskEl}
        </div>
        
        <div style="font-size:20px;font-weight:600;color:#1e293b;margin-bottom:8px;">
          ${conditionLabel}
        </div>
        
        <div class="meta" style="margin-bottom:12px;">
          ${t('confidence')}: <strong>${kase.ai.confidence}%</strong> · 
          Risk Score: <strong>${kase.ai.score}/100</strong> ·
          Urgency: <strong>${kase.ai.urgency || 'normal'}</strong>
        </div>
        
        <div style="background:#f8fafc;padding:12px;border-radius:6px;margin:12px 0;">
          <strong>🔍 Analysis Reasoning:</strong>
          <p style="margin:8px 0 0 0;">${kase.ai.explanation.reasons.join('. ')}</p>
        </div>
        
        ${emergency}
        ${vitalsHtml}
        ${warningsHtml}
        ${treatmentsHtml}
        ${labTestsHtml}
        ${actionsHtml}
        ${diffHtml}
        ${att}
        
        <div class="meta" style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;">
          ${t('case_id')}: <code>${kase.id}</code> · ${t('status')}: <strong>${kase.status}</strong>
        </div>
        
        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
          <button id="escalateBtn" class="btn-secondary" ${kase.status === 'ESCALATED' ? 'disabled' : ''}>
            ${kase.status === 'ESCALATED' ? '✅ Already Escalated' : '👨‍⚕️ ' + t('request_second_opinion')}
          </button>
          <button id="exportCaseBtn" class="btn-secondary">📄 Export Case</button>
          <button id="printBtn" class="btn-secondary">🖨️ Print</button>
        </div>
      </div>
    `;

    // Escalate button
    const esc = document.getElementById('escalateBtn');
    if (kase.status !== 'ESCALATED') {
      esc.addEventListener('click', async () => {
        await postJSON('/second-opinion', { caseId: kase.id, action: 'escalate' });
        esc.innerText = '✅ Escalated';
        esc.disabled = true;
        refreshStats();
      });
    }

    // Export case button
    document.getElementById('exportCaseBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(kase, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${kase.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Print button
    document.getElementById('printBtn').addEventListener('click', () => {
      window.print();
    });
  }
}

// --- Doctor dashboard logic ---
if (document.getElementById('cases')) {
  const mount = document.getElementById('cases');
  const refreshBtn = document.getElementById('refreshBtn');

  async function loadEscalated() {
    mount.innerHTML = t('loading') || 'Loading...';
    const res = await fetch('/cases');
    const cases = await res.json();
    const escalated = cases.filter(c => c.status === 'ESCALATED');

    if (escalated.length === 0) {
      mount.innerHTML = `<div class="meta">${t('no_escalated')}</div>`;
      return;
    }

    mount.innerHTML = '';
    escalated.forEach(kase => {
      const el = document.createElement('div');
      el.className = 'case';
      const riskClass = kase.ai.risk.toLowerCase();
      const conditionLabel = kase.ai.conditionCode ? t('condition.' + kase.ai.conditionCode, kase.ai.condition) : kase.ai.condition;
      const attachmentsHtml = (kase.attachments||[]).map(a => `<div><a href="${a.data}" target="_blank">${a.name}</a></div>`).join('');
      const vitalsHtml = kase.vitals ? `<div class="vitals-display"><strong>Vitals:</strong> BP: ${kase.vitals.bp_systolic||'-'}/${kase.vitals.bp_diastolic||'-'} · HR: ${kase.vitals.heart_rate||'-'} · Temp: ${kase.vitals.temperature||'-'}°C · SpO2: ${kase.vitals.spo2||'-'}%</div>` : '';
      el.innerHTML = `
        <div><strong>Case:</strong> ${kase.id} · <span class="meta">Age: ${kase.patient.age} · Severity: ${kase.severity} · Duration: ${kase.duration}d</span></div>
        <div><strong>AI:</strong> ${conditionLabel} <span class="risk ${riskClass}">${kase.ai.risk}</span></div>
        <div class="meta">${t('confidence')}: ${kase.ai.confidence}% · ${t('score')}: ${kase.ai.score}</div>
        ${vitalsHtml}
        <p>${kase.ai.explanation.reasons.join('. ')}</p>
        ${kase.ai.treatments ? `<div class="treatments"><strong>Suggested Treatments:</strong> ${kase.ai.treatments.join(', ')}</div>` : ''}
        ${kase.ai.warnings && kase.ai.warnings.length ? `<div class="warnings"><strong>⚠️ Warnings:</strong> ${kase.ai.warnings.join(', ')}</div>` : ''}
        ${attachmentsHtml}
        <div class="doctor-form">
          <label>${t('doctor_name')} <input type="text" class="doctor-name" placeholder="Dr. Name"></label>
          <label>${t('doctor_recommendation')} <select class="doctor-rec">
            <option>Agree with AI</option>
            <option>Modify: Suggest different diagnosis</option>
            <option>Refer to higher centre</option>
            <option>Prescribe medication</option>
            <option>Order lab tests</option>
            <option>Schedule follow-up</option>
          </select></label>
          <label>${t('doctor_comments')}</label>
          <textarea class="doctor-comments" placeholder="Notes for the record"></textarea>
          <label>Prescription (optional)</label>
          <textarea class="doctor-prescription" placeholder="Medications, dosage, duration..."></textarea>
          <div style="margin-top:8px"><button class="btn-review">${t('submit_review')}</button></div>
        </div>
      `;

      const btn = el.querySelector('.btn-review');
      btn.addEventListener('click', async () => {
        const doctorName = el.querySelector('.doctor-name').value || 'Doctor';
        const doctorRecommendation = el.querySelector('.doctor-rec').value;
        const comments = el.querySelector('.doctor-comments').value;
        const prescription = el.querySelector('.doctor-prescription').value;

        btn.disabled = true;
        btn.innerText = 'Submitting...';

        await postJSON('/second-opinion', { caseId: kase.id, action: 'review', doctorName, doctorRecommendation, comments, prescription });

        btn.innerText = 'Reviewed ✓';
        setTimeout(() => loadEscalated(), 1000);
      });

      mount.appendChild(el);
    });
  }

  // initial load
  loadEscalated();

  refreshBtn && refreshBtn.addEventListener('click', loadEscalated);

  // refresh every 20s (simple polling for low-bandwidth friendly)
  setInterval(loadEscalated, 20_000);
}
