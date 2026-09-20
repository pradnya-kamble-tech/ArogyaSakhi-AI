import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { Building2, Shield, Users, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import DashboardLayout, { NavItem } from '../components/DashboardLayout';
import { fetchAdminStats, fetchAdminUsers, fetchDashboard } from '../services/api';

const COLORS = ['#EF4444', '#F59E0B', '#10B981'];

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchAdminStats().then(setStats).catch(() => {});
    fetchDashboard().then(setAnalytics).catch(() => {});
    fetchAdminUsers().then(setUsers).catch(() => {});
  }, []);

  const pie = analytics
    ? [
        { name: 'High Risk', value: analytics.highRiskCount || 0 },
        { name: 'Medium Risk', value: analytics.mediumRiskCount || 0 },
        { name: 'Low Risk', value: analytics.lowRiskCount || 0 }
      ]
    : [];

  const nav = (
    <>
      <NavItem to="/admin" end icon={Shield} label="Dashboard" />
      <NavItem to="/ai-analytics" icon={TrendingUp} label="Analytics" />
      <NavItem to="/settings" icon={Users} label="Settings" />
    </>
  );

  return (
    <DashboardLayout title="Platform Administration" subtitle="System monitoring & control" nav={nav} onLogout={onLogout}>
      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat label="Total Users" value={stats?.total_users ?? 0} icon={<Users className="h-6 w-6" />} color="from-medical-blue-light to-medical-blue-dark" />
        <Stat label="Total Patients" value={stats?.total_patients ?? 0} icon={<Building2 className="h-6 w-6" />} color="from-medical-green to-green-600" />
        <Stat label="AI Predictions" value={stats?.total_predictions ?? 0} icon={<TrendingUp className="h-6 w-6" />} color="from-medical-amber to-amber-600" />
        <Stat label="Open Alerts" value={stats?.open_alerts ?? 0} icon={<AlertCircle className="h-6 w-6" />} color="from-medical-red to-red-600" />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-1 rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical">
          <h3 className="text-lg text-medical-gray-900 mb-6 font-serif">Patient Risk Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={pie} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pie.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Management */}
        <div className="lg:col-span-2 rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg text-medical-gray-900 font-serif">Active Users</h3>
            <span className="text-sm font-medium text-medical-blue-light">{users.length} members</span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {users.length > 0 ? (
              users.map((u) => (
                <div 
                  key={u.id} 
                  className="flex items-center justify-between rounded-lg border border-medical-gray-200 bg-medical-soft-white px-4 py-3 hover:bg-medical-white transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-medical-blue-light to-medical-blue-dark text-white font-semibold text-sm">
                      {u.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-medical-gray-900 text-sm">{u.name}</p>
                      <p className="text-xs text-medical-gray-600">{u.email || 'No email'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    u.role === 'DOCTOR' ? 'bg-medical-blue-light/10 text-medical-blue-light' :
                    u.role === 'ADMIN' ? 'bg-medical-red/10 text-medical-red' :
                    u.role === 'PATIENT' ? 'bg-medical-green/10 text-medical-green' :
                    'bg-medical-amber/10 text-medical-amber'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-medical-gray-600">No users to display</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Statistics */}
      <div className="grid gap-4 md:grid-cols-3 text-center">
        <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6">
          <div className="text-3xl font-bold text-medical-blue-light mb-1">
            {analytics?.totalPatients ?? 0}
          </div>
          <p className="text-sm text-medical-gray-600">Total Patients</p>
        </div>
        <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6">
          <div className="text-3xl font-bold text-medical-green mb-1">
            {analytics?.totalCases ?? 0}
          </div>
          <p className="text-sm text-medical-gray-600">Active Cases</p>
        </div>
        <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6">
          <div className="text-3xl font-bold text-medical-amber mb-1">
            {analytics?.recentAlerts?.length ?? 0}
          </div>
          <p className="text-sm text-medical-gray-600">Recent Alerts</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value, icon, color }) {
  return (
    <div className={`rounded-lg bg-gradient-to-br ${color} p-6 text-white shadow-medical`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="mt-3 text-4xl font-bold">{value}</p>
        </div>
        <div className="opacity-30">{icon}</div>
      </div>
    </div>
  );
}
