import { useEffect, useState } from 'react';
import { fetchPatients, voiceIntent } from '../services/api';
import { Mic, MicOff, Globe, Activity } from 'lucide-react';

export default function VoiceAssistant() {
  const PATIENT_STORAGE_KEY = 'asha_selected_patient';
  const [lang, setLang] = useState('en');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients().then((data) => {
      const patientList = data || [];
      setPatients(patientList);
      const storedPatient = localStorage.getItem(PATIENT_STORAGE_KEY);
      if (storedPatient && patientList.find((p) => p.id === storedPatient)) {
        setSelectedPatient(storedPatient);
      } else if (patientList.length) {
        setSelectedPatient(patientList[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      localStorage.setItem(PATIENT_STORAGE_KEY, selectedPatient);
    }
  }, [selectedPatient]);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }
    setError('');
    const rec = new SR();
    rec.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const res = await voiceIntent(text, lang, selectedPatient);
      setResult(res);
      setListening(false);
    };
    rec.onerror = (e) => {
      setError(e.error === 'not-allowed' ? 'Microphone permission denied.' : 'Voice recognition error.');
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 md:p-10 shadow-medical">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-medical-blue-light/10 mb-4">
            <Mic className="h-10 w-10 text-medical-blue-light" />
          </div>
          <h2 className="text-3xl font-bold text-medical-gray-900">Voice Assistant</h2>
          <p className="mt-2 text-medical-gray-600">Multilingual voice navigation and emergency activation.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-medical-gray-600 mb-2">
              <Globe className="inline-block h-3 w-3 mr-1" /> Language
            </label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-4 py-3 text-medical-gray-900 outline-none focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20">
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-medical-gray-600 mb-2">
              Patient Context
            </label>
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-4 py-3 text-medical-gray-900 outline-none focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20">
              {patients.length ? patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.health_id ? ` • ${p.health_id}` : ''}</option>
              )) : <option value="">Select patient...</option>}
            </select>
          </div>
        </div>

        <div className="flex justify-center mb-10">
          <button 
            type="button" 
            onClick={start} 
            className={`flex items-center gap-3 rounded-full px-10 py-4 text-lg font-bold text-white shadow-lg transition ${
              listening 
                ? 'bg-medical-red animate-pulse shadow-medical-red/40 hover:bg-red-600' 
                : 'bg-medical-blue-light shadow-medical-blue-light/40 hover:bg-medical-blue-dark hover:-translate-y-1'
            }`}
          >
            {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            {listening ? 'Listening...' : 'Start Recording'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-medical-red/20 bg-medical-red/10 p-4 text-center text-sm font-medium text-medical-red">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-medical-gray-100 bg-medical-soft-white p-6">
          <p className="text-xs uppercase font-bold tracking-widest text-medical-gray-500 mb-3">Live Transcript</p>
          <div className="min-h-[60px]">
            {transcript ? (
              <p className="text-lg text-medical-gray-900 italic">"{transcript}"</p>
            ) : (
              <p className="text-sm text-medical-gray-400 italic">Say something like "I have a headache" or "Trigger emergency"...</p>
            )}
          </div>
          
          {result && (
            <div className="mt-6 border-t border-medical-gray-200 pt-4">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-medical-blue-light mt-0.5" />
                <div>
                  <p className="text-sm text-medical-gray-600">Detected Intent: <strong className="text-medical-gray-900 uppercase">{result.intent}</strong></p>
                  <p className="mt-1 text-sm text-medical-blue-dark font-medium">{result.action}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
