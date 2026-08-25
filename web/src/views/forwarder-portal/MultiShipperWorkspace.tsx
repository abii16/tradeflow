import React from 'react';
import { Search, Filter, Plus, FileText, CheckCircle2, AlertTriangle, ArrowRight, Star, ChevronRight } from 'lucide-react';

export default function MultiShipperWorkspace() {
  const [manifests, setManifests] = React.useState<any[]>([]);
  const bids: any[] = [];

  React.useEffect(() => {
    async function loadManifests() {
      try {
        const { getAllLoads } = await import('@/lib/apiClient');
        const res = await getAllLoads();
        // Assume res is an object with a loads array
        const fetchedManifests = (res.loads || []).map((load: any) => {
          const originAddr = load.origin?.address || load.origin || 'Unknown Origin';
          const destAddr = load.destination?.address || load.destination || 'Unknown Destination';
          return {
            mbl: load.id || 'N/A',
            hbl: load.cargoType || 'N/A',
            importer: load.shipperId || 'Unknown Shipper',
            route: `${originAddr} -> ${destAddr}`,
            status: load.status || 'Pending',
            badge: 'bg-slate-100 text-slate-700',
            action: 'View'
          };
        });
        setManifests(fetchedManifests);
      } catch (err) {
        console.error('Failed to load manifests:', err);
      }
    }
    loadManifests();
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 flex flex-col h-full">
      {/* Top Header Area */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm shrink-0">
        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-inter">Multi-Shipper Cargo Manager</h1>
            <p className="text-sm text-slate-500 font-inter mt-1">
              Consolidating active manifests, multi-importer vaults, and carrier bids for the Djibouti–Modjo corridor.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 shrink-0 shadow-sm">
            <Plus size={16} />
            New Manifest
          </button>
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
          
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
        
        {/* Left Column (3/5) */}
        <div className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-slate-100 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 font-inter">Active Manifests <span className="text-slate-400 font-medium text-sm ml-1">(Total: {manifests.length})</span></h2>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-semibold">All</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-xs font-semibold transition-colors">Cleared</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-xs font-semibold transition-colors">In Transit</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-xs font-semibold transition-colors">Doc Error</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-xs font-semibold transition-colors">Pending</button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 shadow-sm">
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">MBL / HBL</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Importer Entity</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Route</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customs Status</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {manifests.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[13px] font-bold text-slate-900">{row.mbl}</div>
                      <div className="font-mono text-slate-500 text-[11px] mt-0.5">HBL: {row.hbl}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-slate-700 font-inter font-medium">{row.importer}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-semibold">{row.route}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide border border-transparent ${row.badge.replace('bg-', 'border-').replace('100', '200')} ${row.badge}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-bold font-inter px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all bg-blue-50 hover:bg-blue-100">
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (2/5) */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          
          {/* Batch Customs Filing Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col flex-1 min-h-0">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 font-inter">Batch Customs Filing (FR-06)</h3>
              <p className="text-[13px] text-slate-500 font-inter mt-1">Automated document validation against Ethiopian Customs Authority rules.</p>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-2">
              <button className="w-full text-left flex items-center justify-between gap-3 bg-white hover:bg-slate-50 p-3.5 rounded-lg border border-slate-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                  <div>
                    <div className="text-sm font-bold text-slate-800">Commercial Invoice Match</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{manifests.length}/{manifests.length} Validated</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
              
              <button className="w-full text-left flex items-center justify-between gap-3 bg-white hover:bg-slate-50 p-3.5 rounded-lg border border-slate-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                  <div>
                    <div className="text-sm font-bold text-slate-800">Packing List Discrepancy</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">0 Pending Review</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
              </button>
              
              <button className="w-full text-left flex items-center justify-between gap-3 bg-white hover:bg-slate-50 p-3.5 rounded-lg border border-slate-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                  <div>
                    <div className="text-sm font-bold text-slate-800">Bill of Lading & Origin Cert</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Validated successfully</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            </div>
            
            <div className="p-4 border-t border-slate-100 shrink-0">
              <button className="w-full bg-[#0F172A] text-white py-2.5 rounded-lg text-sm font-bold font-inter hover:bg-slate-800 transition-all active:scale-95 shadow-sm">
                Run Batch Automated Validation
              </button>
            </div>
          </div>

          {/* Carrier Bid Workspace Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col flex-1 min-h-0">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 font-inter">Carrier Bid Workspace (FR-02.3)</h3>
              <p className="text-[13px] text-slate-500 font-inter mt-1">Competitive matching for unassigned TEUs.</p>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {bids.map((bid, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors group">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="text-amber-400 fill-amber-400" size={12} />
                      <span className="text-xs font-bold text-slate-700">{bid.rating}</span>
                      <span className="text-[13px] font-bold text-slate-900 ml-1">{bid.carrier}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Rate: <span className="font-mono font-bold text-slate-800">{bid.rate}</span></span>
                      <span>Lead: {bid.lead}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded shadow-sm hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all active:scale-95">
                    Award Load
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-slate-100 shrink-0 flex justify-center">
              <a href="#" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                Open Full Bidding Auction Workspace <ArrowRight size={16} />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
