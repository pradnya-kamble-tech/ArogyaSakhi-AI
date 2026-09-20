import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CaseReport() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const data = location.state; // passed from AssessmentWizard

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-medical-white">
                <div className="text-center">
                    <p className="text-medical-gray-600 mb-4">No case data available.</p>
                    <Link to="/worker" className="text-medical-blue-light underline">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const { patient, symptoms, vitals, result } = data;
    const now = new Date();

    return (
        <div className="min-h-screen bg-medical-white">
            {/* Print-hidden toolbar */}
            <div className="print:hidden bg-medical-soft-white border-b border-medical-gray-200 px-6 py-3 flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="text-sm text-medical-blue-dark font-medium">← Back</button>
                <div className="flex gap-3">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-medical-blue-light text-white rounded-lg text-sm font-bold">
                        🖨️ Print Report
                    </button>
                    <Link to="/worker/refer" state={data} className="px-4 py-2 bg-medical-red text-white rounded-lg text-sm font-bold">
                        📝 Referral Slip
                    </Link>
                </div>
            </div>

            {/* Printable Report Body */}
            <div className="max-w-3xl mx-auto p-8 print:p-4">
                {/* Header */}
                <div className="border-b-2 border-medical-gray-900 pb-4 mb-6">
                    <h1 className="text-3xl font-serif font-bold text-medical-gray-900">ArogyaSakhi Clinical Report</h1>
                    <p className="text-sm text-medical-gray-600 mt-1">Decision support, not a diagnosis</p>
                    <p className="text-xs text-medical-gray-500 mt-2">Generated: {now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
                </div>

                {/* Patient Info */}
                <section className="mb-6">
                    <h2 className="text-lg font-serif font-bold text-medical-gray-900 mb-3 uppercase tracking-wider border-b border-medical-gray-200 pb-1">Patient Information</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div><span className="text-medical-gray-600">Name:</span> <strong>{patient?.name || '—'}</strong></div>
                        <div><span className="text-medical-gray-600">Age:</span> <strong>{patient?.age || '—'}</strong></div>
                        <div><span className="text-medical-gray-600">Sex:</span> <strong>{patient?.sex || '—'}</strong></div>
                        <div><span className="text-medical-gray-600">Village:</span> <strong>{patient?.village || '—'}</strong></div>
                        {patient?.isPregnant && <div className="col-span-2"><span className="text-medical-gray-600">Pregnant:</span> <strong>Yes ({patient?.weeks || '?'} weeks)</strong></div>}
                    </div>
                </section>

                {/* Symptoms */}
                <section className="mb-6">
                    <h2 className="text-lg font-serif font-bold text-medical-gray-900 mb-3 uppercase tracking-wider border-b border-medical-gray-200 pb-1">Presenting Symptoms</h2>
                    <div className="flex flex-wrap gap-2">
                        {symptoms?.map((s, i) => (
                            <span key={i} className="bg-medical-gray-100 border border-medical-gray-200 px-3 py-1 rounded-full text-sm">{s}</span>
                        ))}
                        {(!symptoms || symptoms.length === 0) && <p className="text-medical-gray-500 text-sm">None recorded</p>}
                    </div>
                </section>

                {/* Vitals */}
                <section className="mb-6">
                    <h2 className="text-lg font-serif font-bold text-medical-gray-900 mb-3 uppercase tracking-wider border-b border-medical-gray-200 pb-1">Vitals</h2>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        {vitals?.bp_systolic && <div>BP: <strong>{vitals.bp_systolic}/{vitals.bp_diastolic} mmHg</strong></div>}
                        {vitals?.heart_rate && <div>HR: <strong>{vitals.heart_rate} bpm</strong></div>}
                        {vitals?.temperature && <div>Temp: <strong>{vitals.temperature}°F</strong></div>}
                        {vitals?.spo2 && <div>SpO2: <strong>{vitals.spo2}%</strong></div>}
                        {vitals?.respiratory_rate && <div>RR: <strong>{vitals.respiratory_rate}/min</strong></div>}
                    </div>
                </section>

                {/* AI Assessment */}
                <section className="mb-6">
                    <h2 className="text-lg font-serif font-bold text-medical-gray-900 mb-3 uppercase tracking-wider border-b border-medical-gray-200 pb-1">AI Assessment (Local Engine)</h2>
                    <div className={`p-4 rounded-lg border-2 mb-4 ${result?.category === 'Red' ? 'border-medical-red bg-medical-red/5' :
                            result?.category === 'Amber' ? 'border-medical-amber bg-medical-amber/5' :
                                'border-medical-green bg-medical-green/5'
                        }`}>
                        <p className="font-bold text-lg">{result?.category || 'Unknown'} Risk Level</p>
                        <p className="text-xs opacity-70 mt-1">Score: {result?.risk?.score}/100 | Confidence: {result?.risk?.confidence}%</p>
                    </div>

                    {result?.topConditions?.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-bold text-sm text-medical-gray-700 mb-2">Top Possible Conditions</h3>
                            <ol className="list-decimal pl-5 space-y-1 text-sm">
                                {result.topConditions.map((c, i) => <li key={i}>{c}</li>)}
                            </ol>
                        </div>
                    )}

                    {result?.risk?.reasons?.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-bold text-sm text-medical-gray-700 mb-2">Clinical Drivers</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                {result.risk.reasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    )}

                    {result?.risk?.treatments?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-sm text-medical-gray-700 mb-2">Recommended Actions</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                {result.risk.treatments.map((t, i) => <li key={i}>{t.replace('treatment.', '')}</li>)}
                            </ul>
                        </div>
                    )}
                </section>

                {/* Footer */}
                <div className="border-t-2 border-medical-gray-900 pt-4 mt-8 text-xs text-medical-gray-500">
                    <p>This report is generated by ArogyaSakhi AI Decision Support System. It is intended for healthcare worker guidance only and does not constitute a medical diagnosis. A qualified doctor must review all findings.</p>
                    <p className="mt-2">Worker: {localStorage.getItem('userName') || '—'} | Report ID: {Date.now().toString(36)}</p>
                </div>
            </div>
        </div>
    );
}
