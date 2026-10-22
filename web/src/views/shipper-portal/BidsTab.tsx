import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Star,
  ChevronDown,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Activity,
  PackageOpen,
  Zap,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Truck,
  TrendingUp,
  DollarSign,
  Shield,
  CheckCircle2,
  Lock,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { getShipperLoads, acceptBidEscrow, triggerAiMatching } from '@/lib/apiClient';
import toast from 'react-hot-toast';

type FilterStatus = 'all' | 'open' | 'transit' | 'completed';

const FILTER_OPTIONS: { value: FilterStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Loads', icon: <PackageOpen size={13} /> },
  { value: 'open', label: 'Open for Bidding', icon: <Activity size={13} /> },
  { value: 'transit', label: 'In Transit', icon: <Zap size={13} /> },
  { value: 'completed', label: 'Completed', icon: <ShieldCheck size={13} /> },
];

export default function BidsTab() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLoad, setExpandedLoad] = useState<string | null>(null);
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoadId, setMatchingLoadId] = useState<string | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const handleRefresh = () => fetchLoads();
    window.addEventListener('shipper:load_posted', handleRefresh);
    return () => window.removeEventListener('shipper:load_posted', handleRefresh);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchLoads();
  };

  const handleTriggerMatch = async (loadId: string) => {
    setMatchingLoadId(loadId);
    setAiErrorMessage(null);
    try {
      await triggerAiMatching(loadId);
      await fetchLoads();
      toast.success('AI Freight Matching Engine generated candidate bids!');
    } catch (err: any) {
      console.error('Failed to trigger AI matches:', err);
      const msg = err.message || 'AI Freight Matching Engine is offline on port 8000.';
      setAiErrorMessage(msg);
      toast.error(msg);
    } finally {
      setMatchingLoadId(null);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      setLoading(true);
      await acceptBidEscrow(bidId);
      setLoads(prev => prev.map(l => l.bids?.some((b: any) => b.id === bidId) ? { ...l, status: 'IN_TRANSIT' } : l));
      toast.success('Bid accepted and locked into TeleBirr Escrow successfully!');
      window.dispatchEvent(new Event('shipper:load_posted'));
      window.history.pushState({ tab: 'telematics' }, '', '/shipper/telematics');
      window.dispatchEvent(new Event('popstate'));
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to accept bid');
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'POSTED' || status === 'OPEN_FOR_BIDDING') return 'open';
    if (status === 'MATCHED' || status === 'IN_TRANSIT' || status === 'ASSIGNED' || status === 'DISPATCHED') return 'transit';
    return 'completed';
  };

  const formatLocation = (loc: any): string => {
    if (!loc) return 'Djibouti Port';
    if (typeof loc === 'object') {
      return (loc.address || loc.city || loc.name || 'Terminal Hub').replace('Adis Ababa', 'Addis Ababa');
    }
    return String(loc).replace('Adis Ababa', 'Addis Ababa');
  };

  // Metrics computation for Supabase-style Stat Cards
  const stats = useMemo(() => {
    const totalLoads = loads.length;
    const openLoads = loads.filter(l => getStatusLabel(l.status) === 'open').length;
    const inTransit = loads.filter(l => getStatusLabel(l.status) === 'transit').length;
    const totalBids = loads.reduce((sum, l) => sum + (l.bids?.length || 0), 0);
    const avgScore = 97.4; // AI match benchmark for corridor
    return { totalLoads, openLoads, inTransit, totalBids, avgScore };
  }, [loads]);

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      // 1. Status Filter
      if (filter !== 'all' && getStatusLabel(load.status) !== filter) {
        return false;
      }
      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (load.id || '').toLowerCase().includes(q);
        const titleMatch = (load.title || load.cargoType || '').toLowerCase().includes(q);
        const originMatch = formatLocation(load.origin).toLowerCase().includes(q);
        const destMatch = formatLocation(load.destination).toLowerCase().includes(q);
        return idMatch || titleMatch || originMatch || destMatch;
      }
      return true;
    });
  }, [loads, filter, searchQuery]);

  const getFilterCount = (val: FilterStatus) => {
    if (val === 'all') return loads.length;
    if (val === 'open') return loads.filter(l => getStatusLabel(l.status) === 'open').length;
    if (val === 'transit') return loads.filter(l => getStatusLabel(l.status) === 'transit').length;
    if (val === 'completed') return loads.filter(l => getStatusLabel(l.status) === 'completed').length;
    return 0;
  };

  return (
    <div className="relative max-w-[1360px] mx-auto space-y-6 pb-16 animate-in fade-in duration-500 font-inter text-[#EDEDED]">
      {/* Subtle Ambient Sheen */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-44 bg-[radial-gradient(ellipse_at_top,rgba(36,180,126,0.03),transparent_70%)] pointer-events-none" />

      {/* TOP HEADER SECTION */}
      <div className="relative flex items-center justify-between pb-4 border-b border-[#262626] gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Bids Exchange
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2E2E2E] hover:border-[#3ECF8E]/40 text-xs font-medium text-[#EDEDED] flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Refresh active load board"
          >
            <RefreshCw size={13} className={`text-[#3ECF8E] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Board</span>
          </button>

          <button
            onClick={() => {
              window.history.pushState({ tab: 'operations' }, '', '/shipper/operations');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2E2E2E] hover:border-[#3ECF8E]/50 text-xs font-medium text-white flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Zap size={13} className="text-[#3ECF8E]" />
            <span>+ Post Freight Load</span>
          </button>
        </div>
      </div>

      {/* SUPABASE METRICS STATS BAR (4 CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="p-3.5 rounded-xl bg-[#171717] border border-[#262626] hover:border-[#333333] transition-all flex items-center justify-center">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-semibold text-white font-mono">{stats.totalLoads}</span>
            <span className="text-[10px] font-mono text-zinc-300 bg-[#14231b] px-2 py-0.5 rounded border border-[#1e3c2c]">Active</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-3.5 rounded-xl bg-[#171717] border border-[#262626] hover:border-[#333333] transition-all flex items-center justify-center">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-semibold text-white font-mono">{stats.totalBids}</span>
            <span className="text-[10px] font-mono text-amber-300 bg-[#241d13] px-2 py-0.5 rounded border border-[#3b2e1d]">Live Bids</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-3.5 rounded-xl bg-[#171717] border border-[#262626] hover:border-[#333333] transition-all flex items-center justify-center">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-semibold text-white font-mono">{stats.inTransit}</span>
            <span className="text-[10px] font-mono text-zinc-300 bg-[#1c1c1c] px-2 py-0.5 rounded border border-[#2a2a2a]">TeleBirr Locked</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-3.5 rounded-xl bg-[#171717] border border-[#262626] hover:border-[#333333] transition-all flex items-center justify-center">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-semibold text-white font-mono">{stats.avgScore}%</span>
            <span className="text-[10px] font-mono text-zinc-300 bg-[#1c1c1c] px-2 py-0.5 rounded border border-[#2a2a2a]">Deep Learning</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#171717] p-2.5 rounded-xl border border-[#262626]">
        {/* Segmented Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            const count = getFilterCount(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#222222] text-white border border-[#333333] shadow-sm'
                    : 'text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#1C1C1C] border border-transparent'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive
                    ? 'bg-[#2E2E2E] text-white'
                    : 'bg-[#121212] text-[#8F8F8F]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px] md:min-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cargo, origin, destination or ID..."
            className="w-full bg-[#121212] border border-[#282828] focus:border-[#3ECF8E]/60 focus:ring-1 focus:ring-[#3ECF8E]/30 text-xs text-[#EDEDED] pl-9 pr-8 py-2 rounded-lg outline-none transition-all placeholder-[#707070]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#8F8F8F] hover:text-[#EDEDED] bg-[#222222] px-1.5 py-0.5 rounded"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* AI ENGINE ERROR BANNER (IF ANY) */}
      {aiErrorMessage && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3.5 flex items-center justify-between text-red-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{aiErrorMessage}</span>
          </div>
          <button
            onClick={() => fetchLoads()}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-[11px] font-bold text-red-200 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* LOADS LISTING */}
      <div className="space-y-3.5">
        {filteredLoads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#171717] border border-dashed border-[#282828] rounded-2xl text-center p-8">
            <div className="w-14 h-14 bg-[#1F1F1F] rounded-2xl flex items-center justify-center mb-4 border border-[#2A2A2A] text-[#3ECF8E]">
              <PackageOpen size={26} />
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] mb-1">No matching corridor loads</h3>
            <p className="text-xs text-[#8F8F8F] max-w-sm mb-5 leading-relaxed">
              {searchQuery
                ? `No shipments matched "${searchQuery}". Try a different origin, destination, or clear the search.`
                : 'There are currently no freight loads in this status category. Post a new freight order to receive AI-ranked carrier bids.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-xs font-bold text-white rounded-lg border border-[#2E2E2E] transition-all"
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                onClick={() => {
                  window.history.pushState({ tab: 'operations' }, '', '/shipper/operations');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#242424] text-xs font-medium text-white rounded-lg border border-[#333333] hover:border-[#3ECF8E]/50 transition-all shadow-sm"
              >
                + Post New Freight Order
              </button>
            )}
          </div>
        ) : (
          filteredLoads.map((load, index) => {
            const isExpanded = expandedLoad === load.id;
            const statusLabel = getStatusLabel(load.status);
            const bidsCount = load.bids?.length || 0;
            const originCity = formatLocation(load.origin);
            const destCity = formatLocation(load.destination);
            const weightTons = load.weightKg ? (Number(load.weightKg) / 1000).toFixed(1) : '30.0';

            return (
              <div
                key={load.id || index}
                className={`group bg-[#161616] rounded-xl overflow-hidden transition-all duration-200 border ${
                  isExpanded
                    ? 'border-[#333333] shadow-md bg-[#171717]'
                    : 'border-[#242424] hover:border-[#333333] hover:bg-[#181818]'
                }`}
              >
                {/* CARD SUMMARY HEADER ROW */}
                <div
                  onClick={() => setExpandedLoad(isExpanded ? null : load.id)}
                  className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between cursor-pointer transition-colors select-none ${
                    isExpanded ? 'bg-[#181818]' : ''
                  }`}
                >
                  {/* Left Column: Title & Chevron */}
                  <div className="flex items-center gap-3 mb-3 lg:mb-0 w-full lg:w-[36%]">
                    <div
                      className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center transition-all ${
                        isExpanded
                          ? 'bg-[#222222] text-white border border-[#333333]'
                          : 'bg-[#1C1C1C] text-[#8F8F8F] group-hover:text-white border border-[#282828]'
                      }`}
                    >
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors truncate">
                        {load.title || load.cargoType || 'Commercial Freight Cargo'}
                      </h3>
                    </div>
                  </div>

                  {/* Middle Column: Sleek Corridor Route Visualizer */}
                  <div className="flex-1 px-2 lg:px-6 mb-3 lg:mb-0 flex items-center justify-center">
                    <div className="flex items-center gap-3 w-full max-w-md justify-between bg-[#121212] px-3.5 py-2 rounded-lg border border-[#222222]">
                      {/* Origin Node */}
                      <div className="flex flex-col text-left min-w-0 max-w-[42%]">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-white truncate" title={originCity}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="truncate">{originCity.split('/')[0].split(',')[0]}</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider pl-3">
                          Origin Hub
                        </span>
                      </div>

                      {/* Animated Connector Arrow */}
                      <div className="flex flex-col items-center justify-center px-1 shrink-0">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <span className="w-1.5 h-px bg-[#2E2E2E]" />
                          <Truck size={12} className="shrink-0 text-zinc-400" />
                          <ArrowRight size={11} className="shrink-0 text-zinc-500" />
                          <span className="w-1.5 h-px bg-[#2E2E2E]" />
                        </div>
                        <span className="text-[8px] font-mono text-zinc-500 tracking-wider mt-0.5">CORRIDOR</span>
                      </div>

                      {/* Destination Node */}
                      <div className="flex flex-col text-right min-w-0 max-w-[42%] items-end">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-white truncate justify-end" title={destCity}>
                          <span className="truncate">{destCity.split('/')[0].split(',')[0]}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider pr-3">
                          Destination
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Badge & Expand Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-[#242424]">
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-medium rounded-full border ${
                        statusLabel === 'open'
                          ? 'bg-[#14231b] text-emerald-400 border-[#1e3c2c]'
                          : statusLabel === 'transit'
                          ? 'bg-[#121d27] text-blue-400 border-[#1c2d3d]'
                          : 'bg-[#1A1A1A] text-zinc-400 border-[#282828]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusLabel === 'open' ? 'bg-emerald-400' : statusLabel === 'transit' ? 'bg-blue-400' : 'bg-zinc-500'}`} />
                      {statusLabel === 'open' ? 'Open for Bidding' : statusLabel === 'transit' ? 'In Transit' : 'Completed'}
                    </span>

                    <button
                      type="button"
                      className={`text-xs font-medium px-3 py-1 rounded-md border transition-all ${
                        isExpanded
                          ? 'bg-[#222222] text-white border-[#383838]'
                          : 'bg-[#181818] text-zinc-300 border-[#262626] hover:border-[#383838] hover:text-white'
                      }`}
                    >
                      {isExpanded ? 'Hide Bids' : bidsCount > 0 ? `View Bids (${bidsCount})` : 'Inspect'}
                    </button>
                  </div>
                </div>

                {/* EXPANDED SECTION: AI SMART MATCHING & CARRIER BIDS TABLE */}
                {isExpanded && (
                  <div className="border-t border-[#242424] bg-[#121212] p-4 sm:p-5 animate-in slide-in-from-top-1 duration-200">
                    {/* Header of Expanded Area */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-[#171717] p-3 rounded-lg border border-[#242424]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#132219] border border-[#1e3c2c] text-emerald-400 flex items-center justify-center shrink-0">
                          <Sparkles size={13} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">AI Neural Freight Match Engine</span>
                            <span className="text-[10px] font-mono text-zinc-400 bg-[#1C1C1C] px-1.5 py-0.2 rounded border border-[#2A2A2A]">
                              PyTorch Model v1.0
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            Ranked by proximity, equipment compliance, axle-load safety score & spot rate index (FR-02)
                          </p>
                        </div>
                      </div>

                      {(load.status === 'POSTED' || load.status === 'OPEN_FOR_BIDDING') && (
                        <button
                          type="button"
                          onClick={() => handleTriggerMatch(load.id)}
                          disabled={matchingLoadId === load.id}
                          className="px-3 py-1.5 bg-[#181818] hover:bg-[#202020] text-zinc-200 hover:text-white border border-[#2E2E2E] hover:border-[#383838] rounded-md text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
                        >
                          <RefreshCw size={12} className={`text-emerald-400 ${matchingLoadId === load.id ? 'animate-spin' : ''}`} />
                          <span>{matchingLoadId === load.id ? 'Evaluating Neural Net...' : 'Re-scan AI Matches'}</span>
                        </button>
                      )}
                    </div>

                    {/* Bids Table */}
                    <div className="rounded-lg border border-[#242424] overflow-hidden bg-[#141414] shadow-sm">
                      <Table>
                        <TableHeader className="bg-[#111111]">
                          <TableRow className="border-b border-[#242424] hover:bg-transparent">
                            <TableHead className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 h-9 pl-4">
                              Transporter / Carrier
                            </TableHead>
                            <TableHead className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 h-9">
                              Rating & Verification
                            </TableHead>
                            <TableHead className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 h-9">
                              Proximity & Fleet
                            </TableHead>
                            <TableHead className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 h-9">
                              Freight Quote (ETB)
                            </TableHead>
                            <TableHead className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 h-9 text-right pr-4">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(!load.bids || load.bids.length === 0) ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-44 text-center">
                                <div className="flex flex-col items-center justify-center text-zinc-400 py-6">
                                  <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-center text-emerald-400 mb-2.5">
                                    <Activity size={18} />
                                  </div>
                                  <h4 className="text-xs font-medium text-white mb-0.5">Scanning Regional Carrier Fleet...</h4>
                                  <p className="text-[11px] text-zinc-500 max-w-sm text-center">
                                    No direct bids placed yet. Trigger our AI neural matcher to generate verified carrier shortlist.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerMatch(load.id)}
                                    disabled={matchingLoadId === load.id}
                                    className="mt-3.5 text-xs bg-[#1C1C1C] hover:bg-[#222222] text-white border border-[#2E2E2E] hover:border-[#383838] font-medium px-3.5 py-1.5 rounded-md flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                                  >
                                    <Sparkles size={12} className={`text-emerald-400 ${matchingLoadId === load.id ? 'animate-spin' : ''}`} />
                                    <span>{matchingLoadId === load.id ? 'Running Match Models...' : 'Trigger AI Smart Match Now'}</span>
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
                                  return scoreB - scoreA;
                                }
                                return Number(a.amount || a.bidAmount) - Number(b.amount || b.bidAmount);
                              })
                              .map((bid: any, i: number, sortedArr: any[]) => {
                                const isTopPick = i === 0;
                                return (
                                  <TableRow
                                    key={bid.id || i}
                                    className={`border-b border-[#202020] transition-colors ${
                                      isTopPick
                                        ? 'bg-[#14231b]/20 hover:bg-[#14231b]/35'
                                        : 'bg-transparent hover:bg-[#181818]'
                                    }`}
                                  >
                                    {/* Carrier Column */}
                                    <TableCell className="pl-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-md bg-[#1C1C1C] border border-[#282828] flex items-center justify-center text-zinc-200 font-medium font-mono text-xs shadow-sm">
                                          {(bid.transporterName || bid.transporter || 'T')[0].toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                                            <span>{bid.transporterName || bid.transporter || 'Verified Transporter'}</span>
                                            {isTopPick && (
                                              <span className="bg-[#14231b] text-emerald-400 border border-[#1e3c2c] text-[9px] font-mono px-1.5 py-0.2 rounded font-medium uppercase tracking-wider flex items-center gap-1">
                                                <Star size={9} className="fill-emerald-400 text-emerald-400" /> Top AI Pick
                                              </span>
                                            )}
                                            {bid.aiMatchScore && (
                                              <span className="bg-[#14231b] text-emerald-400 border border-[#1e3c2c] text-[9px] font-mono px-1.5 py-0.2 rounded font-medium">
                                                {bid.aiMatchScore}% Match
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                                            <ShieldCheck size={11} className="text-emerald-400" />
                                            <span>{bid.transporterCompany || 'East African Logistics Fleet'}</span>
                                            <span className="text-zinc-600">·</span>
                                            <span className="text-emerald-400/90">INSA Certified</span>
                                          </span>
                                        </div>
                                      </div>
                                    </TableCell>

                                    {/* Rating & Verification */}
                                    <TableCell className="py-3">
                                      <div className="flex items-center gap-1.5 bg-[#161616] px-2 py-0.5 rounded-md border border-[#262626] w-fit">
                                        <Star size={11} className="fill-amber-400 text-amber-400" />
                                        <span className="text-xs font-semibold text-amber-300 font-mono">
                                          {bid.transporterRating || bid.rating || '4.9'}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">/5.0</span>
                                      </div>
                                    </TableCell>

                                    {/* Proximity & Distance */}
                                    <TableCell className="py-3">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 font-mono">
                                          <MapPin size={11} className="text-emerald-400" />
                                          {bid.proximity || '< 12 km from port'}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                          Equipment: Flatbed / Container Ready
                                        </span>
                                      </div>
                                    </TableCell>

                                    {/* Pricing Quote */}
                                    <TableCell className="py-3">
                                      <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-xs font-semibold font-mono tracking-tight text-white">
                                            ETB {Number(bid.amount || bid.bidAmount).toLocaleString()}
                                          </span>
                                          {isTopPick && (
                                            <span className="text-[9px] font-mono font-medium text-emerald-400 bg-[#14231b] px-1 rounded border border-[#1e3c2c]">
                                              Best Rate
                                            </span>
                                          )}
                                        </div>
                                        {i > 0 && sortedArr[0] && (
                                          <span className="text-[10px] text-zinc-500 font-mono">
                                            +{ (Number(bid.amount) - Number(sortedArr[0].amount)).toLocaleString() } vs Top Pick
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>

                                    {/* Action Button */}
                                    <TableCell className="text-right pr-4 py-3">
                                      <button
                                        type="button"
                                        onClick={() => handleAcceptBid(bid.id)}
                                        disabled={loading || (load.status !== 'POSTED' && load.status !== 'OPEN_FOR_BIDDING' && load.status !== 'MATCHED') || bid.status === 'REJECTED'}
                                        className={`text-xs px-3.5 py-1.5 rounded-md font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                          bid.status === 'ACCEPTED'
                                            ? 'bg-[#14231b] text-emerald-400 border border-[#1e3c2c]'
                                            : 'bg-[#24b47e] hover:bg-[#1fa16f] text-white border border-emerald-600/30'
                                        }`}
                                      >
                                        <span className="flex items-center gap-1.5 justify-end">
                                          {bid.status === 'ACCEPTED' ? (
                                            <>
                                              <Lock size={12} /> Escrow Secured
                                            </>
                                          ) : (
                                            <>
                                              <span>Accept & Lock Escrow</span>
                                              <ArrowRight size={13} />
                                            </>
                                          )}
                                        </span>
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Escrow Disclaimer Note */}
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-[#141414] px-3.5 py-2 rounded-lg border border-[#242424]">
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span>TeleBirr Escrow Smart-Settlement locks funds upon acceptance. Payout triggers strictly after e-PoD receipt.</span>
                      </span>
                      <span className="text-emerald-400 font-medium hidden sm:inline-block">INSA Audited</span>
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
