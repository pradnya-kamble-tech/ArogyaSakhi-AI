import { useEffect, useState } from 'react';
import { fetchDashboard } from '../services/api';
import { AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard()
      .then(setAnalytics)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-white via-medical-soft-white to-blue-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-lg border border-medical-gray-200 bg-gradient-to-r from-medical-blue-light to-medical-blue-dark p-8 text-white shadow-medical">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">PLATFORM OVERVIEW</p>
              <h1 className="mt-3 text-4xl font-serif">AI Health Command Center</h1>
            </div>
            <div className="rounded-lg bg-white/20 px-5 py-3 text-sm font-medium backdrop-blur-sm">
              Status: <span className="text-medical-green">● Connected</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-medical-red/30 bg-medical-red/10 p-4 text-medical-red">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          {analytics ? [
            { label: 'Active Cases', value: analytics.totalCases || 0, icon: '📋', color: 'blue' },
            { label: 'Patients Tracked', value: analytics.totalPatients || 0, icon: '👥', color: 'green' },
            { label: 'Pending Follow-ups', value: analytics.pendingFollowUps || 0, icon: '📞', color: 'amber' }
          ].map((card) => (
            <div key={card.label} className={`rounded-lg border ${
              card.color === 'blue' ? 'border-medical-blue-light/20 bg-gradient-to-br from-medical-blue-light/5 to-medical-blue-dark/5' :
              card.color === 'green' ? 'border-medical-green/20 bg-gradient-to-br from-medical-green/5 to-emerald-600/5' :
              'border-medical-amber/20 bg-gradient-to-br from-medical-amber/5 to-amber-600/5'
            } p-6 shadow-medical`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medical-gray-600">{card.label}</p>
                  <p className="mt-3 text-4xl font-bold text-medical-gray-900">{card.value}</p>
                </div>
                <span className="text-4xl">{card.icon}</span>
              </div>
            </div>
          )) : (
            <div className="flex items-center justify-center rounded-lg border border-medical-gray-200 bg-medical-white p-8 text-medical-gray-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-medical-blue-light border-r-transparent"></div>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
            <div className="mb-6 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-medical-blue-light" />
              <h2 className="text-xl text-medical-gray-900 font-serif">Risk Distribution</h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-medical-red/10 p-4 border-l-4 border-medical-red">
                <p className="text-sm font-medium text-medical-gray-700">High Risk</p>
                <p className="mt-1 text-2xl font-bold text-medical-red">{analytics?.highRiskCount ?? 0}</p>
              </div>
              <div className="rounded-lg bg-medical-amber/10 p-4 border-l-4 border-medical-amber">
                <p className="text-sm font-medium text-medical-gray-700">Moderate Risk</p>
                <p className="mt-1 text-2xl font-bold text-medical-amber">{analytics?.mediumRiskCount ?? 0}</p>
              </div>
              <div className="rounded-lg bg-medical-green/10 p-4 border-l-4 border-medical-green">
                <p className="text-sm font-medium text-medical-gray-700">Low Risk</p>
                <p className="mt-1 text-2xl font-bold text-medical-green">{analytics?.lowRiskCount ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
            <div className="mb-6 flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-medical-red" />
              <h2 className="text-xl text-medical-gray-900 font-serif">Recent Alerts</h2>
            </div>
            <div className="space-y-3">
              {(analytics?.recentAlerts || []).slice(0, 3).map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-medical-gray-100 bg-medical-gray-50 p-4">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-medical-red flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-medium text-medical-gray-900">{alert.title}</p>
                    <p className="mt-1 text-sm text-medical-gray-600">{alert.details}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    alert.priority === 'HIGH' ? 'bg-medical-red/10 text-medical-red' :
                    alert.priority === 'MEDIUM' ? 'bg-medical-amber/10 text-medical-amber' :
                    'bg-medical-green/10 text-medical-green'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
              ))}
              {!analytics?.recentAlerts?.length && (
                <p className="text-center text-sm text-medical-gray-500 py-6">No active alerts</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
