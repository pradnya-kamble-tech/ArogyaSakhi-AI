import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchCaseTrends } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import {
  User, Phone, MapPin, Activity, Calendar, ArrowLeft, TrendingUp,
  AlertCircle, Info, RefreshCw,
} from 'lucide-react';
import { Button, EditorialTimeline } from '../components/design/Editorial';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [cases, setCases] = useState([]);
  const [trendData, setTrendData] = useState(null);   // null = not loaded yet
  const [trendMsg, setTrendMsg] = useState('');        // insufficient / error
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/cases?patient_id=${id}`),
    ])
      .then(([patientRes, casesRes]) => {
        setPatient(patientRes.data);
        const caseList = casesRes.data.cases || [];
        setCases(caseList);
        // Load trends from the most recent case for this patient
        if (caseList.length > 0) {
          loadTrends(caseList[0].client_uuid);
        }
      })
      .catch((e) => setError(e.message || 'Failed to load patient data'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadTrends = async (caseId) => {
    setTrendLoading(true);
    setTrendMsg('');
    setTrendData(null);
    try {
      const res = await fetchCaseTrends(caseId);
      if (res.message) setTrendMsg(res.message);
      if (res.sufficient_for_trend && res.observations?.length >= 2) {
        // Map to recharts-friendly shape
        setTrendData(
          res.observations.map((o) => ({
            date: o.observed_at
              ? new Date(o.observed_at).toLocaleDateString()
              : '—',
            sbp: o.bp_systolic ?? null,
            dbp: o.bp_diastolic ?? null,
            hr: o.heart_rate ?? null,
            temp: o.temperature ?? null,
            spo2: o.spo2 ?? null,
          }))
        );
      } else {
        setTrendData([]);
      }
    } catch (e) {
      setTrendMsg('Trend data could not be loaded.');
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-medical-blue-light border-r-transparent" />
        <span className="ml-3 text-sm text-medical-gray-500">Loading patient…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-medical-red/10 border border-medical-red/20 p-6 flex items-center gap-3 text-medical-red">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Failed to load patient</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="rounded-lg bg-medical-white p-8 text-center shadow-medical">
        <p className="text-medical-gray-500 mb-4">Patient not found.</p>
        <Link to="/worker" className="text-medical-blue-light hover:underline">
          Return to dashboard
        </Link>
      </div>
    );
  }

  const timelineItems = cases.map((c) => ({
    date: new Date(c.synced_at || Date.now()).toLocaleDateString(),
    event: `Assessment — ${c.risk_level || 'Green'} risk`,
    detail: c.inputs?.symptoms?.join(', ') || 'Routine checkup.',
  }));

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <Link
        to={-1}
        className="inline-flex items-center gap-2 text-sm font-medium text-medical-gray-600 hover:text-medical-blue-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Patient Header */}
      <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 md:p-8 shadow-medical">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-medical-gray-100 pb-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-blue-light to-medical-blue-dark text-3xl font-bold text-white shadow-md">
              {patient.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl text-medical-gray-900 font-serif">{patient.name}</h1>
              <p className="text-medical-gray-500 font-medium mt-1">
                ID: {patient.health_id || patient.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RiskBadge level={patient.risk_level} />
            <Button
              onClick={() =>
                navigate('/worker/assess', { state: { patientId: patient.id } })
              }
            >
              New Assessment
            </Button>
          </div>
        </div>

        {/* Demographics */}
        <h3 className="text-sm uppercase tracking-wider text-medical-gray-500 mb-4 font-serif">
          Demographics
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <InfoCard icon={<Calendar className="h-4 w-4" />} label="Age / Gender">
            {patient.age || '—'} yrs, {patient.gender || '—'}
          </InfoCard>
          <InfoCard icon={<Phone className="h-4 w-4" />} label="Phone">
            {patient.phone || '—'}
          </InfoCard>
          <InfoCard icon={<MapPin className="h-4 w-4" />} label="Location">
            {patient.village || patient.district || '—'}
          </InfoCard>
          <InfoCard icon={<Activity className="h-4 w-4" />} label="Pregnant">
            <span className={patient.is_pregnant ? 'text-medical-amber font-bold' : ''}>
              {patient.is_pregnant ? 'Yes' : 'No'}
            </span>
          </InfoCard>
        </div>

        {/* Chronic conditions / allergies */}
        {(patient.chronic_conditions?.length > 0 || patient.allergies?.length > 0) && (
          <>
            <h3 className="text-sm uppercase tracking-wider text-medical-gray-500 mb-4 font-serif">
              Medical History
            </h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {(patient.chronic_conditions || []).map((tag, i) => (
                <span
                  key={`cc-${i}`}
                  className="rounded-full bg-medical-amber/10 border border-medical-amber/20 px-3 py-1.5 text-sm font-medium text-medical-amber"
                >
                  {tag}
                </span>
              ))}
              {(patient.allergies || []).map((tag, i) => (
                <span
                  key={`al-${i}`}
                  className="rounded-full bg-medical-red/10 border border-medical-red/20 px-3 py-1.5 text-sm font-medium text-medical-red"
                >
                  ⚠ {tag}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Visit Timeline */}
        <h3 className="text-sm uppercase tracking-wider text-medical-gray-500 mb-4 font-serif">
          Assessment History
        </h3>
        <div className="mb-8">
          {cases.length > 0 ? (
            <EditorialTimeline items={timelineItems} />
          ) : (
            <p className="text-sm text-medical-gray-500 italic">
              No assessments recorded yet.
            </p>
          )}
        </div>

        {/* Physiological Trends */}
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-4 w-4 text-medical-gray-500" />
          <h3 className="text-sm uppercase tracking-wider text-medical-gray-500 font-serif">
            Physiological Trends
          </h3>
          {trendData !== null && (
            <button
              onClick={() => cases.length > 0 && loadTrends(cases[0].client_uuid)}
              className="ml-auto flex items-center gap-1 text-xs text-medical-blue-light hover:underline"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          )}
        </div>

        {trendLoading && (
          <div className="flex items-center gap-2 text-sm text-medical-gray-500 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-medical-blue-light border-r-transparent" />
            Loading trend data…
          </div>
        )}

        {!trendLoading && trendMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-medical-soft-white border border-medical-gray-200 p-4 text-medical-gray-600 text-sm mb-6">
            <Info className="h-4 w-4 flex-shrink-0 text-medical-blue-light" />
            {trendMsg}
          </div>
        )}

        {!trendLoading && trendData && trendData.length >= 2 && (
          <div className="mb-8 p-6 bg-medical-soft-white rounded-lg border border-medical-gray-200 shadow-sm h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '11px' }}
                />
                <YAxis
                  yAxisId="bp"
                  stroke="#EF4444"
                  style={{ fontSize: '11px' }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <YAxis
                  yAxisId="hr"
                  orientation="right"
                  stroke="#F59E0B"
                  style={{ fontSize: '11px' }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Legend />
                <Line
                  yAxisId="bp"
                  type="monotone"
                  dataKey="sbp"
                  name="Systolic BP"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  yAxisId="bp"
                  type="monotone"
                  dataKey="dbp"
                  name="Diastolic BP"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  yAxisId="hr"
                  type="monotone"
                  dataKey="hr"
                  name="Heart Rate"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  yAxisId="hr"
                  type="monotone"
                  dataKey="spo2"
                  name="SpO₂ %"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Medical tags */}
        {patient.medical_history && patient.medical_history.length > 0 && (
          <>
            <h3 className="text-sm uppercase tracking-wider text-medical-gray-500 mb-4 font-serif">
              Medical Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {patient.medical_history.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-medical-blue-light/10 border border-medical-blue-light/20 px-3 py-1.5 text-sm font-medium text-medical-blue-dark"
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, children }) {
  return (
    <div className="rounded-lg border border-medical-gray-100 bg-medical-soft-white p-4">
      <div className="flex items-center gap-2 text-medical-gray-500 mb-2">
        {icon}
        <span className="text-xs uppercase font-semibold">{label}</span>
      </div>
      <p className="text-lg font-bold text-medical-gray-900">{children}</p>
    </div>
  );
}
