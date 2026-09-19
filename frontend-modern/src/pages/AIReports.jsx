import { useEffect, useState } from 'react';
import { fetchAlerts } from '../services/api';
import { ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export default function AIReports() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchAlerts()
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false)); 
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 md:p-8 shadow-medical">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-medical-blue-light/10">
            <FileText className="h-6 w-6 text-medical-blue-light" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-medical-gray-900">AI & Emergency Reports</h2>
            <p className="mt-1 text-sm text-medical-gray-600">Historical log of all system alerts and AI predictions.</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-medical-blue-light border-r-transparent"></div>
            </div>
          ) : alerts.length > 0 ? (
            alerts.map((a) => (
              <div key={a.id} className="group relative flex flex-col sm:flex-row gap-4 rounded-lg border border-medical-gray-200 bg-medical-white p-5 shadow-sm transition hover:border-medical-blue-light/50 hover:shadow-md">
                <div className="flex-shrink-0">
                  {a.alert_type?.toLowerCase().includes('emergency') || a.priority === 'HIGH' ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-medical-red/10 text-medical-red">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-medical-blue-light/10 text-medical-blue-light">
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <p className="font-bold text-medical-gray-900">{a.alert_type || 'System Report'}</p>
                    <span className="text-xs font-semibold text-medical-gray-500 bg-medical-soft-white px-2 py-1 rounded">
                      {new Date(a.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-medical-gray-700 leading-relaxed">{a.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-medical-gray-300 bg-medical-soft-white py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-medical-green mb-3" />
              <p className="text-lg font-medium text-medical-gray-900">All clear</p>
              <p className="text-sm text-medical-gray-500">No active reports or emergency alerts generated yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
