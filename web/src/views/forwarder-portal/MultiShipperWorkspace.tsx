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
        const fetchedManifests = (res.loads || []).map((load: any) => {
          const originAddr = load.origin?.address || load.origin || 'Unknown Origin';
          const destAddr = load.destination?.address || load.destination || 'Unknown Destination';
          return {
            mbl: load.id || 'N/A',
            hbl: load.cargoType || 'N/A',
            importer: load.shipperId || 'Unknown Shipper',
            route: `${originAddr} -> ${destAddr}`,
            status: load.status || 'Pending',
            badge: 'bg-[#3ECF8E]/10 text-[#3ECF8E]',
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
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10">
      {/* Top Header Area */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-5">
        <div className="mb-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">Multi-Shipper Cargo Manager</h1>
            <p className="text-sm text-[#8F8F8F] mt-1">
              Consolidating active manifests, multi-importer vaults, and carrier bids for the Djibouti–Modjo corridor.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] rounded-lg text-sm font-bold transition-all active:scale-95 shrink-0">
            <Plus size={15} />
            New Manifest
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" size={16} />
            <input 
              type="text" 
              placeholder="Search MBL, HBL, Importer, Container..." 
              className="w-full pl-9 pr-16 py-2 bg-[#181818] border border-[#2E2E2E] rounded-lg text-sm text-[#EDEDED] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] transition-all placeholder:text-[#8F8F8F]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-[#8F8F8F] font-medium bg-[#2A2A2A] px-1.5 py-0.5 rounded border border-[#2E2E2E]">
              <span>Ctrl</span><span>K</span>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#181818] border border-[#2E2E2E] rounded-lg text-sm font-semibold text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#EDEDED] transition-colors shrink-0">
            <Filter size={15} />
            Filter
          </button>
        </div>
      </div>

      {/* Main Layout Grid — no fixed heights, flows naturally */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* Left Column (3/5) — Manifest Table */}
        <div className="lg:col-span-3 bg-[#232323] border border-[#2E2E2E] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2E2E2E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#EDEDED]">
                Active Manifests <span className="text-[#8F8F8F] font-normal ml-1">(Total: {manifests.length})</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                <button className="px-2.5 py-0.5 bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 rounded-full text-[11px] font-semibold">All</button>
                <button className="px-2.5 py-0.5 bg-[#181818] text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#EDEDED] border border-[#2E2E2E] rounded-full text-[11px] font-semibold transition-colors">Cleared</button>
                <button className="px-2.5 py-0.5 bg-[#181818] text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#EDEDED] border border-[#2E2E2E] rounded-full text-[11px] font-semibold transition-colors">In Transit</button>
                <button className="px-2.5 py-0.5 bg-[#181818] text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#EDEDED] border border-[#2E2E2E] rounded-full text-[11px] font-semibold transition-colors">Doc Error</button>
                <button className="px-2.5 py-0.5 bg-[#181818] text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#EDEDED] border border-[#2E2E2E] rounded-full text-[11px] font-semibold transition-colors">Pending</button>
              </div>
            </div>
          </div>

          {/* Table — horizontal scroll only if needed, no vertical scroll */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-[#181818] border-b border-[#2E2E2E]">
                <tr>
                  <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">MBL / HBL</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">Importer Entity</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">Route</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">Customs Status</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]">
                {manifests.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#2A2A2A] transition-colors group">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-[#EDEDED]">{row.mbl}</div>
                      <div className="font-mono text-[#8F8F8F] text-[10px] mt-0.5">HBL: {row.hbl}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#EDEDED] font-medium">{row.importer}</td>
                    <td className="py-3 px-4 text-xs text-[#8F8F8F]">{row.route}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${row.badge}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-[#3ECF8E] text-xs font-bold px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-all bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 border border-[#3ECF8E]/20">
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (2/5) — Cards stacked, no inner scroll */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          {/* Batch Customs Filing Card */}
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl">
            <div className="p-4 border-b border-[#2E2E2E]">
              <h3 className="text-sm font-bold text-[#EDEDED]">Batch Customs Filing (FR-06)</h3>
              <p className="text-xs text-[#8F8F8F] mt-0.5">Automated document validation against Ethiopian Customs Authority rules.</p>
            </div>
            
            <div className="p-3 space-y-2">
              <button className="w-full text-left flex items-center justify-between gap-3 bg-[#181818] hover:bg-[#2A2A2A] p-3 rounded-lg border border-[#2E2E2E] transition-colors group">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#3ECF8E] shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-[#EDEDED]">Commercial Invoice Match</div>
                    <div className="text-[11px] text-[#8F8F8F] mt-0.5">{manifests.length}/{manifests.length} Validated</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[#8F8F8F] group-hover:text-[#3ECF8E] transition-colors shrink-0" />
              </button>
              
              <button className="w-full text-left flex items-center justify-between gap-3 bg-[#181818] hover:bg-[#2A2A2A] p-3 rounded-lg border border-[#2E2E2E] transition-colors group">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#3ECF8E] shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-[#EDEDED]">Packing List Discrepancy</div>
                    <div className="text-[11px] text-[#8F8F8F] mt-0.5">0 Pending Review</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[#8F8F8F] group-hover:text-amber-500 transition-colors shrink-0" />
              </button>
              
              <button className="w-full text-left flex items-center justify-between gap-3 bg-[#181818] hover:bg-[#2A2A2A] p-3 rounded-lg border border-[#2E2E2E] transition-colors group">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#3ECF8E] shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-[#EDEDED]">Bill of Lading & Origin Cert</div>
                    <div className="text-[11px] text-[#8F8F8F] mt-0.5">Validated successfully</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[#8F8F8F] group-hover:text-[#3ECF8E] transition-colors shrink-0" />
              </button>
            </div>
            
            <div className="p-3 border-t border-[#2E2E2E]">
              <button className="w-full bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] py-2 rounded-lg text-sm font-bold transition-all active:scale-95">
                Run Batch Automated Validation
              </button>
            </div>
          </div>

          {/* Carrier Bid Workspace Card */}
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl">
            <div className="p-4 border-b border-[#2E2E2E]">
              <h3 className="text-sm font-bold text-[#EDEDED]">Carrier Bid Workspace (FR-02.3)</h3>
              <p className="text-xs text-[#8F8F8F] mt-0.5">Competitive matching for unassigned TEUs.</p>
            </div>
            
            <div className="p-3 space-y-2">
              {bids.map((bid, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-[#2E2E2E] rounded-lg bg-[#181818] hover:border-[#3ECF8E]/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="text-amber-400 fill-amber-400" size={11} />
                      <span className="text-[11px] font-bold text-[#8F8F8F]">{bid.rating}</span>
                      <span className="text-xs font-bold text-[#EDEDED] ml-1">{bid.carrier}</span>
                    </div>
                    <div className="text-[11px] text-[#8F8F8F] flex items-center gap-3">
                      <span>Rate: <span className="font-mono font-bold text-[#EDEDED]">{bid.rate}</span></span>
                      <span>Lead: {bid.lead}</span>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 bg-[#181818] border border-[#2E2E2E] text-[#8F8F8F] text-xs font-bold rounded hover:bg-[#3ECF8E] hover:text-[#1C1C1C] hover:border-[#3ECF8E] transition-all active:scale-95 shrink-0">
                    Award
                  </button>
                </div>
              ))}
              {bids.length === 0 && (
                <div className="py-6 text-center text-xs text-[#8F8F8F]">No active bids yet</div>
              )}
            </div>
            
            <div className="p-3 border-t border-[#2E2E2E] flex justify-center">
              <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-[#3ECF8E] hover:text-[#34b27b] transition-colors">
                Open Full Bidding Auction Workspace <ArrowRight size={14} />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
