import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureShell from '../components/FeatureShell';
import { db } from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

// Engine imports
import { evaluateBaseRisk } from '../engine/riskEngine';
import { matchConditions } from '../engine/conditionMatcher';
import { assessMaternal } from '../engine/maternalMl';

export default function AssessmentWizard({ onLogout }) {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const { t } = useTranslation();

    // State for all steps
    const [patient, setPatient] = useState({ id: '', name: '', age: '', sex: '', village: '', isPregnant: false, weeks: '' });
    const [symptoms, setSymptoms] = useState([]);
    const [vitals, setVitals] = useState({ bp_systolic: '', bp_diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '', blood_sugar: '', hb: '' });

    // Results
    const [result, setResult] = useState(null);

    // -- Step 1: Patient --
    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-serif text-medical-gray-900">1. Patient Details</h2>
            <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Name" className="p-3 border rounded-lg" value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })} />
                <input type="number" placeholder="Age" className="p-3 border rounded-lg" value={patient.age} onChange={e => setPatient({ ...patient, age: e.target.value })} />
                <select className="p-3 border rounded-lg" value={patient.sex} onChange={e => setPatient({ ...patient, sex: e.target.value })}>
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
                <input type="text" placeholder="Village" className="p-3 border rounded-lg" value={patient.village} onChange={e => setPatient({ ...patient, village: e.target.value })} />
                {patient.sex === 'Female' && (
                    <div className="col-span-2 flex items-center space-x-4 p-4 bg-medical-soft-white rounded-lg">
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" checked={patient.isPregnant} onChange={e => setPatient({ ...patient, isPregnant: e.target.checked })} />
                            <span>Is Pregnant?</span>
                        </label>
                        {patient.isPregnant && (
                            <input type="number" placeholder="Weeks (e.g. 24)" className="p-2 border rounded max-w-[120px]" value={patient.weeks} onChange={e => setPatient({ ...patient, weeks: e.target.value })} />
                        )}
                    </div>
                )}
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-medical-blue-light text-white p-3 rounded-lg font-bold">Next: Symptoms</button>
        </div>
    );

    // -- Step 2: Symptoms --
    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-serif text-medical-gray-900">2. Symptoms</h2>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search symptom or select..."
                    className="p-3 border rounded-lg flex-1"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                            setSymptoms([...symptoms, e.target.value]);
                            e.target.value = '';
                        }
                    }}
                />
                <button className="bg-medical-gray-200 p-3 rounded-lg">🎤 Mic</button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {symptoms.map(s => (
                    <span key={s} className="bg-medical-blue-light/10 text-medical-blue-dark px-3 py-1 rounded-full flex items-center gap-2">
                        {s} <button onClick={() => setSymptoms(symptoms.filter(x => x !== s))}>x</button>
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                {['Fever', 'Cough', 'Chest Pain', 'Headache', 'Vomiting', 'Diarrhea', 'Bleeding', 'Swelling'].map(s => (
                    <button key={s} onClick={() => setSymptoms([...symptoms, s.toLowerCase()])} className="p-2 border rounded hover:bg-medical-soft-white text-left">
                        + {s}
                    </button>
                ))}
            </div>

            <div className="flex justify-between pt-6">
                <button onClick={() => setStep(1)} className="px-6 py-3 border rounded-lg font-bold">Back</button>
                <button onClick={() => setStep(3)} className="px-6 bg-medical-blue-light text-white py-3 rounded-lg font-bold">Next: Vitals</button>
            </div>
        </div>
    );

    // -- Step 3: Vitals --
    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-serif text-medical-gray-900">3. Vitals</h2>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-medical-gray-600 block mb-1">BP Systolic</label><input type="number" className="w-full p-3 border rounded-lg" value={vitals.bp_systolic} onChange={e => setVitals({ ...vitals, bp_systolic: e.target.value })} /></div>
                <div><label className="text-xs text-medical-gray-600 block mb-1">BP Diastolic</label><input type="number" className="w-full p-3 border rounded-lg" value={vitals.bp_diastolic} onChange={e => setVitals({ ...vitals, bp_diastolic: e.target.value })} /></div>
                <div><label className="text-xs text-medical-gray-600 block mb-1">Heart Rate (BPM)</label><input type="number" className="w-full p-3 border rounded-lg" value={vitals.heart_rate} onChange={e => setVitals({ ...vitals, heart_rate: e.target.value })} /></div>
                <div><label className="text-xs text-medical-gray-600 block mb-1">Temp (F)</label><input type="number" className="w-full p-3 border rounded-lg" value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} /></div>
                <div><label className="text-xs text-medical-gray-600 block mb-1">SpO2 (%)</label><input type="number" className="w-full p-3 border rounded-lg" value={vitals.spO2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} /></div>
                <div><label className="text-xs text-medical-gray-600 block mb-1">Resp Rate</label><input type="number" className="w-full p-3 border rounded-lg" value={vitals.respiratory_rate} onChange={e => setVitals({ ...vitals, respiratory_rate: e.target.value })} /></div>
                <div><label className="text-xs text-medical-gray-600 block mb-1">Blood Sugar (mg/dL)</label><input type="number" className="w-full p-3 border rounded-lg" value={vitals.blood_sugar} onChange={e => setVitals({ ...vitals, blood_sugar: e.target.value })} /></div>
                <div><label className="text-xs text-medical-gray-600 block mb-1">Hb (g/dL)</label><input type="number" className="w-full p-3 border rounded-lg" value={vitals.hb} onChange={e => setVitals({ ...vitals, hb: e.target.value })} /></div>
            </div>

            <div className="flex justify-between pt-6">
                <button onClick={() => setStep(2)} className="px-6 py-3 border rounded-lg font-bold">Back</button>
                <button onClick={handleAnalyze} className="px-6 bg-gradient-to-r from-medical-amber to-orange-500 text-white py-3 rounded-lg font-bold shadow-lg">Run Analysis</button>
            </div>
        </div>
    );

    // -- Analysis Trigger --
    const handleAnalyze = () => {
        // Convert vitals to numbers where possible
        const v = {
            bp_systolic: Number(vitals.bp_systolic) || null,
            bp_diastolic: Number(vitals.bp_diastolic) || null,
            heart_rate: Number(vitals.heart_rate) || null,
            temperature: Number(vitals.temperature) || null,
            spo2: Number(vitals.spo2) || null,
            respiratory_rate: Number(vitals.respiratory_rate) || null
        };

        const risk = evaluateBaseRisk({
            age: Number(patient.age),
            symptoms,
            vitals: v,
            isMaternal: patient.isPregnant
        });
        const matches = matchConditions(symptoms, patient.isPregnant);
        let category = risk.calculatedUrgency === 'critical' ? 'Red' : risk.score > 40 ? 'Amber' : 'Green';
        let finalTopConditions = matches;
        let reasons = [...risk.reasons];

        const ML_DATA = {};
        if (patient.isPregnant) {
            const m_vitals = {
                age: Number(patient.age) || null,
                sbp: v.bp_systolic,
                dbp: v.bp_diastolic,
                bloodSugarMgDl: Number(vitals.blood_sugar) || null,
                tempC: v.temperature ? (v.temperature - 32) * 5 / 9 : null,
                hr: v.heart_rate
            };
            const DANGER_MAP = {
                'bleeding': 'vaginal_bleeding', 'fever': 'fever', 'headache': 'severe_headache',
                'swelling': 'swelling_face_hands', 'convulsions': 'convulsions', 'blurred vision': 'blurred_vision',
                'reduced fetal movement': 'reduced_fetal_movement', 'breathless': 'breathless_at_rest', 'abdominal pain': 'severe_abdominal_pain'
            };
            const dangerSigns = symptoms.map(s => DANGER_MAP[s.toLowerCase()] || s).filter(s => Object.values(DANGER_MAP).includes(s));

            const mlRes = assessMaternal({ vitals: m_vitals, dangerSigns, hb: Number(vitals.hb) || null });

            const LEVEL_ORDER = { Green: 0, Yellow: 1, Amber: 1, Red: 2 };
            const mLevel = mlRes.level === 'Yellow' ? 'Amber' : mlRes.level;
            category = LEVEL_ORDER[mLevel] > LEVEL_ORDER[category] ? mLevel : category;

            reasons = [...reasons, ...mlRes.reasons.map(r => r.text)];
            if (mlRes.insufficientData) {
                reasons.push("Not enough data");
            }
            if (mlRes.ml && mlRes.ml.label) {
                finalTopConditions.push(`AI Suspects: ${mlRes.ml.label} (Conf: ${Math.round(mlRes.ml.confidence * 100)}%)`);
            }
            Object.assign(ML_DATA, { ...mlRes });
        }

        risk.reasons = reasons;
        setResult({
            risk,
            vitals: v,
            topConditions: finalTopConditions,
            category,
            maternalAppdx: patient.isPregnant ? ML_DATA : null
        });

        setStep(4);
    };

    const saveCase = async () => {
        // Encrypt logic goes here for true offline, but here we just place it in dexie queue
        const caseUuid = uuidv4();
        const payload = {
            client_uuid: caseUuid,
            patient_name: patient.name,
            patient_age: patient.age,
            symptoms,
            vitals,
            engine_output: result
        };

        // Using simple pseudo-encryption for the sake of fast demo. 
        // Usually we would await encryptData(sessionCryptoKey, payload) 
        await db.cases.put({ client_uuid: caseUuid, status: 'pending', payload: JSON.stringify(payload) });
        await db.syncQueue.put({ client_uuid: caseUuid, endpoint: '/sync/cases', status: 'pending' });

        alert('Case saved to offline queue!');
        navigate('/worker');
    };

    // -- Step 4: Results --
    const renderStep4 = () => {
        if (!result) return null;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl font-serif text-medical-gray-900">Analysis Result</h2>
                <div className={`p-6 rounded-xl border-2 ${result.category === 'Red' ? 'border-medical-red bg-medical-red/10' :
                    result.category === 'Amber' ? 'border-medical-amber bg-medical-amber/10' :
                        'border-medical-green bg-medical-green/10'
                    }`}>
                    <h3 className={`text-xl font-bold uppercase tracking-widest ${result.category === 'Red' ? 'text-medical-red' :
                        result.category === 'Amber' ? 'text-medical-amber' :
                            'text-medical-green'
                        }`}>{result.category} Escalation</h3>
                    <p className="text-sm font-semibold opacity-80 mt-2">Decision support, not a diagnosis.</p>
                </div>

                <div>
                    <h4 className="font-bold text-gray-700">Top Possible Conditions</h4>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        {result.topConditions.map(c => <li key={c} className="text-medical-gray-900">{c}</li>)}
                        {result.topConditions.length === 0 && <li className="text-medical-gray-500">Unspecified</li>}
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-gray-700">Clinical Drivers</h4>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        {result.risk.reasons.map((r, i) => <li key={i} className="text-red-700">{r}</li>)}
                        {result.risk.reasons.length === 0 && <li className="text-medical-gray-500">Routine checks</li>}
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-gray-700">Recommended Actions</h4>
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {result.risk.treatments.map((t, i) => (
                            <span key={i} className="bg-medical-soft-white border border-gray-300 px-3 py-1 rounded text-sm">{t.replace('treatment.', '')}</span>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-6 flex-wrap">
                    <button onClick={saveCase} className="flex-1 px-4 py-3 bg-medical-blue-light text-white rounded-lg font-bold">Save Case</button>
                    <button onClick={() => navigate('/worker/report', { state: { patient, symptoms, vitals, result } })} className="flex-1 px-4 py-3 bg-medical-gray-900 text-white rounded-lg font-bold">Generate Report</button>

                    {(result.category === 'Red' || result.category === 'Amber') && (
                        <button onClick={() => navigate('/worker/refer', { state: { patient, symptoms, result } })} className="flex-1 px-4 py-3 bg-medical-red text-white rounded-lg font-bold">Refer Now</button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <FeatureShell onLogout={onLogout}>
            <div className="max-w-2xl mx-auto py-10">
                {/* Simple Stepper indicator */}
                <div className="flex justify-between mb-8 opacity-50 text-sm font-bold tracking-widest">
                    <span className={step >= 1 ? 'text-medical-blue-dark' : ''}>1. PATIENT</span>
                    <span className={step >= 2 ? 'text-medical-blue-dark' : ''}>2. SYMPTOMS</span>
                    <span className={step >= 3 ? 'text-medical-blue-dark' : ''}>3. VITALS</span>
                    <span className={step >= 4 ? 'text-medical-blue-dark' : ''}>4. RESULT</span>
                </div>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </div>
        </FeatureShell>
    );
}
