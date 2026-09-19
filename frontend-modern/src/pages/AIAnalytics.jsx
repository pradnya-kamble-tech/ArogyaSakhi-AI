import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fetchDashboard } from '../services/api';
import { Activity } from 'lucide-react';

export default function AIAnalytics() {
  const [data, setData] = useState(null);
  
  useEffect(() => { 
    fetchDashboard().then(setData).catch(() => {}); 
  }, []);

  const chart = [
    { name: 'High Risk', cases: data?.highRiskCount || 0 },
    { name: 'Med Risk', cases: data?.mediumRiskCount || 0 },
    { name: 'Low Risk', cases: data?.lowRiskCount || 0 }
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 md:p-8 shadow-medical">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-medical-gray-900">System Analytics</h2>
            <p className="mt-1 text-sm text-medical-gray-600">AI prediction distribution and engine status</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-medical-green/20 bg-medical-green/10 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-medical-green animate-pulse"></div>
            <span className="text-sm font-semibold text-medical-green uppercase tracking-wider">
              {data?.engineStatus || 'Online'}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-lg border border-medical-red/20 bg-medical-red/5 p-4 text-center">
            <p className="text-sm font-semibold text-medical-red uppercase tracking-wider mb-1">High Risk</p>
            <p className="text-3xl font-bold text-medical-red">{data?.highRiskCount || 0}</p>
          </div>
          <div className="rounded-lg border border-medical-amber/20 bg-medical-amber/5 p-4 text-center">
            <p className="text-sm font-semibold text-medical-amber uppercase tracking-wider mb-1">Medium Risk</p>
            <p className="text-3xl font-bold text-medical-amber">{data?.mediumRiskCount || 0}</p>
          </div>
          <div className="rounded-lg border border-medical-green/20 bg-medical-green/5 p-4 text-center">
            <p className="text-sm font-semibold text-medical-green uppercase tracking-wider mb-1">Low Risk</p>
            <p className="text-3xl font-bold text-medical-green">{data?.lowRiskCount || 0}</p>
          </div>
        </div>

        <div className="h-80 w-full rounded-lg border border-medical-gray-100 bg-medical-soft-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" tick={{ fill: '#4B5563', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#6B7280" tick={{ fill: '#4B5563', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#0EA5E9', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="cases" stroke="#0EA5E9" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
