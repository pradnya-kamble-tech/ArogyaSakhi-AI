import { useEffect, useState } from 'react';
import { Calendar, FileText, Heart, AlertCircle, CheckCircle2, TrendingUp, Activity, Upload } from 'lucide-react';
import DashboardLayout, { NavItem } from '../components/DashboardLayout';
import { fetchDashboard, fetchPatientMe } from '../services/api';

export default function PatientDashboard({ onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboard().then(setAnalytics),
      fetchPatientMe().then(setPatient)
    ]).finally(() => setLoading(false));
  }, []);

  const nav = (
    <>
      <NavItem to="/patient" end icon={Heart} label="Health Overview" />
      <NavItem to="/image-upload" icon={Upload} label="Image Diagnosis" />
      <NavItem to="/emergency-sos" icon={AlertCircle} label="Emergency SOS" />
      <NavItem to="/ai-reports" icon={FileText} label="Reports" />
      <NavItem to="/symptom-checker" icon={Activity} label="Symptom Checker" />
    </>
  );

  const getRiskColor = (level) => {
    const colors = {
      'Green': { bg: 'bg-medical-green/10', border: 'border-medical-green/30', text: 'text-medical-green', badge: 'bg-medical-green/20 text-medical-green' },
      'Yellow': { bg: 'bg-medical-amber/10', border: 'border-medical-amber/30', text: 'text-medical-amber', badge: 'bg-medical-amber/20 text-medical-amber' },
      'Red': { bg: 'bg-medical-red/10', border: 'border-medical-red/30', text: 'text-medical-red', badge: 'bg-medical-red/20 text-medical-red' }
    };
    return colors[level] || colors['Green'];
  };

  const riskLevel = patient?.risk_level || 'Green';
  const riskColor = getRiskColor(riskLevel);

  return (
    <DashboardLayout title="My Health" subtitle="Personal health dashboard" nav={nav} onLogout={onLogout}>
      <div className="space-y-8">
        {/* Health Score Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Health Score Card */}
          <div className="rounded-lg bg-gradient-to-br from-medical-blue-light to-medical-blue-dark p-6 text-white shadow-medical">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Health Score</p>
                <p className="mt-3 text-4xl font-bold">{analytics?.patientHealthScore ?? 72}%</p>
                <p className="mt-2 text-xs text-white/70">Overall wellness</p>
              </div>
              <TrendingUp className="h-12 w-12 text-white/30" />
            </div>
          </div>

          {/* Risk Level Card */}
          <div className={`rounded-lg border-2 p-6 shadow-medical ${riskColor.bg} ${riskColor.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${riskColor.text}`}>Risk Level</p>
                <p className={`mt-3 text-4xl font-bold ${riskColor.text}`}>{riskLevel}</p>
                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${riskColor.badge}`}>
                  {riskLevel === 'Green' ? '✓ Healthy' : riskLevel === 'Yellow' ? '⚠ Monitor' : '🚨 Alert'}
                </div>
              </div>
              {riskLevel === 'Green' && <CheckCircle2 className={`h-12 w-12 ${riskColor.text}`} />}
              {riskLevel === 'Yellow' && <AlertCircle className={`h-12 w-12 ${riskColor.text}`} />}
              {riskLevel === 'Red' && <AlertCircle className={`h-12 w-12 ${riskColor.text}`} />}
            </div>
          </div>

          {/* Next Appointment Card */}
          <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6 shadow-medical">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-medical-gray-600">Next Appointment</p>
                <p className="mt-3 text-2xl font-bold text-medical-gray-900">{analytics?.nextAppointment || 'Not scheduled'}</p>
                <p className="mt-2 text-xs text-medical-gray-500">Schedule: Coming soon</p>
              </div>
              <Calendar className="h-12 w-12 text-medical-gray-300" />
            </div>
          </div>
        </div>

        {/* Patient Profile Section */}
        {patient && (
          <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-medical-blue-light to-medical-blue-dark text-white text-2xl font-bold">
                {patient.name?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-medical-gray-900">{patient.name}</h2>
                <p className="text-sm text-medical-gray-600">Patient ID: {patient.health_id}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <PatientField label="Age" value={patient.age || 'N/A'} />
              <PatientField label="Gender" value={patient.gender || 'N/A'} />
              <PatientField label="Phone" value={patient.phone || 'N/A'} />
              <PatientField label="Email" value={patient.email || 'N/A'} />
              <PatientField label="Village" value={patient.village || 'N/A'} />
              <PatientField label="Health ID" value={patient.health_id || 'N/A'} icon="🆔" />
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical">
          <h3 className="mb-6 text-xl font-bold text-medical-gray-900">Health Recommendations</h3>
          <div className="space-y-4">
            {(analytics?.recommendations || []).length > 0 ? (
              analytics.recommendations.map((r, i) => (
                <div key={i} className="rounded-lg border-l-4 border-l-medical-blue-light bg-medical-soft-white p-4">
                  <p className="font-semibold text-medical-gray-900">{r.title}</p>
                  <p className="mt-1 text-sm text-medical-gray-600">{r.description}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-medical-green/10 border border-medical-green/20 p-4">
                <p className="text-sm font-medium text-medical-green">No recommendations yet. Complete a symptom check to get personalized guidance.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/image-upload"
            className="rounded-lg border-2 border-medical-amber bg-medical-amber/10 p-6 text-center transition hover:bg-medical-amber/20"
          >
            <Upload className="mb-3 h-8 w-8 text-medical-amber mx-auto" />
            <p className="font-semibold text-medical-gray-900">Image Diagnosis</p>
            <p className="mt-2 text-xs text-medical-gray-600">AI-powered analysis</p>
          </a>
          <a
            href="/symptom-checker"
            className="rounded-lg border-2 border-medical-blue-light bg-medical-blue-light/10 p-6 text-center transition hover:bg-medical-blue-light/20"
          >
            <Activity className="mb-3 h-8 w-8 text-medical-blue-light mx-auto" />
            <p className="font-semibold text-medical-gray-900">Run Symptom Check</p>
            <p className="mt-2 text-xs text-medical-gray-600">Quick health analysis</p>
          </a>
          <a
            href="/emergency-sos"
            className="rounded-lg border-2 border-medical-red bg-medical-red/10 p-6 text-center transition hover:bg-medical-red/20"
          >
            <AlertCircle className="mb-3 h-8 w-8 text-medical-red mx-auto" />
            <p className="font-semibold text-medical-gray-900">Emergency SOS</p>
            <p className="mt-2 text-xs text-medical-gray-600">Alert nearby hospitals</p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PatientField({ label, value, icon }) {
  return (
    <div className="rounded-lg bg-medical-soft-white p-4 border border-medical-gray-200">
      <p className="text-xs font-semibold uppercase tracking-wider text-medical-gray-600">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <p className="text-lg font-semibold text-medical-gray-900">{value}</p>
      </div>
    </div>
  );
}
