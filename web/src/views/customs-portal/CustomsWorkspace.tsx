import React, { useState } from 'react';
import { ChevronRight, AlertTriangle, Lock, Map, Search, Filter, CheckCircle2 } from 'lucide-react';

export default function CustomsWorkspace() {
  const [activeManifestId, setActiveManifestId] = useState('TFM-9943');

  const queue = [
    { id: 'TFM-9942', forwarder: 'Horn of Africa Logistics', eta: '14:30 EAT', status: 'Pending Review', color: 'amber' },
    { id: 'TFM-9943', forwarder: 'Red Sea Transport', eta: '15:00 EAT', status: 'Flagged Discrepancy', color: 'rose' },
    { id: 'TFM-9944', forwarder: 'Ethio-Djibouti Freight', eta: '16:15 EAT', status: 'Pending Review', color: 'amber' },
    { id: 'TFM-9940', forwarder: 'Abyssinia Transit', eta: '12:10 EAT', status: 'Cleared', color: 'emerald' },
  ];

  const getStatusClasses = (color: string) => {
    switch (color) {
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rose': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* LEFT COLUMN: Incoming Manifest Queue */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900">Incoming Manifest Queue</h3>
            <p className="text-xs text-slate-500 mt-1">Select a manifest to run automated checks (FR-06.3)</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm transition-colors">
              <Filter size={16} />
            </button>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Manifest ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Freight Forwarder</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">ETA at Galafi</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Verification Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((row) => {
                const isActive = activeManifestId === row.id;
                return (
                  <tr 
                    key={row.id} 
                    className={`group cursor-pointer transition-colors ${isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                    onClick={() => setActiveManifestId(row.id)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-slate-900">{row.id}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700">{row.forwarder}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-slate-600">{row.eta}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border shadow-sm ${getStatusClasses(row.color)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                      }`}>
                        {row.status === 'Cleared' ? 'View Pass' : isActive ? 'Active Selection' : 'Select'}
                        {!isActive && row.status !== 'Cleared' && <ChevronRight size={14} className="opacity-70" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: Automated Consistency Checker */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-sm">
        {activeManifestId === 'TFM-9943' ? (
          <>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center shadow-sm">
                  <AlertTriangle size={16} className="text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Selected Manifest: {activeManifestId}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Automated Consistency Checker</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Alert Box */}
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-5 shadow-sm">
                <h4 className="flex items-center gap-2 text-sm font-bold text-rose-800 mb-4">
                  <AlertTriangle size={18} />
                  ⚠️ WEIGHT DISCREPANCY DETECTED (FR-06.2)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/60 p-3 rounded border border-rose-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Declared Weight (T1)</div>
                    <div className="font-mono text-lg font-bold text-slate-800">24,500 kg</div>
                  </div>
                  <div className="bg-white/60 p-3 rounded border border-rose-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Scale Reading (Galafi #2)</div>
                    <div className="font-mono text-lg font-bold text-slate-800">26,150 kg</div>
                  </div>
                  <div className="bg-white/60 p-3 rounded border border-rose-100 flex flex-col justify-center">
                    <div className="text-[10px] uppercase font-bold text-rose-600 mb-1 tracking-wider">Calculated Variance</div>
                    <div className="font-mono text-lg font-bold text-rose-700">+6.73% (+1,650 kg)</div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs font-bold text-[#DC2626] bg-white/60 border border-rose-200 py-2 px-3 rounded shadow-sm inline-block">
                  Exceeds 2% Regulatory Tolerance Threshold
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cargo Declaration</div>
                  <div className="text-sm font-medium text-slate-800">Industrial Machinery & Spare Parts</div>
                </div>
                
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Smart E-Seal Integrity</div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-xs font-bold shadow-sm w-fit">
                    <Lock size={12} className="text-emerald-500" />
                    🔒 Intact (E-Seal ID: GL-88910 - No Tampering)
                  </div>
                </div>
              </div>

              {/* Mini Map */}
              <div className="rounded-lg border border-slate-200 overflow-hidden relative shadow-sm group bg-slate-100 h-40 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div className="flex flex-col items-center gap-2 z-10">
                  <Map size={32} className="text-slate-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-500 bg-white/80 px-2 py-1 rounded backdrop-blur border border-slate-200">Satellite Snapshot: Galafi Scale Station</span>
                </div>
                
                {/* Simulated check point highlight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 border-2 border-blue-500 rounded bg-blue-500/10 flex items-center justify-center z-10 animate-pulse">
                  <span className="text-[10px] font-bold text-blue-700 bg-white/90 px-1 rounded">Lane 2 Active</span>
                </div>
              </div>
            </div>

            {/* Action Triggers */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 shrink-0">
              <button className="flex-1 h-12 bg-[#059669] hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 border border-emerald-800/20">
                <CheckCircle2 size={18} />
                Validate & Issue Digital Transit Pass (Clear)
              </button>
              <button className="flex-1 h-12 bg-[#DC2626] hover:bg-rose-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 border border-rose-800/20">
                <AlertTriangle size={18} />
                Flag for Physical Bay Inspection (Hold)
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Search size={24} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Select a Manifest</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Click on a manifest from the incoming queue to view automated consistency checks and metadata.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
