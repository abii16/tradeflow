import React from 'react';
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

export default function ControlTowerDashboard() {
  return (
    <div className="space-y-6">
      
      {/* Row 1: KPI Metric Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-mono font-bold text-slate-900">142</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                +12.5%
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mb-0.5">Active In-Transit Assets</div>
            <div className="text-[11px] text-slate-400">4 corridors active</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500">
            <Truck size={18} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-xl font-mono font-bold text-slate-900 mb-1">ETB 356,229.54</div>
            <div className="text-xs font-semibold text-slate-600 mb-0.5">Avg Corridor Spot Rate</div>
            <div className="text-[11px] text-slate-400">Djibouti -&gt; Modjo baseline</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
            <CircleDollarSign size={18} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-bold text-slate-900 mb-1">98.28%</div>
            <div className="text-xs font-semibold text-slate-600 mb-0.5">Deep ETA Reliability</div>
            <div className="text-[11px] text-slate-400">MAE: 0.50h accuracy</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
            <Clock size={18} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-bold text-slate-900 mb-1">12 Cleared</div>
            <div className="text-xs font-semibold text-slate-600 mb-0.5">Customs Verification Queue</div>
            <div className="text-[11px] text-slate-400">Galafi station throughput</div>
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
                Spot Pricing Optimizer
              </h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">FR-04</span>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Route A (Direct)</div>
                  <div className="text-[10px] text-slate-500">Djibouti -&gt; Awash -&gt; Modjo</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-slate-900">ETB 345,000</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">-5.0% Variance</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Route B (Bypass)</div>
                  <div className="text-[10px] text-slate-500">Djibouti -&gt; Dire Dawa -&gt; Modjo</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-slate-900">ETB 362,500</div>
                  <div className="text-[10px] text-rose-600 font-semibold">+4.8% Variance</div>
                </div>
              </div>
            </div>

            <button className="w-full mt-4 bg-[#0F172A] text-white text-xs font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
              Recalculate Network Yield
            </button>
          </div>

          {/* Card B: Deep ETA Projection */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-slate-500" />
                Deep ETA Projection
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <MapPin size={14} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-semibold text-slate-900">Modjo Dry Port</span>
                    <span className="text-xs font-mono font-bold text-blue-600">Est. 14:30 EAT</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[85%] rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <MapPin size={14} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-semibold text-slate-900">Galafi Border</span>
                    <span className="text-xs font-mono font-bold text-slate-700">Est. 21:00 EAT</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 w-[30%] rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Model Confidence Interval</span>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">99.1%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Verification Registry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Verification Registry (FR-01.4)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Audit log of entity applications and customs clearances.</p>
          </div>
          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
            Queue
            <span className="bg-slate-600 text-white text-[10px] px-1.5 rounded-full">12</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Application ID</th>
                <th className="px-6 py-3 font-semibold">Entity / Transporter</th>
                <th className="px-6 py-3 font-semibold">License / TIN</th>
                <th className="px-6 py-3 font-semibold">Verification Status</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-semibold text-slate-900">REQ-8492</td>
                <td className="px-6 py-4 font-medium text-slate-900">TransHorn Logistics</td>
                <td className="px-6 py-4 font-mono text-xs">TIN-ET-99421A</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Pending Verification
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 font-semibold text-xs hover:text-blue-700 flex items-center justify-end gap-1 ml-auto">
                    Review & Validate <ChevronRight size={14} />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-semibold text-slate-900">REQ-8491</td>
                <td className="px-6 py-4 font-medium text-slate-900">Addis Freightways</td>
                <td className="px-6 py-4 font-mono text-xs">TIN-ET-10294B</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    <AlertTriangle size={10} className="text-rose-500" />
                    Mismatch Detected
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 font-semibold text-xs hover:text-blue-700 flex items-center justify-end gap-1 ml-auto">
                    Review & Validate <ChevronRight size={14} />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-semibold text-slate-900">REQ-8488</td>
                <td className="px-6 py-4 font-medium text-slate-900">Ethio-Djibouti Carriers</td>
                <td className="px-6 py-4 font-mono text-xs">TIN-DJ-55102C</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    <ShieldCheck size={10} className="text-emerald-500" />
                    Verified
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
