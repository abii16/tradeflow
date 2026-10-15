import React, { useState, useEffect } from 'react';
import { Star, Truck, MapPin, Clock, ArrowRight, Loader2, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getForwarderBiddingExchange, awardForwarderBid } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function BiddingExchange() {
  const [cargoCards, setCargoCards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [awardingId, setAwardingId] = useState<string | null>(null);

  const fetchCargo = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getForwarderBiddingExchange();
      if (res?.cargoCards) {
        setCargoCards(res.cargoCards);
      }
    } catch (err: any) {
      console.error('Failed to load cargo for bidding', err);
      toast.error('Could not load freight auction exchange');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargo();
  }, []);

  const handleAward = async (bidId: string, carrierName: string, rate: number, currency: string) => {
    setAwardingId(bidId);
    try {
      await awardForwarderBid(bidId);
      toast.success(`Contract awarded to ${carrierName} for ${rate.toLocaleString()} ${currency}! Haul dispatched.`);
      await fetchCargo(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to award contract');
    } finally {
      setAwardingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 flex flex-col h-full">
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-black/20 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">Freight Auction &amp; Carrier Bidding Exchange (FR-02.3)</h1>
          <p className="text-sm text-[#8F8F8F] mt-1">Live competitive matching for unassigned TEUs along the Djibouti–Modjo corridor.</p>
        </div>
        <button 
          onClick={() => fetchCargo(false)}
          className="p-2.5 bg-[#181818] border border-[#2E2E2E] rounded-lg text-[#8F8F8F] hover:text-[#EDEDED] transition-colors"
          title="Refresh Bids"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
          <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
          <span className="text-xs font-mono">Aggregating live carrier bids across freight corridors...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
          {cargoCards.map((cargo, idx) => (
            <div key={idx} className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-black/20 overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-[#2E2E2E] bg-[#1C1C1C] shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#EDEDED]">{cargo.title}</h3>
                    <div className="flex items-center gap-1.5 text-[#8F8F8F] text-sm font-medium mt-1">
                      <MapPin size={14} className="text-[#3ECF8E]" /> {cargo.route}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#8F8F8F] uppercase font-bold tracking-wider">Shipper Budget</div>
                    <div className="font-mono text-xl font-bold text-[#EDEDED] mt-0.5">
                      {cargo.targetRate.toLocaleString()} {cargo.currency}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#8F8F8F]">
                  <div className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1.5 rounded border border-[#2E2E2E]">
                    <Clock size={13} className="text-amber-500" /> Posted: {cargo.pickup}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1.5 rounded border border-[#2E2E2E]">
                    <Truck size={13} className="text-[#8F8F8F]" /> Cargo: {cargo.cargoType || 'Standard Freight'} ({Number(cargo.weightKg || 25000) / 1000} tons)
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-6 py-3 bg-[#181818] border-b border-[#2E2E2E] text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider shrink-0 flex items-center justify-between">
                  <span>Live Bids ({cargo.bids.length})</span>
                  <span className="text-[10px] text-[#3ECF8E] font-medium">SRS FR-02.3 Shortlist Matching</span>
                </div>
                <ul className="divide-y divide-[#2E2E2E] overflow-auto flex-1">
                  {cargo.bids.map((bid: any, i: number) => {
                    const diff = cargo.targetRate - bid.rate;
                    const isBelow = diff > 0;
                    const isAbove = diff < 0;
                    const isMatch = diff === 0;

                    return (
                      <li key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-[#2A2A2A] transition-colors ${i === 0 ? 'bg-[#3ECF8E]/5' : ''}`}>
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                          <div className="w-10 h-10 rounded-full bg-[#181818] border border-[#2E2E2E] flex items-center justify-center shrink-0">
                            <Truck size={18} className="text-[#3ECF8E]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-[#EDEDED]">{bid.carrier}</span>
                              <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                <Star size={10} className="fill-amber-500" /> {bid.rating}
                              </span>
                              {bid.isVerified && (
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-1.5 py-0.5 rounded">
                                  <ShieldCheck size={11} /> Verified
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-medium text-[#8F8F8F] flex items-center gap-3">
                              <span className="flex items-center gap-1"><Clock size={12}/> Transit: {bid.lead}</span>
                              {i === 0 && <span className="text-[#3ECF8E] font-bold text-[10px] uppercase bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-1.5 py-0.5 rounded">Lowest Bid</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex flex-row sm:flex-row items-center justify-between sm:justify-end gap-6 sm:gap-6 w-full sm:w-auto border-t sm:border-0 border-[#2E2E2E] pt-4 sm:pt-0">
                          <div className="flex flex-col items-start sm:items-end">
                            <div className="font-mono text-lg font-bold text-[#EDEDED]">
                              {Number(bid.rate).toLocaleString()} {bid.currency}
                            </div>
                            <div className="mt-1">
                              {isBelow && <span className="text-[#3ECF8E] font-mono text-xs font-bold bg-[#3ECF8E]/10 px-1.5 py-0.5 rounded border border-[#3ECF8E]/20">- {Math.abs(diff).toLocaleString()} ETB Savings</span>}
                              {isAbove && <span className="text-rose-500 font-mono text-xs font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">+ {Math.abs(diff).toLocaleString()} ETB Premium</span>}
                              {isMatch && <span className="text-[#8F8F8F] font-mono text-xs font-bold bg-[#181818] px-1.5 py-0.5 rounded border border-[#2E2E2E]">Matches Budget</span>}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleAward(bid.id, bid.carrier, bid.rate, bid.currency)}
                            disabled={awardingId === bid.id}
                            className="px-5 py-2.5 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {awardingId === bid.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <>Award Contract <ArrowRight size={14} /></>
                            )}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {cargo.bids.length === 0 && (
                    <li className="p-8 text-center text-xs text-[#8F8F8F]">
                      No bids currently submitted for this consignment.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
          {cargoCards.length === 0 && (
            <div className="col-span-2 p-16 text-center text-[#8F8F8F] bg-[#232323] border border-[#2E2E2E] rounded-xl">
              No active marketplace freight loads requiring carrier matching.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
