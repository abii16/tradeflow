import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, ChevronDown, Sparkles, MapPin, ArrowRight, ShieldCheck, Activity, PackageOpen, Zap, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

type FilterStatus = 'all' | 'open' | 'transit' | 'completed';

import { getShipperLoads, acceptBidEscrow, triggerAiMatching } from '@/lib/apiClient';

const FILTER_OPTIONS: { value: FilterStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Loads', icon: <PackageOpen size={14} /> },
  { value: 'open', label: 'Open for Bidding', icon: <Activity size={14} /> },
  { value: 'transit', label: 'In Transit', icon: <Zap size={14} /> },
  { value: 'completed', label: 'Completed', icon: <ShieldCheck size={14} /> },
];

export default function BidsTab() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedLoad, setExpandedLoad] = useState<string | null>(null);
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoadId, setMatchingLoadId] = useState<string | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  const fetchLoads = async () => {
    try {
      setAiErrorMessage(null);
      const data = await getShipperLoads();
      setLoads(data.loads || []);
    } catch (error: any) {
      console.error(error);
      if (error?.message && error.message.includes('AI Freight Matching')) {
        setAiErrorMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const handleRefresh = () => fetchLoads();
    window.addEventListener('shipper:load_posted', handleRefresh);
    return () => window.removeEventListener('shipper:load_posted', handleRefresh);
  }, []);

  const handleTriggerMatch = async (loadId: string) => {
    setMatchingLoadId(loadId);
    setAiErrorMessage(null);
    try {
      await triggerAiMatching(loadId);
      await fetchLoads();
    } catch (err: any) {
      console.error('Failed to trigger AI matches:', err);
      setAiErrorMessage(err.message || 'AI Freight Matching Engine is offline on port 8000.');
    } finally {
      setMatchingLoadId(null);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      setLoading(true);
      await acceptBidEscrow(bidId);
      setLoads(prev => prev.map(l => l.bids?.some((b: any) => b.id === bidId) ? { ...l, status: 'IN_TRANSIT' } : l));
      alert('Bid accepted and locked into escrow successfully!');
      window.location.href = '/shipper/telematics';
    } catch (error) {
      console.error(error);
      alert('Failed to accept bid');
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'POSTED' || status === 'OPEN_FOR_BIDDING') return 'open';
    if (status === 'MATCHED' || status === 'IN_TRANSIT' || status === 'ASSIGNED' || status === 'DISPATCHED') return 'transit';
    return 'completed';
  };

  const filteredLoads = loads.filter((load) => {
    if (filter === 'all') return true;
    return getStatusLabel(load.status) === filter;
  });

  const getFilterCount = (val: FilterStatus) => {
    if (val === 'all') return loads.length;
    if (val === 'open') return loads.filter(l => getStatusLabel(l.status) === 'open').length;
    if (val === 'transit') return loads.filter(l => getStatusLabel(l.status) === 'transit').length;
    if (val === 'completed') return loads.filter(l => getStatusLabel(l.status) === 'completed').length;
    return 0;
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#2E2E2E]/80 gap-4">
        <div className="relative z-10">

          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight capitalize">
            {t('bids_exchange')}
          </h1>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex flex-wrap gap-3 items-center relative z-10">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            const count = getFilterCount(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                  isActive
                    ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/30 text-[#3ECF8E]'
                    : 'bg-[#232323] border-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] hover:border-[#8F8F8F]'
                }`}
              >
                {opt.icon}
                {opt.label}
                <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                  isActive ? 'bg-[#3ECF8E]/20 text-[#3ECF8E]' : 'bg-[#1C1C1C] text-[#8F8F8F]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Engine Status Alert */}
      {aiErrorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between text-red-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{aiErrorMessage}</span>
          </div>
          <button
            onClick={() => fetchLoads()}
            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4 relative">
        {filteredLoads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#232323] border border-dashed border-[#2E2E2E] rounded-2xl text-center">
            <div className="w-16 h-16 bg-[#1C1C1C] rounded-full flex items-center justify-center mb-4 border border-[#2E2E2E] shadow-sm">
              <PackageOpen size={24} className="text-[#8F8F8F]" />
            </div>
            <h3 className="text-base font-semibold text-[#EDEDED] mb-1">No loads found</h3>
            <p className="text-sm text-[#8F8F8F] max-w-sm">There are currently no loads matching your selected filter. Try changing your filter or post a new freight order.</p>
          </div>
        ) : (
          filteredLoads.map((load, index) => {
            const isExpanded = expandedLoad === load.id;
            const statusLabel = getStatusLabel(load.status);
            
            return (
              <div 
                key={load.id} 
                className={`group bg-[#232323] rounded-xl overflow-hidden transition-all duration-300 ${
                  isExpanded 
                    ? 'ring-1 ring-[#3ECF8E]/20 shadow-lg shadow-blue-900/5 border-transparent' 
                    : 'border border-[#2E2E2E] hover:border-blue-300/60 hover:shadow-md'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  onClick={() => setExpandedLoad(isExpanded ? null : load.id)}
                  className={`p-3 flex flex-col lg:flex-row lg:items-center justify-between cursor-pointer transition-colors relative overflow-hidden ${
                    isExpanded ? 'bg-[#3ECF8E]/10' : 'hover:bg-[#1C1C1C]/50'
                  }`}
                >
                  {/* Left Side: ID and Title */}
                  <div className="flex items-start gap-4 mb-4 lg:mb-0 w-full lg:w-1/3">
                    <div className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                      isExpanded ? 'bg-[#3ECF8E]/20 text-[#3ECF8E]' : 'bg-[#181818] text-[#8F8F8F] group-hover:bg-[#3ECF8E]/10 group-hover:text-[#3ECF8E]'
                    }`}>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-mono font-bold bg-[#181818] text-[#8F8F8F] px-2 py-0.5 rounded-sm tracking-widest border border-[#2E2E2E]/60">
                          TF-LOAD-{load.id?.substring(0, 4)?.toUpperCase()}
                        </span>
                        {load.bids?.length > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-sm border border-amber-500/20 animate-pulse">
                            <Activity size={10} />
                            {load.bids.length} BIDS
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#EDEDED] group-hover:text-[#3ECF8E] transition-colors leading-snug">
                        {load.title || load.cargoType || 'Freight Order'}
                      </h3>
                    </div>
                  </div>

                  {/* Middle Side: Route */}
                  <div className="flex-1 px-0 lg:px-6 mb-4 lg:mb-0 hidden md:flex items-center justify-center">
                    <div className="flex items-center gap-4 w-full justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-end text-right w-[42%]">
                        <div className="text-xs font-semibold text-[#EDEDED] mb-0.5 line-clamp-1" title={String(typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin).replace('Adis Ababa', 'Addis Ababa')}>
                          {String(typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin).replace('Adis Ababa', 'Addis Ababa').split(',')[0]}
                        </div>
                        <span className="text-[10px] text-[#8F8F8F] uppercase tracking-wider font-medium">Origin</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center px-1 shrink-0">
                        <div className="w-12 h-px bg-slate-200 relative flex items-center justify-center">
                          <ArrowRight size={14} className="text-[#8F8F8F] absolute bg-[#232323] px-0.5" />
                        </div>
                      </div>

                      <div className="flex flex-col items-start text-left w-[42%]">
                        <div className="text-xs font-semibold text-[#EDEDED] mb-0.5 line-clamp-1" title={String(typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination).replace('Adis Ababa', 'Addis Ababa')}>
                          {String(typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination).replace('Adis Ababa', 'Addis Ababa').split(',')[0]}
                        </div>
                        <span className="text-[10px] text-[#8F8F8F] uppercase tracking-wider font-medium">Destination</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Status */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 border-[#2E2E2E] pt-3 lg:pt-0">
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full border shadow-sm capitalize ${
                        statusLabel === 'open'
                          ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/20'
                          : statusLabel === 'transit'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-[#1C1C1C] text-[#8F8F8F] border-[#2E2E2E]'
                      }`}
                    >
                      {statusLabel === 'open' ? <div className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-ping" /> : null}
                      {statusLabel === 'transit' ? <Zap size={12} className="text-[#3ECF8E]" /> : null}
                      {statusLabel === 'completed' ? <ShieldCheck size={12} className="text-[#8F8F8F]" /> : null}
                      {getStatusLabel(load.status)}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Area */}
                {isExpanded && (
                  <div className="border-t border-[#2E2E2E] bg-[#181818] p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles size={12} /> AI Smart Match
                        </div>
                        <span className="text-xs font-medium text-[#8F8F8F] flex items-center gap-1">
                          <Clock size={12} /> Ranked real-time by price, proximity & reliability (FR-02)
                        </span>
                      </div>
                      {(load.status === 'POSTED' || load.status === 'OPEN_FOR_BIDDING') && (
                        <button
                          type="button"
                          onClick={() => handleTriggerMatch(load.id)}
                          disabled={matchingLoadId === load.id}
                          className="text-xs font-bold text-[#3ECF8E] hover:text-[#3ECF8E]/80 bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={matchingLoadId === load.id ? 'animate-spin' : ''} />
                          {matchingLoadId === load.id ? 'Evaluating Network...' : 'Re-scan AI Matches'}
                        </button>
                      )}
                    </div>
                    
                    <div className="border border-[#2E2E2E]/70 rounded-xl overflow-hidden shadow-sm bg-[#232323]">
                      <Table>
                        <TableHeader className="bg-[#1C1C1C]/80">
                          <TableRow className="border-[#2E2E2E]/70 hover:bg-transparent">
                            <TableHead className="text-xs font-bold text-[#8F8F8F] h-10">Transporter</TableHead>
                            <TableHead className="text-xs font-bold text-[#8F8F8F] h-10">Rating</TableHead>
                            <TableHead className="text-xs font-bold text-[#8F8F8F] h-10">Distance</TableHead>
                            <TableHead className="text-xs font-bold text-[#8F8F8F] h-10">Quote</TableHead>
                            <TableHead className="text-xs font-bold text-[#8F8F8F] h-10 text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(!load.bids || load.bids.length === 0) ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-36 text-center">
                                <div className="flex flex-col items-center justify-center text-[#8F8F8F] py-4">
                                  <Activity size={24} className="mb-2 animate-pulse text-[#3ECF8E]" />
                                  <p className="text-sm font-medium text-[#EDEDED]">Scanning network for optimal carrier bids...</p>
                                  <p className="text-xs text-[#8F8F8F] mt-1">AI Freight Matching Engine is evaluating verified carriers.</p>
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerMatch(load.id)}
                                    disabled={matchingLoadId === load.id}
                                    className="mt-3.5 text-xs bg-[#3ECF8E]/15 hover:bg-[#3ECF8E]/25 text-[#3ECF8E] border border-[#3ECF8E]/40 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                                  >
                                    <Sparkles size={14} className={matchingLoadId === load.id ? 'animate-spin' : ''} />
                                    {matchingLoadId === load.id ? 'Evaluating Machine Learning Match...' : 'Trigger AI Smart Match Now'}
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            [...(load.bids)]
                              .sort((a: any, b: any) => {
                                const scoreA = typeof a.aiMatchScore === 'number' ? a.aiMatchScore : 0;
                                const scoreB = typeof b.aiMatchScore === 'number' ? b.aiMatchScore : 0;
                                if (scoreB !== scoreA) {
                                  return scoreB - scoreA; // Highest percentage first!
                                }
                                return Number(a.amount || a.bidAmount) - Number(b.amount || b.bidAmount);
                              })
                              .map((bid: any, i: number, sortedArr: any[]) => (
                              <TableRow key={bid.id || i} className={`border-[#2E2E2E] transition-colors ${i === 0 ? 'bg-[#3ECF8E]/10/30 hover:bg-[#3ECF8E]/10/50' : 'bg-[#232323] hover:bg-[#1C1C1C]'}`}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-[#2E2E2E] flex items-center justify-center text-[#EDEDED] font-bold text-xs">
                                      {(bid.transporterName || bid.transporter || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-[#EDEDED] flex items-center gap-2">
                                        {bid.transporterName || bid.transporter || 'Unknown Transporter'}
                                        {i === 0 && (
                                          <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Top Pick</span>
                                        )}
                                        {bid.aiMatchScore && (
                                          <span className="bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                            {bid.aiMatchScore}% Match
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-[#8F8F8F] font-mono flex items-center gap-1 mt-0.5">
                                        <ShieldCheck size={10} className="text-green-500" /> {bid.transporterCompany ? `${bid.transporterCompany} · ` : ''}Verified Carrier
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5 bg-amber-50 inline-flex px-2 py-1 rounded-md border border-amber-100/50">
                                    <Star size={12} className="fill-amber-500 text-amber-500" />
                                    <span className="text-xs font-bold text-amber-700">{bid.transporterRating || bid.rating || '4.8'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-medium text-[#8F8F8F] flex items-center gap-1.5">
                                    <MapPin size={12} className="text-[#8F8F8F]" />
                                    {bid.proximity || '< 15 km'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-black font-mono tracking-tight ${i === 0 ? 'text-green-600' : 'text-[#EDEDED]'}`}>
                                      {Number(bid.amount || bid.bidAmount).toLocaleString()} <span className="text-[10px] font-bold text-[#8F8F8F]">{bid.currency || 'ETB'}</span>
                                    </span>
                                    {i > 0 && sortedArr[0] && (
                                      <span className="text-[10px] text-zinc-400 font-mono">
                                        {Number(bid.amount) >= Number(sortedArr[0].amount) ? '+' : ''}
                                        {(Number(bid.amount) - Number(sortedArr[0].amount)).toLocaleString()} diff
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptBid(bid.id)}
                                    disabled={loading || (load.status !== 'POSTED' && load.status !== 'OPEN_FOR_BIDDING' && load.status !== 'MATCHED') || bid.status === 'REJECTED'}
                                    className={`relative overflow-hidden group text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                      bid.status === 'ACCEPTED'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:shadow-md hover:-translate-y-px'
                                    }`}
                                  >
                                    <span className="relative z-10 flex items-center gap-1.5">
                                      {bid.status === 'ACCEPTED' ? (
                                        <><ShieldCheck size={14} /> Contract Secured</>
                                      ) : (
                                        <>Accept & Lock Escrow <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></>
                                      )}
                                    </span>
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

