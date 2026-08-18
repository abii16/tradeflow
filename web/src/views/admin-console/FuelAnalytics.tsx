import React from 'react';
import { useTranslation } from 'react-i18next';
import { Droplet, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function FuelAnalytics() {
  const { t } = useTranslation();

  const vehicles = [
    { id: 'TRK-9021', driver: 'Abebe B.', route: 'Djibouti -> Modjo', estimated: 245, actual: 252, variance: '+2.8%', status: 'Normal' },
    { id: 'TRK-1144', driver: 'Kassa T.', route: 'Djibouti -> Dire Dawa', estimated: 180, actual: 215, variance: '+19.4%', status: 'Flagged' },
    { id: 'TRK-7732', driver: 'Dawit M.', route: 'Modjo -> Awassa', estimated: 95, actual: 92, variance: '-3.1%', status: 'Efficient' },
    { id: 'TRK-8991', driver: 'Samuel K.', route: 'Galafi -> Semera', estimated: 60, actual: 61, variance: '+1.6%', status: 'Normal' },
  ];

  return (
    <div className="max-w-[1320px] mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Droplet size={24} className="text-slate-700" />
            Fuel Consumption Analytics (FR-07)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track estimated vs. actual fuel consumption per trip and surface efficiency trends.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="border border-slate-300 rounded-lg text-sm px-3 py-2 bg-white">
            <option>Last 30 Days</option>
            <option>This Week</option>
            <option>Today</option>
          </select>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Fuel Burned</div>
              <div className="text-3xl font-black text-slate-900">42,590 <span className="text-sm font-normal text-slate-500">Liters</span></div>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Droplet size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
            <TrendingDown size={14} /> -4.2% from last month
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Variance</div>
              <div className="text-3xl font-black text-slate-900">+3.1%</div>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-xs text-slate-500">Actual burn vs ETA model estimates</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Flagged Vehicles</div>
              <div className="text-3xl font-black text-slate-900">12</div>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-xs text-slate-500">&gt; 15% variance requiring inspection</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900">Vehicle Efficiency Tracker</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Vehicle & Driver</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Active Route</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Estimated (L)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Actual (L)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider w-48">Burn Progress</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((v) => {
                const percent = Math.min(100, Math.round((v.actual / v.estimated) * 100));
                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-bold text-slate-900">{v.id}</div>
                      <div className="text-[11px] text-slate-500">{v.driver}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{v.route}</td>
                    <td className="px-6 py-4 font-mono">{v.estimated}</td>
                    <td className="px-6 py-4 font-mono font-bold">{v.actual}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${v.status === 'Flagged' ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono font-bold w-10 text-right">{v.variance}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {v.status === 'Flagged' && (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <AlertTriangle size={12} /> Flagged
                        </span>
                      )}
                      {v.status === 'Normal' && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Normal
                        </span>
                      )}
                      {v.status === 'Efficient' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Efficient
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
