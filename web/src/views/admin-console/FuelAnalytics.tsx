import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplet, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fetchFuelAnalytics, exportFuelReport } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function FuelAnalytics() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [metrics, setMetrics] = useState({
    totalFuelBurned: 42590,
    variancePercent: 3.1,
    flaggedVehiclesCount: 12
  });
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchFuelAnalytics();
        setMetrics({
          totalFuelBurned: data.totalFuelBurned,
          variancePercent: data.variancePercent,
          flaggedVehiclesCount: data.flaggedVehiclesCount
        });
        setVehicles(data.activeVehicles || []);
      } catch (err) {
        toast.error('Failed to load fuel analytics');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFuelReport();
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

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
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Fuel Burned</div>
              <div className="text-3xl font-black text-slate-900">{metrics.totalFuelBurned.toLocaleString()} <span className="text-sm font-normal text-slate-500">Liters</span></div>
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
              <div className="text-3xl font-black text-slate-900">+{metrics.variancePercent}%</div>
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
              <div className="text-3xl font-black text-slate-900">{metrics.flaggedVehiclesCount}</div>
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
              {vehicles.map((v, idx) => {
                const percent = Math.min(100, Math.round((v.actualLiters / v.estimatedLiters) * 100));
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-bold text-slate-900">{v.vehicleId}</div>
                      <div className="text-[11px] text-slate-500">{v.driverName}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{v.activeRoute}</td>
                    <td className="px-6 py-4 font-mono">{v.estimatedLiters}</td>
                    <td className="px-6 py-4 font-mono font-bold">{v.actualLiters}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${v.status === 'FLAGGED' ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono font-bold w-10 text-right">{v.burnProgressVariance}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {v.status === 'FLAGGED' && (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <AlertTriangle size={12} /> Flagged
                        </span>
                      )}
                      {v.status === 'NORMAL' && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Normal
                        </span>
                      )}
                      {v.status === 'EFFICIENT' && (
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
