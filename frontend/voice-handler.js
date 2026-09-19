/**
 * Voice Assistant Handler (Brave & Privacy Resilient)
 * Brave Note: Brave disables Web Speech API by default.
 * Users must enable "Allow Google Services for push messaging and speech recognition" in brave://settings/google_services
 */

(function () {
    // State
    let recognition = null;
    let isListening = false;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let animationId = null;
    let stream = null;

    // DOM
    const startBtn = document.getElementById('startMicBtn');
    const stopBtn = document.getElementById('stopMicBtn');
    const statusLabel = document.getElementById('voiceStatus');
    const liveDisplay = document.getElementById('liveTranscriptDisplay');
    const finalTextarea = document.getElementById('finalVoiceTranscript');
    const clearBtn = document.getElementById('clearVoiceBtn');

    // Unified Review UI
    const reviewContainer = document.getElementById('voiceReviewContainer');
    const symptomSection = document.getElementById('reviewSymptomsSection');
    const symptomList = document.getElementById('reviewSymptomsList');
    const durationSection = document.getElementById('reviewDurationSection');
    const durationText = document.getElementById('reviewDurationText');
    const applyBtn = document.getElementById('voiceApplyBtn');
    const discardBtn = document.getElementById('voiceDiscardBtn');

    let sessionSymptoms = new Set();
    let sessionDuration = null;

    // Pro-Level Multi-Language Keyword Detection Dictionary (English, Hindi, Marathi)
    const KEYWORD_MAP = {
        fever: ["fever", "feverish", "temperature", "shivering", "बुखार", "ताप", "taap", "tap", " गरम ", "ang garam", "th थंडी"],
        cough: ["cough", "coughing", "khasi", "khokla", "खांसी", "खोकला", " खोकला ", "सकाळी खोकला", "khokle"],
        breathlessness: ["breathlessness", "short of breath", "breathing difficulty", "saans", "सांस", "दम", "श्वास", "tras", "breath"],
        chest_pain: ["chest pain", "tightness", "sine mein dard", "chhatit dukhne", "सीने में दर्द", "छातीत दुखणे", "sineat dukhne"],
        headache: ["headache", "head pain", "migraine", "sar dard", "doke dukhi", "सिर दर्द", "डोकेदुखी", "डोके दुखणे"],
        rash: ["rash", "red spots", "दाने", "पुरळ", "itch", "rashes", "khaj"],
        diarrhea: ["diarrhea", "loose motions", "दस्त", "जुलाब", "dast", "julab"],
        vomiting: ["vomiting", "throwing up", "vomit", "उल्टी", "उलट्या", "ulti"],
        abdominal_pain: ["abdominal pain", "stomach ache", "pet dard", "pot dukhi", "पेट दर्द", "पोटदुखी", "पोटात दुखणे"],
        fatigue: ["fatigue", "tiredness", "weakness", "कमजोरी", "थकान", "थकवा", "kamzori", "thakan", "thakva"],
        body_ache: ["body ache", "back pain", "बदन दर्द", "अंगदुखी", "badan dard", "ang dukhi", "ang dukhne"],
        sore_throat: ["sore throat", "swallow", "गले में दर्द", "घसा दुखणे", "gala kharab", "sardi", "सर्दी"],
        joint_pain: ["joint pain", "joints", "जोड़ों में दर्द", "सांधेदुखी", "jodon mein dard", "sandhe dukhi"],
        nausea: ["nausea", "feeling sick", "जी मिचलाना", "मळमळणे", "ji michlana", "malmalne"],
        dizziness: ["dizziness", "vertigo", "चक्कर", "chakkar", "giddiness"],
        confusion: ["confusion", "disoriented", "उलझन", "गोंधळ", "confusion"],
        swelling: ["swelling", "सूजन", "सूज", "sujan", "suj"],
        palpitations: ["palpitations", "heartbeat", "धड़कन", "धडधडणे", "dhadkan"]
    };

    const WORD_TO_NUM = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
        "दोन": 2, "पाच": 5, "सहा": 6, "नऊ": 9, "दहा": 10
    };

    function scanTranscript(text) {
        if (!text) return;
        const lowerText = text.toLowerCase();

        // 1. Scan for Symptoms
        for (const [symptom, keywords] of Object.entries(KEYWORD_MAP)) {
            if (keywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
                sessionSymptoms.add(symptom);
            }
        }

        // 2. Scan for Duration (Enhanced for EN/HI/MR)
        const dRegex = /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस|दोन|पाच|सहा|नऊ|दहा)\s+(day|days|week|weeks|दिन|हफ्ते|दिवस|आठवडे)/gi;
        let dMatch;
        while ((dMatch = dRegex.exec(lowerText)) !== null) {
            let val = dMatch[1];
            let unit = dMatch[2].toLowerCase();
            let num = parseInt(val, 10) || WORD_TO_NUM[val] || 0;
            if (num > 0) {
                if (unit.startsWith('week') || unit.includes('हफ्ते') || unit.includes('आठवडे')) {
                    sessionDuration = num * 7;
                } else {
                    sessionDuration = num;
                }
            }
        }

        renderReview();
    }

    function renderReview() {
        if (!reviewContainer) return;

        if (sessionSymptoms.size === 0 && sessionDuration === null) {
            reviewContainer.style.display = 'none';
            return;
        }

        reviewContainer.style.display = 'block';

        // Update Symptoms UI
        if (sessionSymptoms.size > 0) {
            symptomSection.style.display = 'block';
            symptomList.innerHTML = '';
            sessionSymptoms.forEach(sym => {
                const tag = document.createElement('span');
                tag.style.cssText = 'background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #dbeafe;';
                tag.textContent = '✅ ' + (sym.charAt(0).toUpperCase() + sym.slice(1)).replace('_', ' ');
                symptomList.appendChild(tag);
            });
        } else {
            symptomSection.style.display = 'none';
        }

        // Update Duration UI
        if (sessionDuration !== null) {
            durationSection.style.display = 'block';
            durationText.textContent = `⏳ ${sessionDuration} days`;
        } else {
            durationSection.style.display = 'none';
        }
    }

    applyBtn?.addEventListener('click', () => {
        // Apply Symptoms to Checkboxes
        sessionSymptoms.forEach(sym => {
            const cb = document.querySelector(`input[name="symptom"][value="${sym}"]`);
            if (cb && !cb.checked) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Apply Duration to Input
        if (sessionDuration !== null) {
            const dInput = document.getElementById('duration');
            if (dInput) {
                dInput.value = sessionDuration;
                dInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        showDiagnostic('✅ Data applied to form', 'success');
        clearSession();
    });

    discardBtn?.addEventListener('click', () => {
        showDiagnostic('✖️ Detections discarded');
        clearSession();
    });

    function clearSession() {
        sessionSymptoms.clear();
        sessionDuration = null;
        if (reviewContainer) reviewContainer.style.display = 'none';
    }

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    async function isBrave() {
        return (navigator.brave && await navigator.brave.isBrave()) || false;
    }

    function showDiagnostic(msg, type = 'info') {
        console.log(`[Voice Diagnostic] ${msg}`);
        if (statusLabel) {
            statusLabel.textContent = msg;
            statusLabel.classList.remove('hidden');
            if (type === 'error') statusLabel.style.color = '#ef4444';
            else if (type === 'success') statusLabel.style.color = '#10b981';
            else statusLabel.style.color = '#4f46e5';
        }
    }

    // Canvas Injector
    let canvas = document.getElementById('voiceVisualizer');
    if (!canvas) {
        const container = document.getElementById('voiceAssistantContainer');
        if (container) {
            const visualizerBox = document.createElement('div');
            visualizerBox.id = 'voiceVisualizerBox';
            visualizerBox.style.cssText = 'height: 40px; width: 100%; margin-bottom: 15px; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;';
            canvas = document.createElement('canvas');
            canvas.id = 'voiceVisualizer';
            canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
            visualizerBox.appendChild(canvas);
            const preview = document.getElementById('voicePreview');
            if (preview) preview.parentNode.insertBefore(visualizerBox, preview.nextSibling);
            else container.prepend(visualizerBox);
        }
    }

    async function initVisualizer() {
        try {
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            drawVisualizer();
        } catch (err) {
            showDiagnostic('❌ Mic Access Blocked', 'error');
        }
    }

    function drawVisualizer() {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        function draw() {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#6366f1';
            const barWidth = (width / dataArray.length) * 2.5;
            let x = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const barHeight = (dataArray[i] / 255) * height;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
        draw();
    }

    function initSpeechEngine() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showDiagnostic('❌ Speech API Not Supported', 'error');
            return null;
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;

        // Dynamic Language Selection
        const updateLang = () => {
            const langSelector = document.getElementById('langSelect');
            const appLang = langSelector ? langSelector.value : (localStorage.getItem('lang') || 'en');
            // Using en-IN instead of en-US for better Indian context/accents
            rec.lang = (appLang === 'hi') ? 'hi-IN' : (appLang === 'mr' ? 'mr-IN' : 'en-IN');
        };

        updateLang();
        rec._updateLang = updateLang; // Store for refresh

        rec.onstart = () => {
            isListening = true;
            updateUI(true);
            showDiagnostic('🎙️ Listening...', 'success');
        };

        rec.onresult = (event) => {
            let interim = '';
            let finalStr = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const res = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalStr += res;
                else interim += res;
            }
            if (liveDisplay) liveDisplay.textContent = interim || 'Processing...';
            if (finalStr && finalTextarea) {
                const current = finalTextarea.value.trim();
                const pad = (current && !/[.!?]$/.test(current)) ? '. ' : ' ';
                finalTextarea.value = (current + pad + finalStr.trim()).trim();
                finalTextarea.scrollTop = finalTextarea.scrollHeight;
                if (liveDisplay) liveDisplay.textContent = 'Captured.';
                showDiagnostic('✅ Transcribed', 'success');

                // NEW: Scan for keywords when transcript is updated
                scanTranscript(finalStr);
            }
        };

        rec.onerror = async (e) => {
            console.error('[VoiceEngine] Error:', e.error);
            if (e.error === 'network') {
                const braveUser = await isBrave();
                if (braveUser) {
                    showDiagnostic('❌ BRAVE BLOCKED GOOGLE SPEECH', 'error');
                    alert('BRAVE BROWSER FIX:\n\n1. Go to brave://settings/google_services\n2. Enable "Allow Google Services for push messaging and speech recognition"\n3. Restart Brave.\n\nAlternatively, use Chrome or Microsoft Edge.');
                } else {
                    showDiagnostic('❌ NETWORK ERROR', 'error');
                    alert('Speech Recognition requires an internet connection to Google servers. Please check your network.');
                }
                stopAction();
            } else if (e.error === 'not-allowed') {
                showDiagnostic('❌ PERMISSION DENIED', 'error');
                alert('Microphone blocked. Please enable it in browser settings.');
                stopAction();
            }
        };

        rec.onend = () => {
            if (isListening) {
                setTimeout(() => { if (isListening) try { rec.start(); } catch (err) { } }, 1000);
            } else {
                updateUI(false);
                showDiagnostic('System Standby');
            }
        };

        return rec;
    }

    async function startAction() {
        if (!isSecure) {
            alert('Security Warning: Voice Assistant works best via http://localhost:5000');
        }
        await initVisualizer();
        if (!recognition) recognition = initSpeechEngine();
        if (!recognition) return;

        // Force language sync with UI before starting
        if (typeof recognition._updateLang === 'function') {
            recognition._updateLang();
        }

        try {
            recognition.start();
        } catch (e) {
            if (e.name !== 'InvalidStateError') console.error(e);
        }
    }

    function stopAction() {
        isListening = false;
        if (recognition) try { recognition.stop(); } catch (e) { }
        if (animationId) cancelAnimationFrame(animationId);
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        updateUI(false);
    }

    function updateUI(active) {
        const container = document.getElementById('voiceAssistantContainer');
        if (active) {
            startBtn?.classList.add('hidden');
            stopBtn?.classList.remove('hidden');
            container?.classList.add('is-listening');
        } else {
            startBtn?.classList.remove('hidden');
            stopBtn?.classList.add('hidden');
            container?.classList.remove('is-listening');
            if (liveDisplay) liveDisplay.textContent = "Click 'Start Voice' to begin...";
        }
    }

    startBtn?.addEventListener('click', startAction);
    stopBtn?.addEventListener('click', stopAction);
    clearBtn?.addEventListener('click', () => {
        if (finalTextarea) finalTextarea.value = '';
        if (liveDisplay) liveDisplay.textContent = "History cleared. Waiting for input...";
        clearSession();
        showDiagnostic('System Reset');
    });

})();
