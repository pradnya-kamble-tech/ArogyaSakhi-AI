import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { logout } from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AshaDashboard from './pages/AshaDashboard';
// No patient portal
import AdminDashboard from './pages/AdminDashboard';
import AssessmentWizard from './pages/AssessmentWizard';
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
    return '/worker'; // PCW
  };

  const allRoles = ['PCW', 'DOCTOR', 'ADMIN'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-white via-medical-soft-white to-blue-50 text-medical-gray-900">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />

        <Route path="/home" element={<Navigate to={homeByRole()} replace />} />

        <Route path="/worker" element={<ProtectedRoute allowedRoles={['PCW']}><AshaDashboard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/worker/assess" element={<ProtectedRoute allowedRoles={['PCW']}><AssessmentWizard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={allRoles}><Dashboard /></ProtectedRoute>} />

        <Route path="/symptom-checker" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><SymptomChecker /></FeatureShell></ProtectedRoute>} />
        <Route path="/emergency-sos" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><EmergencySOS /></FeatureShell></ProtectedRoute>} />
        <Route path="/hospital-finder" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><HospitalFinder /></FeatureShell></ProtectedRoute>} />
        <Route path="/voice-assistant" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><VoiceAssistant /></FeatureShell></ProtectedRoute>} />
        <Route path="/image-upload" element={<ProtectedRoute allowedRoles={['PCW']}><ImageUpload onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><Settings /></FeatureShell></ProtectedRoute>} />
        <Route path="/ai-analytics" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><FeatureShell onLogout={handleLogout}><AIAnalytics /></FeatureShell></ProtectedRoute>} />
        <Route path="/ai-reports" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><AIReports /></FeatureShell></ProtectedRoute>} />
        <Route path="/patient/:id" element={<ProtectedRoute allowedRoles={allRoles}><FeatureShell onLogout={handleLogout}><PatientDetails /></FeatureShell></ProtectedRoute>} />
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
