import React, { useState } from 'react';
import { TrendingUp, Settings2, Activity, Zap, ArrowRight, BarChart2, Shield } from 'lucide-react';

export default function DynamicPricing() {
  const [floorBound, setFloorBound] = useState(-15);
  const [ceilBound, setCeilBound] = useState(45);
  const [dieselIndex, setDieselIndex] = useState(95.50);

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" /> 
            Corridor Spot & Contract Rate Governance Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage the FR-04 pricing algorithms and monitor network yield.</p>
        </div>
        <button className="bg-[#0F172A] hover:bg-slate-800 text-white font-semibold py-2 px-6 rounded-lg text-sm shadow-md transition-all flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          Publish & Sync Corridor Rates to Marketplace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Controls & Algorithm Parameters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <Settings2 size={16} className="text-slate-500" />
              Algorithm Volatility Controls
            </h3>
            
            <div className="space-y-6">
              {/* Floor Slider */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-semibold text-slate-700">Spot Rate Floor Bound</label>
                  <span className="text-xs font-mono font-bold text-slate-900">{floorBound}%</span>
                </div>
                <input 
                  type="range" 
                  min="-30" 
                  max="0" 
                  value={floorBound}
                  onChange={(e) => setFloorBound(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>-30%</span>
                  <span>0%</span>
                </div>
              </div>

              {/* Ceiling Slider */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-semibold text-slate-700">Spot Rate Surge Ceiling</label>
                  <span className="text-xs font-mono font-bold text-rose-600">+{ceilBound}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="85" 
                  value={ceilBound}
                  onChange={(e) => setCeilBound(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0%</span>
                  <span>+85%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700 block mb-2">Current Diesel Baseline Index (ETB/L)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">ETB</span>
                  <input 
                    type="number" 
                    value={dieselIndex}
                    onChange={(e) => setDieselIndex(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                  <Shield size={12} /> Live API sync with National Petroleum Auth.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] rounded-xl border border-slate-800 shadow-sm p-5 text-white">
            <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2 text-sm">
              <Activity size={16} className="text-emerald-400" />
              Live Network Yield
            </h3>
            <div className="text-3xl font-mono font-bold mb-1">ETB 2.42M</div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-4">
              <TrendingUp size={14} /> +8.4% vs trailing 24h
            </div>
            
            <div className="space-y-2 mt-4 text-xs font-mono">
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span className="text-slate-400">Demand Surge Mult:</span>
                <span className="font-bold">1.24x</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span className="text-slate-400">Total Active Freight:</span>
                <span className="font-bold">142 TEUs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown Grid & Chart */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* Rate Comparison Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-900 text-sm">Real-time Corridor Spot Calculation</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">Djibouti -&gt; Modjo</span>
            </div>
            
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Segment 1 */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Segment 1</div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-4">
                  Djibouti <ArrowRight size={14} className="text-slate-400" /> Galafi
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Rate:</span>
                    <span>ETB 142,000</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Dwell Surcharge:</span>
                    <span>+ ETB 18,500</span>
                  </div>
                  <div className="w-full h-px bg-slate-100 my-1"></div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm">
                    <span>Subtotal:</span>
                    <span>ETB 160,500</span>
                  </div>
                </div>
              </div>

              {/* Segment 2 */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Segment 2</div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-4">
                  Galafi <ArrowRight size={14} className="text-slate-400" /> Modjo
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Rate:</span>
                    <span>ETB 175,000</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Fuel Index Adj:</span>
                    <span>+ ETB 20,729</span>
                  </div>
                  <div className="w-full h-px bg-slate-100 my-1"></div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm">
                    <span>Subtotal:</span>
                    <span>ETB 195,729</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-slate-900 p-4 rounded-b-xl flex justify-between items-center text-white">
              <span className="font-semibold text-sm">Computed Corridor Total</span>
              <span className="font-mono text-xl font-bold text-emerald-400">ETB 356,229.54</span>
            </div>
          </div>

          {/* Chart Mockup */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-1 flex flex-col relative overflow-hidden">
             <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart2 size={16} className="text-slate-500" />
                30-Day Spot Rate Trend
              </h3>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1 text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Algorithm Rate</span>
                <span className="flex items-center gap-1 text-slate-500 ml-3"><div className="w-2 h-2 rounded-full border-2 border-slate-300"></div> Market Avg</span>
              </div>
            </div>

            {/* CSS Based Chart Mockup for pure aesthetic */}
            <div className="flex-1 w-full flex items-end justify-between gap-1 relative z-10 pt-10 pb-6 px-4">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-x-0 bottom-6 h-px bg-slate-100"></div>
              <div className="absolute inset-x-0 bottom-[30%] h-px bg-slate-100"></div>
              <div className="absolute inset-x-0 bottom-[60%] h-px bg-slate-100"></div>
              <div className="absolute inset-x-0 bottom-[90%] h-px bg-slate-100"></div>
              
              <div className="absolute left-0 bottom-[90%] -translate-y-1/2 text-[9px] font-mono text-slate-400">400K</div>
              <div className="absolute left-0 bottom-[60%] -translate-y-1/2 text-[9px] font-mono text-slate-400">300K</div>
              <div className="absolute left-0 bottom-[30%] -translate-y-1/2 text-[9px] font-mono text-slate-400">200K</div>

              {/* Bars */}
              {[40, 45, 42, 50, 55, 60, 58, 65, 70, 75, 72, 80, 85, 90, 88].map((h, i) => (
                <div key={i} className="relative flex-1 group flex justify-center h-full items-end">
                  <div 
                    style={{ height: `${h}%` }} 
                    className="w-full max-w-[12px] bg-blue-500/80 rounded-t-sm hover:bg-blue-600 transition-colors relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 z-20 pointer-events-none">
                      {Math.round(200 + h * 2)}K
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gradient Background */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-blue-50 to-transparent pointer-events-none"></div>
          </div>

        </div>
      </div>

    </div>
  );
}
