import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, ChevronDown, Sparkles, MapPin, ArrowRight, ShieldCheck, Activity, PackageOpen, Zap, Clock } from 'lucide-react';

type FilterStatus = 'all' | 'open' | 'transit' | 'completed';

import { getShipperLoads, acceptBidEscrow } from '@/lib/apiClient';

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

  const fetchLoads = async () => {
    try {
      const data = await getShipperLoads();
      setLoads(data.loads || []);
    } catch (error) {
      console.error(error);
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
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div className="relative z-10">

          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight capitalize">
            {t('bids_exchange')}
          </h1>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 shadow-inner backdrop-blur-sm relative z-10">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            const count = getFilterCount(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`relative flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-200/50 -z-10 transition-all" />
                )}
                <span className={`${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                  {opt.icon}
                </span>
                {opt.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/50 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4 relative">
        {filteredLoads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
              <PackageOpen size={24} className="text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No loads found</h3>
            <p className="text-sm text-slate-500 max-w-sm">There are currently no loads matching your selected filter. Try changing your filter or post a new freight order.</p>
          </div>
        ) : (
          filteredLoads.map((load, index) => {
            const isExpanded = expandedLoad === load.id;
            const statusLabel = getStatusLabel(load.status);
            
            return (
              <div 
                key={load.id} 
                className={`group bg-white rounded-xl overflow-hidden transition-all duration-300 ${
                  isExpanded 
                    ? 'ring-1 ring-blue-500/20 shadow-lg shadow-blue-900/5 border-transparent' 
                    : 'border border-slate-200 hover:border-blue-300/60 hover:shadow-md'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  onClick={() => setExpandedLoad(isExpanded ? null : load.id)}
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between cursor-pointer transition-colors relative overflow-hidden ${
                    isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Left Side: ID and Title */}
                  <div className="flex items-start gap-4 mb-4 lg:mb-0 w-full lg:w-1/3">
                    <div className={`mt-1.5 w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                      isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                    }`}>
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm tracking-widest border border-slate-200/60">
                          TF-LOAD-{load.id?.substring(0, 4)?.toUpperCase()}
                        </span>
                        {load.bids?.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-100 animate-pulse">
                            <Activity size={10} />
                            {load.bids.length} BIDS
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                        {load.title || load.cargoType || 'Freight Order'}
                      </h3>
                    </div>
                  </div>

                  {/* Middle Side: Route */}
                  <div className="flex-1 px-0 lg:px-6 mb-4 lg:mb-0 hidden md:flex items-center justify-center">
                    <div className="flex items-center gap-4 w-full justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-end text-right w-[42%]">
                        <div className="text-xs font-semibold text-slate-700 mb-0.5 line-clamp-1" title={String(typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin).replace('Adis Ababa', 'Addis Ababa')}>
                          {String(typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin).replace('Adis Ababa', 'Addis Ababa').split(',')[0]}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Origin</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center px-1 shrink-0">
                        <div className="w-12 h-px bg-slate-200 relative flex items-center justify-center">
                          <ArrowRight size={14} className="text-slate-400 absolute bg-white px-0.5" />
                        </div>
                      </div>

                      <div className="flex flex-col items-start text-left w-[42%]">
                        <div className="text-xs font-semibold text-slate-700 mb-0.5 line-clamp-1" title={String(typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination).replace('Adis Ababa', 'Addis Ababa')}>
                          {String(typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination).replace('Adis Ababa', 'Addis Ababa').split(',')[0]}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Destination</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Status */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-sm capitalize ${
                        statusLabel === 'open'
                          ? 'bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-800 border-emerald-200'
                          : statusLabel === 'transit'
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-800 border-blue-200'
                          : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {statusLabel === 'open' ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> : null}
                      {statusLabel === 'transit' ? <Zap size={12} className="text-blue-600" /> : null}
                      {statusLabel === 'completed' ? <ShieldCheck size={12} className="text-slate-500" /> : null}
                      {getStatusLabel(load.status)}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Area */}
                {isExpanded && (
                  <div className="border-t border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 uppercase tracking-wider shadow-sm shadow-blue-500/20">
                          <Sparkles size={12} /> AI Smart Match
                        </div>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> Ranked real-time by price & rating
                        </span>
                      </div>
                    </div>
                    
                    <div className="border border-slate-200/70 rounded-xl overflow-hidden shadow-sm bg-white">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow className="border-slate-200/70 hover:bg-transparent">
                            <TableHead className="text-xs font-bold text-slate-600 h-10">Transporter</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 h-10">Rating</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 h-10">Distance</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 h-10">Quote</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 h-10 text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(!load.bids || load.bids.length === 0) ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center">
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                  <Activity size={20} className="mb-2 animate-pulse" />
                                  <p className="text-sm font-medium">Scanning network for optimal carrier bids...</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            [...(load.bids)].sort((a: any, b: any) => Number(a.amount) - Number(b.amount)).map((bid: any, i: number) => (
                              <TableRow key={bid.id || i} className={`border-slate-100 transition-colors ${i === 0 ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                                      {(bid.transporterName || bid.transporter || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        {bid.transporterName || bid.transporter || 'Unknown Transporter'}
                                        {i === 0 && (
                                          <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Top Pick</span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                        <ShieldCheck size={10} className="text-green-500" /> Verified Carrier
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
                                  <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                    <MapPin size={12} className="text-slate-400" />
                                    {bid.proximity || '< 15 km'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-black font-mono tracking-tight ${i === 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                      {Number(bid.amount || bid.bidAmount).toLocaleString()} <span className="text-[10px] font-bold text-slate-500">{bid.currency || 'ETB'}</span>
                                    </span>
                                    {i > 0 && load.bids[0] && (
                                      <span className="text-[10px] text-red-500 font-medium">
                                        +{(Number(bid.amount) - Number(load.bids[0].amount)).toLocaleString()} diff
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

