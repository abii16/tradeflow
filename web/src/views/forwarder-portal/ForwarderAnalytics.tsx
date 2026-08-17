import React from 'react';
import { Package, Clock, ShieldCheck, DollarSign, TrendingUp, TrendingDown, Activity, Star, AlertTriangle } from 'lucide-react';

export default function ForwarderAnalytics() {
  const kpis = [
    { label: 'Total TEU Volume', value: '1,240 TEUs', change: '+14.2%', changeType: 'positive', icon: Package, subtitle: 'MoM Growth' },
    { label: 'Avg Customs Clearance Time', value: '4.2 Hours', change: '-4.3h', changeType: 'positive', icon: Clock, subtitle: 'Down from 8.5h' },
    { label: 'Carrier Compliance Rate', value: '96.4%', change: '+2.1%', changeType: 'positive', icon: ShieldCheck, subtitle: 'On-time delivery' },
    { label: 'Total Escrow Facilitated', value: 'ETB 18.45M', change: '+8.4%', changeType: 'positive', icon: DollarSign, subtitle: 'Active Escrow' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 h-full flex flex-col">
      <div className="mb-2 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-inter">Forwarder Throughput & Performance (FR-07, FR-09)</h1>
        <p className="text-sm text-slate-500 font-inter mt-1">Analytics overview for corridor logistics and carrier performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
                  <Icon size={20} className="text-slate-600" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md shadow-sm ${kpi.changeType === 'positive' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                  {kpi.changeType === 'positive' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-sm font-bold text-slate-500">{kpi.label}</div>
              <div className="text-2xl font-bold text-slate-900 font-inter mt-1 tracking-tight">{kpi.value}</div>
              <div className="text-xs font-semibold text-slate-400 mt-2">{kpi.subtitle}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[450px]">
        {/* Chart 1 Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-inter">Monthly Clearance Speed & Volume Trends</h3>
              <p className="text-xs text-slate-500 font-medium">Djibouti Port vs Galafi Checkpoint throughput</p>
            </div>
            <button className="text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 p-2 rounded-lg border border-slate-200"><Activity size={18}/></button>
          </div>
          
          <div className="flex-1 relative flex pt-8 pb-8 pl-12 pr-4 border border-slate-100 rounded-lg bg-slate-50/50">
            {/* Gridlines */}
            <div className="absolute inset-0 pt-8 pb-8 pl-12 pr-4 flex flex-col justify-between pointer-events-none">
              {[500, 400, 300, 200, 100, 0].map((val) => (
                <div key={val} className="relative w-full border-t border-dashed border-slate-200 flex-1">
                  <span className="absolute -left-10 -top-2.5 text-[10px] font-bold text-slate-400 font-mono w-8 text-right">{val}</span>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="relative w-full h-full flex justify-between items-end px-4 gap-8 z-10">
              {[
                { month: 'Jan', dj: { h: '60%', val: 300 }, gl: { h: '40%', val: 200 } },
                { month: 'Feb', dj: { h: '70%', val: 350 }, gl: { h: '45%', val: 225 } },
                { month: 'Mar', dj: { h: '85%', val: 425 }, gl: { h: '55%', val: 275 } },
                { month: 'Apr', dj: { h: '95%', val: 475 }, gl: { h: '75%', val: 375 } },
              ].map((data, i) => (
                <div key={i} className="flex-1 flex justify-center items-end gap-1.5 sm:gap-3 h-full group relative">
                  {/* DJ Bar */}
                  <div className="w-full max-w-[40px] bg-blue-400 rounded-t-sm transition-all hover:bg-blue-500 relative flex flex-col justify-end group/bar shadow-sm border border-blue-500/20" style={{ height: data.dj.h }}>
                    <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 font-mono">
                      {data.dj.val} TEUs
                    </div>
                  </div>
                  {/* GL Bar */}
                  <div className="w-full max-w-[40px] bg-indigo-500 rounded-t-sm transition-all hover:bg-indigo-600 relative flex flex-col justify-end group/bar shadow-sm border border-indigo-600/20" style={{ height: data.gl.h }}>
                    <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 font-mono">
                      {data.gl.val} TEUs
                    </div>
                  </div>
                  {/* Label */}
                  <div className="absolute -bottom-7 text-xs font-bold text-slate-500">{data.month}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mt-6 shrink-0">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-400 shadow-sm"></span><span className="text-xs font-bold text-slate-700">Djibouti Volume</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-500 shadow-sm"></span><span className="text-xs font-bold text-slate-700">Galafi Volume</span></div>
          </div>
        </div>

        {/* Chart 2 Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex flex-col h-full overflow-hidden">
          <div className="mb-6 shrink-0">
            <h3 className="text-base font-bold text-slate-900 font-inter">Transporter Performance Scorecard</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">FR-09 benchmarking carrier ratings and incident counts</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50">
            <ul className="space-y-4">
              {[
                { name: 'Kangaroo Freight', score: 98, incidents: 0, rating: 4.9 },
                { name: 'Tana Logistics', score: 94, incidents: 1, rating: 4.8 },
                { name: 'Abyssinia Transit', score: 88, incidents: 2, rating: 4.7 },
                { name: 'BlueNile Freighters', score: 82, incidents: 3, rating: 4.5 },
                { name: 'Ethio-Djibouti Line', score: 76, incidents: 5, rating: 4.2 },
                { name: 'Rift Valley Carriers', score: 72, incidents: 6, rating: 4.0 },
              ].map((carrier, idx) => (
                <li key={idx} className="flex flex-col gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{carrier.name}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Star size={12} className="fill-amber-500" /> {carrier.rating}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 uppercase tracking-wider text-[10px]">Compliance Score</span>
                      <span className="font-mono text-slate-900">{carrier.score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                      <div 
                        className={`h-full rounded-full ${carrier.score > 90 ? 'bg-emerald-500' : carrier.score > 80 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                        style={{ width: `${carrier.score}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={12} className={carrier.incidents > 0 ? "text-amber-500" : "text-slate-300"} />
                      YTD Incidents
                    </span>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${carrier.incidents === 0 ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {carrier.incidents}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
