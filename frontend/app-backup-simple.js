// Healthcare DSS - Ultra Simple Version
// Clear 3-step workflow: Input → Analysis → Results

// ===== STEP MANAGEMENT =====
function showStep(stepNumber) {
    // Update progress bar
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });

    // Show/hide sections
    document.getElementById('inputSection').classList.toggle('hidden', stepNumber !== 1);
    document.getElementById('loadingSection').classList.toggle('hidden', stepNumber !== 2);
    document.getElementById('resultsSection').classList.toggle('hidden', stepNumber !== 3);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== LANGUAGE SWITCHING (FIXED) =====
const translations = {
    en: {
        title: "Healthcare Decision Support System",
        subtitle: "AI-Powered Patient Analysis - Simple & Fast",
        step1: "Enter Details",
        step2: "AI Analysis",
        step3: "View Results",
        analyzing: "AI is analyzing the case...",
        wait: "Please wait, this will take just a few seconds",
        emergency: "URGENT: Immediate Medical Attention Required!",
        newCase: "New Case",
        print: "Print Report",
        export: "Export"
    },
    hi: {
        title: "स्वास्थ्य निर्णय सहायता प्रणाली",
        subtitle: "AI-संचालित रोगी विश्लेषण - सरल और तेज़",
        step1: "विवरण दर्ज करें",
        step2: "AI विश्लेषण",
        step3: "परिणाम देखें",
        analyzing: "AI मामले का विश्लेषण कर रहा है...",
        wait: "कृपया प्रतीक्षा करें, इसमें कुछ सेकंड लगेंगे",
        emergency: "तत्काल: तुरंत चिकित्सा ध्यान आवश्यक!",
        newCase: "नया मामला",
        print: "रिपोर्ट प्रिंट करें",
        export: "निर्यात करें"
    },
    mr: {
        title: "आरोग्य निर्णय सहाय्य प्रणाली",
        subtitle: "AI-चालित रुग्ण विश्लेषण - सोपे आणि जलद",
        step1: "तपशील प्रविष्ट करा",
        step2: "AI विश्लेषण",
        step3: "निकाल पहा",
        analyzing: "AI प्रकरणाचे विश्लेषण करत आहे...",
        wait: "कृपया प्रतीक्षा करा, यास काही सेकंद लागतील",
        emergency: "तातडीचे: त्वरित वैद्यकीय लक्ष आवश्यक!",
        newCase: "नवीन प्रकरण",
        print: "अहवाल मुद्रित करा",
        export: "निर्यात करा"
    }
};

let currentLang = 'en';

function changeLanguage(lang) {
    currentLang = lang;
    const t = translations[lang] || translations.en;

    // Update text content
    document.querySelector('.header h1').textContent = '🏥 ' + t.title;
    document.querySelector('.header p').textContent = t.subtitle;
    document.querySelector('#step1 .step-label').textContent = t.step1;
    document.querySelector('#step2 .step-label').textContent = t.step2;
    document.querySelector('#step3 .step-label').textContent = t.step3;
    document.querySelector('.loading-text').textContent = '🤖 ' + t.analyzing;
    document.querySelector('.loading-screen p').textContent = t.wait;

    const emergencyH3 = document.querySelector('#emergencyAlert h3');
    if (emergencyH3) emergencyH3.textContent = '🚨 ' + t.emergency;

    document.getElementById('newCaseBtn').textContent = '➕ ' + t.newCase;
    document.getElementById('printBtn').textContent = '🖨️ ' + t.print;
    document.getElementById('exportBtn').textContent = '📄 ' + t.export;

    console.log('Language changed to:', lang);
}

// Setup language selector
document.getElementById('langSelect').addEventListener('change', (e) => {
    changeLanguage(e.target.value);
});

// ===== FORM SUBMISSION =====
let currentCase = null;

document.getElementById('caseForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect data
    const age = Number(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const severity = document.getElementById('severity').value;
    const symptoms = Array.from(document.querySelectorAll('input[name="symptom"]:checked'))
        .map(cb => cb.value);

    // Vitals
    const vitals = {};
    const bp = document.getElementById('bp').value;
    if (bp) vitals.bp = bp;

    const hr = document.getElementById('heart_rate').value;
    if (hr) vitals.heart_rate = Number(hr);

    const temp = document.getElementById('temperature').value;
    if (temp) vitals.temperature = Number(temp);

    // Go to step 2 (loading)
    showStep(2);

    try {
        // Call API
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                age,
                gender,
                symptoms,
                severity,
                vitals,
                duration: 1,
                medicalHistory: []
            })
        });

        if (!response.ok) throw new Error('API failed');

        currentCase = await response.json();

        // Wait a bit for effect
        setTimeout(() => {
            displayResults(currentCase);
            showStep(3);
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: Could not analyze case. Please try again.');
        showStep(1);
    }
});

