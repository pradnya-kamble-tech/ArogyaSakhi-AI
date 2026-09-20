import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { logout } from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AshaDashboard from './pages/AshaDashboard';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SymptomChecker from './pages/SymptomChecker';
import EmergencySOS from './pages/EmergencySOS';
import HospitalFinder from './pages/HospitalFinder';
import VoiceAssistant from './pages/VoiceAssistant';
import ImageUpload from './pages/ImageUpload';
import Settings from './pages/Settings';
import AIAnalytics from './pages/AIAnalytics';
import AIReports from './pages/AIReports';
import PatientDetails from './pages/PatientDetails';
import ProtectedRoute from './components/ProtectedRoute';
import FeatureShell from './components/FeatureShell';
import DesignShowcase from './pages/DesignShowcase';
import LegacyLogin from './pages/LegacyLogin';
import LegacySignup from './pages/LegacySignup';
import LegacyLanding from './pages/LegacyLanding';

function App() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const homeByRole = () => {
    const role = localStorage.getItem('userRole');
    if (role === 'DOCTOR' || role === 'SPECIALIST') return '/doctor';
    if (role === 'ADMIN' || role === 'AUDITOR') return '/admin';
    if (role === 'PATIENT') return '/patient';
    return '/asha';
  };

  const allRoles = ['PCW (ASHA)', 'PCW (ASHA)', 'DOCTOR', 'SPECIALIST', 'PATIENT', 'ADMIN', 'AUDITOR'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-white via-medical-soft-white to-blue-50 text-medical-gray-900">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />

        <Route path="/home" element={<Navigate to={homeByRole()} replace />} />

        <Route path="/asha" element={<ProtectedRoute allowedRoles={['PCW (ASHA)', 'PCW (ASHA)']}><AshaDashboard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR', 'SPECIALIST']}><DoctorDashboard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/patient" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'AUDITOR']}><AdminDashboard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={allRoles}><Dashboard /></ProtectedRoute>} />

        <Route path="/symptom-checker" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><SymptomChecker /></FeatureShell></ProtectedRoute>} />
        <Route path="/emergency-sos" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><EmergencySOS /></FeatureShell></ProtectedRoute>} />
        <Route path="/hospital-finder" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><HospitalFinder /></FeatureShell></ProtectedRoute>} />
        <Route path="/voice-assistant" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><VoiceAssistant /></FeatureShell></ProtectedRoute>} />
        <Route path="/image-upload" element={<ProtectedRoute allowedRoles={['PATIENT', 'PCW (ASHA)', 'PCW (ASHA)']}><ImageUpload onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><Settings /></FeatureShell></ProtectedRoute>} />
        <Route path="/ai-analytics" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN', 'SPECIALIST', 'AUDITOR']}><FeatureShell onLogout={handleLogout}><AIAnalytics /></FeatureShell></ProtectedRoute>} />
        <Route path="/ai-reports" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><AIReports /></FeatureShell></ProtectedRoute>} />
        <Route path="/patient/:id" element={<ProtectedRoute allowedRoles={['PCW (ASHA)', 'PCW (ASHA)', 'DOCTOR', 'ADMIN']}><FeatureShell onLogout={handleLogout}><PatientDetails /></FeatureShell></ProtectedRoute>} />
        <Route path="/design" element={<DesignShowcase />} />

        <Route path="/legacy/login" element={<LegacyLogin />} />
        <Route path="/legacy/signup" element={<LegacySignup />} />
        <Route path="/legacy" element={<LegacyLanding />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
