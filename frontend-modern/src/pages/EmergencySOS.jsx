import { useEffect, useState } from 'react';
import { fetchPatients, triggerSOS } from '../services/api';
import { AlertCircle } from 'lucide-react';

export default function EmergencySOS() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const PATIENT_STORAGE_KEY = 'asha_selected_patient';

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

  const send = async () => {
    setLoading(true);
    setStatus('');
    try {
      const pos = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({ latitude: 18.52, longitude: 73.85 });
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => resolve({ latitude: 18.52, longitude: 73.85 })
        );
      });
      const data = await triggerSOS({ patient_id: selectedPatient, message: 'Emergency SOS from ASHA worker', ...pos });
      setStatus(`SOS dispatched. Alert ID: ${data.alert_id}`);
    } catch (e) {
      setStatus(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto rounded-lg border-2 border-medical-red/20 bg-gradient-to-br from-medical-white to-medical-red/5 p-10 text-center shadow-medical">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-medical-red/10 mb-6">
        <AlertCircle className="h-12 w-12 text-medical-red" />
      </div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-medical-red">Emergency Response</p>
      <h2 className="mt-4 text-4xl font-bold text-medical-gray-900">One-tap SOS</h2>
      <p className="mx-auto mt-4 max-w-md text-medical-gray-600 leading-relaxed">
        Instantly notifies doctors, administrators, and provides routing to the nearest equipped hospital.
      </p>
      {patients.length > 0 && (
        <div className="mx-auto mt-8 max-w-sm text-left">
          <label className="block text-sm font-semibold text-medical-gray-700 mb-2">Select patient for SOS context</label>
          <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-4 py-3 text-medical-gray-900 outline-none focus:border-medical-red focus:ring-2 focus:ring-medical-red/20 shadow-sm transition">
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name}{patient.health_id ? ` • ${patient.health_id}` : ''}</option>
            ))}
          </select>
        </div>
      )}
      <button
        type="button"
        onClick={send}
        disabled={loading}
        className="mt-10 rounded-full bg-medical-red px-14 py-5 text-xl font-bold text-white shadow-lg shadow-medical-red/30 transition hover:bg-red-600 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {loading ? 'Dispatching...' : 'TRIGGER SOS'}
      </button>
      {status && (
        <div className="mx-auto mt-8 max-w-md rounded-lg border border-medical-green/20 bg-medical-green/10 p-4">
          <p className="text-sm font-semibold text-medical-green">{status}</p>
        </div>
      )}
    </div>
  );
}
