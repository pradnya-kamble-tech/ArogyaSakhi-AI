import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Stethoscope, AlertCircle, Volume2, CheckCircle2,
  XCircle, Info, RefreshCw, Activity, ClipboardList, AlertTriangle, MapPin,
} from 'lucide-react';
import { aiVoiceExtract } from '../services/api';
import DashboardLayout, { NavItem } from '../components/DashboardLayout';

// ─── Deterministic local extractor ────────────────────────────────────────────
// Catches the most common simple patterns so we work offline / without AI key.
const SYMPTOM_KEYWORDS = [
  'fever','cough','cold','headache','vomiting','nausea','diarrhea','fatigue',
  'breathlessness','chest pain','abdominal pain','bleeding','swelling','rash',
  'itching','dizziness','weakness','back pain','joint pain','sore throat',
  'runny nose','constipation','insomnia','palpitations','jaundice','seizure',
  'confusion','blurred vision','reduced fetal movement','convulsions',
];
const DURATION_RE = /(\d+)\s*(day|days|week|weeks|month|months|hour|hours)/i;
const SEVERITY_RE = /\b(mild|moderate|severe|critical)\b/i;

function localExtract(transcript) {
  const lower = transcript.toLowerCase();
  const symptoms = SYMPTOM_KEYWORDS.filter((s) => lower.includes(s));
  const durMatch = DURATION_RE.exec(lower);
  const sevMatch = SEVERITY_RE.exec(lower);
  return {
    symptoms,
    duration: durMatch ? `${durMatch[1]} ${durMatch[2]}` : null,
    severity: sevMatch ? sevMatch[1] : null,
    confidence_score: symptoms.length > 0 ? Math.min(60, 30 + symptoms.length * 10) : 0,
    source: 'local',
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function VoiceAssistant() {
  const [isListening, setIsListening]     = useState(false);
  const [transcript, setTranscript]       = useState('');
  const [extracted, setExtracted]         = useState(null);   // confirmed preview
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [speechSupported]                 = useState(
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // ── Speech recognition ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    setError('');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions and try again.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setTranscript('');
    setExtracted(null);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = () => (isListening ? stopListening() : startListening());

  // ── Extraction ──────────────────────────────────────────────────────────────
  const analyzeTranscript = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError('');
    setExtracted(null);

    // Always run local extraction first so we have a fallback
    const localResult = localExtract(transcript);

    try {
      const res = await aiVoiceExtract({ transcript });
      const ai = res.extracted || {};
      // Merge: AI wins on fields it returned, local fills gaps
      const merged = {
        symptoms: (ai.symptoms?.length > 0 ? ai.symptoms : localResult.symptoms),
        duration: ai.duration || localResult.duration,
        severity: ai.severity || localResult.severity,
        confidence_score: ai.confidence_score ?? localResult.confidence_score,
        source: ai.error ? 'local' : 'ai',
      };
      setExtracted(merged);
    } catch {
      // Backend unreachable or key missing — use local result transparently
      setExtracted({ ...localResult, source: 'local' });
    } finally {
      setLoading(false);
    }
  };

  // ── Apply to wizard ─────────────────────────────────────────────────────────
  const applyUpdates = () => {
    if (!extracted?.symptoms?.length) {
      setError('No symptoms detected. Please speak more clearly or add symptoms manually.');
      return;
    }
    navigate('/worker/assess', {
      state: {
        voiceSymptoms: extracted.symptoms,
        voiceDuration: extracted.duration,
        voiceSeverity: extracted.severity,
      },
    });
  };

  const discard = () => {
    setTranscript('');
    setExtracted(null);
    setError('');
  };

  const nav = (
    <>
      <NavItem to="/worker" icon={Activity} label="Dashboard" />
      <NavItem to="/worker/assess" icon={ClipboardList} label="New Assessment" />
      <NavItem to="/voice-assistant" end icon={Volume2} label="Voice Assistant" />
      <NavItem to="/emergency-sos" icon={AlertTriangle} label="Emergency SOS" />
      <NavItem to="/hospital-finder" icon={MapPin} label="Hospital Finder" />
    </>
  );

  return (
    <DashboardLayout title="Voice Assistant" subtitle="Speak to log symptoms instantly" nav={nav}>
      <div className="max-w-3xl mx-auto mt-8 space-y-6">

        {/* Main card */}
        <div className="bg-medical-white rounded-xl shadow-medical border border-medical-gray-200 p-8 space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-serif text-medical-gray-900">Patient Story Recorder</h2>
            <p className="text-medical-gray-600 text-sm">
              Press the microphone and describe the patient's symptoms in natural language.
              Review the detected information before it is applied to the assessment.
            </p>
          </div>

          {/* Speech not supported fallback */}
          {!speechSupported && (
            <div className="rounded-lg bg-medical-amber/10 border border-medical-amber/20 p-4 flex items-start gap-3 text-medical-amber">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Speech recognition unavailable</p>
                <p className="text-xs mt-1">
                  Your browser does not support the Web Speech API. You can type the transcript
                  manually below and still extract symptoms using the AI.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-medical-red/10 border border-medical-red/20 text-medical-red p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Mic button */}
          {speechSupported && (
            <div className="flex justify-center">
              <button
                onClick={toggleListening}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                className={`p-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                  isListening
                    ? 'bg-medical-red text-white animate-pulse'
                    : 'bg-gradient-to-r from-medical-blue-light to-medical-blue-dark text-white'
                }`}
              >
                {isListening ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
              </button>
            </div>
          )}

          {/* Transcript area — editable so the worker can correct dictation errors */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-medical-gray-500 mb-2">
              Transcript {isListening && <span className="text-medical-red animate-pulse">● Recording</span>}
            </label>
            <textarea
              value={transcript}
              onChange={(e) => { setTranscript(e.target.value); setExtracted(null); }}
              placeholder={speechSupported ? 'Transcript will appear here…' : 'Type or paste the patient description here…'}
              rows={4}
              className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white p-4 text-medical-gray-900 text-sm resize-none outline-none focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
            />
          </div>

          {/* Analyse button */}
          {transcript && !extracted && (
            <button
              onClick={analyzeTranscript}
              disabled={loading || isListening}
              className={`w-full py-4 rounded-lg flex items-center justify-center gap-3 text-base font-bold shadow-md transition-all ${
                loading || isListening
                  ? 'bg-medical-gray-200 text-medical-gray-400 cursor-not-allowed'
                  : 'bg-medical-green text-white hover:bg-green-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-r-transparent rounded-full animate-spin" />
                  Analysing transcript…
                </>
              ) : (
                <>
                  <Stethoscope className="w-5 h-5" />
                  Extract Clinical Information
                </>
              )}
            </button>
          )}
        </div>

        {/* ── Preview / Confirm panel ─────────────────────────────────────── */}
        {extracted && (
          <div className="bg-medical-white rounded-xl shadow-medical border-2 border-medical-blue-light/30 p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif text-medical-gray-900">Detected Clinical Information</h3>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                extracted.source === 'ai'
                  ? 'bg-medical-blue-light/10 text-medical-blue-dark'
                  : 'bg-medical-amber/10 text-medical-amber'
              }`}>
                {extracted.source === 'ai' ? 'AI Extracted' : 'Local Extraction'}
              </span>
            </div>

            {/* Confidence note */}
            <div className="flex items-center gap-2 text-xs text-medical-gray-500 bg-medical-soft-white rounded-lg px-4 py-3 border border-medical-gray-200">
              <Info className="w-4 h-4 flex-shrink-0 text-medical-blue-light" />
              Confidence: {extracted.confidence_score ?? '—'}% · Review before applying.
              Extraction is decision-support only — do not apply without verification.
            </div>

            {/* Symptoms */}
            <div>
              <p className="text-sm font-bold text-medical-gray-700 mb-2">Detected Symptoms</p>
              {extracted.symptoms?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {extracted.symptoms.map((s) => (
                    <span
                      key={s}
                      className="bg-medical-blue-light/10 text-medical-blue-dark px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-medical-blue-light/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-medical-gray-500 italic">No symptoms detected.</p>
              )}
            </div>

            {/* Duration & Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-medical-gray-200 bg-medical-soft-white p-4">
                <p className="text-xs uppercase font-semibold text-medical-gray-500 mb-1">Duration</p>
                <p className="text-sm font-bold text-medical-gray-900">
                  {extracted.duration || <span className="text-medical-gray-400 font-normal italic">Not mentioned</span>}
                </p>
              </div>
              <div className="rounded-lg border border-medical-gray-200 bg-medical-soft-white p-4">
                <p className="text-xs uppercase font-semibold text-medical-gray-500 mb-1">Severity</p>
                <p className="text-sm font-bold text-medical-gray-900 capitalize">
                  {extracted.severity || <span className="text-medical-gray-400 font-normal italic">Not mentioned</span>}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={applyUpdates}
                disabled={!extracted.symptoms?.length}
                className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm shadow-md transition ${
                  extracted.symptoms?.length
                    ? 'bg-medical-green text-white hover:bg-green-700'
                    : 'bg-medical-gray-200 text-medical-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Apply Updates to Assessment
              </button>
              <button
                onClick={discard}
                className="flex-1 py-3 rounded-lg border border-medical-gray-200 flex items-center justify-center gap-2 font-bold text-sm text-medical-gray-700 hover:bg-medical-soft-white transition"
              >
                <XCircle className="w-5 h-5" />
                Discard
              </button>
            </div>

            <button
              onClick={() => { setExtracted(null); analyzeTranscript(); }}
              className="w-full flex items-center justify-center gap-2 text-xs text-medical-blue-light hover:underline"
            >
              <RefreshCw className="w-3 h-3" /> Re-analyse transcript
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
