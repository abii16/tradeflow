import React from 'react';
import { Search, Filter, Plus, FileText, CheckCircle2, AlertTriangle, ArrowRight, Star } from 'lucide-react';

export default function MultiShipperWorkspace() {
  const manifests = [
    { mbl: 'MSC-99281-DJ', hbl: 'ETH-0019', importer: 'Habesha Steel PLC', route: 'DJB -> MDJ', status: 'Cleared', badge: 'bg-emerald-100 text-emerald-700', action: 'View Docs' },
    { mbl: 'MAE-44120-DJ', hbl: 'MULTI-4', importer: 'Ethio Telecom', route: 'DJB -> KLT', status: 'In Transit', badge: 'bg-sky-100 text-sky-700', action: 'Track Leg' },
    { mbl: 'CMA-77312-GL', hbl: 'AGRI-92', importer: 'Oromia Agri Co.', route: 'GLF -> MDJ', status: 'Doc Error', badge: 'bg-red-100 text-red-700', action: 'Resolve' },
    { mbl: 'ZIM-11029-DJ', hbl: 'TX-882', importer: 'Awash Textiles', route: 'DJB -> HAW', status: 'Pending Review', badge: 'bg-amber-100 text-amber-700', action: 'Inspect' },
  ];

  const bids = [
    { carrier: 'Tana Logistics', rating: 4.8, rate: '$850', lead: '24h' },
    { carrier: 'Kangaroo Freight', rating: 4.9, rate: '$820', lead: '12h' },
    { carrier: 'Ethio-Djibouti Line', rating: 4.2, rate: '$910', lead: '72h' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-inter">Multi-Shipper Cargo Manager</h1>
          <p className="text-sm text-slate-500 font-inter mt-1">
            Consolidating active manifests, multi-importer vaults, and carrier bids for the Djibouti–Modjo corridor.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search MBL, HBL, Importer, Container..." 
              className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-inter placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
              <span className="font-sans">Ctrl</span>
              <span>K</span>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0">
            <Filter size={16} />
            Filter
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shrink-0">
            <Plus size={16} />
            New Manifest
          </button>
        </div>
      </div>

      {/* Main Layout 60/40 Split */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column (60%) */}
        <div className="lg:w-3/5 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 font-inter">Active Manifests <span className="text-slate-400 font-medium text-sm ml-1">(Total: 142)</span></h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-semibold">All</button>
              <button className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-xs font-semibold transition-colors">Cleared</button>
              <button className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-xs font-semibold transition-colors">In Transit</button>
              <button className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-xs font-semibold transition-colors hidden sm:block">Doc Error</button>
              <button className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-xs font-semibold transition-colors hidden sm:block">Pending</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">MBL / HBL</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Importer Entity</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customs Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {manifests.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-mono text-sm font-medium text-slate-900">
                      <div>{row.mbl}</div>
                      <div className="text-slate-500 text-xs mt-0.5">HBL: {row.hbl}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-700 font-inter font-medium">{row.importer}</td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-semibold">{row.route}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${row.badge}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-bold font-inter px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors">
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (40%) */}
        <div className="lg:w-2/5 flex flex-col gap-6">
          
          {/* Batch Customs Filing Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-slate-900 font-inter">Batch Customs Filing (FR-06)</h3>
            <p className="text-xs text-slate-500 font-inter mt-1 mb-5">Automated document validation against Ethiopian Customs Authority rules.</p>
            
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Commercial Invoice Match</div>
                  <div className="text-xs text-emerald-600 font-medium mt-0.5">142/142 Validated</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Packing List Discrepancy</div>
                  <div className="text-xs text-amber-600 font-medium mt-0.5 flex items-center justify-between">
                    <span>3 Pending Review</span>
                    <a href="#" className="underline ml-2 hover:text-amber-800">Review 3 Waybills</a>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Bill of Lading & Origin Cert</div>
                  <div className="text-xs text-emerald-600 font-medium mt-0.5">Validated successfully</div>
                </div>
              </div>
            </div>
            
            <button className="w-full bg-[#0F172A] text-white py-2.5 rounded-lg text-sm font-semibold font-inter hover:bg-slate-800 transition-colors shadow-sm">
              Run Batch Automated Validation
            </button>
          </div>

          {/* Carrier Bid Workspace Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-slate-900 font-inter">Carrier Bid Workspace (FR-02.3)</h3>
            <p className="text-xs text-slate-500 font-inter mt-1 mb-5">Competitive matching for unassigned TEUs.</p>
            
            <div className="space-y-3 mb-6">
              {bids.map((bid, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="text-amber-400 fill-amber-400" size={12} />
                      <span className="text-xs font-bold text-slate-700">{bid.rating}</span>
                      <span className="text-sm font-semibold text-slate-900 ml-1">{bid.carrier}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Rate/TEU: <span className="font-mono font-bold text-slate-800">{bid.rate}</span></span>
                      <span>Lead: {bid.lead}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all">
                    Award Load
                  </button>
                </div>
              ))}
            </div>
            
            <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 mt-auto">
              Open Full Bidding Auction Workspace <ArrowRight size={16} />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
