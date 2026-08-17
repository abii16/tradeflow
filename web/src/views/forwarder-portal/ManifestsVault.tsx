import React, { useState } from 'react';
import { Search, Filter, Plus, Check, AlertTriangle, Clock, Download, Upload, UploadCloud, X } from 'lucide-react';

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
      status: 'Doc Error', badge: 'bg-red-100 text-red-700', action: 'Fix Documents' 
    },
    { 
      mbl: 'ZIM-11029-DJ', hbl: 'TX-882', importer: 'Awash Textiles', corridor: 'Djibouti -> Hawassa', 
      docs: { ci: 'valid', pl: 'valid', bl: 'pending', coo: 'valid' },
      status: 'Pending Review', badge: 'bg-amber-100 text-amber-700', action: 'Upload Docs' 
    },
  ];

  const renderDocIcon = (status: string) => {
    if (status === 'valid') return <Check size={14} className="text-emerald-500" />;
    if (status === 'error') return <AlertTriangle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-inter">Consolidated Customs Manifests & Document Vault (FR-06)</h1>
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shrink-0">
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

      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Master BL (MBL)</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">House BL (HBL)</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Declared Importer</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Customs Corridor</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Checklist</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Clearance Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {manifests.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-sm font-bold text-slate-900">{row.mbl}</td>
                  <td className="py-4 px-6 font-mono text-sm text-slate-600">{row.hbl}</td>
                  <td className="py-4 px-6 text-sm text-slate-800 font-medium font-inter">{row.importer}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">{row.corridor}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-md border border-slate-200 inline-flex">
                      <div className="flex items-center gap-1" title="Commercial Invoice"><span className="text-[10px] font-bold text-slate-500">CI:</span>{renderDocIcon(row.docs.ci)}</div>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <div className="flex items-center gap-1" title="Packing List"><span className="text-[10px] font-bold text-slate-500">PL:</span>{renderDocIcon(row.docs.pl)}</div>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <div className="flex items-center gap-1" title="Bill of Lading"><span className="text-[10px] font-bold text-slate-500">BL:</span>{renderDocIcon(row.docs.bl)}</div>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <div className="flex items-center gap-1" title="Certificate of Origin"><span className="text-[10px] font-bold text-slate-500">COO:</span>{renderDocIcon(row.docs.coo)}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${row.badge}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => row.action !== 'Download Pass' && setShowModal(true)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold font-inter px-4 py-2 rounded transition-colors ${
                        row.action === 'Download Pass' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
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
                <p className="font-medium">Instant Verification Active</p>
                <p className="text-xs text-blue-600/80 mt-0.5">Files uploaded here are automatically checked against the Ethiopian Customs Authority ruleset.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
