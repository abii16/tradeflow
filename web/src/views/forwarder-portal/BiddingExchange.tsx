import React, { useState, useEffect } from 'react';
import { Star, Truck, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function BiddingExchange() {
  const [showFlash, setShowFlash] = useState(false);
  const [cargoCards, setCargoCards] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCargo() {
      try {
        const { getAllLoads } = await import('@/lib/apiClient');
        const res = await getAllLoads();
        const loads = res.loads || [];
        
        const formatted = loads.filter((l: any) => l.status === 'POSTED').map((load: any) => {
          const originAddr = load.origin?.address || load.origin || 'Unknown';
          const destAddr = load.destination?.address || load.destination || 'Unknown';
          return {
            title: load.title || 'Untitled Load',
            route: `${originAddr} -> ${destAddr}`,
            targetRate: load.budgetAmount ? parseInt(load.budgetAmount) : 0,
            pickup: new Date(load.createdAt).toLocaleDateString(),
            bids: []
          };
        });
        setCargoCards(formatted);
      } catch (err) {
        console.error('Failed to load cargo for bidding', err);
      }
    }
    fetchCargo();
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 flex flex-col h-full">
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-black/20 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">Freight Auction & Carrier Bidding Exchange (FR-02.3)</h1>
          <p className="text-sm text-[#8F8F8F] mt-1">Live competitive matching for unassigned TEUs.</p>
        </div>
      </div>

      {showFlash && (
        <div className="bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] px-4 py-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 shrink-0">
          <div className="flex items-center gap-2 font-medium text-sm">
            <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse"></span>
            New lowest bid received: <span className="font-bold">Kangaroo Freight</span> (<span className="font-mono">$820/TEU</span>)
          </div>
        </div>
      )}

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
                  <div className="text-[10px] text-[#8F8F8F] uppercase font-bold tracking-wider">Target Rate</div>
                  <div className="font-mono text-xl font-bold text-[#EDEDED] mt-0.5">${cargo.targetRate}/TEU</div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#8F8F8F]">
                <div className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1.5 rounded border border-[#2E2E2E]">
                  <Clock size={13} className="text-amber-500" /> Required Pickup: {cargo.pickup}
                </div>
                <div className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1.5 rounded border border-[#2E2E2E]">
                  <Truck size={13} className="text-[#8F8F8F]" /> Standard TEU
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-6 py-3 bg-[#181818] border-b border-[#2E2E2E] text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider shrink-0">
                Live Bids ({cargo.bids.length})
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
                          <Truck size={18} className="text-[#8F8F8F]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-[#EDEDED]">{bid.carrier}</span>
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <Star size={10} className="fill-amber-500" /> {bid.rating}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-[#8F8F8F] flex items-center gap-3">
                            <span className="flex items-center gap-1"><Clock size={12}/> ETA: {bid.eta}</span>
                            {i === 0 && <span className="text-[#3ECF8E] font-bold text-[10px] uppercase bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-1.5 py-0.5 rounded">Lowest Bid</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-row sm:flex-row items-center justify-between sm:justify-end gap-6 sm:gap-6 w-full sm:w-auto border-t sm:border-0 border-[#2E2E2E] pt-4 sm:pt-0">
                        <div className="flex flex-col items-start sm:items-end">
                          <div className="font-mono text-lg font-bold text-[#EDEDED]">${bid.rate}/TEU</div>
                          <div className="mt-1">
                            {isBelow && <span className="text-[#3ECF8E] font-mono text-xs font-bold bg-[#3ECF8E]/10 px-1.5 py-0.5 rounded border border-[#3ECF8E]/20">- ${Math.abs(diff)} Below Target</span>}
                            {isAbove && <span className="text-rose-500 font-mono text-xs font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">+ ${Math.abs(diff)} Above Target</span>}
                            {isMatch && <span className="text-[#8F8F8F] font-mono text-xs font-bold bg-[#181818] px-1.5 py-0.5 rounded border border-[#2E2E2E]">Matches Target</span>}
                          </div>
                        </div>
                        <button className="px-5 py-2.5 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm shrink-0 flex items-center justify-center gap-2">
                          Award Contract <ArrowRight size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
