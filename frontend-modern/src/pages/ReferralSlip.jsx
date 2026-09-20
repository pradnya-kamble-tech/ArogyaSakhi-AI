import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const FACILITIES = [
    { name: 'Primary Health Centre, Wadgaon', type: 'PHC', tel: '+919876543210', distance: '3 km' },
    { name: 'Rural Hospital, Ambegaon', type: 'RH', tel: '+919876543211', distance: '8 km' },
    { name: 'Sub-District Hospital, Junnar', type: 'SDH', tel: '+919876543212', distance: '15 km' },
    { name: 'District Hospital, Pune', type: 'DH', tel: '+919876543213', distance: '45 km' },
    { name: 'Sassoon General Hospital, Pune', type: 'Tertiary', tel: '+919876543214', distance: '50 km' },
];

export default function ReferralSlip() {
    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state;

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-medical-white">
                <div className="text-center">
                    <p className="text-medical-gray-600 mb-4">No case data for referral.</p>
                    <Link to="/worker" className="text-medical-blue-light underline">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const { patient, symptoms, result } = data;
    const now = new Date();

    return (
        <div className="min-h-screen bg-medical-white">
            {/* Print-hidden toolbar */}
            <div className="print:hidden bg-medical-soft-white border-b border-medical-gray-200 px-6 py-3 flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="text-sm text-medical-blue-dark font-medium">← Back</button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-medical-blue-light text-white rounded-lg text-sm font-bold">
                    🖨️ Print Slip
                </button>
            </div>

            <div className="max-w-2xl mx-auto p-8 print:p-4">
                {/* Header */}
                <div className="text-center border-b-2 border-medical-gray-900 pb-4 mb-6">
                    <h1 className="text-2xl font-serif font-bold text-medical-gray-900 uppercase tracking-widest">Referral Slip</h1>
                    <p className="text-sm text-medical-gray-600 mt-1">ArogyaSakhi Health Worker Referral</p>
                    <p className="text-xs text-medical-gray-500 mt-2">Date: {now.toLocaleDateString()} | Time: {now.toLocaleTimeString()}</p>
                </div>

                {/* Patient */}
                <section className="mb-6 bg-medical-soft-white p-4 rounded-lg">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-medical-gray-700 mb-2">Patient</h2>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Name: <strong>{patient?.name || '—'}</strong></div>
                        <div>Age/Sex: <strong>{patient?.age || '—'} / {patient?.sex || '—'}</strong></div>
                        <div>Village: <strong>{patient?.village || '—'}</strong></div>
                        {patient?.isPregnant && <div>Pregnant: <strong>Yes ({patient?.weeks}w)</strong></div>}
                    </div>
                </section>

                {/* Reason for Referral */}
                <section className="mb-6">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-medical-gray-700 mb-2">Reason for Referral</h2>
                    <div className={`p-3 rounded-lg border ${result?.category === 'Red' ? 'border-medical-red bg-medical-red/5 text-medical-red' :
                            'border-medical-amber bg-medical-amber/5 text-medical-amber'
                        }`}>
                        <p className="font-bold">{result?.category} Risk — Escalation Required</p>
                    </div>
                    <div className="mt-3 text-sm">
                        <p className="font-medium text-medical-gray-700">Presenting symptoms:</p>
                        <p className="text-medical-gray-900">{symptoms?.join(', ') || 'None recorded'}</p>
                    </div>
                    {result?.topConditions?.length > 0 && (
                        <div className="mt-2 text-sm">
                            <p className="font-medium text-medical-gray-700">Suspected conditions:</p>
                            <p className="text-medical-gray-900">{result.topConditions.join(', ')}</p>
                        </div>
                    )}
                </section>

                {/* Facility Selection */}
                <section className="mb-6">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-medical-gray-700 mb-3">Refer To (select facility)</h2>
                    <div className="space-y-2">
                        {FACILITIES.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-medical-gray-200 hover:bg-medical-soft-white transition">
                                <div>
                                    <p className="font-bold text-sm text-medical-gray-900">{f.name}</p>
                                    <p className="text-xs text-medical-gray-500">{f.type} · {f.distance}</p>
                                </div>
                                <a href={`tel:${f.tel}`} className="px-3 py-1 bg-medical-green text-white rounded-full text-xs font-bold">
                                    📞 Call
                                </a>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Signature */}
                <section className="border-t-2 border-medical-gray-900 pt-4 mt-6">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs text-medical-gray-500 mb-8">Referring Health Worker</p>
                            <div className="border-b border-medical-gray-400 mb-1"></div>
                            <p className="text-sm font-medium">{localStorage.getItem('userName') || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-medical-gray-500 mb-8">Receiving Doctor</p>
                            <div className="border-b border-medical-gray-400 mb-1"></div>
                            <p className="text-sm text-medical-gray-500">Signature</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
