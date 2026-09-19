import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { User, Phone, MapPin, Activity, Calendar, ArrowLeft } from 'lucide-react';

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/patients/${id}`)
       .then((r) => setPatient(r.data))
       .catch(() => {})
       .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-medical-blue-light border-r-transparent"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="rounded-lg bg-medical-white p-8 text-center shadow-medical">
        <p className="text-medical-gray-500 mb-4">Patient not found or failed to load.</p>
        <Link to="/patient" className="text-medical-blue-light hover:underline">Return to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link to={-1} className="inline-flex items-center gap-2 text-sm font-medium text-medical-gray-600 hover:text-medical-blue-dark">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      
      <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 md:p-8 shadow-medical">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-medical-gray-100 pb-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-blue-light to-medical-blue-dark text-3xl font-bold text-white shadow-md">
              {patient.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-medical-gray-900">{patient.name}</h1>
              <p className="text-medical-gray-500 font-medium mt-1">ID: {patient.health_id || patient.id}</p>
            </div>
          </div>
          <div>
            <RiskBadge level={patient.risk_level} />
          </div>
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-medical-gray-500 mb-4">Demographics & Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border border-medical-gray-100 bg-medical-soft-white p-4">
            <div className="flex items-center gap-2 text-medical-gray-500 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs uppercase font-semibold">Age / Gender</span>
            </div>
            <p className="text-lg font-bold text-medical-gray-900">{patient.age || '—'} yrs, {patient.gender || '—'}</p>
          </div>
          
          <div className="rounded-lg border border-medical-gray-100 bg-medical-soft-white p-4">
            <div className="flex items-center gap-2 text-medical-gray-500 mb-2">
              <Phone className="h-4 w-4" />
              <span className="text-xs uppercase font-semibold">Phone</span>
            </div>
            <p className="text-lg font-bold text-medical-gray-900">{patient.phone || '—'}</p>
          </div>

          <div className="rounded-lg border border-medical-gray-100 bg-medical-soft-white p-4">
            <div className="flex items-center gap-2 text-medical-gray-500 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="text-xs uppercase font-semibold">Location</span>
            </div>
            <p className="text-lg font-bold text-medical-gray-900 truncate">{patient.village || patient.district || '—'}</p>
          </div>

          <div className="rounded-lg border border-medical-gray-100 bg-medical-soft-white p-4">
            <div className="flex items-center gap-2 text-medical-gray-500 mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs uppercase font-semibold">Pregnancy</span>
            </div>
            <p className={`text-lg font-bold ${patient.is_pregnant ? 'text-medical-amber' : 'text-medical-gray-900'}`}>
              {patient.is_pregnant ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-medical-gray-500 mb-4">Medical Tags</h3>
        <div className="flex flex-wrap gap-2">
          {patient.medical_history && patient.medical_history.length > 0 ? (
            patient.medical_history.map((tag, idx) => (
              <span key={idx} className="rounded-full bg-medical-blue-light/10 border border-medical-blue-light/20 px-3 py-1.5 text-sm font-medium text-medical-blue-dark">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm text-medical-gray-500 italic">No medical history tags available.</span>
          )}
        </div>
      </div>
    </div>
  );
}
