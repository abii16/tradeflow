import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Settings2, Activity, Zap, ArrowRight, BarChart2, Shield, BrainCircuit, Cpu } from 'lucide-react';
import { fetchPricingGovernance, updatePricingGovernance, publishRates, recalculateYield } from '../../lib/apiClient';
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

  const [yieldMetrics, setYieldMetrics] = useState({ networkYield: 2420000, variancePercent: 8.4, totalActiveFreight: 142 });
  const [historicalTrend, setHistoricalTrend] = useState<any[]>([]);
  const [aiConfidence, setAiConfidence] = useState(94.2);

  const loadData = async () => {
    try {
      const data = await fetchPricingGovernance();
      if (data.policy) {
        setFloorBound(Number(data.policy.spotRateFloor));
        setCeilBound(Number(data.policy.spotRateCeiling));
        setDieselIndex(Number(data.policy.dieselPrice));
        setDemandMultiplier(Number(data.policy.demandMultiplier));
      }
      if (data.yieldMetrics) setYieldMetrics(data.yieldMetrics);
      if (data.historicalTrend) setHistoricalTrend(data.historicalTrend);
      if (data.aiConfidenceScore) setAiConfidence(data.aiConfidenceScore);
    } catch (err) {
      toast.error('Failed to load pricing governance');
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
        toast.error('Failed to update parameters');
      } finally {
        setSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [floorBound, ceilBound, dieselIndex, demandMultiplier, loading]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await publishRates();
      toast.success(t('dp_btn_sync') + ' Successful');
    } catch (err) {
      toast.error('Failed to publish rates');
    } finally {
      setSyncing(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      await recalculateYield();
      toast.success('AI Network Optimization Complete');
      await loadData();
    } catch (err) {
      toast.error('Failed to optimize network');
    } finally {
      setOptimizing(false);
    }
  };

  // Real-time computed values
  const base1 = 142000;
  const base2 = 175000;
  const dwellSurcharge = Math.round(18500 * demandMultiplier);
  const fuelAdj = Math.round(20000 * (dieselIndex / 100));
  const computedSegment1 = base1 + dwellSurcharge;
  const computedSegment2 = base2 + fuelAdj;
  const computedTotal = computedSegment1 + computedSegment2;

  if (loading) {
    return <div className="h-full flex items-center justify-center text-slate-500">Loading AI Engine...</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
            <Cpu size={24} className="text-blue-400" /> 
            Corridor Spot & Contract Rate Governance Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage FR-04 pricing algorithms, monitor network yield, and deploy AI bounds.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOptimize}
            disabled={optimizing}
            className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 font-bold py-2.5 px-5 rounded-xl text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <BrainCircuit size={16} className={optimizing ? "animate-spin" : "animate-pulse"} />
            {optimizing ? 'Optimizing...' : 'Trigger AI Optimization'}
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing || saving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-lg shadow-blue-900/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Zap size={16} className="text-amber-300" />
            {syncing ? 'Syncing...' : 'Publish Rates to Market'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Controls & AI Status */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* AI Status Card */}
          <div className="bg-[#0B1120] rounded-2xl border border-indigo-500/20 shadow-2xl p-6 text-white relative overflow-hidden group">
            <div className="absolute -inset-px bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity blur"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-slate-300 mb-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><BrainCircuit size={16} className="text-indigo-400" /> AI Pricing Engine Status</span>
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE</span>
              </h3>
              <div className="flex items-end gap-3 mb-2">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">{aiConfidence}%</div>
                <div className="text-sm font-semibold text-slate-400 mb-1">Confidence Score</div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${aiConfidence}%` }}></div>
              </div>

              <div className="space-y-3 mt-4 text-xs font-mono">
                <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                  <span className="text-slate-400">Demand Multiplier</span>
                  <span className="font-bold text-indigo-300">{demandMultiplier}x</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                  <span className="text-slate-400">Active Network TEUs</span>
                  <span className="font-bold text-emerald-300">{yieldMetrics.totalActiveFreight} TEUs</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                  <span className="text-slate-400">24h Network Yield</span>
                  <span className="font-bold text-amber-300">ETB {(yieldMetrics.networkYield / 1000000).toFixed(2)}M</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
            {saving && <div className="absolute top-4 right-4 text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded animate-pulse">Saving...</div>}
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-sm">
              <Settings2 size={16} className="text-slate-500" />
              Algorithm Volatility Controls
            </h3>
            
            <div className="space-y-8">
              {/* Multiplier Slider */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Demand Surge Multiplier</label>
                  <span className="text-sm font-mono font-black text-indigo-600">{demandMultiplier}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.5" 
                  step="0.01"
                  value={demandMultiplier}
                  onChange={(e) => setDemandMultiplier(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 shadow-inner"
                />
              </div>

              {/* Floor Slider */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dp_floor_label')}</label>
                  <span className="text-sm font-mono font-black text-blue-600">{floorBound}%</span>
                </div>
                <input 
                  type="range" 
                  min="-30" 
                  max="0" 
                  value={floorBound}
                  onChange={(e) => setFloorBound(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 shadow-inner"
                />
              </div>

              {/* Ceiling Slider */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dp_ceil_label')}</label>
                  <span className="text-sm font-mono font-black text-rose-600">+{ceilBound}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="85" 
                  value={ceilBound}
                  onChange={(e) => setCeilBound(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500 shadow-inner"
                />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">{t('dp_diesel_label')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">ETB</span>
                  <input 
                    type="number" 
                    value={dieselIndex}
                    onChange={(e) => setDieselIndex(Number(e.target.value))}
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-semibold">
                  <Shield size={12} className="text-emerald-500" /> {t('dp_diesel_api')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown Grid & Chart */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          
          {/* Rate Comparison Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                Live Network Spot Calculation
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">Djibouti -&gt; Modjo</span>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
              
              {/* Segment 1 */}
              <div className="border border-slate-200/60 rounded-xl p-5 bg-white relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-indigo-500"></div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Transit Leg 1</div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-800 mb-6">
                  Djibouti <ArrowRight size={14} className="text-slate-300" /> Galafi
                </div>
                <div className="space-y-3 text-xs font-mono font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Rate</span>
                    <span className="text-slate-700">ETB {base1.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-indigo-500 bg-indigo-50/50 p-1.5 -mx-1.5 rounded">
                    <span>Demand Surge ({demandMultiplier}x)</span>
                    <span className="font-bold">+ ETB {dwellSurcharge.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-px bg-slate-100 my-2"></div>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>Leg Subtotal</span>
                    <span>ETB {computedSegment1.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Segment 2 */}
              <div className="border border-slate-200/60 rounded-xl p-5 bg-white relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-teal-500"></div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Transit Leg 2</div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-800 mb-6">
                  Galafi <ArrowRight size={14} className="text-slate-300" /> Modjo
                </div>
                <div className="space-y-3 text-xs font-mono font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Rate</span>
                    <span className="text-slate-700">ETB {base2.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 bg-emerald-50/50 p-1.5 -mx-1.5 rounded">
                    <span>Fuel Index Adj ({dieselIndex})</span>
                    <span className="font-bold">+ ETB {fuelAdj.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-px bg-slate-100 my-2"></div>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>Leg Subtotal</span>
                    <span>ETB {computedSegment2.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-[#0B1120] p-6 flex justify-between items-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
              <div className="flex items-center gap-3 z-10">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                <span className="font-bold text-sm text-slate-300 uppercase tracking-wider">Computed Corridor Total</span>
              </div>
              <span className="font-mono text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 z-10 drop-shadow-sm">
                ETB {computedTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Chart Mockup */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col relative overflow-hidden group">
             <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart2 size={16} className="text-slate-500" />
                AI Predictive Spot Rate Trend (30 Days)
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2.5 h-2.5 rounded bg-indigo-500 shadow-sm"></div> AI Computed Rate</span>
                <span className="flex items-center gap-1.5 text-slate-400"><div className="w-2.5 h-2.5 rounded border-2 border-slate-300"></div> Market Avg</span>
              </div>
            </div>

            {/* Trend Chart (Data from API) */}
            <div className="flex-1 w-full flex items-end justify-between gap-2 relative z-10 pt-10 pb-6 px-2">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-x-0 bottom-6 h-px bg-slate-100 border-b border-dashed border-slate-200"></div>
              <div className="absolute inset-x-0 bottom-[30%] h-px bg-slate-100 border-b border-dashed border-slate-200"></div>
              <div className="absolute inset-x-0 bottom-[60%] h-px bg-slate-100 border-b border-dashed border-slate-200"></div>
              <div className="absolute inset-x-0 bottom-[90%] h-px bg-slate-100 border-b border-dashed border-slate-200"></div>
              
              <div className="absolute left-0 bottom-[90%] -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">400K</div>
              <div className="absolute left-0 bottom-[60%] -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">300K</div>
              <div className="absolute left-0 bottom-[30%] -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">200K</div>

              {/* Bars based on historicalTrend */}
              {historicalTrend.map((data, i) => {
                const maxVal = Math.max(...historicalTrend.map(d => Math.max(d.algorithmic, d.market)));
                const h = (data.algorithmic / maxVal) * 100;
                
                return (
                  <div key={i} className="relative flex-1 group/bar flex justify-center h-full items-end">
                    <div 
                      style={{ height: `${h}%` }} 
                      className="w-full max-w-[16px] bg-gradient-to-t from-indigo-500 to-blue-400 rounded-t-md hover:from-indigo-400 hover:to-blue-300 transition-all relative shadow-sm cursor-pointer"
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0B1120] text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 z-20 pointer-events-none shadow-xl border border-slate-700 whitespace-nowrap transition-opacity">
                        ETB {(data.algorithmic / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gradient Background */}
            <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-indigo-50/50 to-transparent pointer-events-none"></div>
          </div>

        </div>
      </div>

    </div>
  );
}
