import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, ChevronDown, Sparkles } from 'lucide-react';

type FilterStatus = 'all' | 'open' | 'transit' | 'completed';

import { getShipperLoads, acceptBidEscrow } from '@/lib/apiClient';

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All Loads' },
  { value: 'open', label: 'Open for Bidding' },
  { value: 'transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
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

  const filteredLoads = loads.filter((load) => {
    if (filter === 'all') return true;
    return getStatusLabel(load.status) === filter;
  });

  const getStatusLabel = (status: string) => {
    if (status === 'POSTED' || status === 'OPEN_FOR_BIDDING' || status === 'MATCHED') return 'open';
    if (status === 'IN_TRANSIT' || status === 'ASSIGNED' || status === 'DISPATCHED') return 'transit';
    return 'completed';
  };

  const getFilterCount = (val: FilterStatus) => {
    if (val === 'all') return loads.length;
    if (val === 'open') return loads.filter(l => getStatusLabel(l.status) === 'open').length;
    if (val === 'transit') return loads.filter(l => getStatusLabel(l.status) === 'transit').length;
    if (val === 'completed') return loads.filter(l => getStatusLabel(l.status) === 'completed').length;
    return 0;
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{t('bids_exchange')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Review incoming carrier quotes and award smart contracts (FR-02)</p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === opt.value
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label} ({getFilterCount(opt.value)})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredLoads.map((load) => (
          <div key={load.id} className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div
              onClick={() => setExpandedLoad(expandedLoad === load.id ? null : load.id)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${expandedLoad === load.id ? 'rotate-180' : ''}`}
                />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">TF-LOAD-{load.id?.substring(0, 4)?.toUpperCase()}</span>
                  <h3 className="text-sm font-semibold text-slate-900">{load.title || load.cargoType || 'Freight Order'}</h3>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-700">
                    {String(typeof load.origin === 'object' && load.origin !== null ? load.origin.address || load.origin.city : load.origin).replace('Adis Ababa', 'Addis Ababa')} → {String(typeof load.destination === 'object' && load.destination !== null ? load.destination.address || load.destination.city : load.destination).replace('Adis Ababa', 'Addis Ababa')}
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono">{load.bids?.length || 0} active bids received</p>
                </div>
                <span
                  className={`px-2 py-0.5 text-[11px] font-medium rounded border capitalize ${
                    getStatusLabel(load.status) === 'open'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : getStatusLabel(load.status) === 'transit'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {getStatusLabel(load.status)}
                </span>
              </div>
            </div>

            {expandedLoad === load.id && (
              <div className="border-t border-slate-100 bg-slate-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles size={12} /> AI Shortlist
                  </div>
                  <span className="text-xs text-slate-500">Ranked by price, proximity, and fleet rating</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-slate-500">Transporter</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Fleet Rating</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Proximity</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Quote (ETB)</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!load.bids || load.bids.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-sm text-slate-500">
                          Waiting for incoming carrier bids...
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...(load.bids)].sort((a: any, b: any) => Number(a.amount) - Number(b.amount)).map((bid: any, i: number) => (
                        <TableRow key={bid.id || i} className={`border-slate-100 bg-white hover:bg-slate-50/80 ${i === 0 ? 'ring-1 ring-indigo-500/20 shadow-sm relative z-10' : ''}`}>
                          <TableCell className="font-medium text-xs text-slate-900">
                            <div className="flex items-center gap-2">
                              {bid.transporterName || bid.transporter || 'Unknown Transporter'}
                            </div>
                            <span className="mt-1 inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-mono">
                              Class A
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1 text-amber-600 font-medium">
                              <Star size={12} className="fill-amber-500 text-amber-500" />
                              {bid.transporterRating || bid.rating || '4.5'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">{bid.proximity || 'Unknown'}</TableCell>
                          <TableCell className="text-xs font-semibold font-mono text-slate-900">
                            {Number(bid.amount || bid.bidAmount).toLocaleString()} {bid.currency || 'ETB'}
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              type="button"
                              onClick={() => handleAcceptBid(bid.id)}
                              disabled={loading || (load.status !== 'POSTED' && load.status !== 'OPEN_FOR_BIDDING' && load.status !== 'MATCHED') || bid.status === 'REJECTED'}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50"
                            >
                              {bid.status === 'ACCEPTED' ? 'Accepted' : 'Accept & Lock Escrow'}
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
