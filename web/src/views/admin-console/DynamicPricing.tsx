import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, Activity, Zap, BarChart2, Shield, BrainCircuit, Cpu, AlertTriangle, X, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { fetchPricingGovernance, updatePricingGovernance, publishRates, recalculateYield, fetchAuditLogs } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function DynamicPricing() {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const [floorBound, setFloorBound] = useState(-15);
  const [ceilBound, setCeilBound] = useState(45);
  const [dieselIndex, setDieselIndex] = useState(95.50);
  const [demandMultiplier, setDemandMultiplier] = useState(1.24);

  const [metrics, setMetrics] = useState({ networkYield24h: 2420000, activeTeus: 142 });
  const [historicalTrend, setHistoricalTrend] = useState<any[]>([]);
  const [aiConfidence, setAiConfidence] = useState(94.2);
  const [divergingContracts, setDivergingContracts] = useState<any[]>([]);

  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Compute values real-time based on SRS FR-04.1
  const base1 = 142000;
  const base2 = 175000;
  const dwellSurcharge = Math.round(18500 * demandMultiplier);
  const fuelAdj = Math.round(20000 * (dieselIndex / 100));
  const computedSegment1 = base1 + dwellSurcharge;
  const computedSegment2 = base2 + fuelAdj;
  const computedTotal = computedSegment1 + computedSegment2;

  const loadData = async () => {
    try {
      const data = await fetchPricingGovernance();
      setFloorBound(data.volatilityBounds.floor);
      setCeilBound(data.volatilityBounds.ceiling);
      setDieselIndex(data.dieselBaselineIndex);
      setDemandMultiplier(data.demandMultiplier);
      setMetrics({ networkYield24h: data.networkYield24h, activeTeus: data.activeTeus });
      setHistoricalTrend(data.historicalTrends);
      setAiConfidence(data.confidenceScore);
      setDivergingContracts(data.divergingContracts || []);
    } catch (err) {
      toast.error(t('dp_err_load', 'Failed to load pricing governance'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debounced save for sliders
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      try {
        setSaving(true);
        await updatePricingGovernance({
          spotRateFloor: floorBound,
          spotRateCeiling: ceilBound,
          dieselPrice: dieselIndex,
          demandMultiplier
        });
      } catch (err) {
        toast.error(t('dp_err_update', 'Failed to update parameters'));
      } finally {
        setSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [floorBound, ceilBound, dieselIndex, demandMultiplier, loading]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await publishRates({
        volatilityBounds: { floor: floorBound, ceiling: ceilBound },
        dieselBaselineIndex: dieselIndex,
        demandMultiplier,
        computedTotal
      });
      toast.success(t('dp_sync_success', 'Corridor rates published and synced across active marketplace.'));
    } catch (err) {
      toast.error(t('dp_err_sync', 'Failed to publish rates'));
    } finally {
      setSyncing(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      await recalculateYield();
      toast.success(t('dp_opt_success', 'AI Network Optimization Complete'));
      await loadData();
    } catch (err) {
      toast.error(t('dp_err_opt', 'Failed to optimize network'));
    } finally {
      setOptimizing(false);
    }
  };

  const openAuditDrawer = async () => {
    setAuditDrawerOpen(true);
    setLoadingAudit(true);
    try {
      const resp = await fetchAuditLogs({ action: 'PRICING_PUBLISHED', limit: 10 });
      setAuditLogs(resp.logs || []);
    } catch (err) {
      toast.error(t('dp_err_audit', 'Failed to load audit logs'));
    } finally {
      setLoadingAudit(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-slate-500">{t('dp_loading', 'Loading AI Engine...')}</div>;
  }

  // Calculate Trend SVG Path
  const maxVal = Math.max(...historicalTrend.map(d => Math.max(d.algorithmic, d.market)), 1);
  let trendSvgPath = '';
  historicalTrend.forEach((data, i) => {
    const x = ((i + 0.5) / Math.max(1, historicalTrend.length)) * 100;
    const y = 100 - (data.market / maxVal) * 100;
    trendSvgPath += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  });

  return (
    <div className="bg-slate-50/70 min-h-screen text-slate-900 p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {t('dp_title', 'Corridor Spot & Contract Governance')}
          </h2>
        </div>
        <div className="flex items-center gap-2 h-10">
          <button 
            onClick={openAuditDrawer}
            className="bg-indigo-50 hover:bg-indigo-100 text-slate-900 border border-indigo-200 shadow-sm px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Clock className="w-4 h-4 text-slate-900" /> {t('dp_btn_audit', 'Audit Logs')}
          </button>
          <button 
            onClick={handleOptimize}
            disabled={optimizing}
            className="bg-indigo-50 hover:bg-indigo-100 text-slate-900 border border-indigo-200 shadow-sm px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-slate-900 ${optimizing ? "animate-spin" : ""}`} />
            {optimizing ? t('dp_optimizing', 'Optimizing...') : t('dp_btn_optimize', 'Trigger AI Optimization')}
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing || saving}
            className="bg-indigo-50 hover:bg-indigo-100 text-slate-900 border border-indigo-200 shadow-sm px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-slate-900" />
            {syncing ? t('dp_syncing', 'Syncing...') : t('dp_btn_publish', 'Publish Rates to Marketplace')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Column: Controls & AI Status */}
        <div className="xl:col-span-1 flex flex-col space-y-6">
          
          {/* AI Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BrainCircuit size={16} className="text-indigo-600" /> 
                {t('dp_ai_status_title', 'AI Pricing Engine Status')}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● {t('dp_live_engine', 'LIVE ENGINE')}
              </span>
            </div>
            
            <div className="mb-6">
              <div className="text-3xl font-black text-slate-900 font-mono">{aiConfidence}%</div>
              <div className="text-xs font-semibold text-slate-500">{t('dp_confidence_score', 'Algorithmic Confidence Score')}</div>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
                <span className="text-slate-600 font-medium">{t('dp_demand_multiplier', 'Demand Multiplier')}</span>
                <span className="font-bold text-slate-900">{demandMultiplier}x</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
                <span className="text-slate-600 font-medium">{t('dp_active_teus', 'Active Corridor TEUs')}</span>
                <span className="font-bold text-slate-900">{metrics.activeTeus} TEUs</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
                <span className="text-slate-600 font-medium">{t('dp_network_yield', '24h Network Yield')}</span>
                <span className="font-bold text-slate-900">ETB {(metrics.networkYield24h / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </div>

          {/* Volatility & Fuel Baseline Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow transition-shadow relative flex-1">
            {saving && <div className="absolute top-4 right-4 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded animate-pulse">{t('dp_saving', 'Saving...')}</div>}
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-sm">
              <Settings2 size={16} className="text-slate-500" />
              {t('dp_controls_title', 'Volatility & Baseline Controls')}
            </h3>
            
            <div className="space-y-6">
              {/* Multiplier Slider */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dp_demand_surge_label', 'Demand Surge Multiplier')}</label>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-indigo-600">{demandMultiplier}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.01"
                  value={demandMultiplier}
                  onChange={(e) => setDemandMultiplier(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Floor Slider */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dp_floor_bound', 'Spot Rate Floor Bound')}</label>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-indigo-600">{floorBound}%</span>
                </div>
                <input 
                  type="range" 
                  min="-30" 
                  max="0" 
                  value={floorBound}
                  onChange={(e) => setFloorBound(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Ceiling Slider */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dp_ceil_bound', 'Spot Rate Surge Ceiling')}</label>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-indigo-600">+{ceilBound}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="85" 
                  value={ceilBound}
                  onChange={(e) => setCeilBound(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="pt-5 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('dp_diesel_baseline', 'Baseline Fuel Index')}</label>
                <div className="relative flex items-center">
                  <input 
                    type="number" 
                    value={dieselIndex}
                    onChange={(e) => setDieselIndex(Number(e.target.value))}
                    className="w-full h-10 pl-4 pr-16 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-xs"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-500 bg-transparent">ETB / L</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
                  <Shield size={12} className="text-emerald-500" /> {t('dp_fuel_helper', 'Live sync with National Petroleum Authority')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown Grid & Chart */}
        <div className="xl:col-span-2 flex flex-col space-y-6">
          
          {/* Rate Comparison Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow transition-shadow">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" />
                {t('dp_live_spot_title', 'Live Corridor Spot Calculation')}
              </h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
              
              {/* Segment 1 */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Leg 1</div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-5">
                  {t('dp_seg1_name', 'Djibouti ➔ Galafi')}
                </div>
                <div className="space-y-2.5 text-xs font-mono font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>{t('dp_base_rate', 'Base Rate')}</span>
                    <span className="text-slate-700">ETB {base1.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-indigo-600 bg-indigo-50/50 p-1.5 -mx-1.5 rounded">
                    <span>{t('dp_surcharge', 'Surcharge')}</span>
                    <span className="font-bold">+ ETB {dwellSurcharge.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-px bg-slate-200 my-1"></div>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>{t('dp_leg_subtotal', 'Subtotal')}</span>
                    <span>ETB {computedSegment1.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Segment 2 */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Leg 2</div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-5">
                  {t('dp_seg2_name', 'Galafi ➔ Modjo Dry Port')}
                </div>
                <div className="space-y-2.5 text-xs font-mono font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>{t('dp_base_rate', 'Base Rate')}</span>
                    <span className="text-slate-700">ETB {base2.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-indigo-600 bg-indigo-50/50 p-1.5 -mx-1.5 rounded">
                    <span>{t('dp_fuel_adj', 'Fuel Adj')}</span>
                    <span className="font-bold">+ ETB {fuelAdj.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-px bg-slate-200 my-1"></div>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>{t('dp_leg_subtotal', 'Subtotal')}</span>
                    <span>ETB {computedSegment2.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-6 pt-0">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
                <span className="font-bold text-sm text-indigo-900 uppercase tracking-wider">{t('dp_computed_total', 'Computed Corridor Total')}</span>
                <span className="text-2xl font-black text-indigo-700 font-mono">
                  ETB {computedTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex-1 flex flex-col relative overflow-hidden group hover:shadow transition-shadow">
             <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart2 size={16} className="text-slate-500" />
                {t('dp_chart_title', '30-Day Predictive Spot Rate Trend')}
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></div> {t('dp_computed_rate', 'Algorithm Computed Rate')}</span>
                <span className="flex items-center gap-1.5 text-slate-400"><div className="w-3 h-0.5 rounded-full bg-slate-400 border border-slate-400 border-dashed"></div> {t('dp_market_avg', 'Market Avg')}</span>
              </div>
            </div>

            <div className="flex-1 w-full flex items-end justify-between gap-2 md:gap-3 relative z-10 pt-10 pb-6 px-8">
              {/* SVG Trend Line for Market Avg */}
              <div className="absolute inset-0 pt-10 pb-6 px-8 pointer-events-none">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path 
                    d={trendSvgPath} 
                    fill="none" 
                    className="stroke-slate-400 stroke-[1.5] stroke-dasharray-[4,4]" 
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              
              {/* Grid Lines */}
              <div className="absolute inset-x-8 bottom-6 h-px border-b border-slate-100"></div>
              <div className="absolute inset-x-8 bottom-[30%] h-px border-b border-slate-100"></div>
              <div className="absolute inset-x-8 bottom-[60%] h-px border-b border-slate-100"></div>
              <div className="absolute inset-x-8 bottom-[90%] h-px border-b border-slate-100"></div>
              
              {/* Y-Axis Labels */}
              <div className="absolute left-0 bottom-[90%] -translate-y-1/2 text-[11px] font-medium text-slate-400">400K</div>
              <div className="absolute left-0 bottom-[60%] -translate-y-1/2 text-[11px] font-medium text-slate-400">300K</div>
              <div className="absolute left-0 bottom-[30%] -translate-y-1/2 text-[11px] font-medium text-slate-400">200K</div>

              {historicalTrend.map((data, i) => {
                const h = (data.algorithmic / maxVal) * 100;
                
                return (
                  <div key={i} className="relative flex-1 group/bar flex justify-center h-full items-end z-10">
                    <div 
                      style={{ height: `${h}%` }} 
                      className="w-1.5 md:w-2 bg-indigo-500/60 hover:bg-indigo-500/80 rounded-t-sm transition-all duration-200 relative cursor-pointer"
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 z-20 pointer-events-none whitespace-nowrap transition-opacity shadow-lg">
                        ETB {(data.algorithmic / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X-Axis Labels */}
            <div className="flex justify-between items-center px-8 mt-2 text-[11px] font-medium text-slate-400">
               <span>Day 1</span>
               <span>Day 10</span>
               <span>Day 20</span>
               <span>Day 30</span>
            </div>
          </div>
        </div>

      </div>

      {/* Contract Rate Divergence Monitor */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            {t('dp_contract_divergence_title', 'Contract Rates Divergence Monitor (FR-04.2)')}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">{t('dp_col_contract_id', 'Contract ID')}</th>
                <th className="px-6 py-3">{t('dp_col_shipper', 'Shipper Entity')}</th>
                <th className="px-6 py-3">{t('dp_col_locked', 'Locked Rate')}</th>
                <th className="px-6 py-3">{t('dp_col_spot', 'Spot Rate')}</th>
                <th className="px-6 py-3">{t('dp_col_divergence', 'Divergence %')}</th>
                <th className="px-6 py-3">{t('dp_col_status', 'Status')}</th>
                <th className="px-6 py-3 text-right rounded-tr-lg">{t('dp_col_actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {divergingContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    {t('dp_no_divergence', 'No contracts diverging >15% from current spot rate.')}
                  </td>
                </tr>
              ) : (
                divergingContracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{contract.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{contract.shipperName}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">ETB {contract.lockedRate.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">ETB {contract.currentSpot.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono font-bold text-rose-600">+{contract.divergencePct.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">
                        {contract.status === 'FLAGGED_FOR_REVIEW' ? t('dp_status_flagged', 'FLAGGED_FOR_REVIEW') : contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-indigo-200/60 transition-colors">
                          {t('dp_action_renegotiate', 'Initiate Renegotiation')}
                        </button>
                        <button className="text-slate-500 hover:text-slate-800 text-xs font-medium px-2.5 py-1.5 transition-colors">
                          {t('dp_action_dismiss', 'Dismiss')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Calculation Audit Log Drawer */}
      {auditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setAuditDrawerOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{t('dp_audit_drawer_title', 'Pricing Calculation Audit Log')}</h3>
                <p className="text-xs text-slate-500">{t('dp_audit_drawer_desc', 'Cryptographic SHA-256 price update verification (FR-04.3)')}</p>
              </div>
              <button onClick={() => setAuditDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {loadingAudit ? (
                <div className="text-center text-slate-500 py-10">{t('dp_audit_loading', 'Loading cryptographic logs...')}</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center text-slate-500 py-10">{t('dp_audit_empty', 'No pricing updates found.')}</div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-50 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-500" /> {t('dp_audit_event', 'Price Broadcast')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>{t('dp_audit_admin', 'Admin ID')}</span>
                        <span className="text-slate-900">{log.actorEmail || 'System'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>{t('dp_audit_fuel', 'Fuel Baseline')}</span>
                        <span className="text-slate-900">{log.details?.dieselBaselineIndex || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>{t('dp_audit_mult', 'Demand Mult.')}</span>
                        <span className="text-slate-900">{log.details?.demandMultiplier || 'N/A'}x</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-bold">
                        <span>{t('dp_audit_final', 'Final Rate')}</span>
                        <span className="text-indigo-600">ETB {log.details?.computedTotal?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">{t('dp_audit_hash', 'SHA-256 Integrity Hash')}</div>
                      <div className="text-[10px] font-mono text-slate-600 break-all">{log.details?.integrityHash || 'N/A'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
