import React from 'react';
import { Package, Clock, ShieldCheck, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function ForwarderAnalytics() {
  const kpis = [
    { label: 'Total TEU Volume', value: '1,240 TEUs', change: '+14.2%', changeType: 'positive', icon: Package, subtitle: 'MoM Growth' },
    { label: 'Avg Customs Clearance Time', value: '4.2 Hours', change: '-4.3h', changeType: 'positive', icon: Clock, subtitle: 'Down from 8.5h' },
    { label: 'Carrier Compliance Rate', value: '96.4%', change: '+2.1%', changeType: 'positive', icon: ShieldCheck, subtitle: 'On-time delivery' },
    { label: 'Total Escrow Facilitated', value: 'ETB 18.45M', change: '+8.4%', changeType: 'positive', icon: DollarSign, subtitle: 'Active Escrow' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-inter">Forwarder Throughput & Performance (FR-07, FR-09)</h1>
        <p className="text-sm text-slate-500 font-inter mt-1">Analytics overview for corridor logistics and carrier performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Icon size={20} className="text-slate-600" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${kpi.changeType === 'positive' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                  {kpi.changeType === 'positive' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-500">{kpi.label}</div>
              <div className="text-2xl font-bold text-slate-900 font-inter mt-1 tracking-tight">{kpi.value}</div>
              <div className="text-xs font-medium text-slate-400 mt-2">{kpi.subtitle}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Chart 1 Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-inter">Monthly Clearance Speed & Volume Trends</h3>
              <p className="text-xs text-slate-500">Djibouti Port vs Galafi Checkpoint throughput</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><Activity size={18}/></button>
          </div>
          
          <div className="flex-1 border-b border-l border-slate-200 relative flex items-end p-4 gap-4 pt-10">
            {/* Simulated Chart Bars */}
            <div className="flex-1 flex justify-center items-end gap-2 h-full group relative">
              <div className="w-full bg-blue-200 rounded-t-sm h-[60%] hover:bg-blue-300 transition-colors"></div>
              <div className="w-full bg-indigo-500 rounded-t-sm h-[40%] hover:bg-indigo-600 transition-colors"></div>
              <div className="absolute -bottom-6 text-xs font-bold text-slate-400">Jan</div>
            </div>
            <div className="flex-1 flex justify-center items-end gap-2 h-full group relative">
              <div className="w-full bg-blue-200 rounded-t-sm h-[70%] hover:bg-blue-300 transition-colors"></div>
              <div className="w-full bg-indigo-500 rounded-t-sm h-[45%] hover:bg-indigo-600 transition-colors"></div>
              <div className="absolute -bottom-6 text-xs font-bold text-slate-400">Feb</div>
            </div>
            <div className="flex-1 flex justify-center items-end gap-2 h-full group relative">
              <div className="w-full bg-blue-200 rounded-t-sm h-[85%] hover:bg-blue-300 transition-colors"></div>
              <div className="w-full bg-indigo-500 rounded-t-sm h-[55%] hover:bg-indigo-600 transition-colors"></div>
              <div className="absolute -bottom-6 text-xs font-bold text-slate-400">Mar</div>
            </div>
            <div className="flex-1 flex justify-center items-end gap-2 h-full group relative">
              <div className="w-full bg-blue-200 rounded-t-sm h-[95%] hover:bg-blue-300 transition-colors"></div>
              <div className="w-full bg-indigo-500 rounded-t-sm h-[75%] hover:bg-indigo-600 transition-colors"></div>
              <div className="absolute -bottom-6 text-xs font-bold text-slate-400">Apr</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-200"></span><span className="text-xs font-medium text-slate-600">Djibouti Volume</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-500"></span><span className="text-xs font-medium text-slate-600">Galafi Volume</span></div>
          </div>
        </div>

        {/* Chart 2 Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex flex-col h-[400px]">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 font-inter">Transporter Performance Scorecard</h3>
            <p className="text-xs text-slate-500">FR-09 benchmarking carrier ratings and incident counts</p>
          </div>
          
          <div className="flex-1 overflow-auto pr-2">
            <ul className="space-y-4">
              {[
                { name: 'Kangaroo Freight', score: 98, incidents: 0, rating: 4.9 },
                { name: 'Tana Logistics', score: 94, incidents: 1, rating: 4.8 },
                { name: 'Abyssinia Transit', score: 88, incidents: 2, rating: 4.7 },
                { name: 'Ethio-Djibouti Line', score: 76, incidents: 5, rating: 4.2 },
              ].map((carrier, idx) => (
                <li key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{carrier.name}</span>
                    <span className="text-xs font-bold text-slate-500">Rating: {carrier.rating}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${carrier.score > 90 ? 'bg-emerald-500' : carrier.score > 80 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${carrier.score}%` }}></div>
                    </div>
                    <span className="text-xs font-bold font-mono w-8 text-right">{carrier.score}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {carrier.incidents} Incidents Logged YTD
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