// ===== DISPLAY RESULTS =====
function displayResults(kase) {
    const ai = kase.ai;
    const risk = ai.risk;
    const riskClass = risk.toLowerCase();

    // Emergency alert
    if (risk === 'Red') {
        document.getElementById('emergencyAlert').classList.remove('hidden');
    } else {
        document.getElementById('emergencyAlert').classList.add('hidden');
    }

    // Risk badge
    const badge = document.getElementById('riskBadge');
    badge.className = `risk-badge ${riskClass}`;
    badge.textContent = risk + ' Risk';

    // Diagnosis
    document.getElementById('diagnosisText').textContent = ai.condition;

    // Metrics
    document.getElementById('metricsText').innerHTML = `
    Confidence: <strong>${ai.confidence}%</strong> · 
    Risk Score: <strong>${ai.score}/100</strong> · 
    Urgency: <strong>${ai.urgency || 'Normal'}</strong>
  `;

    // Display Heatmap
    displayHeatmap(ai, kase);

    // Display Risk Breakdown
    displayRiskBreakdown(ai, kase);

    // Analysis card
    const analysisCard = document.getElementById('analysisCard');
    analysisCard.className = `result-card ${riskClass}`;

    let analysisHTML = '<div style="line-height: 1.8;">';
    if (ai.explanation && ai.explanation.reasons) {
        ai.explanation.reasons.forEach(reason => {
            analysisHTML += `<p style="margin-bottom: 10px;">• ${reason}</p>`;
        });
    }

    // Clinical summary
    if (ai.clinicalSummary && ai.clinicalSummary.summaryText) {
        analysisHTML += `<div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
      <strong>Clinical Summary:</strong><br>
      ${ai.clinicalSummary.summaryText}
    </div>`;
    }
    analysisHTML += '</div>';
    document.getElementById('analysisContent').innerHTML = analysisHTML;

    // Recommendations
    let recsHTML = '<div style="line-height: 1.8;">';

    if (ai.treatments && ai.treatments.length > 0) {
        recsHTML += '<div style="margin-bottom: 15px;"><strong>💊 Treatments:</strong><ul style="margin: 8px 0 0 20px;">';
        ai.treatments.forEach(t => recsHTML += `<li>${t}</li>`);
        recsHTML += '</ul></div>';
    }

    if (ai.labTests && ai.labTests.length > 0) {
        recsHTML += '<div style="margin-bottom: 15px;"><strong>🧪 Lab Tests:</strong><ul style="margin: 8px 0 0 20px;">';
        ai.labTests.forEach(t => recsHTML += `<li>${t}</li>`);
        recsHTML += '</ul></div>';
    }

    if (ai.warnings && ai.warnings.length > 0) {
        recsHTML += '<div style="margin-bottom: 15px;"><strong>⚠️ Warnings:</strong><ul style="margin: 8px 0 0 20px;">';
        ai.warnings.forEach(w => recsHTML += `<li>${w}</li>`);
        recsHTML += '</ul></div>';
    }

    if (ai.suggestedActions && ai.suggestedActions.length > 0) {
        recsHTML += '<div><strong>📝 Actions:</strong><ul style="margin: 8px 0 0 20px;">';
        ai.suggestedActions.forEach(a => recsHTML += `<li>${a}</li>`);
        recsHTML += '</ul></div>';
    }

    recsHTML += '</div>';
    document.getElementById('recommendationsContent').innerHTML = recsHTML;
}

