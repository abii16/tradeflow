import React, { useState } from 'react';
import { Search, Filter, Plus, Check, AlertTriangle, Clock, Download, Upload, UploadCloud, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ManifestsVault() {
  const [showModal, setShowModal] = useState(false);

  const manifests = [
    { 
      mbl: 'MSC-99281-DJ', hbl: 'ETH-0019', importer: 'Habesha Steel PLC', corridor: 'Djibouti -> Modjo', 
      docs: { ci: 'valid', pl: 'valid', bl: 'valid', coo: 'valid' },
      status: 'Cleared', badge: 'bg-emerald-100 text-emerald-700', action: 'Download Pass' 
    },
    { 
      mbl: 'CMA-77312-GL', hbl: 'AGRI-92', importer: 'Oromia Agri Co.', corridor: 'Galafi -> Modjo', 
      docs: { ci: 'valid', pl: 'error', bl: 'valid', coo: 'pending' },
      status: 'Doc Error', badge: 'bg-rose-100 text-rose-700', action: 'Fix Documents' 
    },
    { 
      mbl: 'ZIM-11029-DJ', hbl: 'TX-882', importer: 'Awash Textiles', corridor: 'Djibouti -> Hawassa', 
      docs: { ci: 'valid', pl: 'valid', bl: 'pending', coo: 'valid' },
      status: 'Pending Review', badge: 'bg-amber-100 text-amber-700', action: 'Upload Docs' 
    },
    { 
      mbl: 'TFM-9945-DJ', hbl: 'CEM-104', importer: 'Ethio-Cement', corridor: 'Djibouti -> Modjo', 
      docs: { ci: 'valid', pl: 'valid', bl: 'valid', coo: 'pending' },
      status: 'Pending Review', badge: 'bg-amber-100 text-amber-700', action: 'Upload Docs' 
    },
    { 
      mbl: 'TFM-9946-DJ', hbl: 'BGI-88', importer: 'BGI Ethiopia', corridor: 'Djibouti -> Modjo', 
      docs: { ci: 'valid', pl: 'valid', bl: 'valid', coo: 'valid' },
      status: 'Cleared', badge: 'bg-emerald-100 text-emerald-700', action: 'Download Pass' 
    },
  ];

  const renderDocBadge = (status: string, label: string) => {
    if (status === 'valid') return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold"><Check size={10}/> {label}</span>;
    if (status === 'error') return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold"><AlertTriangle size={10}/> {label}</span>;
    return <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer hover:bg-rose-100 transition-colors" onClick={() => setShowModal(true)}><Upload size={10}/> {label}</span>;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 flex flex-col h-full">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-inter">Consolidated Customs Manifests & Document Vault (FR-06)</h1>
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 shrink-0 shadow-sm">
            <Plus size={16} />
            Create Master Manifest
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by MBL, HBL..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-inter placeholder:text-slate-400"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <Filter size={16} />
            Filter Status
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 shadow-sm">
              <tr className="border-b border-slate-200">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Master BL (MBL)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">House BL (HBL)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Declared Importer</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customs Corridor</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document Checklist</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clearance Status</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manifests.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6 font-mono text-sm font-bold text-slate-900">{row.mbl}</td>
                  <td className="py-4 px-6 font-mono text-sm text-slate-500">{row.hbl}</td>
                  <td className="py-4 px-6 text-sm text-slate-800 font-bold font-inter">{row.importer}</td>
                  <td className="py-4 px-6 text-[13px] font-medium text-slate-600">{row.corridor}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {renderDocBadge(row.docs.ci, 'CI')}
                      {renderDocBadge(row.docs.pl, 'PL')}
                      {renderDocBadge(row.docs.bl, 'BL')}
                      {renderDocBadge(row.docs.coo, 'COO')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide border border-transparent ${row.badge.replace('bg-', 'border-').replace('100', '200')} ${row.badge}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => row.action !== 'Download Pass' && setShowModal(true)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold font-inter px-4 py-2 rounded transition-colors active:scale-95 ${
                        row.action === 'Download Pass' ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200' : 'bg-[#0F172A] text-white hover:bg-slate-800 shadow-sm'
                      }`}
                    >
                      {row.action === 'Download Pass' ? <Download size={14} /> : <Upload size={14} />}
                      {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dock */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-b-xl">
          <div className="text-sm font-medium text-slate-500">
            Showing <span className="font-bold text-slate-900">1–5</span> of <span className="font-bold text-slate-900">142</span> Master Manifests
          </div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded text-sm font-medium text-slate-500 hover:bg-slate-100 flex items-center gap-1 transition-colors">
              <ChevronLeft size={16} /> Previous
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold bg-blue-600 text-white shadow-sm">1</button>
            <button className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">2</button>
            <button className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">3</button>
            <span className="text-slate-400 px-1">...</span>
            <button className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">15</button>
            <button className="px-3 py-1.5 rounded text-sm font-medium text-slate-500 hover:bg-slate-100 flex items-center gap-1 transition-colors">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Upload Missing Documents</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer group">
                <UploadCloud size={40} className="text-slate-400 group-hover:text-blue-500 mb-4 transition-colors" />
                <p className="text-sm font-semibold text-slate-700">Drag & drop files here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse local files</p>
              </div>
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-bold flex items-center gap-2"><Check size={16} className="text-blue-600"/> Instant Verification Active</p>
                <p className="text-[13px] font-medium text-blue-700 mt-1">Files uploaded here are automatically checked against the Ethiopian Customs Authority ruleset.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
