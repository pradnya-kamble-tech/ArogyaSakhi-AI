import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function FeatureShell({ children, onLogout }) {
  const role = localStorage.getItem('userRole');
  const home = role === 'DOCTOR' ? '/doctor' : role === 'ADMIN' ? '/admin' : '/worker';

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const changeLanguage = (e) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    localStorage.setItem('appLang', lng);
  };

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

          <div className="flex items-center gap-4">
            <select
              value={i18n.language}
              onChange={changeLanguage}
              className="bg-transparent text-sm text-medical-gray-700 font-semibold border-none cursor-pointer focus:ring-0"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="mr">MR</option>
            </select>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-medical-gray-200 bg-medical-soft-white">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-medical-green" />
              ) : (
                <WifiOff className="h-4 w-4 text-medical-red" />
              )}
              <span className="text-xs font-semibold text-medical-gray-700">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {pendingSync > 0 && (
                <div className="flex items-center gap-1 ml-2 text-xs font-bold text-medical-amber">
                  <RefreshCw className="h-3 w-3" />
                  {pendingSync}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 text-sm font-medium text-medical-red hover:text-red-700 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
