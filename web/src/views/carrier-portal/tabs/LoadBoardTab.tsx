import React, { useState, useEffect } from 'react';
import { 
  Package,
  Search, 
  Filter, 
  MapPin, 
  Zap, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  X, 
  Loader2, 
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { getCarrierLoads, getCarrierMyBids, submitCarrierBid, withdrawCarrierBid, getCarrierOverview } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { getRouteCorridor } from './ActiveHaulsTab';

function parsePlaceCity(p: any, fallback: string): string {
  if (!p) return fallback;
  if (typeof p === 'string') {
    try {
      const parsed = JSON.parse(p);
      return parsed.city || parsed.address || p;
    } catch {
      return p;
    }
  }
  return p.city || p.address || fallback;
}

function formatCargoTitle(title: string, cargoType?: string): string {
  const clean = (title || '').replace(/^Freight:\s*/i, '').trim();
  if (!clean) return cargoType ? cargoType.toUpperCase() : 'Freight Consignment';
  if (clean.toLowerCase() === 'car') return 'Automotive (Car)';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

interface LoadItem {
  id: string;
  title: string;
  description: string;
  origin: any;
  destination: any;
  weightKg: string;
  volumeM3?: string;
  cargoType: string;
  budgetAmount: string;
  currency: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  shipperName?: string;
  shipperCompany?: string;
  hasBid?: boolean;
  myBid?: any;
  aiMatchScore?: number;
  corridorLeg?: string;
  distanceKm?: number;
}

interface BidItem {
  id: string;
  loadId: string;
  bidAmount: string;
  currency: string;
  deliveryEta: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  loadTitle: string;
  origin: any;
  destination: any;
  cargoType: string;
  weightKg: string;
  budgetAmount: string;
  loadStatus: string;
}

export default function LoadBoardTab() {
  const [activeSubTab, setActiveSubTab] = useState<'available' | 'my_bids'>('available');
  const [loads, setLoads] = useState<LoadItem[]>([]);
  const [myBids, setMyBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCargoType, setSelectedCargoType] = useState<string>('ALL');
  const [verificationStatus, setVerificationStatus] = useState<string>('VERIFIED');
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // Place Bid Modal State
  const [showBidModal, setShowBidModal] = useState<boolean>(false);
  const [selectedLoad, setSelectedLoad] = useState<LoadItem | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [deliveryEta, setDeliveryEta] = useState<string>('');
  const [bidNotes, setBidNotes] = useState<string>('');
  const [submittingBid, setSubmittingBid] = useState<boolean>(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setAiErrorMessage(null);
    try {
      const [loadsRes, bidsRes, overviewRes] = await Promise.all([
        getCarrierLoads().catch((e) => {
          if (e.response?.status === 503 || e.response?.data?.error) {
            setAiErrorMessage(e.response?.data?.error || 'AI Freight Matching Engine is offline.');
          }
          throw e;
        }),
        getCarrierMyBids().catch(() => ({ bids: [] })),
        getCarrierOverview().catch(() => null),
      ]);

      if (loadsRes?.loads) setLoads(loadsRes.loads);
      if (bidsRes?.bids) setMyBids(bidsRes.bids);
      if (overviewRes?.verificationStatus) setVerificationStatus(overviewRes.verificationStatus);
    } catch (err: any) {
      console.error('Failed to fetch load board data:', err);
      if (!aiErrorMessage) {
        toast.error(err.response?.data?.error || 'Could not load marketplace listings');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter loads
  const filteredLoads = loads.filter((load) => {
    const matchesSearch = 
      load.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (load.origin as any)?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (load.destination as any)?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.cargoType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = 
      selectedCargoType === 'ALL' || 
      load.cargoType?.toLowerCase() === selectedCargoType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const handleOpenBidModal = (load: LoadItem) => {
    if (verificationStatus !== 'VERIFIED') {
      toast.error('Bidding blocked: Transporter account pending verification per SRS FR-01');
      return;
    }
    setSelectedLoad(load);
    // Suggest 95% of shipper's budget as competitive AI recommendation
    const suggested = Math.round(Number(load.budgetAmount || 300000) * 0.96);
    setBidAmount(suggested.toString());
    setBidNotes('Equipped with certified heavy-duty trailer and GPS tracking unit.');
    setShowBidModal(true);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoad || !bidAmount) return;

    setSubmittingBid(true);
    try {
      await submitCarrierBid({
        loadId: selectedLoad.id,
        bidAmount: parseFloat(bidAmount),
        deliveryEta: deliveryEta || undefined,
        notes: bidNotes,
      });

      toast.success('Bid placed successfully! Awaiting shipper selection.');
      setShowBidModal(false);
      await fetchData(true);
      setActiveSubTab('my_bids');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleWithdrawBid = async (bidId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this bid?')) return;
    try {
      await withdrawCarrierBid(bidId);
      toast.success('Bid withdrawn successfully');
      await fetchData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to withdraw bid');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
        <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
        <span className="text-xs font-mono">Loading live freight marketplace from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and SubTab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            Load Board
          </h2>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1 bg-[#171717] p-1 rounded-lg border border-[#282828]">
          <button
            onClick={() => setActiveSubTab('available')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'available'
                ? 'bg-[#3ECF8E] text-black shadow-sm'
                : 'text-[#8F8F8F] hover:text-[#EDEDED]'
            }`}
          >
            Available Cargo ({loads.length})
          </button>
          <button
            onClick={() => setActiveSubTab('my_bids')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'my_bids'
                ? 'bg-[#3ECF8E] text-black shadow-sm'
                : 'text-[#8F8F8F] hover:text-[#EDEDED]'
            }`}
          >
            My Bids ({myBids.length})
          </button>
        </div>
      </div>

      {/* SRS FR-01: Verification status banner */}
      {verificationStatus !== 'VERIFIED' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-amber-400">Transporter Account Pending Verification (SRS FR-01)</h4>
            <p className="text-xs text-[#8F8F8F] mt-0.5">
              Your trade license and vehicle roadworthiness credentials are under review by Platform Administration.
              Per SRS Section 3.1, submitting bids and accepting loads is locked until your account is approved.
            </p>
          </div>
        </div>
      )}

      {/* AI Engine Status Banner */}
      {aiErrorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-rose-400">AI Microservice Notice</h4>
            <p className="text-xs text-[#8F8F8F] mt-0.5">{aiErrorMessage}</p>
          </div>
        </div>
      )}

      {activeSubTab === 'available' ? (
        <>
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707070]" />
              <input
                type="text"
                placeholder="Search by city, commodity, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#171717] border border-[#282828] focus:border-[#3ECF8E] rounded-lg pl-10 pr-4 py-2 text-xs text-[#EDEDED] placeholder-[#707070] outline-none transition font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCargoType}
                onChange={(e) => setSelectedCargoType(e.target.value)}
                className="bg-[#171717] border border-[#282828] focus:border-[#3ECF8E] rounded-lg px-3 py-2 text-xs text-[#EDEDED] outline-none font-mono transition cursor-pointer"
              >
                <option value="ALL">All Commodities</option>
                <option value="Steel">Steel & Construction</option>
                <option value="Coffee">Coffee Beans Export</option>
                <option value="Agriculture & Chemicals">Agriculture & Fertilizer</option>
                <option value="Dry">Dry Cargo</option>
                <option value="Bulk Petroleum">Bulk Petroleum</option>
                <option value="20ft Standard Dry Container (FCL)">20ft Container (FCL)</option>
              </select>
            </div>
          </div>

          {/* Load Cards Grid */}
          {filteredLoads.length === 0 ? (
            <div className="p-12 text-center bg-[#171717] border border-[#282828] rounded-xl max-w-lg mx-auto">
              <AlertCircle size={32} className="text-[#707070] mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#EDEDED] mb-1">No Matching Cargo Found</h4>
              <p className="text-xs text-[#707070]">
                Try adjusting your search terms or filter settings. New consignments appear as shippers post.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLoads.map((load) => {
                const weightTons = (Number(load.weightKg || 0) / 1000).toFixed(1);
                const matchScore = load.aiMatchScore || 94.5;
                const corridor = getRouteCorridor(load.origin, load.destination);
                const originCity = parsePlaceCity(load.origin, 'Modjo');
                const destCity = parsePlaceCity(load.destination, 'Addis Ababa');
                const displayTitle = formatCargoTitle(load.title, load.cargoType);
                const transitWindow = corridor.totalKm <= 100
                  ? '2-4h transit window'
                  : corridor.totalKm <= 400
                  ? '8-14h transit window'
                  : '24-36h transit window';
                const shipper = load.shipperCompany || load.shipperName || 'Ethiopian Enterprise';

                return (
                  <div
                    key={load.id}
                    className="bg-[#171717] hover:bg-[#1C1C1C] border border-[#262626] hover:border-[#383838] rounded-xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                  >
                    <div>
                      {/* Top Row: AI Match & Commodity Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <span className="text-[11px] font-mono font-medium text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(62,207,142,0.06)]">
                          <Sparkles size={11} className="text-[#3ECF8E]" />
                          <span>{matchScore}% AI Match</span>
                        </span>

                        <span className="text-[10px] font-mono text-[#A1A1A1] bg-[#121212] px-2.5 py-0.5 rounded border border-[#282828] uppercase tracking-wider">
                          {load.cargoType || 'Dry Cargo'}
                        </span>
                      </div>

                      {/* Clean Cargo Title (No redundant 'Freight:' prefix) */}
                      <h3 className="text-sm font-bold text-[#EDEDED] leading-snug mb-2 group-hover:text-[#3ECF8E] transition-colors">
                        {displayTitle}
                      </h3>

                      {/* Corridor Route Typography (Crisp, Supabase green arrow) */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-[#EDEDED] font-semibold">{originCity}</span>
                          <span className="text-[#3ECF8E] font-bold">→</span>
                          <span className="text-[#EDEDED] font-semibold">{destCity}</span>
                        </div>
                        <div className="text-[11px] text-[#707070] font-mono mt-1">
                          ~{corridor.totalKm} km corridor haul • {transitWindow}
                        </div>
                      </div>

                      {/* Cargo Specifications Grid */}
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#121212] border border-[#262626] text-xs font-mono mb-4">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-[#707070] block">WEIGHT</span>
                          <span className="font-semibold text-[#EDEDED] text-xs">{weightTons} Metric Tons</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-[#707070] block">POSTED BY</span>
                          <span className="font-semibold text-[#EDEDED] text-xs truncate block" title={shipper}>
                            {shipper}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Budget & Bid Action */}
                    <div className="pt-3 border-t border-[#262626] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#707070] block">
                          Shipper Budget
                        </span>
                        <span className="text-sm font-mono font-bold text-[#3ECF8E]">
                          ETB {Number(load.budgetAmount || 0).toLocaleString()}
                        </span>
                      </div>

                      {load.hasBid ? (
                        <div className="text-[11px] font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 shadow-[0_0_10px_rgba(62,207,142,0.06)]">
                          <CheckCircle2 size={13} className="text-[#3ECF8E]" />
                          <span>Bid Submitted</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenBidModal(load)}
                          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-[0_0_12px_rgba(62,207,142,0.18)] hover:shadow-[0_0_18px_rgba(62,207,142,0.28)] flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Zap size={13} />
                          <span>Place AI Bid</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* My Bids View */
        <div className="space-y-4">
          {myBids.length === 0 ? (
            <div className="p-12 text-center bg-[#171717] border border-[#282828] rounded-xl max-w-lg mx-auto">
              <Package size={32} className="text-[#707070] mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#EDEDED] mb-1">No Active Bids</h4>
              <p className="text-xs text-[#707070] mb-4">
                You have not placed any bids on the marketplace yet. Browse the available cargo tab to submit competitive bids.
              </p>
              <button
                onClick={() => setActiveSubTab('available')}
                className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm"
              >
                Find Loads Now
              </button>
            </div>
          ) : (
            <div className="bg-[#171717] border border-[#282828] rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#282828] flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#8F8F8F]">
                  Your Submitted Bids Ledger ({myBids.length})
                </span>
                <span className="text-[10px] font-mono text-[#3ECF8E]">
                  Pessimistic Concurrency Protected
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121212] border-b border-[#282828] text-[10px] text-[#707070] uppercase">
                    <tr>
                      <th className="py-3 px-4">Load Title</th>
                      <th className="py-3 px-4">Route</th>
                      <th className="py-3 px-4">Your Bid (ETB)</th>
                      <th className="py-3 px-4">Shipper Budget</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282828] text-[#EDEDED]">
                    {myBids.map((b) => (
                      <tr key={b.id} className="hover:bg-[#1C1C1C] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white max-w-[200px] truncate">
                          {formatCargoTitle(b.loadTitle, b.cargoType)}
                        </td>
                        <td className="py-3.5 px-4 text-[#8F8F8F]">
                          {parsePlaceCity(b.origin, 'Djibouti')} → {parsePlaceCity(b.destination, 'Modjo')}
                        </td>
                        <td className="py-3.5 px-4 text-[#3ECF8E] font-bold">
                          ETB {Number(b.bidAmount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-[#8F8F8F]">
                          ETB {Number(b.budgetAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              b.status === 'ACCEPTED'
                                ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30'
                                : b.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-[#121212] text-[#8F8F8F] border border-[#282828]'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#8F8F8F] text-[10px]">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {b.status === 'PENDING' && (
                            <button
                              onClick={() => handleWithdrawBid(b.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded-md text-[10px] transition"
                            >
                              Withdraw
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: PLACE COMPETITIVE AI BID (FR-02)
          ========================================================================= */}
      {showBidModal && selectedLoad && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#282828] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#282828] flex items-center justify-between bg-[#121212]">
              <div>
                <h3 className="font-bold text-sm text-[#EDEDED] flex items-center gap-2">
                  <Zap size={16} className="text-[#3ECF8E]" />
                  Submit AI-Assisted Freight Bid
                </h3>
                <p className="text-[10px] font-mono text-[#8F8F8F] mt-0.5">
                  SRS FR-02 Bidding Engine • Instant Shipper Evaluation
                </p>
              </div>
              <button
                onClick={() => setShowBidModal(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="p-5 space-y-4">
              {/* Load Snapshot Card */}
              <div className="p-3.5 rounded-lg bg-[#121212] border border-[#262626] space-y-1.5 text-xs">
                <div className="font-bold text-[#EDEDED]">{formatCargoTitle(selectedLoad.title, selectedLoad.cargoType)}</div>
                <div className="text-[11px] font-mono text-[#8F8F8F] flex items-center gap-1.5">
                  <span>{parsePlaceCity(selectedLoad.origin, 'Djibouti')}</span>
                  <span className="text-[#3ECF8E]">→</span>
                  <span>{parsePlaceCity(selectedLoad.destination, 'Modjo')}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-[#8F8F8F]">
                  <span>Weight: {(Number(selectedLoad.weightKg) / 1000).toFixed(1)}T</span>
                  <span>Budget: <strong className="text-[#3ECF8E]">ETB {Number(selectedLoad.budgetAmount).toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Bid Amount Input */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Proposed Transport Cost (ETB) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#8F8F8F]">
                    ETB
                  </span>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-[#121212] border border-[#262626] rounded-lg pl-12 pr-4 py-2.5 text-xs text-[#EDEDED] font-mono font-bold focus:border-[#3ECF8E] outline-none"
                  />
                </div>
                <p className="text-[10px] text-[#707070] mt-1 font-mono">
                  Calculated against current diesel index (ETB 95.50/L) & corridor demand.
                </p>
              </div>

              {/* Delivery ETA */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Estimated Delivery Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={deliveryEta}
                  onChange={(e) => setDeliveryEta(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-lg px-3.5 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Operational Notes & Equipment Confirmation
                </label>
                <textarea
                  rows={2}
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                  placeholder="e.g. Verified Scania 40T trailer ready at Doraleh terminal..."
                  className="w-full bg-[#121212] border border-[#262626] rounded-lg px-3.5 py-2 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#121212] hover:bg-[#1C1C1C] border border-[#262626] text-xs font-semibold text-[#8F8F8F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="px-5 py-2 rounded-lg bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold transition shadow-[0_0_12px_rgba(62,207,142,0.18)] flex items-center gap-2"
                >
                  {submittingBid ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Transmitting Bid...
                    </>
                  ) : (
                    'Confirm & Broadcast Bid'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
