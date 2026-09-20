import { Bell, Lock, User, Globe } from 'lucide-react';

export default function Settings() {
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || 'Patient';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl text-medical-gray-900 font-serif">Settings</h1>
        <p className="mt-2 text-medical-gray-600">Manage your account preferences and security</p>
      </div>

      {/* Account Information */}
      <div className="mb-8 rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-medical-blue-light/10">
            <User className="h-8 w-8 text-medical-blue-light" />
          </div>
          <div>
            <h3 className="text-lg text-medical-gray-900 font-serif">{userName}</h3>
            <p className="text-sm text-medical-gray-600">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-8 rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
        <div className="mb-4 flex items-center gap-3">
          <Bell className="h-5 w-5 text-medical-blue-light" />
          <h3 className="text-medical-gray-900 font-serif">Notifications</h3>
        </div>
        <div className="space-y-4 border-t border-medical-gray-100 pt-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-medical-gray-300 text-medical-blue-light" />
            <span className="text-sm text-medical-gray-700">Receive alert notifications</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-medical-gray-300 text-medical-blue-light" />
            <span className="text-sm text-medical-gray-700">Receive appointment reminders</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4 rounded border-medical-gray-300 text-medical-blue-light" />
            <span className="text-sm text-medical-gray-700">Receive updates and announcements</span>
          </label>
        </div>
      </div>

      {/* Language Settings */}
      <div className="mb-8 rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
        <div className="mb-4 flex items-center gap-3">
          <Globe className="h-5 w-5 text-medical-blue-light" />
          <h3 className="text-medical-gray-900 font-serif">Language</h3>
        </div>
        <div className="border-t border-medical-gray-100 pt-4">
          <select className="w-full rounded-lg border border-medical-gray-300 bg-medical-white px-4 py-2 text-medical-gray-900 focus:border-medical-blue-light focus:outline-none focus:ring-2 focus:ring-medical-blue-light/20">
            <option>English</option>
            <option>हिंदी</option>
            <option>Español</option>
            <option>मराठी</option>
          </select>
        </div>
      </div>

      {/* Security Settings */}
      <div className="mb-8 rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
        <div className="mb-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-medical-blue-light" />
          <h3 className="text-medical-gray-900 font-serif">Security</h3>
        </div>
        <div className="border-t border-medical-gray-100 pt-4">
          <button type="button" className="rounded-lg bg-medical-blue-light/10 px-4 py-2 text-sm font-medium text-medical-blue-light hover:bg-medical-blue-light/20 transition">
            Change Password
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-medical-red/20 bg-medical-red/5 p-6">
        <h3 className="mb-4 text-medical-red font-serif">Danger Zone</h3>
        <button 
          onClick={handleLogout}
          className="rounded-lg bg-medical-red px-6 py-2 font-medium text-white hover:bg-red-600 transition"
        >
          Sign Out of All Devices
        </button>
      </div>
    </div>
  );
}
