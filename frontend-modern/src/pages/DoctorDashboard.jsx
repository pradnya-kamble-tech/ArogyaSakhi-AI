import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, BarChart3, ClipboardList, Users, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, FileText, Brain, Loader } from 'lucide-react';
import DashboardLayout, { NavItem } from '../components/DashboardLayout';
import {
  fetchAlerts, fetchDashboard, alertAction, fetchCases, reviewCase,
  requestConsultation, fetchConsultationQueue, reviewConsultation,
  aiExplain, aiHandover, aiDifferential,
} from '../services/api';
import { wsAlertsUrl } from '../services/api';

export default function DoctorDashboard({ onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [error, setError] = useState('');
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  const [expandedConsultation, setExpandedConsultation] = useState(null);

  const load = () => {
    fetchDashboard().then(setAnalytics).catch((e) => setError(e.message));
    fetchAlerts().then(data => {
      const sorted = (data || []).sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1));
      setAlerts(sorted);
    }).catch(() => { });
    fetchCases().then(data => {
      const riskScore = { 'CRITICAL': 4, 'HIGH': 3, 'Red': 3, 'MEDIUM': 2, 'Amber': 2, 'Yellow': 2, 'NORMAL': 1, 'Green': 1 };
      const sorted = (data.cases || []).sort((a, b) =>
        (riskScore[b.priority] || riskScore[b.risk_level] || 0) -
        (riskScore[a.priority] || riskScore[a.risk_level] || 0)
      );
      setCases(sorted);
    }).catch(() => { });
    fetchConsultationQueue().then(data => {
      const pScore = { 'CRITICAL': 3, 'HIGH': 2, 'ROUTINE': 1 };
      const sorted = (data.consultations || []).sort((a, b) => (pScore[b.priority] || 0) - (pScore[a.priority] || 0));
      setConsultations(sorted);
    }).catch(() => { });
  };

  const handleAlertAction = async (alertId, action, extra = {}) => {
    try {
      await alertAction(alertId, { action, ...extra });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleReviewAction = async (caseId, status, payload = {}) => {
    try {
      await reviewCase(caseId, { status, ...payload });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleConsultationResponse = async (id, status, payload = {}) => {
    try {
      await reviewConsultation(id, { status, ...payload });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateConsultation = async (caseId, reason) => {
    if (!reason) return;
    try {
      await requestConsultation(caseId, { reason, priority: 'HIGH', handover_note: { message: 'Doctor dispatch' } });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  // ── AI helpers ──────────────────────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState({});   // keyed by "type:id"
  const [aiResults, setAiResults] = useState({});   // keyed by "type:id"

  const runAI = async (type, id, caseData) => {
    const key = `${type}:${id}`;
    setAiLoading((prev) => ({ ...prev, [key]: true }));
    setAiResults((prev) => ({ ...prev, [key]: null }));
    try {
      let res;
      if (type === 'explain')    res = await aiExplain({ case_data: caseData });
      if (type === 'handover')   res = await aiHandover({ case_data: caseData });
      if (type === 'differential') res = await aiDifferential({ case_data: caseData });
      setAiResults((prev) => ({ ...prev, [key]: res }));
    } catch (e) {
      setAiResults((prev) => ({ ...prev, [key]: { error: true, message: e.message } }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const buildCaseData = (c) => ({
    patient_name: c.patient_name,
    patient_age: c.patient_age,
    symptoms: c.inputs?.symptoms || [],
    vitals: c.inputs?.vitals || {},
    risk_level: c.risk_level,
    escalation: c.escalation,
    engine_output: c.engine_output,
    doctor_notes: c.doctor_notes,
  });

  useEffect(() => {
    load();
    const ws = new WebSocket(wsAlertsUrl());
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'emergency' || msg.type === 'sos') load();
      } catch (_) { /* ignore */ }
    };
    return () => ws.close();
  }, []);

  const chartData = analytics
    ? [
      { name: 'High Risk', value: analytics.highRiskCount || 0 },
      { name: 'Medium', value: analytics.mediumRiskCount || 0 },
      { name: 'Low Risk', value: analytics.lowRiskCount || 0 }
    ]
    : [];

  const nav = (
    <>
      <NavItem to="/doctor" end icon={AlertTriangle} label="Emergency Center" />
      <NavItem to="/ai-analytics" icon={BarChart3} label="AI Analytics" />
      <NavItem to="/ai-reports" icon={ClipboardList} label="Reports" />
    </>
  );

  return (
    <DashboardLayout title="Emergency Response Center" subtitle="Real-time patient monitoring" nav={nav} onLogout={onLogout}>
      {error && <div className="mb-6 rounded-lg bg-medical-red/10 border border-medical-red/20 p-4 text-medical-red">{error}</div>}

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="rounded-lg bg-gradient-to-br from-medical-red to-red-600 p-6 text-white shadow-medical">
          <AlertTriangle className="h-8 w-8 mb-3 text-white/80" />
          <p className="text-sm font-medium text-white/90">Critical Cases</p>
          <p className="mt-3 text-4xl font-bold">{analytics?.criticalCases ?? 0}</p>
          <p className="mt-2 text-xs text-white/70">Awaiting response</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-medical-amber to-amber-600 p-6 text-white shadow-medical">
          <Clock className="h-8 w-8 mb-3 text-white/80" />
          <p className="text-sm font-medium text-white/90">Pending Reviews</p>
          <p className="mt-3 text-4xl font-bold">{analytics?.pendingReviews ?? 0}</p>
          <p className="mt-2 text-xs text-white/70">Requires attention</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-medical-green to-green-600 p-6 text-white shadow-medical">
          <CheckCircle2 className="h-8 w-8 mb-3 text-white/80" />
          <p className="text-sm font-medium text-white/90">Resolved Today</p>
          <p className="mt-3 text-4xl font-bold">{analytics?.closedCasesToday ?? 0}</p>
          <p className="mt-2 text-xs text-white/70">Successfully handled</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Emergency Alerts - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-medical-red" />
            <h2 className="text-xl text-medical-gray-900 font-serif">Live Emergency Alerts</h2>
            {alerts.some(a => a.status === 'open') && (
              <span className="ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-red/10 text-xs font-semibold text-medical-red">
                <span className="h-2 w-2 animated bg-medical-red rounded-full" />
                {alerts.filter(a => a.status === 'open').length} Active
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {alerts.map((a) => (
              <div key={a.id}>
                <div
                  className={`rounded-lg border-l-4 p-5 transition cursor-pointer ${a.status === 'open'
                    ? 'border-l-medical-red bg-medical-red/5 border border-medical-red/20'
                    : a.status === 'accepted'
                      ? 'border-l-medical-amber bg-medical-amber/5 border border-medical-amber/20'
                      : 'border-l-medical-green bg-medical-green/5 border border-medical-green/20'
                    }`}
                  onClick={() => setExpandedAlert(expandedAlert === a.id ? null : a.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-medical-gray-900">{a.patient?.name || a.message || 'Emergency Alert'}</p>
                      <p className="mt-1 text-sm text-medical-gray-600">
                        {a.patient && (
                          <>
                            <span className="font-medium">ID:</span> {a.patient.health_id || a.patient.id}
                            {a.patient.age && <> · <span className="font-medium">Age:</span> {a.patient.age}y</>}
                            {a.patient.gender && <> · <span className="font-medium">Gender:</span> {a.patient.gender}</>}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${a.status === 'open' ? 'bg-medical-red/20 text-medical-red' :
                        a.status === 'accepted' ? 'bg-medical-amber/20 text-medical-amber' :
                          'bg-medical-green/20 text-medical-green'
                        }`}>
                        {a.status?.toUpperCase()}
                      </span>
                      {expandedAlert === a.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-medical-gray-700">{a.message}</p>
                </div>

                {/* Expanded Alert Details */}
                {expandedAlert === a.id && (
                  <div className="mt-2 rounded-lg bg-medical-soft-white border border-medical-gray-300 p-4 space-y-4">
                    {/* AI Predictions */}
                    {a.ai_predictions && a.ai_predictions.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-medical-gray-900 mb-2">AI Analysis</p>
                        <div className="space-y-2">
                          {a.ai_predictions.map((pred, i) => (
                            <div key={i} className="rounded-lg bg-medical-white p-3 border border-medical-blue-light/30">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <p className="text-xs font-semibold text-medical-gray-600 uppercase tracking-wider">{pred.model_type}</p>
                                  <p className="text-sm font-medium text-medical-gray-900 mt-1">{pred.probable_condition}</p>
                                  <p className="text-xs text-medical-gray-600 mt-1">Score: {(pred.risk_score * 100).toFixed(1)}%</p>
                                </div>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${pred.risk_level === 'Red' ? 'bg-medical-red/20 text-medical-red' :
                                  pred.risk_level === 'Yellow' ? 'bg-medical-amber/20 text-medical-amber' :
                                    'bg-medical-green/20 text-medical-green'
                                  }`}>
                                  {pred.risk_level}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Images */}
                    {a.uploaded_images && a.uploaded_images.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-medical-gray-900 mb-2">Medical Images ({a.uploaded_images.length})</p>
                        <div className="flex gap-2 flex-wrap">
                          {a.uploaded_images.map((img, i) => (
                            <div key={i} className="rounded-lg bg-medical-white p-2 border border-medical-gray-300 text-center">
                              <div className="text-2xl mb-1">📷</div>
                              <p className="text-xs text-medical-gray-600">{img.image_type}</p>
                              {img.confidence && <p className="text-xs text-medical-blue-light font-bold">{(img.confidence * 100).toFixed(0)}%</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {a.status === 'open' && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-medical-gray-300">
                        <button
                          onClick={() => handleAlertAction(a.id, 'accept')}
                          className="rounded-lg bg-medical-green text-white px-4 py-2 text-sm font-medium hover:bg-green-700 transition shadow-sm"
                        >
                          ✓ Accept & Review
                        </button>
                        <button
                          onClick={() => handleAlertAction(a.id, 'reject')}
                          className="rounded-lg bg-medical-red text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition shadow-sm"
                        >
                          ✕ Decline
                        </button>
                      </div>
                    )}

                    {a.status === 'accepted' && (
                      <div className="pt-3 border-t border-medical-gray-300 space-y-3">
                        <p className="text-sm font-bold text-medical-gray-900">Prescription / Orders</p>
                        <textarea
                          placeholder="Type medication or orders here..."
                          className="w-full rounded-lg border border-medical-gray-300 p-2 text-sm outline-none focus:border-medical-blue-light"
                          rows="3"
                          id={`rx-${a.id}`}
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById(`rx-${a.id}`)?.value;
                            handleAlertAction(a.id, 'prescribe', { notes: val });
                          }}
                          className="rounded-lg bg-medical-blue-light text-white px-4 py-2 text-sm font-medium hover:bg-medical-blue-dark transition shadow-sm"
                        >
                          Submit Prescription
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {!alerts.length && (
              <div className="rounded-lg bg-medical-soft-white border border-medical-gray-300 p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-medical-green mx-auto mb-3 opacity-50" />
                <p className="font-medium text-medical-gray-900">All clear</p>
                <p className="text-sm text-medical-gray-600">No active emergency alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Decision Support Cases */}
        <div className="lg:col-span-2 rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical md:-mt-6">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardList className="h-6 w-6 text-medical-blue-dark" />
            <h2 className="text-xl text-medical-gray-900 font-serif">Assessment Reviews</h2>
            {cases.filter(c => c.status === 'pending_review').length > 0 && (
              <span className="ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-amber/10 text-xs font-semibold text-medical-amber">
                {cases.filter(c => c.status === 'pending_review').length} Pending
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {cases.map(c => (
              <div key={c.client_uuid}>
                <div
                  className="rounded-lg border-l-4 border-l-medical-blue-dark bg-medical-blue-light/5 border border-medical-blue-light/20 p-5 cursor-pointer transition"
                  onClick={() => setExpandedCase(expandedCase === c.client_uuid ? null : c.client_uuid)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-medical-gray-900">{c.patient_name || 'Patient'}</p>
                      <p className="mt-1 text-sm text-medical-gray-600">
                        Age: {c.patient_age}y · Base Risk: <strong className={c.risk_level === 'Red' ? 'text-medical-red' : c.risk_level === 'Amber' ? 'text-medical-amber' : 'text-medical-green'}>{c.risk_level}</strong>
                        {c.priority && c.priority !== 'NORMAL' && (
                          <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                            c.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                            c.priority === 'HIGH' ? 'bg-medical-red/20 text-medical-red' :
                            'bg-medical-amber/20 text-medical-amber'
                          }`}>{c.priority}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-block px-3 py-1 rounded-full bg-medical-gray-200 text-xs font-semibold uppercase">{c.status.replace('_', ' ')}</span>
                      {expandedCase === c.client_uuid ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {expandedCase === c.client_uuid && (
                  <div className="mt-2 rounded-lg bg-medical-soft-white border border-medical-gray-300 p-4 space-y-4 text-sm">
                    {c.engine_output?.topConditions && c.engine_output.topConditions.length > 0 && (
                      <div>
                        <span className="font-bold">AI Suspected:</span> {c.engine_output.topConditions.join(', ')}
                      </div>
                    )}
                    <div>
                      <span className="font-bold">Symptoms: </span> {c.inputs?.symptoms?.join(', ') || 'None'}
                    </div>

                    {/* ── AI Tools panel ─────────────────────────────────────── */}
                    <div className="border-t border-medical-gray-200 pt-3 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-medical-gray-500">AI Decision Support</p>
                      <p className="text-xs text-medical-gray-400 italic">
                        AI outputs are decision-support only — not a confirmed diagnosis. All findings must be verified clinically.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { type: 'explain',     label: 'Explain Decision',  icon: <Brain className="h-3 w-3" /> },
                          { type: 'handover',    label: 'Handover Note',     icon: <FileText className="h-3 w-3" /> },
                          { type: 'differential',label: 'Differential',       icon: <ClipboardList className="h-3 w-3" /> },
                        ].map(({ type, label, icon }) => {
                          const key = `${type}:${c.client_uuid}`;
                          const isLoading = aiLoading[key];
                          return (
                            <button
                              key={type}
                              onClick={() => runAI(type, c.client_uuid, buildCaseData(c))}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-medical-blue-light/30 bg-medical-blue-light/5 text-medical-blue-dark text-xs font-medium hover:bg-medical-blue-light/15 transition disabled:opacity-50"
                            >
                              {isLoading ? <Loader className="h-3 w-3 animate-spin" /> : icon}
                              {isLoading ? 'Loading…' : label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explain result */}
                      {aiResults[`explain:${c.client_uuid}`] && (
                        <AiResultPanel
                          title="AI Decision Explanation"
                          result={aiResults[`explain:${c.client_uuid}`]?.explanation}
                        />
                      )}
                      {/* Handover note result */}
                      {aiResults[`handover:${c.client_uuid}`] && (
                        <AiResultPanel
                          title="AI Handover Note (editable)"
                          result={aiResults[`handover:${c.client_uuid}`]?.note}
                          editable
                        />
                      )}
                      {/* Differential result */}
                      {aiResults[`differential:${c.client_uuid}`] && (
                        <AiDifferentialPanel
                          result={aiResults[`differential:${c.client_uuid}`]?.differential}
                        />
                      )}
                    </div>

                    {c.status === 'pending_review' && (
                      <div className="pt-3 border-t border-medical-gray-300 space-y-2">
                        <textarea
                          placeholder="Doctor Notes / Final Diagnosis"
                          className="w-full rounded border p-2"
                          id={`cx-${c.client_uuid}`}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleReviewAction(c.client_uuid, 'validated', { doctor_notes: document.getElementById(`cx-${c.client_uuid}`).value })} className="px-3 py-2 bg-medical-green text-white rounded font-medium shadow">Validate</button>
                          <button onClick={() => handleReviewAction(c.client_uuid, 'referred', { doctor_notes: document.getElementById(`cx-${c.client_uuid}`).value })} className="px-3 py-2 bg-medical-red text-white rounded font-medium shadow">Refer Patient</button>
                          <button onClick={() => handleCreateConsultation(c.client_uuid, document.getElementById(`cx-${c.client_uuid}`).value || 'Second Opinion Required')} className="px-3 py-2 bg-medical-amber text-white rounded font-medium shadow">Second Opinion</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-10 mb-6">
            <Users className="h-6 w-6 text-medical-amber" />
            <h2 className="text-xl text-medical-gray-900 font-serif">Second Opinion Requests</h2>
            {consultations.filter(c => c.status === 'PENDING').length > 0 && (
              <span className="ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-amber/10 text-xs font-semibold text-medical-amber">
                {consultations.filter(c => c.status === 'PENDING').length} Requests
              </span>
            )}
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto pb-4">
            {consultations.map(c => (
              <div key={c.id}>
                <div
                  className="rounded-lg border-l-4 border-l-medical-amber bg-medical-amber/5 border border-medical-amber/20 p-5 cursor-pointer transition"
                  onClick={() => setExpandedConsultation(expandedConsultation === c.id ? null : c.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-medical-gray-900">Dr. Requested Opinion ({c.priority})</p>
                      <p className="mt-1 text-sm text-medical-gray-600">Case ID: {c.case_id} · Reason: {c.reason}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-block px-3 py-1 rounded-full bg-medical-gray-200 text-xs font-semibold uppercase">{c.status}</span>
                      {expandedConsultation === c.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {expandedConsultation === c.id && (
                  <div className="mt-2 rounded-lg bg-medical-soft-white border border-medical-gray-300 p-4 space-y-4 text-sm">
                    {c.handover_note && (
                      <div>
                        <span className="font-bold block mb-1">AI Handover Note:</span>
                        <pre className="text-xs bg-medical-white p-3 border rounded overflow-x-auto whitespace-pre-wrap font-sans">
                          {JSON.stringify(c.handover_note, null, 2)}
                        </pre>
                      </div>
                    )}

                    {c.status === 'PENDING' && (
                      <div className="pt-3 border-t border-medical-gray-300 space-y-2">
                        <textarea
                          placeholder="Your Specialist Response..."
                          className="w-full rounded border p-2"
                          id={`cons-${c.id}`}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleConsultationResponse(c.id, 'RESOLVED', { specialist_response: document.getElementById(`cons-${c.id}`).value })} className="px-3 py-2 bg-medical-green text-white rounded">Mark Resolved</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Risk Distribution Chart */}
          <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
            <h3 className="text-lg text-medical-gray-900 mb-4 font-serif">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-medical-gray-600">Total Patients</p>
              <p className="text-xl font-bold text-medical-gray-900">{analytics?.totalPatients ?? 0}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-medical-gray-600">Active Cases</p>
              <p className="text-xl font-bold text-medical-amber">{analytics?.totalCases ?? 0}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-medical-gray-600">Response Rate</p>
              <p className="text-xl font-bold text-medical-green">{analytics?.responseRate ?? 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


// ─── AI result display sub-components ────────────────────────────────────────
function AiResultPanel({ title, result, editable = false }) {
  const [editContent, setEditContent] = React.useState('');
  React.useEffect(() => {
    if (result) setEditContent(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  }, [result]);
  if (!result) return null;
  if (result.error) return (
    <div className="rounded-lg bg-medical-red/10 border border-medical-red/20 p-3 text-xs text-medical-red">
      AI unavailable: {result.message}
    </div>
  );
  return (
    <div className="rounded-lg bg-medical-white border border-medical-blue-light/20 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-bold text-medical-blue-dark uppercase tracking-wider">{title}</p>
        <span className="text-xs bg-medical-amber/10 text-medical-amber px-2 py-0.5 rounded-full font-medium">Decision support only</span>
      </div>
      {editable ? (
        <textarea
          className="w-full text-xs font-mono bg-medical-soft-white border border-medical-gray-200 rounded p-3 resize-y min-h-[120px] outline-none focus:border-medical-blue-light"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
        />
      ) : (
        <div className="text-xs space-y-1">
          {result.summary && <p><strong>Summary:</strong> {result.summary}</p>}
          {result.patient_summary && <p><strong>Patient:</strong> {result.patient_summary}</p>}
          {result.risk_explanation && <p><strong>Risk:</strong> {result.risk_explanation}</p>}
          {result.reason_for_escalation && <p><strong>Escalation:</strong> {result.reason_for_escalation}</p>}
          {result.recommended_urgency && <p><strong>Urgency:</strong> {result.recommended_urgency}</p>}
          {result.red_flags?.length > 0 && <p><strong>Red flags:</strong> {result.red_flags.join(', ')}</p>}
          {result.key_factors?.length > 0 && (
            <div><strong>Key factors:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                {result.key_factors.map((f, i) => <li key={i}>{f.factor}: {f.finding} — {f.clinical_relevance}</li>)}
              </ul>
            </div>
          )}
          {result.uncertainties?.length > 0 && (
            <p className="text-medical-amber"><strong>Uncertainties:</strong> {result.uncertainties.join('; ')}</p>
          )}
          {!result.summary && !result.patient_summary && (
            <pre className="whitespace-pre-wrap text-medical-gray-600 overflow-x-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function AiDifferentialPanel({ result }) {
  if (!result) return null;
  if (result.error) return (
    <div className="rounded-lg bg-medical-red/10 border border-medical-red/20 p-3 text-xs text-medical-red">
      AI unavailable: {result.message}
    </div>
  );
  const conditions = result.possible_conditions || [];
  return (
    <div className="rounded-lg bg-medical-white border border-medical-blue-light/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-bold text-medical-blue-dark uppercase tracking-wider">
          AI Differential — Possible Conditions
        </p>
        <span className="text-xs bg-medical-red/10 text-medical-red px-2 py-0.5 rounded-full font-medium">
          Not a diagnosis
        </span>
      </div>
      <p className="text-xs text-medical-gray-500 italic">
        {result.disclaimer || 'Decision support only — not a diagnosis'}
      </p>
      {conditions.length === 0 && <p className="text-xs text-medical-gray-500">No conditions returned.</p>}
      {conditions.map((cond, i) => (
        <div key={i} className="border-l-4 border-medical-blue-light/40 pl-3 space-y-1 text-xs">
          <p className="font-bold text-medical-gray-900">{cond.condition}</p>
          {cond.supporting_findings?.length > 0 && (
            <p><span className="font-semibold text-medical-green">Supporting:</span> {cond.supporting_findings.join(', ')}</p>
          )}
          {cond.missing_or_contradictory_findings?.length > 0 && (
            <p><span className="font-semibold text-medical-amber">Missing/contradictory:</span> {cond.missing_or_contradictory_findings.join(', ')}</p>
          )}
          {cond.uncertainty && <p className="text-medical-gray-500">Uncertainty: {cond.uncertainty}</p>}
          {cond.suggested_verification && (
            <p><span className="font-semibold">Verify:</span> {cond.suggested_verification}</p>
          )}
        </div>
      ))}
    </div>
  );
}
