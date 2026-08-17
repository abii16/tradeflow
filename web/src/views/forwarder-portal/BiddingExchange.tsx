import React, { useState, useEffect } from 'react';
import { Star, Truck, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function BiddingExchange() {
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    // Simulate a live bid arriving after 3 seconds
    const timer = setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 5000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const cargoCards = [
    {
      title: '30T Rebar',
      route: 'Djibouti -> Modjo',
      pickup: '24h',
      targetRate: '$850/TEU',
      bids: [
        { carrier: 'Kangaroo Freight', rating: 4.9, rate: '$820/TEU', eta: '12h' },
        { carrier: 'Tana Logistics', rating: 4.8, rate: '$850/TEU', eta: '24h' },
        { carrier: 'Ethio-Djibouti Line', rating: 4.2, rate: '$910/TEU', eta: '72h' },
      ]
    },
    {
      title: '20T Agricultural Equipment',
      route: 'Galafi -> Modjo',
      pickup: '48h',
      targetRate: '$780/TEU',
      bids: [
        { carrier: 'Abyssinia Transit', rating: 4.7, rate: '$760/TEU', eta: '18h' },
        { carrier: 'BlueNile Freighters', rating: 4.6, rate: '$790/TEU', eta: '24h' },
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-inter">Freight Auction & Carrier Bidding Exchange (FR-02.3)</h1>
          <p className="text-sm text-slate-500 font-inter mt-1">Live competitive matching for unassigned TEUs.</p>
        </div>
      </div>

      {showFlash && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-medium text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            New lowest bid received: <span className="font-bold">Kangaroo Freight</span> (<span className="font-mono">$820/TEU</span>)
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {cargoCards.map((cargo, idx) => (
          <div key={idx} className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-inter">{cargo.title}</h3>
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm font-medium mt-1">
                    <MapPin size={16} className="text-blue-500" /> {cargo.route}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Target Rate</div>
                  <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">{cargo.targetRate}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  <Clock size={14} className="text-amber-500" /> Required Pickup: {cargo.pickup}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  <Truck size={14} className="text-slate-400" /> Standard TEU
                </div>
              </div>
            </div>

            <div className="p-0 flex-1">
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Live Bids ({cargo.bids.length})
              </div>
              <ul className="divide-y divide-slate-100">
                {cargo.bids.map((bid, i) => (
                  <li key={i} className={`flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors ${i === 0 ? 'bg-emerald-50/30' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <Truck size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">{bid.carrier}</span>
                          <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 rounded border border-amber-200">
                            <Star size={10} className="fill-amber-500" /> {bid.rating}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock size={12}/> ETA: {bid.eta}</span>
                          {i === 0 && <span className="text-emerald-600 font-bold text-[10px] uppercase bg-emerald-100 px-1.5 rounded">Lowest Bid</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <div className="font-mono text-base font-bold text-slate-900">{bid.rate}</div>
                      <button className="px-4 py-2 bg-[#0F172A] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm shrink-0 flex items-center justify-center gap-1.5">
                        Award Contract <ArrowRight size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
