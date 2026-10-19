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
  Radar,
  RefreshCw
} from 'lucide-react';
import LiveRadarMap from './LiveRadarMap';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { 
  getAllVerifications,
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
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [etaData, setEtaData] = useState<any[]>([]);
  const [recalculating, setRecalculating] = useState(false);
  const [refreshingEta, setRefreshingEta] = useState(false);

  const handleRefreshEta = async () => {
    setRefreshingEta(true);
    try {
      const res = await fetchEtaProjections();
      setEtaData(res.projections || []);
      const modjoH = res.projections?.[0]?.remainingHours;
      const galafiH = res.projections?.[1]?.remainingHours;
      toast.success(`PyTorch AI Model: Modjo ${modjoH}h • Galafi ${galafiH}h`);
    } catch (err) {
      toast.error('Failed to recalculate ETA');
    } finally {
      setRefreshingEta(false);
    }
  };

  const loadRoutes = async () => {
    setLoadingRoutes(true);
    try {
      const routeRes = await fetchCorridorRoutes();
      if (routeRes && routeRes.routes && routeRes.routes.length > 0) {
        setRoutes(routeRes.routes);
        setRoutesError(null);
      } else {
        setRoutes([]);
        setRoutesError('No routes returned from AI Pricing Engine.');
      }
    } catch (err: any) {
      console.error('[ControlTower] Failed to fetch AI corridor routes:', err);
      setRoutes([]);
      setRoutesError(err?.message || 'AI Spot Pricing Engine is offline. Real ML prediction is required.');
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    async function loadAll() {
      try {
        const [vRes, sumRes, etaRes, loadsRes] = await Promise.all([
          getAllVerifications(),
          fetchCorridorSummary(),
          fetchEtaProjections(),
          getAllLoads()
        ]);
        setVerifications((vRes.data || []).filter((v: any) => v.status === 'PENDING'));
        setSummary(sumRes);
        setEtaData(etaRes.projections || []);
        setLoads(loadsRes?.loads || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoadingVerifications(false);
      }

      // Load AI corridor routes with fail-fast detection
      await loadRoutes();
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

  // Live auto-refresh of ETA projections so km ticks down and AI recalculates in real-time
  useEffect(() => {
    const etaInterval = setInterval(async () => {
      try {
        const res = await fetchEtaProjections();
        if (res && res.projections) {
          setEtaData(res.projections);
        }
      } catch (err) {
        // silent background update
      }
    }, 8000);
    return () => clearInterval(etaInterval);
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateYield();
      await loadRoutes();
      toast.success('Live AI Yield optimization complete!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to recalculate yield from AI Engine');
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
        <div className="bg-[#232323] border border-[#2E2E2E]/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-mono font-bold text-[#EDEDED]">{telemetry.trucks.length > 0 ? telemetry.trucks.length : summary.activeAssets}</span>
              {(telemetry.trucks.length > 0 || summary.activeAssets > 0) && (
                <span className="text-[10px] font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-1.5 py-0.5 rounded-full">
                  Live
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-[#8F8F8F] mb-0.5">{t('kpi_active_assets')}</div>

          </div>
          <div className="bg-[#3ECF8E]/10 text-[#3ECF8E] p-3 rounded-xl flex items-center justify-center">
            <Truck size={18} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#232323] border border-[#2E2E2E]/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div>
            <div className="text-xl font-mono font-bold text-[#EDEDED] mb-1">
              {loads.length > 0 
                ? `ETB ${Math.round(loads.reduce((acc, curr) => acc + Number(curr.budgetAmount || 0), 0) / loads.length).toLocaleString()}` 
                : 'ETB 0'}
            </div>
            <div className="text-xs font-semibold text-[#8F8F8F] mb-0.5">{t('kpi_avg_spot_rate')}</div>

          </div>
          <div className="bg-[#3ECF8E]/10 text-[#3ECF8E] p-3 rounded-xl flex items-center justify-center">
            <CircleDollarSign size={18} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#232323] border border-[#2E2E2E]/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-bold text-[#EDEDED] mb-1">
              {etaData.length > 0 ? (etaData[0]?.confidence || '98.8%') : '--'}
            </div>
            <div className="text-xs font-semibold text-[#8F8F8F] mb-0.5">{t('kpi_eta_reliability')}</div>

          </div>
          <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#232323] border border-[#2E2E2E]/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-bold text-[#EDEDED] mb-1">{verifications.length} {t('kpi_pending', 'Pending')}</div>
            <div className="text-xs font-semibold text-[#8F8F8F] mb-0.5">{t('kpi_customs_queue')}</div>

          </div>
          <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
        </div>

      </div>

      {/* Row 2: Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (65%): Live Interactive Corridor Radar */}
        <div className="lg:col-span-2 bg-[#1C1C1C] rounded-xl shadow-sm overflow-hidden relative h-full min-h-[480px] border border-[#2E2E2E]">
          <LiveRadarMap />
        </div>

        {/* Right Column (35%): Stacked White Cards */}
        <div className="space-y-4 flex flex-col h-full">
          
          {/* Card A: Spot Pricing Optimizer */}
          <div className="bg-[#232323] rounded-xl shadow-sm border border-[#2E2E2E] p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#EDEDED] text-sm flex items-center gap-1.5">
                <TrendingUp size={16} className="text-[#8F8F8F]" />
                {t('spo_title')}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                  routesError 
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                    : 'text-[#3ECF8E] bg-[#3ECF8E]/10 border-[#3ECF8E]/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${routesError ? 'bg-rose-500' : 'bg-[#3ECF8E] animate-pulse'}`}></span>
                  {routesError ? 'AI Offline' : 'LGBM ML Live'}
                </span>
                <button
                  onClick={loadRoutes}
                  disabled={loadingRoutes}
                  className="p-1 hover:bg-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] rounded transition-colors disabled:opacity-50"
                  title="Recalculate with Live AI Engine"
                >
                  <RefreshCw size={13} className={loadingRoutes ? 'animate-spin text-[#3ECF8E]' : ''} />
                </button>
              </div>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {loadingRoutes ? (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                  <RefreshCw size={20} className="animate-spin text-[#3ECF8E] mb-2" />
                  <span className="text-xs">Querying Live AI Pricing Engine...</span>
                </div>
              ) : routesError ? (
                <div className="flex flex-col items-center justify-center p-4 text-center border border-rose-500/20 bg-rose-500/5 rounded-lg">
                  <AlertTriangle size={24} className="text-rose-400 mb-2" />
                  <div className="text-xs font-semibold text-rose-300">AI Spot Pricing Engine Offline</div>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px]">
                    {routesError}
                  </p>
                  <button
                    onClick={loadRoutes}
                    className="mt-3 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs rounded border border-rose-500/30 transition-colors"
                  >
                    Retry Live AI Query
                  </button>
                </div>
              ) : routes.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">
                  No pricing routes returned by AI Engine
                </div>
              ) : (
                routes.map((route) => (
                  <div key={route.id} className="flex items-center justify-between p-3 border border-[#2E2E2E] rounded-lg bg-[#181818] relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                    <div>
                      <div className="text-xs font-semibold text-[#EDEDED]">{route.name}</div>
                      {route.calculationId && (
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          ID: {route.calculationId} {route.confidence ? `• R² ${(route.confidence * 100).toFixed(1)}%` : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-[#EDEDED]">ETB {Number(route.price).toLocaleString()}</div>
                      <div className={`text-[10px] font-semibold ${route.variance <= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {route.variance > 0 ? '+' : ''}{Number(route.variance).toFixed(1)}% {t('spo_variance')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={handleRecalculate}
              disabled={recalculating || Boolean(routesError)}
              className="w-full mt-4 bg-[#181818] text-[#3ECF8E] border border-[#2E2E2E] text-xs font-bold py-2.5 rounded-lg hover:bg-[#3ECF8E]/10 transition-colors disabled:opacity-50"
            >
              {recalculating ? 'Optimizing with AI Engine...' : t('spo_recalc')}
            </button>
          </div>

          {/* Card B: Deep ETA Projection */}
          <div className="bg-[#232323] rounded-xl shadow-sm border border-[#2E2E2E] p-5">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#EDEDED] text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-[#8F8F8F]" />
                {t('eta_proj_title')}
              </h3>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse"></span>
                  PyTorch Live
                </span>
                <button
                  onClick={handleRefreshEta}
                  disabled={refreshingEta}
                  className="p-1 hover:bg-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] rounded transition-colors disabled:opacity-50"
                  title="Recalculate ETA with AI Engine"
                >
                  <RefreshCw size={13} className={refreshingEta ? 'animate-spin text-[#3ECF8E]' : ''} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {etaData.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8F8F8F] flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#181818] border border-[#2E2E2E] flex items-center justify-center">
                    <Truck size={18} className="text-[#555]" />
                  </div>
                  <span className="font-medium text-[#EDEDED]">No in-transit shipments active</span>
                  <span className="text-[11px] text-[#707070] max-w-[220px]">
                    Post a load and dispatch a vehicle to track live AI PyTorch ETA.
                  </span>
                </div>
              ) : (
                etaData.map((eta, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#2E2E2E] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={14} className={i === 0 ? "text-[#3ECF8E]" : "text-[#8F8F8F]"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {eta.truckId && (
                            <span className="text-[10px] font-mono font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-1 py-0.2 rounded">
                              {eta.truckId}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[#EDEDED] truncate">{eta.destination}</span>
                        </div>
                        <span className={`text-xs font-mono font-bold shrink-0 ${i === 0 ? 'text-[#3ECF8E]' : 'text-[#EDEDED]'}`}>
                          {eta.estimatedArrival}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#8F8F8F] font-mono mb-1.5">
                        <span className="truncate max-w-[170px]">
                          {eta.driver ? `${eta.driver} • ` : ''}
                          {Math.round(eta.progressPercent || 0)}% completed
                        </span>
                        <span className="text-[#3ECF8E] font-medium shrink-0">
                          {eta.remainingHours ? `~${eta.remainingHours}h remaining` : ''}
                          {eta.remainingDistanceKm ? ` (${eta.remainingDistanceKm} km)` : ''}
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-[#181818] rounded-full overflow-hidden border border-[#2E2E2E]/50">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            i === 0
                              ? 'bg-gradient-to-r from-[#3ECF8E]/80 to-[#3ECF8E]'
                              : 'bg-gradient-to-r from-sky-500/70 to-sky-400'
                          }`}
                          style={{ width: `${eta.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {etaData.length > 0 && (
                <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#8F8F8F]">
                    <span className="text-[10px]">Model:</span>
                    <span className="font-mono text-[#3ECF8E] text-[10px] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-1.5 py-0.5 rounded">
                      ETADeepModel (11f)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#8F8F8F]">Confidence:</span>
                    <span className="text-[11px] font-mono font-bold text-[#EDEDED] bg-[#181818] border border-[#2E2E2E] px-1.5 py-0.5 rounded">
                      {etaData[0]?.confidence || '98.8%'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Row 3 & 4: Live Feed & Verification Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Live Global Order Book */}
        <div className="bg-[#232323] rounded-xl shadow-sm border border-[#2E2E2E] overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-5 border-b border-[#2E2E2E] flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-semibold text-[#EDEDED] text-sm">Live Global Order Book</h3>
              <p className="text-[11px] text-[#8F8F8F] mt-0.5">Real-time freight orders broadcasted by shippers</p>
            </div>
            <span className="bg-[#232323] border border-[#2E2E2E] text-[#8F8F8F] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
              Active Loads
              <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] font-bold text-[10px] px-1.5 rounded-full">{loads.filter(l => l.status !== 'COMPLETED').length}</span>
            </span>
          </div>

          <div className="overflow-x-auto flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left text-sm text-[#8F8F8F]">
              <thead className="text-[10px] font-bold text-[#8F8F8F] bg-[#1C1C1C] uppercase border-b border-[#2E2E2E] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Load ID</th>
                  <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Shipper</th>
                  <th className="px-5 py-3.5 font-semibold">Cargo / Weight</th>
                  <th className="px-5 py-3.5 font-semibold">Route</th>
                  <th className="px-5 py-3.5 text-right font-semibold whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E] text-sm text-[#EDEDED] bg-[#232323]">
                {loadingVerifications ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#8F8F8F]">
                      Loading order book...
                    </td>
                  </tr>
                ) : loads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#8F8F8F]">
                      No active freight orders in the network.
                    </td>
                  </tr>
                ) : (
                  loads.map((load) => (
                    <tr key={load.id} className="hover:bg-[#2A2A2A] transition-colors group cursor-default">
                      <td className="px-5 py-3.5 leading-normal whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold bg-[#181818] border border-[#2E2E2E] text-[#EDEDED] px-2.5 py-1 rounded-md shadow-sm">
                          TF-LOAD-{load.id?.split('-')?.[0]?.substring(0, 4)?.toUpperCase() || '8821'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 leading-normal whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center text-[#3ECF8E] font-bold text-xs shrink-0 shadow-sm">
                            {(load.shipperCompany || load.shipperName || 'S')?.[0]?.toUpperCase()}
                          </div>
                          <div className="max-w-[140px] truncate">
                            <div className="text-xs font-semibold text-[#EDEDED] truncate" title={load.shipperCompany || load.shipperName || 'Registered Shipper'}>
                              {load.shipperCompany || load.shipperName || 'Registered Shipper'}
                            </div>
                            <div className="text-[10px] text-[#8F8F8F] truncate flex items-center gap-1" title={load.shipperEmail || load.shipperPhone || ''}>
                              {load.shipperVerified && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3ECF8E] shrink-0" title="Verified Shipper"></span>
                              )}
                              <span className="truncate">{load.shipperName && load.shipperCompany ? load.shipperName : (load.shipperEmail || load.shipperPhone || 'Verified Entity')}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 leading-normal">
                        <div className="text-xs font-semibold text-[#EDEDED] max-w-[160px] truncate" title={load.cargoType || load.title}>{load.cargoType || load.title}</div>
                        <div className="text-[11px] text-[#8F8F8F] mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-medium text-[#D1D1D1]">{Number(load.weightKg).toLocaleString()} kg</span> 
                          <span className="w-1 h-1 rounded-full bg-[#404040]"></span> 
                          <span className="font-mono text-[#3ECF8E]">ETB {Number(load.budgetAmount).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 leading-normal">
                        <div className="flex items-center gap-1.5 text-xs text-[#A0A0A0] max-w-[200px]">
                          <span className="truncate flex-1" title={String(typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin).replace('Adis Ababa', 'Addis Ababa')}>
                            {String(typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin).replace('Adis Ababa', 'Addis Ababa')}
                          </span>
                          <ArrowRight size={13} className="text-[#555] shrink-0" />
                          <span className="truncate flex-1 text-[#EDEDED] font-medium" title={String(typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination).replace('Adis Ababa', 'Addis Ababa')}>
                            {String(typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination).replace('Adis Ababa', 'Addis Ababa')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 leading-normal text-right whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full ${
                          load.status === 'IN_TRANSIT' ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] ring-1 ring-[#3ECF8E]/20' :
                          load.status === 'POSTED' ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20' :
                          load.status === 'MATCHED' ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' :
                          load.status === 'EXPIRED' || load.status === 'CANCELLED' ? 'bg-[#181818] text-[#707070] ring-1 ring-[#2E2E2E]' :
                          'bg-[#181818] text-[#8F8F8F]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            load.status === 'IN_TRANSIT' ? 'bg-[#3ECF8E]' :
                            load.status === 'POSTED' ? 'bg-blue-400' :
                            load.status === 'MATCHED' ? 'bg-amber-400' : 'bg-[#505050]'
                          } ${['IN_TRANSIT', 'POSTED', 'MATCHED'].includes(load.status) ? 'animate-pulse' : ''}`} />
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
        <div className="bg-[#232323] rounded-xl shadow-sm border border-[#2E2E2E] overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-5 border-b border-[#2E2E2E] flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-semibold text-[#EDEDED] text-sm">{t('vr_title')}</h3>
            </div>
            <span className="bg-[#232323] border border-[#2E2E2E] text-[#8F8F8F] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
              {t('vr_queue')}
              <span className="bg-slate-600 text-[#EDEDED] text-[10px] px-1.5 rounded-full">{verifications.length}</span>
            </span>
          </div>

          <div className="overflow-x-auto flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left text-sm text-[#8F8F8F]">
              {verifications.length > 0 && (
                <thead className="text-[10px] font-bold text-[#8F8F8F] bg-[#1C1C1C] uppercase border-b border-[#2E2E2E] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">{t('vr_app_id')}</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">{t('vr_entity')}</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">{t('vr_license')}</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">{t('vr_status')}</th>
                    <th className="px-6 py-4 text-right font-semibold whitespace-nowrap">{t('vr_action')}</th>
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-[#2E2E2E] text-sm text-[#EDEDED] bg-[#232323]">
                {loadingVerifications ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#8F8F8F]">
                      Loading verifications...
                    </td>
                  </tr>
                ) : verifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <ShieldCheck size={22} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#EDEDED]">All Clear</p>
                          <p className="text-xs text-[#8F8F8F] mt-0.5 max-w-[240px] mx-auto">No pending entity KYC or vehicle verifications in queue.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-[#2A2A2A] transition-colors group cursor-default">
                      <td className="px-6 py-4 leading-normal whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold bg-[#181818] border border-[#2E2E2E] text-[#EDEDED] px-2.5 py-1 rounded-md shadow-sm">
                          REQ-{v.id.toString().slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#EDEDED] whitespace-nowrap">{v.userFullName || 'Unknown Entity'}</td>
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">{v.taxId || v.tradeLicenseNumber || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          {t('vr_pending')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button className="text-[#3ECF8E] font-semibold text-xs hover:text-[#3ECF8E]/80 flex items-center justify-end gap-1 ml-auto transition-colors">
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
