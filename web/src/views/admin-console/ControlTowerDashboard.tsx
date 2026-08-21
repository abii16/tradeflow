import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  Truck, 
  CircleDollarSign, 
  Clock, 
  ShieldCheck,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  MoreHorizontal,
  Radar
} from 'lucide-react';
import LiveRadarMap from './LiveRadarMap';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { 
  getPendingVerifications,
  fetchCorridorSummary,
  fetchCorridorRoutes,
  fetchEtaProjections,
  recalculateYield,
  getAllLoads
} from '../../lib/apiClient';

export default function ControlTowerDashboard() {
  const { t } = useTranslation();
  const { telemetry } = useLiveTelemetry();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [loads, setLoads] = useState<any[]>([]);
  
  // Live states
  const [summary, setSummary] = useState({ activeAssets: 0, corridorStatus: 'OPERATIONAL', activeAlerts: 0 });
  const [routes, setRoutes] = useState<any[]>([]);
  const [etaData, setEtaData] = useState<any[]>([]);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const [vRes, sumRes, routeRes, etaRes, loadsRes] = await Promise.all([
          getPendingVerifications(),
          fetchCorridorSummary(),
          fetchCorridorRoutes(),
          fetchEtaProjections(),
          getAllLoads()
        ]);
        setVerifications(vRes.data || []);
        setSummary(sumRes);
        setRoutes(routeRes.routes || []);
        setEtaData(etaRes.projections || []);
        setLoads(loadsRes?.loads || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoadingVerifications(false);
      }
    }
    loadAll();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tradeflow_load_posted') {
        loadAll();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateYield();
      toast.success('Yield recalculated successfully');
    } catch (err) {
      toast.error('Failed to recalculate yield');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Row 1: KPI Metric Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-mono font-bold text-slate-900">{telemetry.trucks.length > 0 ? telemetry.trucks.length : summary.activeAssets}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                +12.5%
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mb-0.5">{t('kpi_active_assets')}</div>
            <div className="text-[11px] text-slate-400">{t('kpi_active_corridors')}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500">
            <Truck size={18} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-xl font-mono font-bold text-slate-900 mb-1">
              ETB {loads.length > 0 ? Math.round(loads.reduce((acc, curr) => acc + Number(curr.budgetAmount || 0), 0) / loads.length).toLocaleString() : '356,229'}
            </div>
            <div className="text-xs font-semibold text-slate-600 mb-0.5">{t('kpi_avg_spot_rate')}</div>
            <div className="text-[11px] text-slate-400">{t('kpi_baseline')}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
            <CircleDollarSign size={18} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-bold text-slate-900 mb-1">98.28%</div>
            <div className="text-xs font-semibold text-slate-600 mb-0.5">{t('kpi_eta_reliability')}</div>
            <div className="text-[11px] text-slate-400">{t('kpi_mae_accuracy')}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
            <Clock size={18} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-bold text-slate-900 mb-1">{verifications.length} {t('kpi_pending', 'Pending')}</div>
            <div className="text-xs font-semibold text-slate-600 mb-0.5">{t('kpi_customs_queue')}</div>
            <div className="text-[11px] text-slate-400">{t('kpi_galafi_throughput')}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600">
            <ShieldCheck size={18} />
          </div>
        </div>

      </div>

      {/* Row 2: Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (65%): Live Interactive Corridor Radar */}
        <div className="lg:col-span-2 bg-[#0F172A] rounded-xl shadow-sm overflow-hidden relative h-full min-h-[480px] border border-slate-800">
          <LiveRadarMap />
        </div>

        {/* Right Column (35%): Stacked White Cards */}
        <div className="space-y-4 flex flex-col h-full">
          
          {/* Card A: Spot Pricing Optimizer */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <TrendingUp size={16} className="text-slate-500" />
                {t('spo_title')}
              </h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">FR-04</span>
            </div>

            <div className="space-y-3 flex-1">
              {routes.map((route, i) => (
                <div key={route.id} className={`flex items-center justify-between p-3 border border-slate-200 rounded-lg ${i === 0 ? 'bg-slate-50 relative overflow-hidden' : ''}`}>
                  {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{route.name}</div>
                    <div className="text-[10px] text-slate-500">{i === 0 ? t('route_a_desc') : t('route_b_desc')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-slate-900">ETB {route.price.toLocaleString()}</div>
                    <div className={`text-[10px] font-semibold ${route.variance < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {route.variance > 0 ? '+' : ''}{route.variance}% {t('spo_variance')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleRecalculate}
              disabled={recalculating}
              className="w-full mt-4 bg-[#0F172A] text-white text-xs font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {recalculating ? 'Recalculating...' : t('spo_recalc')}
            </button>
          </div>

          {/* Card B: Deep ETA Projection */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-slate-500" />
                {t('eta_proj_title')}
              </h3>
            </div>
            
            <div className="space-y-4">
              {etaData.map((eta, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <MapPin size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-semibold text-slate-900">{eta.destination}</span>
                      <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-blue-600' : 'text-slate-700'}`}>{t('eta_est')} {eta.estimatedArrival}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${i === 0 ? 'bg-blue-500' : 'bg-slate-300'} rounded-full`} style={{ width: `${eta.progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}

              {etaData.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">{t('eta_confidence')}</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{etaData[0].confidence}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Row 3 & 4: Live Feed & Verification Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Live Global Order Book */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Live Global Order Book</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Real-time freight orders broadcasted by shippers</p>
            </div>
            <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
              Active Loads
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 rounded-full">{loads.filter(l => l.status !== 'COMPLETED').length}</span>
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Load ID</th>
                  <th className="px-4 py-3 font-semibold">Cargo / Weight</th>
                  <th className="px-4 py-3 font-semibold">Route</th>
                  <th className="px-4 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingVerifications ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      Loading order book...
                    </td>
                  </tr>
                ) : loads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      No active freight orders in the network.
                    </td>
                  </tr>
                ) : (
                  loads.map((load) => (
                    <tr key={load.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-mono font-semibold text-slate-900">
                        TF-LOAD-{load.id?.split('-')?.[0]?.substring(0, 4)?.toUpperCase() || '8821'}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        <div className="text-xs truncate max-w-[120px]" title={load.cargoType || load.title}>{load.cargoType || load.title}</div>
                        <div className="text-[10px] text-slate-500">{load.weightKg} kg • ETB {Number(load.budgetAmount).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4 text-[11px] max-w-[150px] truncate" title={`${typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin} → ${typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination}`}>
                        {String(typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin).replace('Adis Ababa', 'Addis Ababa')} →<br/>{String(typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination).replace('Adis Ababa', 'Addis Ababa')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          load.status === 'POSTED' ? 'bg-emerald-50 text-emerald-700' :
                          load.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {load.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Registry Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{t('vr_title')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('vr_desc')}</p>
            </div>
            <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
              {t('vr_queue')}
              <span className="bg-slate-600 text-white text-[10px] px-1.5 rounded-full">{verifications.length}</span>
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-semibold">{t('vr_app_id')}</th>
                  <th className="px-6 py-3 font-semibold">{t('vr_entity')}</th>
                  <th className="px-6 py-3 font-semibold">{t('vr_license')}</th>
                  <th className="px-6 py-3 font-semibold">{t('vr_status')}</th>
                  <th className="px-6 py-3 text-right font-semibold">{t('vr_action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingVerifications ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      Loading verifications...
                    </td>
                  </tr>
                ) : verifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      No pending verifications at this time.
                    </td>
                  </tr>
                ) : (
                  verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                        REQ-{v.id.toString().slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{v.userFullName || 'Unknown Entity'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{v.taxId || v.tradeLicenseNumber || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          {t('vr_pending')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 font-semibold text-xs hover:text-blue-700 flex items-center justify-end gap-1 ml-auto">
                          {t('vr_review')} <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
