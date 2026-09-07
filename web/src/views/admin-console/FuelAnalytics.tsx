import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplet, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { fetchFuelAnalytics, exportFuelReport } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function FuelAnalytics() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [timeframe, setTimeframe] = useState('Last 30 Days');
  const [metrics, setMetrics] = useState({
    totalFuelBurned: 42590,
    variancePercent: 3.1,
    flaggedVehiclesCount: 12
  });
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchFuelAnalytics(timeframe);
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
  }, [timeframe]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFuelReport(); // Logs the export on backend
      
      // Generate CSV
      const headers = ['Vehicle ID', 'Driver', 'Route', 'Estimated Liters', 'Actual Liters', 'Variance', 'Status'];
      const csvContent = [
        headers.join(','),
        ...vehicles.map(v => 
          `"${v.vehicleId}","${v.driverName}","${v.activeRoute}",${v.estimatedLiters},${v.actualLiters},"${v.burnProgressVariance}","${v.status}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `fuel_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between pb-4 border-b border-[#2E2E2E]">
        <div>
          <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight flex items-center gap-2">
            <Droplet size={24} className="text-[#EDEDED]" />
            Fuel Consumption Analytics (FR-07)
          </h1>
          <p className="text-xs text-[#8F8F8F] mt-0.5">
            Track estimated vs. actual fuel consumption per trip and surface efficiency trends.
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            className="border border-[#2E2E2E] rounded-lg text-sm px-3 py-2 bg-[#232323] outline-none focus:ring-2 focus:ring-slate-900"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Week">This Week</option>
            <option value="Today">Today</option>
          </select>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="bg-[#1C1C1C] text-[#EDEDED] px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-[#232323] transition-colors disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider mb-1">Total Fuel Burned</div>
              <div className="text-3xl font-black text-[#EDEDED]">{metrics.totalFuelBurned.toLocaleString()} <span className="text-sm font-normal text-[#8F8F8F]">Liters</span></div>
            </div>
            <div className="p-2 bg-[#232323] rounded-lg text-[#8F8F8F]">
              <Droplet size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
            <TrendingDown size={14} /> -4.2% from last month
          </div>
        </div>

        <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider mb-1">Avg Variance</div>
              <div className="text-3xl font-black text-[#EDEDED]">+{metrics.variancePercent}%</div>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-xs text-[#8F8F8F]">Actual burn vs ETA model estimates</div>
        </div>

        <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider mb-1">Flagged Vehicles</div>
              <div className="text-3xl font-black text-[#EDEDED]">{metrics.flaggedVehiclesCount}</div>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-xs text-[#8F8F8F]">&gt; 15% variance requiring inspection</div>
        </div>
      </div>

      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#2E2E2E] bg-[#181818] flex justify-between items-center">
          <h2 className="font-bold text-[#EDEDED]">Vehicle Efficiency Tracker</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#181818] border-b border-[#2E2E2E] text-[#8F8F8F] text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Vehicle & Driver</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Active Route</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Estimated (L)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Actual (L)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider w-48">Burn Progress</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {vehicles.map((v, idx) => {
                const percent = Math.min(100, Math.round((v.actualLiters / v.estimatedLiters) * 100));
                return (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-[#181818] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm font-bold text-[#EDEDED]">{v.vehicleId}</div>
                        <div className="text-[11px] text-[#8F8F8F]">{v.driverName}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#EDEDED]">{v.activeRoute}</td>
                      <td className="px-6 py-4 font-mono">{v.estimatedLiters}</td>
                      <td className="px-6 py-4 font-mono font-bold">{v.actualLiters}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full h-2 bg-[#2E2E2E] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${v.status === 'FLAGGED' ? 'bg-red-500' : 'bg-[#3ECF8E]'}`}
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
                          <span className="inline-flex items-center gap-1 bg-[#232323] text-[#8F8F8F] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
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
                    {v.recommendations && v.recommendations.length > 0 && (
                      <tr className="bg-indigo-50/30">
                        <td colSpan={6} className="px-6 py-3 border-t border-indigo-100/50">
                          <div className="flex items-start gap-2">
                            <Lightbulb size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">AI Efficiency Insights (FR-07.2)</div>
                              <ul className="list-disc pl-4 text-xs text-indigo-700 space-y-0.5">
                                {v.recommendations.map((rec: string, rIdx: number) => (
                                  <li key={rIdx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
