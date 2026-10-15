import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileText, CheckCircle2, AlertTriangle, ArrowRight, Star, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { getForwarderWorkspace, getForwarderBiddingExchange, awardForwarderBid } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function MultiShipperWorkspace({ onGoToBidding }: { onGoToBidding?: () => void }) {
  const [manifests, setManifests] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [awardingId, setAwardingId] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [wsRes, bidRes] = await Promise.all([
        getForwarderWorkspace(),
        getForwarderBiddingExchange(),
      ]);

      if (wsRes?.manifests) {
        setManifests(wsRes.manifests);
      }

      if (bidRes?.cargoCards) {
        // Collect all bids across cargo
        const flattenedBids: any[] = [];
        for (const cargo of bidRes.cargoCards) {
          for (const b of cargo.bids || []) {
            flattenedBids.push({
              ...b,
              loadTitle: cargo.title,
              route: cargo.route,
            });
          }
        }
        setBids(flattenedBids);
      }
    } catch (err: any) {
      console.error('Failed to load forwarder workspace:', err);
      toast.error('Could not load forwarder workspace data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAwardBid = async (bidId: string) => {
    setAwardingId(bidId);
    try {
      await awardForwarderBid(bidId);
      toast.success('Bid awarded! Shipment dispatched to transporter.');
      await loadData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to award bid');
    } finally {
      setAwardingId(null);
    }
  };

  const filteredManifests = manifests.filter((m) => {
    const matchesSearch = 
      m.mbl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hbl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.importer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.route?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'CLEARED') return m.status === 'CLEARED';
    if (filterStatus === 'IN_TRANSIT') return m.loadStatus === 'MATCHED' || m.status === 'IN_TRANSIT';
    if (filterStatus === 'DOC_ERROR') return m.status === 'REJECTED';
    if (filterStatus === 'PENDING') return m.status === 'PENDING' || m.status === 'SUBMITTED' || m.status === 'POSTED';
    return true;
  });

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10">
      {/* Top Header Area */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-5">
        <div className="mb-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">Multi-Shipper Cargo Manager (FR-01, FR-06)</h1>
            <p className="text-sm text-[#8F8F8F] mt-1">
              Consolidating active manifests, multi-importer vaults, and carrier bids along the Djibouti–Modjo corridor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadData(false)}
              className="p-2 bg-[#181818] border border-[#2E2E2E] rounded-lg text-[#8F8F8F] hover:text-[#EDEDED] transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search MBL, HBL, Importer, Route..." 
              className="w-full pl-9 pr-16 py-2 bg-[#181818] border border-[#2E2E2E] rounded-lg text-sm text-[#EDEDED] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] transition-all placeholder:text-[#8F8F8F]"
            />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* Left Column (3/5) — Manifest Table */}
        <div className="lg:col-span-3 bg-[#232323] border border-[#2E2E2E] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2E2E2E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#EDEDED]">
                Active Manifests <span className="text-[#8F8F8F] font-normal ml-1">({filteredManifests.length} shown of {manifests.length})</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'CLEARED', label: 'Cleared' },
                  { id: 'IN_TRANSIT', label: 'In Transit' },
                  { id: 'DOC_ERROR', label: 'Doc Error' },
                  { id: 'PENDING', label: 'Pending' },
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                      filterStatus === tab.id
                        ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20'
                        : 'bg-[#181818] text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#EDEDED] border border-[#2E2E2E]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-[#8F8F8F] gap-2">
              <Loader2 size={24} className="animate-spin text-[#3ECF8E]" />
              <span className="text-xs">Loading multi-shipper manifests...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-[#181818] border-b border-[#2E2E2E]">
                  <tr>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">MBL / HBL</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">Importer Entity</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">Route</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">Customs Status</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider text-right">Bids</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E2E]">
                  {filteredManifests.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#2A2A2A] transition-colors group">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-[#EDEDED]">{row.mbl}</div>
                        <div className="font-mono text-[#8F8F8F] text-[10px] mt-0.5">{row.hbl}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#EDEDED] font-medium">{row.importer}</td>
                      <td className="py-3 px-4 text-xs text-[#8F8F8F]">{row.route}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${row.badge}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs font-mono font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded border border-[#3ECF8E]/20">
                          {row.bidsCount} bids
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredManifests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#8F8F8F]">
                        No manifests found matching filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (2/5) — Cards stacked */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          {/* Batch Customs Filing Card */}
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl">
            <div className="p-4 border-b border-[#2E2E2E]">
              <h3 className="text-sm font-bold text-[#EDEDED]">Batch Customs Filing (FR-06)</h3>
              <p className="text-xs text-[#8F8F8F] mt-0.5">Automated document validation against Ethiopian Customs Authority rules.</p>
            </div>
            
            <div className="p-3 space-y-2">
              <div className="w-full text-left flex items-center justify-between gap-3 bg-[#181818] p-3 rounded-lg border border-[#2E2E2E]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#3ECF8E] shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-[#EDEDED]">Commercial Invoice Match</div>
                    <div className="text-[11px] text-[#8F8F8F] mt-0.5">Automated AI OCR Consistency Check</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded">Active</span>
              </div>
              
              <div className="w-full text-left flex items-center justify-between gap-3 bg-[#181818] p-3 rounded-lg border border-[#2E2E2E]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#3ECF8E] shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-[#EDEDED]">Packing List Discrepancy</div>
                    <div className="text-[11px] text-[#8F8F8F] mt-0.5">Cross-referenced against gross weight</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Audited</span>
              </div>
              
              <div className="w-full text-left flex items-center justify-between gap-3 bg-[#181818] p-3 rounded-lg border border-[#2E2E2E]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#3ECF8E] shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-[#EDEDED]">Bill of Lading &amp; Origin Cert</div>
                    <div className="text-[11px] text-[#8F8F8F] mt-0.5">ECC Tariff Classification Validated</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded">Ready</span>
              </div>
            </div>
            
            <div className="p-3 border-t border-[#2E2E2E]">
              <div className="text-xs text-[#8F8F8F] text-center">
                Automated document OCR active via <span className="font-bold text-[#EDEDED]">TradeFlow AI Engine</span>
              </div>
            </div>
          </div>

          {/* Carrier Bid Workspace Card */}
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl">
            <div className="p-4 border-b border-[#2E2E2E]">
              <h3 className="text-sm font-bold text-[#EDEDED]">Carrier Bid Workspace (FR-02.3)</h3>
              <p className="text-xs text-[#8F8F8F] mt-0.5">Live bids submitted by verified corridor transporters.</p>
            </div>
            
            <div className="p-3 space-y-2 max-h-[360px] overflow-y-auto">
              {bids.map((bid, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-[#2E2E2E] rounded-lg bg-[#181818] hover:border-[#3ECF8E]/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="text-amber-400 fill-amber-400" size={11} />
                      <span className="text-[11px] font-bold text-[#8F8F8F]">{bid.rating}</span>
                      <span className="text-xs font-bold text-[#EDEDED] ml-1">{bid.carrier}</span>
                    </div>
                    <div className="text-[11px] text-[#8F8F8F] flex items-center gap-3">
                      <span>Rate: <span className="font-mono font-bold text-[#EDEDED]">{Number(bid.rate).toLocaleString()} {bid.currency}</span></span>
                      <span>Lead: {bid.lead}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAwardBid(bid.id)}
                    disabled={awardingId === bid.id}
                    className="px-3 py-1.5 bg-[#3ECF8E] text-[#1C1C1C] text-xs font-bold rounded hover:bg-[#34b27b] transition-all active:scale-95 shrink-0 flex items-center gap-1 disabled:opacity-50"
                  >
                    {awardingId === bid.id ? <Loader2 size={12} className="animate-spin" /> : 'Award'}
                  </button>
                </div>
              ))}
              {bids.length === 0 && (
                <div className="py-6 text-center text-xs text-[#8F8F8F]">
                  No active carrier bids pending review
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-[#2E2E2E] flex justify-center">
              <button 
                onClick={onGoToBidding}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3ECF8E] hover:text-[#34b27b] transition-colors"
              >
                Open Full Bidding Auction Workspace <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