// ===== HEATMAP DISPLAY =====
function displayHeatmap(ai, kase) {
    const heatmapGrid = document.getElementById('heatmapGrid');

    // Get risk scores
    const generalScore = ai.generalRiskDetails?.score || ai.score || 0;
    const maternalScore = ai.maternalRiskDetails?.maternalScore || 0;
    const confidenceScore = ai.confidenceDetails?.confidenceScore || ai.confidence || 0;
    const overallScore = ai.score || 0;

    // Function to get color based on score
    const getHeatColor = (score) => {
        if (score >= 70) return { bg: '#fee2e2', text: '#991b1b', label: 'High' };
        if (score >= 35) return { bg: '#fef3c7', text: '#92400e', label: 'Medium' };
        return { bg: '#dcfce7', text: '#166534', label: 'Low' };
    };

    // Create heatmap items
    const items = [
        { label: 'General Risk', score: generalScore },
        { label: 'Maternal Risk', score: maternalScore },
        { label: 'AI Confidence', score: confidenceScore },
        { label: 'Overall Risk', score: overallScore }
    ];

    heatmapGrid.innerHTML = items.map(item => {
        const color = getHeatColor(item.score);
        return `
      <div style="background: ${color.bg}; padding: 20px; border-radius: 10px; text-align: center; border: 2px solid ${color.text}20;">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px;">${item.label}</div>
        <div style="font-size: 32px; font-weight: 700; color: ${color.text};">${item.score}</div>
        <div style="font-size: 11px; font-weight: 500; color: ${color.text}; margin-top: 5px;">${color.label}</div>
      </div>
    `;
    }).join('');
}

// ===== RISK BREAKDOWN DISPLAY =====
function displayRiskBreakdown(ai, kase) {
    const breakdownDiv = document.getElementById('riskBreakdown');

    let html = '<div style="line-height: 1.8;">';

    // General Risk Details
    if (ai.generalRiskDetails) {
        const grd = ai.generalRiskDetails;
        html += `
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
        <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">📋 General Risk Assessment</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          <div><strong>Score:</strong> ${grd.score}/100</div>
          <div><strong>Category:</strong> ${grd.category || 'N/A'}</div>
          <div><strong>Condition:</strong> ${grd.condition || 'N/A'}</div>
        </div>
        ${grd.explanation && grd.explanation.length > 0 ? `
          <div style="margin-top: 10px;">
            <strong>Factors:</strong>
            <ul style="margin: 5px 0 0 20px;">
              ${grd.explanation.map(e => `<li>${e}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    }

    // Maternal Risk Details
    if (ai.maternalRiskDetails && ai.maternalRiskDetails.maternalScore > 0) {
        const mrd = ai.maternalRiskDetails;
        html += `
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
        <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">🤰 Maternal Risk Assessment</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          <div><strong>Score:</strong> ${mrd.maternalScore}/100</div>
          <div><strong>Category:</strong> ${mrd.category || 'N/A'}</div>
        </div>
        ${mrd.explanation && mrd.explanation.length > 0 ? `
          <div style="margin-top: 10px;">
            <strong>Factors:</strong>
            <ul style="margin: 5px 0 0 20px;">
              ${mrd.explanation.map(e => `<li>${e}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    }

    // Escalation Details
    if (ai.escalationDetails) {
        const esc = ai.escalationDetails;
        html += `
      <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
        <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">🚨 Escalation Assessment</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          <div><strong>Required:</strong> ${esc.escalationRequired ? 'Yes' : 'No'}</div>
          <div><strong>Level:</strong> ${esc.escalationLevel || 'N/A'}</div>
          <div><strong>Urgency:</strong> ${esc.urgency || 'N/A'}</div>
        </div>
        ${esc.reasoning ? `
          <div style="margin-top: 10px;">
            <strong>Reasoning:</strong> ${esc.reasoning}
          </div>
        ` : ''}
        ${esc.recommendedAction ? `
          <div style="margin-top: 10px;">
            <strong>Action:</strong> ${esc.recommendedAction}
          </div>
        ` : ''}
      </div>
    `;
    }

    // Confidence Details
    if (ai.confidenceDetails) {
        const conf = ai.confidenceDetails;
        html += `
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h4 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px;">✅ Confidence Assessment</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          <div><strong>Score:</strong> ${conf.confidenceScore}%</div>
          <div><strong>Level:</strong> ${conf.confidenceLevel || 'N/A'}</div>
        </div>
        ${conf.factors && conf.factors.length > 0 ? `
          <div style="margin-top: 10px;">
            <strong>Factors:</strong>
            <ul style="margin: 5px 0 0 20px;">
              ${conf.factors.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    }

    html += '</div>';
    breakdownDiv.innerHTML = html;
}

// ===== ACTION BUTTONS =====
document.getElementById('newCaseBtn').addEventListener('click', () => {
    document.getElementById('caseForm').reset();
    showStep(1);
});

document.getElementById('printBtn').addEventListener('click', () => {
    window.print();
});

document.getElementById('exportBtn').addEventListener('click', () => {
    if (!currentCase) return;
    const blob = new Blob([JSON.stringify(currentCase, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case_${currentCase.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// Initialize
showStep(1);
