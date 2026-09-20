import { NavLink } from 'react-router-dom';
import { Activity, Bell, LogOut, Settings, Menu, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({ title, subtitle, nav, children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const userName = localStorage.getItem('userName');
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
    <div className="flex min-h-screen bg-gradient-to-br from-medical-white via-medical-soft-white to-blue-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'fixed' : 'hidden'
        } inset-0 z-50 w-72 transform bg-medical-white border-r border-medical-gray-200 shadow-lg lg:relative lg:block lg:transform-none`}>
        {/* Close button on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-4 top-4 lg:hidden"
        >
          <X className="h-6 w-6 text-medical-gray-900" />
        </button>

        {/* Sidebar content */}
        <div className="h-full flex flex-col p-6 overflow-y-auto">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-blue-light to-medical-blue-dark text-xl shadow-lg">
              🏥
            </div>
            <div>
              <p className="text-lg font-bold text-medical-gray-900">ArogyaSakhi</p>
              <p className="text-xs text-medical-gray-600">Healthcare AI</p>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-6 rounded-lg bg-medical-soft-white p-4 border border-medical-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-medical-blue-light to-medical-blue-dark text-white font-semibold text-sm">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 truncate">
                <p className="font-semibold text-medical-gray-900 truncate">{userName || 'User'}</p>
                <p className="text-xs text-medical-gray-600">Active</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-2 mb-6">{nav}</nav>

          {/* Divider */}
          <div className="my-4 h-px bg-medical-gray-200" />

          {/* Bottom Actions */}
          <div className="space-y-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${isActive
                  ? 'bg-medical-blue-light/10 text-medical-blue-dark font-semibold'
                  : 'text-medical-gray-700 hover:bg-medical-soft-white'
                }`
              }
            >
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>

            <button
              onClick={() => {
                setSidebarOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-medical-red hover:bg-medical-red/10 transition font-medium"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="bg-medical-white border-b border-medical-gray-200 shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 md:px-10 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-medical-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Title - Hidden on Small Screens */}
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-widest text-medical-gray-500 font-semibold">{subtitle}</p>
              <h1 className="mt-1 text-2xl text-medical-gray-900 font-serif">{title}</h1>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4">

              {/* Language Switcher */}
              <select
                value={i18n.language}
                onChange={changeLanguage}
                className="bg-transparent text-sm text-medical-gray-700 font-semibold border-none cursor-pointer focus:ring-0"
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="mr">MR</option>
              </select>

              {/* Online/Offline & Sync */}
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

              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-medical-gray-200">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-medical-blue-light to-medical-blue-dark text-white font-semibold text-xs">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-medical-gray-900">{userName || 'User'}</p>
                  <p className="text-xs text-medical-gray-600">Active now</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive
          ? 'bg-medical-blue-light/10 text-medical-blue-dark shadow-sm'
          : 'text-medical-gray-700 hover:bg-medical-soft-white'
        }`
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}
