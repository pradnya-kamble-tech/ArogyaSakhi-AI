import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, BarChart3, ClipboardList, Users, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardLayout, { NavItem } from '../components/DashboardLayout';
import { fetchAlerts, fetchDashboard, alertAction } from '../services/api';
import { wsAlertsUrl } from '../services/api';

export default function DoctorDashboard({ onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [expandedAlert, setExpandedAlert] = useState(null);

  const load = () => {
    fetchDashboard().then(setAnalytics).catch((e) => setError(e.message));
    fetchAlerts().then(setAlerts).catch(() => {});
  };

  const handleAlertAction = async (alertId, action) => {
    try {
      await alertAction(alertId, { action });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

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
                  className={`rounded-lg border-l-4 p-5 transition cursor-pointer ${
                    a.status === 'open' 
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
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        a.status === 'open' ? 'bg-medical-red/20 text-medical-red' :
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
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                                  pred.risk_level === 'Red' ? 'bg-medical-red/20 text-medical-red' :
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

