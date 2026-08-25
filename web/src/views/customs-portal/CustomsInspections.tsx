import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Shield, CheckCircle2, FileText, X, CircleDot } from 'lucide-react';

export default function CustomsInspections() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeInspection, setActiveInspection] = useState<string | null>(null);
  const [toggles, setToggles] = useState({ visual: false, tamper: false, eSeal: false });

  const inspections: any[] = [];

  const getTriggerClass = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleOpenModal = (id: string) => {
    setActiveInspection(id);
    setToggles({ visual: true, tamper: true, eSeal: true }); // Mock state
    setIsModalOpen(true);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col relative">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="text-blue-600" />
          Secondary Inspection Bay & Physical Verification
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manual verification queue for overweight, doc mismatch, and flagged high-risk containers.</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-sm min-h-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900">Active Inspection Queue</h3>
            <p className="text-xs text-slate-500 mt-1">3 containers currently stationed in physical bays.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm transition-colors">
              <Filter size={16} />
            </button>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Container / ID..." 
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="w-[20%] px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">MANIFEST / CONTAINER ID</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">TRANSPORTER</th>
                <th className="w-[20%] px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">DETECTED TRIGGER</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">INSPECTION BAY</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">OFFICER ASSIGNED</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap truncate">
                    <span className="font-mono text-sm font-bold text-slate-900">{row.id}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap truncate">
                    <span className="text-sm font-medium text-slate-700">{row.transporter}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap truncate">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border shadow-sm ${getTriggerClass(row.color)}`}>
                      {colorToIcon(row.color)}
                      <span className="ml-1.5">{row.trigger}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap truncate">
                    <span className="text-sm font-medium text-slate-700">{row.bay}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap truncate">
                    <span className="text-sm font-medium text-slate-600">{row.officer}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right truncate">
                    <button 
                      onClick={() => handleOpenModal(row.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded transition-all shadow-sm bg-white text-blue-700 border border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                    >
                      [{row.action}]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Bottom Bay Capacity Status Strip */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bay 01 (Security / E-Seals)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 text-sm font-bold">
              <CircleDot size={14} className="fill-amber-500" />
              Occupied (TFM-9921)
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bay 02 (Documentation Audit)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
              <CircleDot size={14} className="fill-emerald-500" />
              Available
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bay 03 (Heavy Axle Scale)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 text-sm font-bold">
              <CircleDot size={14} className="fill-rose-500 animate-pulse" />
              Active Inspection (TFM-9943)
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm rounded-xl" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Physical Inspection Log</h3>
                  <p className="text-xs text-slate-500 font-mono font-medium">{activeInspection}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Weight Recalibration */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Re-Weighed Scale Value (kg)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value="24,550 kg"
                    readOnly
                    className="w-1/2 border border-slate-300 rounded-md p-2.5 text-sm focus:outline-none font-mono font-bold bg-white text-slate-900 shadow-inner"
                  />
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md">
                    Variance reduced to 0.2% - Within Tolerance
                  </span>
                </div>
              </div>

              {/* Contraband & Security Checks */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Contraband & Security Check</label>
                <div className="space-y-3">
                  <button 
                    onClick={() => setToggles({...toggles, visual: !toggles.visual})}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${toggles.visual ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    <span className="font-medium text-sm">Physical Bay Visual Inspection</span>
                    {toggles.visual ? <span className="font-bold text-xs bg-emerald-100 px-2 py-1 rounded">PASSED</span> : <span className="font-bold text-xs bg-slate-100 px-2 py-1 rounded">PENDING</span>}
                  </button>
                  <button 
                    onClick={() => setToggles({...toggles, tamper: !toggles.tamper})}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${toggles.tamper ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    <span className="font-medium text-sm">Cargo Tamper Inspection</span>
                    {toggles.tamper ? <span className="font-bold text-xs bg-emerald-100 px-2 py-1 rounded">PASSED</span> : <span className="font-bold text-xs bg-slate-100 px-2 py-1 rounded">PENDING</span>}
                  </button>
                  <button 
                    onClick={() => setToggles({...toggles, eSeal: !toggles.eSeal})}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${toggles.eSeal ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    <span className="font-medium text-sm">New Digital E-Seal Applied</span>
                    {toggles.eSeal ? <span className="font-bold text-xs bg-blue-100 px-2 py-1 rounded font-mono">#SEAL-ET-9941</span> : <span className="font-bold text-xs bg-slate-100 px-2 py-1 rounded">NOT APPLIED</span>}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-[#059669] hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-lg shadow-sm transition-all text-sm border border-emerald-800/20 flex justify-center items-center gap-2"
              >
                <CheckCircle2 size={18} />
                ✓ Issue Cleared Border Pass & Release Cargo
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-[#DC2626] hover:bg-rose-700 active:scale-[0.99] text-white font-semibold rounded-lg shadow-sm transition-all text-sm border border-rose-800/20 flex justify-center items-center gap-2"
              >
                <AlertTriangle size={18} />
                ⚠️ Impound Container & Escalate to Ministry of Revenue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function colorToIcon(color: string) {
  if (color === 'rose') return <AlertTriangle size={12} />;
  if (color === 'amber') return <Shield size={12} />;
  if (color === 'blue') return <FileText size={12} />;
  return null;
}
