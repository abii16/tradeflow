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
  Sparkles,
  Edit3,
  ArrowRight,
  ShieldCheck,
  Trash2
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
    setDeliveryEta('');
    setBidNotes('Equipped with certified heavy-duty trailer and GPS tracking unit.');
    setShowBidModal(true);
  };

  const handleOpenManageBidModal = (load: LoadItem) => {
    setSelectedLoad(load);
    const existingBid = load.myBid || myBids.find((b) => b.loadId === load.id);
    if (existingBid) {
      setBidAmount(Math.round(Number(existingBid.bidAmount || 0)).toString());
      setDeliveryEta(
        existingBid.deliveryEta ? new Date(existingBid.deliveryEta).toISOString().slice(0, 16) : ''
      );
      setBidNotes(existingBid.notes || 'Equipped with certified heavy-duty trailer and GPS tracking unit.');
    } else {
      const suggested = Math.round(Number(load.budgetAmount || 300000) * 0.96);
      setBidAmount(suggested.toString());
      setDeliveryEta('');
      setBidNotes('Equipped with certified heavy-duty trailer and GPS tracking unit.');
    }
    setShowBidModal(true);
  };

  const handleOpenManageBidModalFromBidItem = (b: BidItem) => {
    const matchedLoad = loads.find((l) => l.id === b.loadId);
    if (matchedLoad) {
      handleOpenManageBidModal(matchedLoad);
    } else {
      const syntheticLoad: LoadItem = {
        id: b.loadId,
        title: b.loadTitle,
        description: '',
        origin: b.origin,
        destination: b.destination,
        weightKg: b.weightKg,
        cargoType: b.cargoType,
        budgetAmount: b.budgetAmount,
        currency: b.currency,
        status: b.loadStatus,
        expiresAt: '',
        createdAt: b.createdAt,
        hasBid: true,
        myBid: b,
      };
      handleOpenManageBidModal(syntheticLoad);
    }
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

      toast.success(selectedLoad.hasBid ? 'Bid revised and updated successfully!' : 'Bid placed successfully! Awaiting shipper selection.');
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
                const myOffer = Number(load.myBid?.bidAmount || 0);
                const budget = Number(load.budgetAmount || 0);
                const diff = myOffer - budget;

                return (
                  <div
                    key={load.id}
                    className={`bg-[#171717] hover:bg-[#1C1C1C] border ${
                      load.hasBid
                        ? 'border-[#3ECF8E]/40 bg-gradient-to-b from-[#14231b]/40 to-[#171717]'
                        : 'border-[#242424]'
                    } hover:border-[#3ECF8E]/50 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-sm hover:shadow-[0_4px_24px_rgba(62,207,142,0.08)]`}
                  >
                    <div>
                      {/* Top Row: AI Match & Load Reference & Bid Status */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <span className="text-[11px] font-mono font-medium text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(62,207,142,0.06)]">
                          <Sparkles size={11} className="text-[#3ECF8E]" />
                          <span>{matchScore}% AI Match</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {load.hasBid && (
                            <span className="text-[10px] font-mono font-bold text-[#3ECF8E] bg-[#3ECF8E]/15 border border-[#3ECF8E]/30 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-[0_0_8px_rgba(62,207,142,0.15)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
                              <span>BID ACTIVE</span>
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-[#8F8F8F] bg-[#121212] px-2.5 py-0.5 rounded-md border border-[#242424] tracking-wide">
                            #LD-{load.id.slice(0, 6).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Clean Cargo Title */}
                      <h3 className="text-[15px] font-bold text-white leading-snug mb-2 group-hover:text-[#3ECF8E] transition-colors">
                        {displayTitle}
                      </h3>

                      {/* Corridor Route Typography (Crisp, Supabase green arrow) */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#EDEDED]">
                          <span>{originCity}</span>
                          <span className="text-[#3ECF8E] font-bold">→</span>
                          <span>{destCity}</span>
                        </div>
                        <div className="text-[11px] text-[#8F8F8F] font-mono mt-1 flex items-center gap-1.5">
                          <span>~{corridor.totalKm} km corridor haul</span>
                          <span className="text-[#555]">•</span>
                          <span>{transitWindow}</span>
                        </div>
                      </div>

                      {/* Cargo Specifications Grid */}
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#121212] border border-[#242424] text-xs font-mono mb-4">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-[#707070] block mb-0.5">WEIGHT</span>
                          <span className="font-semibold text-[#EDEDED] text-xs">{weightTons} Metric Tons</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-[#707070] block mb-0.5">POSTED BY</span>
                          <span className="font-semibold text-[#EDEDED] text-xs truncate block" title={shipper}>
                            {shipper}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Budget & Bid Action */}
                    <div className="pt-3.5 border-t border-[#242424] flex items-center justify-between gap-3">
                      <div>
                        {load.hasBid ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9px] font-mono uppercase tracking-wider text-[#3ECF8E] font-bold">
                                Your Submitted Offer
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
                            </div>
                            <div className="flex items-baseline gap-1 font-mono">
                              <span className="text-[10px] text-[#3ECF8E] font-bold">ETB</span>
                              <span className="text-sm font-bold text-[#3ECF8E] tracking-tight">
                                {myOffer.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#707070] font-mono mt-0.5">
                              <span>Budget: ETB {budget.toLocaleString()}</span>
                              {budget > 0 && myOffer > 0 && (
                                <span className={diff <= 0 ? 'text-[#3ECF8E] font-semibold' : 'text-amber-400 font-semibold'}>
                                  ({diff <= 0 ? `-${Math.abs(diff).toLocaleString()}` : `+${diff.toLocaleString()}`})
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-[#707070] block mb-0.5">
                              Shipper Budget
                            </span>
                            <div className="flex items-baseline gap-1 font-mono">
                              <span className="text-[10px] text-[#707070]">ETB</span>
                              <span className="text-sm font-bold text-white tracking-tight">
                                {budget.toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {load.hasBid ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenManageBidModal(load)}
                            className="bg-[#1C2C24] hover:bg-[#3ECF8E] text-[#3ECF8E] hover:text-[#0C1410] border border-[#3ECF8E]/40 hover:border-[#3ECF8E] text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all duration-200 shadow-[0_0_14px_rgba(62,207,142,0.15)] flex items-center gap-1.5 active:scale-95 cursor-pointer group"
                            title="Click to view submitted bid details, revise your offer, or withdraw"
                          >
                            <Edit3 size={13} className="text-[#3ECF8E] group-hover:text-[#0C1410] group-hover:rotate-12 transition-all" />
                            <span>Manage / Revise Bid</span>
                          </button>
                          <span className="text-[9px] font-mono text-[#8F8F8F] flex items-center gap-1.5">
                            <CheckCircle2 size={11} className="text-[#3ECF8E]" />
                            <span>Submitted & Listed</span>
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenBidModal(load)}
                          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold px-4 py-2 rounded-lg transition shadow-[0_0_12px_rgba(62,207,142,0.18)] hover:shadow-[0_0_18px_rgba(62,207,142,0.28)] flex items-center gap-1.5 active:scale-95 cursor-pointer"
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenManageBidModalFromBidItem(b)}
                                className="text-[#3ECF8E] hover:text-[#0C1410] bg-[#3ECF8E]/10 hover:bg-[#3ECF8E] border border-[#3ECF8E]/30 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono flex items-center gap-1 transition-all cursor-pointer"
                                title="Revise offer price, ETA, or notes"
                              >
                                <Edit3 size={11} />
                                <span>Revise</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWithdrawBid(b.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded-md text-[10px] font-mono transition cursor-pointer"
                              >
                                Withdraw
                              </button>
                            </div>
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
          MODAL: EXECUTIVE BIDDING CONSOLE & BID REVISION (FR-02)
          ========================================================================= */}
      {showBidModal && selectedLoad && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#282828] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#282828] flex items-center justify-between bg-[#121212]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedLoad.hasBid ? 'bg-[#3ECF8E]/10 text-[#3ECF8E]' : 'bg-[#3ECF8E] text-black'}`}>
                  {selectedLoad.hasBid ? <Edit3 size={18} /> : <Zap size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#EDEDED] flex items-center gap-2">
                    {selectedLoad.hasBid ? 'Manage & Revise Submitted Bid' : 'Submit AI-Assisted Freight Bid'}
                  </h3>
                  <p className="text-[10px] font-mono text-[#8F8F8F] mt-0.5">
                    {selectedLoad.hasBid
                      ? 'SRS FR-02 Bidding Engine • View, Revise Offer or Withdraw'
                      : 'SRS FR-02 Bidding Engine • Direct Shipper Marketplace Evaluation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBidModal(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED] p-1.5 rounded-lg hover:bg-[#202020] transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="p-5 space-y-4">
              {/* If already bid, show active status banner */}
              {selectedLoad.hasBid && (
                <div className="p-3.5 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#EDEDED]">
                    <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
                    <span>Active Submitted Offer:</span>
                    <strong className="text-[#3ECF8E] font-bold text-sm">
                      ETB {Number(selectedLoad.myBid?.bidAmount || bidAmount).toLocaleString()}
                    </strong>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#3ECF8E]/20 text-[#3ECF8E] uppercase tracking-wider border border-[#3ECF8E]/30">
                    {selectedLoad.myBid?.status || 'PENDING'}
                  </span>
                </div>
              )}

              {/* Consignment Snapshot Card */}
              <div className="p-3.5 rounded-lg bg-[#121212] border border-[#262626] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#EDEDED] text-sm">
                    {formatCargoTitle(selectedLoad.title, selectedLoad.cargoType)}
                  </span>
                  <span className="text-[10px] font-mono text-[#8F8F8F] bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#333]">
                    #LD-{selectedLoad.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[#EDEDED]">
                  <span>{parsePlaceCity(selectedLoad.origin, 'Djibouti')}</span>
                  <span className="text-[#3ECF8E] font-bold">→</span>
                  <span>{parsePlaceCity(selectedLoad.destination, 'Modjo')}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-[#8F8F8F] border-t border-[#202020]">
                  <span>Weight: <strong className="text-[#EDEDED]">{(Number(selectedLoad.weightKg) / 1000).toFixed(1)} MT</strong></span>
                  <span>Shipper Target: <strong className="text-[#3ECF8E]">ETB {Number(selectedLoad.budgetAmount).toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Bid Amount Input with Quick Adjust Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase text-[#8F8F8F] font-semibold">
                    {selectedLoad.hasBid ? 'Revise Proposed Transport Cost (ETB) *' : 'Proposed Transport Cost (ETB) *'}
                  </label>
                  <span className="text-[10px] font-mono text-[#707070]">
                    Target: ETB {Number(selectedLoad.budgetAmount).toLocaleString()}
                  </span>
                </div>

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
                    className="w-full bg-[#121212] border border-[#262626] rounded-lg pl-12 pr-4 py-2.5 text-sm text-[#EDEDED] font-mono font-bold focus:border-[#3ECF8E] outline-none transition"
                  />
                </div>

                {/* Quick Adjustment Chips */}
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-[#707070] font-mono mr-0.5">Quick adjust:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const curr = Number(bidAmount || 0);
                      if (curr > 10000) setBidAmount((curr - 10000).toString());
                    }}
                    className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] hover:border-[#3ECF8E]/40 text-[10px] font-mono text-[#EDEDED] transition cursor-pointer"
                  >
                    -10k
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const curr = Number(bidAmount || 0);
                      if (curr > 5000) setBidAmount((curr - 5000).toString());
                    }}
                    className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] hover:border-[#3ECF8E]/40 text-[10px] font-mono text-[#EDEDED] transition cursor-pointer"
                  >
                    -5k
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLoad.budgetAmount) {
                        setBidAmount(Math.round(Number(selectedLoad.budgetAmount)).toString());
                      }
                    }}
                    className="px-2.5 py-0.5 rounded bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 text-[10px] font-mono text-[#3ECF8E] font-bold transition cursor-pointer"
                  >
                    Match Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const curr = Number(bidAmount || 0);
                      setBidAmount((curr + 5000).toString());
                    }}
                    className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] hover:border-[#3ECF8E]/40 text-[10px] font-mono text-[#EDEDED] transition cursor-pointer"
                  >
                    +5k
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const curr = Number(bidAmount || 0);
                      setBidAmount((curr + 10000).toString());
                    }}
                    className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] hover:border-[#3ECF8E]/40 text-[10px] font-mono text-[#EDEDED] transition cursor-pointer"
                  >
                    +10k
                  </button>
                </div>

                {/* Variance helper */}
                {selectedLoad.budgetAmount && bidAmount && (
                  <div className="mt-2 p-2 rounded-md bg-[#121212] border border-[#242424] text-[10px] font-mono flex items-center justify-between">
                    {Number(bidAmount) <= Number(selectedLoad.budgetAmount) ? (
                      <span className="text-[#3ECF8E] flex items-center gap-1.5 font-medium">
                        <Sparkles size={11} className="text-[#3ECF8E]" />
                        Competitive Bid: ETB {(Number(selectedLoad.budgetAmount) - Number(bidAmount)).toLocaleString()} (
                        {(
                          ((Number(selectedLoad.budgetAmount) - Number(bidAmount)) /
                            Number(selectedLoad.budgetAmount)) *
                          100
                        ).toFixed(1)}
                        %) below shipper target • High Award Probability
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                        <AlertCircle size={11} className="text-amber-400" />
                        Above Budget: +ETB {(Number(bidAmount) - Number(selectedLoad.budgetAmount)).toLocaleString()} (
                        {(
                          ((Number(bidAmount) - Number(selectedLoad.budgetAmount)) /
                            Number(selectedLoad.budgetAmount)) *
                          100
                        ).toFixed(1)}
                        % premium) • Specify premium justification in notes
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery ETA with Quick Presets */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5 font-semibold">
                  Estimated Delivery Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={deliveryEta}
                  onChange={(e) => setDeliveryEta(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-lg px-3.5 py-2 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none transition"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-[#707070] font-mono mr-0.5">Quick ETA:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(Date.now() + 24 * 3600 * 1000);
                      setDeliveryEta(d.toISOString().slice(0, 16));
                    }}
                    className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] text-[10px] font-mono text-[#EDEDED] transition cursor-pointer"
                  >
                    +24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(Date.now() + 48 * 3600 * 1000);
                      setDeliveryEta(d.toISOString().slice(0, 16));
                    }}
                    className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] text-[10px] font-mono text-[#EDEDED] transition cursor-pointer"
                  >
                    +48 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(Date.now() + 72 * 3600 * 1000);
                      setDeliveryEta(d.toISOString().slice(0, 16));
                    }}
                    className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] text-[10px] font-mono text-[#EDEDED] transition cursor-pointer"
                  >
                    +72 Hours
                  </button>
                </div>
              </div>

              {/* Notes with Quick Tags */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5 font-semibold">
                  Operational Notes & Equipment Confirmation
                </label>
                <textarea
                  rows={2}
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                  placeholder="e.g. Verified Scania 40T trailer ready at Doraleh terminal..."
                  className="w-full bg-[#121212] border border-[#262626] rounded-lg px-3.5 py-2 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none resize-none transition"
                />
                <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-[#707070] font-mono mr-0.5">Quick tags:</span>
                  {['GPS Tracking Active', 'Insured Carrier (BIC)', 'Dual-Driver Fast Transit', 'Immediate Dispatch'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!bidNotes.includes(tag)) {
                          setBidNotes((prev) => (prev ? `${prev} • ${tag}` : tag));
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] hover:border-[#3ECF8E]/30 text-[10px] font-mono text-[#EDEDED] transition cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                {selectedLoad.hasBid && selectedLoad.myBid ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setShowBidModal(false);
                      await handleWithdrawBid(selectedLoad.myBid.id);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Withdraw Bid</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBidModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#121212] hover:bg-[#1C1C1C] border border-[#262626] text-xs font-semibold text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="px-5 py-2 rounded-lg bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold transition shadow-[0_0_12px_rgba(62,207,142,0.18)] hover:shadow-[0_0_18px_rgba(62,207,142,0.28)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingBid ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Transmitting...
                      </>
                    ) : selectedLoad.hasBid ? (
                      <>
                        <Edit3 size={13} />
                        <span>Update & Broadcast Revised Bid</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        <span>Confirm & Broadcast Bid</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
