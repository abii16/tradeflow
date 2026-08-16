import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, ChevronDown } from 'lucide-react';

type FilterStatus = 'all' | 'open' | 'transit' | 'completed';

const LOADS = [
  {
    id: 'TF-LOAD-8821',
    cargo: '40T Structural Steel',
    route: 'Djibouti → Dire Dawa',
    status: 'open' as const,
    bids: [
      { transporter: 'TransHorn Logistics', rating: 4.9, efficiency: 'Class A', proximity: '2h away', amount: 340000 },
      { transporter: 'BlueNile Freighters', rating: 4.7, efficiency: 'Class B+', proximity: '4h away', amount: 352000 },
    ],
  },
  {
    id: 'TF-LOAD-8819',
    cargo: '25T Coffee Beans',
    route: 'Modjo → Djibouti',
    status: 'transit' as const,
    bids: [
      { transporter: 'Horn Express', rating: 4.8, efficiency: 'Class A', proximity: 'En route', amount: 285000 },
    ],
  },
  {
    id: 'TF-LOAD-8812',
    cargo: '18T Textile Goods',
    route: 'Djibouti → Addis Ababa',
    status: 'completed' as const,
    bids: [
      { transporter: 'Ethio Carriers', rating: 4.6, efficiency: 'Class B', proximity: 'Delivered', amount: 410000 },
    ],
  },
];

const FILTER_OPTIONS: { value: FilterStatus; label: string; count: number }[] = [
  { value: 'all', label: 'All Loads', count: 14 },
  { value: 'open', label: 'Open for Bidding', count: 3 },
  { value: 'transit', label: 'In Transit', count: 2 },
  { value: 'completed', label: 'Completed', count: 9 },
];

export default function BidsTab() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeFilter = FILTER_OPTIONS.find(f => f.value === filter)!;
  const filteredLoads = filter === 'all' ? LOADS : LOADS.filter(l => l.status === filter);

  const statusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Active Bidding';
      case 'transit': return 'In Transit';
      case 'completed': return 'Delivered';
      default: return status;
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Loads & Bid Reviews</h1>
          <p className="text-xs text-slate-500 mt-0.5">Review transporter bids, compare ratings, and accept matches (FR-02)</p>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            {activeFilter.label} ({activeFilter.count})
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1 z-20 bg-white border border-slate-200 rounded shadow-sm py-1 w-48">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      filter === opt.value
                        ? 'bg-slate-50 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {opt.label} <span className="text-slate-400">({opt.count})</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Load Cards */}
      {filteredLoads.map((load) => (
        <div key={load.id} className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <span className="font-mono font-semibold text-xs text-slate-900">{load.id}</span>
              <span className="text-xs text-slate-500 ml-2">{load.cargo} • {load.route}</span>
            </div>
            <span className="text-xs font-mono text-slate-600">{statusLabel(load.status)}</span>
          </div>

          <Table>
            <TableHeader className="bg-slate-50 text-[11px] font-semibold text-slate-600">
              <TableRow>
                <TableHead>Transporter</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Proximity</TableHead>
                <TableHead className="text-right">Bid Amount</TableHead>
                {load.status === 'open' && <TableHead className="text-center">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {load.bids.map((bid, i) => (
                <TableRow key={i} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-900">{bid.transporter}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-slate-400 text-slate-400" />
                      <span className="font-mono font-medium text-slate-900">{bid.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700">{bid.efficiency}</TableCell>
                  <TableCell className="text-slate-600">{bid.proximity}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-slate-900">
                    ETB {bid.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  {load.status === 'open' && (
                    <TableCell className="text-center">
                      <button className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded transition-colors">
                        {t('accept_bid')}
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      {filteredLoads.length === 0 && (
        <div className="text-center py-12 text-xs text-slate-400">
          No loads matching "{activeFilter.label}" filter.
        </div>
      )}
    </div>
  );
}
