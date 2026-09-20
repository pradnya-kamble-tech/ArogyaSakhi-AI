import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, ClipboardList, Hospital, MapPin, Mic, Stethoscope, Upload, Users, Wifi, WifiOff, Search, Plus, Check
} from 'lucide-react';
import DashboardLayout, { NavItem } from '../components/DashboardLayout';
import RiskBadge from '../components/RiskBadge';
import { createPatient, fetchPatients, skinDetect } from '../services/api';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { wsAlertsUrl } from '../services/api';

export default function AshaDashboard({ onLogout }) {
  const userName = localStorage.getItem('userName');
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', phone: '', village: '' });
  const { online, queue, syncing, enqueue } = useOfflineQueue();

  const load = () => fetchPatients(search).then(setPatients).catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const ws = new WebSocket(wsAlertsUrl());
    ws.onmessage = () => load();
    return () => ws.close();
  }, []);

  const addPatient = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setCredentials(null);
    const body = { ...form, age: form.age ? Number(form.age) : null };
    if (!online) {
      enqueue('create_patient', body);
      setError('Saved offline — will sync when online');
      return;
    }
    try {
      const result = await createPatient(body);
      setForm({ name: '', age: '', phone: '', village: '' });
      load();
      if (result?.credentials) {
        setCredentials({ ...result.credentials, phone: body.phone });
        setSuccessMessage('Patient registered successfully. Share credentials with the patient.');
      } else {
        setSuccessMessage('Patient registered successfully.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const onSkinUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await skinDetect(file);
      alert('Skin analysis complete — check AI reports');
    } catch (err) {
      setError(err.message);
    }
  };

  const nav = (
    <>
      <NavItem to="/asha" end icon={Activity} label="Dashboard" />
      <NavItem to="/symptom-checker" icon={Stethoscope} label="Symptom Checker" />
      <NavItem to="/emergency-sos" icon={AlertTriangle} label="Emergency SOS" />
      <NavItem to="/voice-assistant" icon={Mic} label="Voice Assistant" />
      <NavItem to="/hospital-finder" icon={MapPin} label="Hospital Finder" />
    </>
  );

  return (
    <DashboardLayout title="Patient Care Command" subtitle="ASHA worker dashboard" nav={nav} onLogout={onLogout}>
      {/* Status Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${online ? 'bg-medical-green/10 text-medical-green border border-medical-green/20' : 'bg-medical-amber/10 text-medical-amber border border-medical-amber/20'}`}>
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? 'Online' : 'Offline Mode'}
        </span>
        {queue.length > 0 && (
          <span className="text-xs text-medical-gray-600 bg-medical-soft-white px-3 py-1 rounded-full">
            {queue.length} pending {syncing && '(syncing...)'}
          </span>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 rounded-lg bg-medical-red/10 border border-medical-red/20 p-4 text-medical-red text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg bg-medical-green/10 border border-medical-green/20 p-4"
        >
          <p className="text-sm font-medium text-medical-green">{successMessage}</p>
          {credentials && (
            <div className="mt-4 rounded-lg bg-medical-white p-6 border border-medical-gray-200 shadow-medical">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-medical-green/20 flex items-center justify-center text-medical-green font-bold">✓</div>
                <span className="text-xs uppercase tracking-widest font-semibold text-medical-gray-600">Patient Credentials</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mb-6 bg-medical-soft-white p-4 rounded-lg border border-medical-gray-200">
                <div>
                  <p className="text-xs text-medical-gray-600 font-semibold">Username</p>
                  <p className="text-sm font-mono font-bold text-medical-gray-900 mt-2 break-all">{credentials.username}</p>
                </div>
                <div>
                  <p className="text-xs text-medical-gray-600 font-semibold">Password</p>
                  <p className="text-sm font-mono font-bold text-medical-gray-900 mt-2 break-all">{credentials.password}</p>
                </div>
                <div>
                  <p className="text-xs text-medical-gray-600 font-semibold">Health ID</p>
                  <p className="text-sm font-mono font-bold text-medical-gray-900 mt-2 break-all">{credentials.health_id}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-between">
                <div className="flex flex-wrap gap-3">
                  <button 
                    type="button" 
                    onClick={() => navigator.clipboard.writeText(`ArogyaSakhi Patient Credentials\n\nName: ${credentials.username}\nPassword: ${credentials.password}\nHealth ID: ${credentials.health_id}`)} 
                    className="inline-flex items-center gap-2 rounded-lg bg-medical-blue-light text-white px-4 py-2 text-sm font-medium hover:bg-medical-blue-dark transition"
                  >
                    📋 Copy
                  </button>
                  <button 
                    type="button" 
                    onClick={() => window.print()} 
                    className="inline-flex items-center gap-2 rounded-lg bg-medical-gray-300 text-medical-gray-900 px-4 py-2 text-sm font-medium hover:bg-medical-gray-400 transition"
                  >
                    🖨️ Print
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href={`sms:${credentials.phone}?body=${encodeURIComponent(`Your ArogyaSakhi account has been created.\n\nUsername: ${credentials.username}\nPassword: ${credentials.password}\nHealth ID: ${credentials.health_id}\n\nLogin at: https://arogya-sakhi.com`)}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-medical-green text-white px-4 py-2 text-sm font-medium hover:bg-green-600 transition"
                  >
                    💬 SMS
                  </a>
                  <a 
                    href={`https://wa.me/${credentials.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Your ArogyaSakhi account has been created.\n\nUsername: ${credentials.username}\nPassword: ${credentials.password}\nHealth ID: ${credentials.health_id}\n\nLogin at: https://arogya-sakhi.com`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] text-white px-4 py-2 text-sm font-medium hover:bg-[#20BA58] transition"
                  >
                    💚 WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Patient Registry - Main Panel */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-2 rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical"
        >
          <div className="mb-6">
            <h2 className="text-xl text-medical-gray-900 mb-4 font-serif">Patient Registry</h2>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-medical-gray-400" />
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Search by name, health ID, or phone..." 
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white pl-10 pr-4 py-2 text-sm text-medical-gray-900 outline-none focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
                />
              </div>
              <button 
                type="button" 
                onClick={load} 
                className="rounded-lg bg-medical-blue-light text-white px-6 py-2 text-sm font-medium hover:bg-medical-blue-dark transition"
              >
                Search
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {patients.length > 0 ? (
              patients.map((p) => (
                <Link 
                  key={p.id} 
                  to={`/patient/${p.id}`} 
                  className="block rounded-lg border border-medical-gray-200 bg-medical-soft-white p-4 hover:border-medical-blue-light hover:shadow-medical transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-medical-gray-900">{p.name}</p>
                      <p className="text-xs text-medical-gray-600 mt-1">
                        Health ID: <span className="font-mono">{p.health_id}</span> {p.village && `· ${p.village}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={p.risk_level} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6 text-center">
                <Users className="h-12 w-12 text-medical-gray-300 mx-auto mb-3" />
                <p className="text-medical-gray-900 font-medium">No patients yet</p>
                <p className="text-xs text-medical-gray-600">Register your first patient using the form on the right</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Sidebar - Registration & Actions */}
        <div className="space-y-6">
          {/* Registration Form */}
          <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
            <h3 className="flex items-center gap-2 text-medical-gray-900 mb-4 font-serif">
              <Plus className="h-5 w-5 text-medical-blue-light" />
              New Patient
            </h3>
            <form onSubmit={addPatient} className="space-y-3">
              <input 
                placeholder="Full name *" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-4 py-2 text-sm text-medical-gray-900 outline-none focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
                required
              />
              <input 
                placeholder="Age" 
                type="number"
                value={form.age} 
                onChange={(e) => setForm({ ...form, age: e.target.value })} 
                className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-4 py-2 text-sm text-medical-gray-900 outline-none focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
              />
              <input 
                placeholder="Phone" 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-4 py-2 text-sm text-medical-gray-900 outline-none focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
              />
              <input 
                placeholder="Village" 
                value={form.village} 
                onChange={(e) => setForm({ ...form, village: e.target.value })} 
                className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-4 py-2 text-sm text-medical-gray-900 outline-none focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
              />
              <button 
                type="submit" 
                className="w-full rounded-lg bg-gradient-to-r from-medical-blue-light to-medical-blue-dark text-white py-3 text-sm font-semibold hover:shadow-medical transition"
              >
                Register Patient
              </button>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
            <h3 className="text-medical-gray-900 mb-4 font-serif">Quick Access</h3>
            <div className="grid gap-2">
              <Link 
                to="/symptom-checker" 
                className="flex items-center gap-3 rounded-lg bg-medical-blue-light/10 border border-medical-blue-light/20 px-4 py-3 text-sm font-medium text-medical-blue-dark hover:bg-medical-blue-light/20 transition"
              >
                <Stethoscope className="h-4 w-4" />
                Symptom Analysis
              </Link>
              <Link 
                to="/emergency-sos" 
                className="flex items-center gap-3 rounded-lg bg-medical-red/10 border border-medical-red/20 px-4 py-3 text-sm font-medium text-medical-red hover:bg-medical-red/20 transition"
              >
                <AlertTriangle className="h-4 w-4" />
                Emergency SOS
              </Link>
              <label className="flex items-center gap-3 rounded-lg bg-medical-amber/10 border border-medical-amber/20 px-4 py-3 text-sm font-medium text-medical-amber hover:bg-medical-amber/20 transition cursor-pointer">
                <Upload className="h-4 w-4" />
                Skin Analysis
                <input type="file" accept="image/*" className="hidden" onChange={onSkinUpload} />
              </label>
              <Link 
                to="/hospital-finder" 
                className="flex items-center gap-3 rounded-lg bg-medical-green/10 border border-medical-green/20 px-4 py-3 text-sm font-medium text-medical-green hover:bg-medical-green/20 transition"
              >
                <Hospital className="h-4 w-4" />
                Nearby Hospitals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
