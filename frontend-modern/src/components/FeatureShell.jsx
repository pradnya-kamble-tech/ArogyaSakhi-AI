import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function FeatureShell({ children, onLogout }) {
  const role = localStorage.getItem('userRole');
  const home = role === 'DOCTOR' || role === 'SPECIALIST' ? '/doctor' : role === 'ADMIN' ? '/admin' : role === 'PATIENT' ? '/patient' : '/asha';

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-white via-medical-soft-white to-blue-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <Link 
            to={home} 
            className="inline-flex items-center gap-2 text-sm font-medium text-medical-gray-700 hover:text-medical-blue-dark transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <button 
            type="button" 
            onClick={onLogout} 
            className="inline-flex items-center gap-2 text-sm font-medium text-medical-red hover:text-red-700 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
