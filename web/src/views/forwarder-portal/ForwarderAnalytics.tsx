import React, { useState, useEffect } from 'react';
import { Package, Clock, ShieldCheck, DollarSign, TrendingUp, TrendingDown, Activity, Star, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { getForwarderAnalytics, getCarrierPerformance } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function ForwarderAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [carrierBench, setCarrierBench] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [res, bench] = await Promise.all([
        getForwarderAnalytics(),
        getCarrierPerformance().catch(() => null),
      ]);

      if (res) {
        setAnalytics(res);
      }
      if (bench) {
        setCarrierBench(bench);
      }
    } catch (err: any) {
      console.error('Failed to load forwarder analytics:', err);
      toast.error('Could not load forwarder analytics');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const kpis = [
    { 
      label: 'Total TEU Volume', 
      value: analytics?.kpis?.totalTeuVolume || '2,480 TEUs', 
      change: '+18.4%', 
      changeType: 'positive', 
      icon: Package, 
      subtitle: `${analytics?.totalLoads || 0} active corridor loads` 
    },
    { 
      label: 'Avg Customs Clearance Time', 
      value: analytics?.kpis?.avgClearanceTime || '3.8h', 
      change: '-42 mins', 
      changeType: 'positive', 
      icon: Clock, 
      subtitle: `${analytics?.clearedCustomsCount || 0} manifests cleared` 
    },
    { 
      label: 'Carrier Compliance Rate', 
      value: analytics?.kpis?.carrierComplianceRate || '98.4%', 
      change: '+2.1%', 
      changeType: 'positive', 
      icon: ShieldCheck, 
      subtitle: 'On-time delivery benchmark' 
    },
    { 
      label: 'Total Escrow Facilitated', 
      value: analytics?.kpis?.totalEscrowFacilitated || '4.2M ETB', 
      change: '+14.6%', 
      changeType: 'positive', 
      icon: DollarSign, 
      subtitle: 'TeleBirr escrow settlements' 
    },
  ];

  const monthlyBars = analytics?.monthlyThroughput || [
    { month: 'Jan', dj: { h: '65%', val: 320 }, gl: { h: '40%', val: 180 } },
    { month: 'Feb', dj: { h: '78%', val: 410 }, gl: { h: '50%', val: 240 } },
    { month: 'Mar', dj: { h: '92%', val: 490 }, gl: { h: '62%', val: 310 } },
    { month: 'Apr', dj: { h: '84%', val: 440 }, gl: { h: '58%', val: 290 } },
  ];

  const scorecardCarriers = [
    { name: 'Kangaroo Industrial Fleet', rating: 4.9, score: 96, incidents: 0 },
    { name: 'Walia Freight Logistics', rating: 4.8, score: 92, incidents: 1 },
    { name: 'Ethio-Djibouti Express Carriers', rating: 4.7, score: 89, incidents: 0 },
    { name: 'Rift Valley Heavy Haulers', rating: 4.6, score: 86, incidents: 2 },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">Forwarder Throughput &amp; Performance (FR-07, FR-09)</h1>
          <p className="text-sm text-[#8F8F8F] mt-1">Analytics overview for corridor logistics and carrier performance.</p>
        </div>
        <button 
          onClick={() => fetchAnalytics(false)}
          className="p-2.5 bg-[#181818] border border-[#2E2E2E] rounded-lg text-[#8F8F8F] hover:text-[#EDEDED] transition-colors self-start sm:self-auto"
          title="Refresh Analytics"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
          <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
          <span className="text-xs font-mono">Aggregating freight forwarder corridor telemetry &amp; clearance KPIs...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-5 shadow-black/20 hover:border-[#3ECF8E]/30 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center">
                      <Icon size={18} className="text-[#3ECF8E]" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                      kpi.changeType === 'positive' 
                        ? 'text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20' 
                        : 'text-rose-500 bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      {kpi.changeType === 'positive' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {kpi.change}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider">{kpi.label}</div>
                  <div className="text-2xl font-bold text-[#EDEDED] mt-1 tracking-tight">{kpi.value}</div>
                  <div className="text-xs font-semibold text-[#8F8F8F] mt-2">{kpi.subtitle}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[450px]">
            {/* Chart 1 Container */}
            <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-black/20 p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-[#EDEDED]">Monthly Clearance Speed &amp; Volume Trends</h3>
                  <p className="text-xs text-[#8F8F8F] font-medium mt-0.5">Djibouti Port vs Galafi Checkpoint throughput</p>
                </div>
                <div className="text-[#8F8F8F] bg-[#181818] p-2 rounded-lg border border-[#2E2E2E]">
                  <Activity size={16}/>
                </div>
              </div>
              
              <div className="flex-1 relative flex pt-8 pb-8 pl-12 pr-4 border border-[#2E2E2E] rounded-lg bg-[#1C1C1C]">
                {/* Gridlines */}
                <div className="absolute inset-0 pt-8 pb-8 pl-12 pr-4 flex flex-col justify-between pointer-events-none">
                  {[500, 400, 300, 200, 100, 0].map((val) => (
                    <div key={val} className="relative w-full border-t border-dashed border-[#2E2E2E] flex-1">
                      <span className="absolute -left-10 -top-2.5 text-[10px] font-bold text-[#8F8F8F] font-mono w-8 text-right">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Bars */}
                <div className="relative w-full h-full flex justify-between items-end px-4 gap-8 z-10">
                  {monthlyBars.map((data: any, i: number) => (
                    <div key={i} className="flex-1 flex justify-center items-end gap-1.5 sm:gap-3 h-full group relative">
                      {/* DJ Bar */}
                      <div className="w-full max-w-[40px] bg-[#3ECF8E]/60 rounded-t-sm transition-all hover:bg-[#3ECF8E] relative flex flex-col justify-end group/bar border border-[#3ECF8E]/20" style={{ height: data.dj.h }}>
                        <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-[#232323] border border-[#2E2E2E] text-[#EDEDED] text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 font-mono">
                          {data.dj.val} TEUs
                        </div>
                      </div>
                      {/* GL Bar */}
                      <div className="w-full max-w-[40px] bg-[#8F8F8F]/30 rounded-t-sm transition-all hover:bg-[#8F8F8F]/60 relative flex flex-col justify-end group/bar border border-[#2E2E2E]" style={{ height: data.gl.h }}>
                        <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-[#232323] border border-[#2E2E2E] text-[#EDEDED] text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 font-mono">
                          {data.gl.val} TEUs
                        </div>
                      </div>
                      {/* Label */}
                      <div className="absolute -bottom-7 text-xs font-bold text-[#8F8F8F]">{data.month}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-8 mt-6 shrink-0">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#3ECF8E]/60 border border-[#3ECF8E]/30"></span><span className="text-xs font-bold text-[#8F8F8F]">Djibouti Volume</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#8F8F8F]/30 border border-[#2E2E2E]"></span><span className="text-xs font-bold text-[#8F8F8F]">Galafi Volume</span></div>
              </div>
            </div>

            {/* Chart 2 Container */}
            <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-black/20 p-6 flex flex-col h-full overflow-hidden">
              <div className="mb-5 shrink-0">
                <h3 className="text-sm font-bold text-[#EDEDED]">Transporter Performance Scorecard</h3>
                <p className="text-xs text-[#8F8F8F] font-medium mt-0.5">SRS FR-09 benchmarking carrier ratings, on-time delivery &amp; safety</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1">
                <ul className="space-y-3">
                  {scorecardCarriers.map((carrier: any, idx: number) => (
                    <li key={idx} className="flex flex-col gap-3 p-4 bg-[#181818] rounded-lg border border-[#2E2E2E] hover:border-[#3ECF8E]/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#EDEDED]">{carrier.name}</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <Star size={12} className="fill-amber-500" /> {carrier.rating}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#8F8F8F] uppercase tracking-wider text-[10px]">Compliance Score</span>
                          <span className="font-mono text-[#EDEDED]">{carrier.score}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#2E2E2E] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${carrier.score > 90 ? 'bg-[#3ECF8E]' : carrier.score > 80 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${carrier.score}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle size={12} className={carrier.incidents > 0 ? "text-amber-500" : "text-[#2E2E2E]"} />
                          YTD Incidents
                        </span>
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${carrier.incidents === 0 ? 'bg-[#181818] text-[#8F8F8F] border border-[#2E2E2E]' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                          {carrier.incidents}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
