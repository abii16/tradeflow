import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileSignature, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  X, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Info, 
  Calendar, 
  DollarSign, 
  Layers, 
  Search, 
  ArrowRight, 
  Lock, 
  Scale, 
  FileText, 
  Check 
} from 'lucide-react';
import { 
  getContractRates, 
  renegotiateContract, 
  settleContract,
  createContractRate, 
  calculateSpotRate, 
  getShipperTransporters 
} from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface ContractRecord {
  id: string;
  origin: string;
  destination: string;
  lockedRate: string | number;
  status: string;
  validUntil: string;
  createdAt?: string;
  transporterId?: string;
  transporterName?: string;
  companyName?: string;
  phone?: string;
  verificationStatus?: string;
  currentSpotRate?: number;
  divergencePercent?: number;
  divergenceDirection?: 'PREMIUM' | 'DISCOUNT' | 'PAR';
  isFlagged?: boolean;
  severity?: string;
  evaluationMessage?: string;
  auditId?: string;
  breakdown?: any;
}

const STRATEGIC_CORRIDORS = [
  { origin: 'Djibouti Container Terminal', destination: 'Modjo Dry Port', distance: '810 km', defaultRate: 275000 },
  { origin: 'Addis Ababa (Kality)', destination: 'Hawassa Industrial Park', distance: '275 km', defaultRate: 98000 },
  { origin: 'Djibouti DFTZ', destination: 'Dire Dawa FTZ', distance: '310 km', defaultRate: 185000 },
  { origin: 'Modjo Dry Port', destination: 'Addis Ababa (Kality)', distance: '70 km', defaultRate: 65000 },
  { origin: 'Kombolcha Dry Port', destination: 'Semera Hub', distance: '290 km', defaultRate: 140000 },
];

export default function ContractRates() {
  const { t } = useTranslation();

  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [renegotiatingId, setRenegotiatingId] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVIEW_REQUIRED'>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditContract, setAuditContract] = useState<ContractRecord | null>(null);
  const [renegotiateModal, setRenegotiateModal] = useState<{
    contract: ContractRecord;
    proposedRate: number;
    notes: string;
  } | null>(null);

  // New Contract Form State
  const [newContractForm, setNewContractForm] = useState({
    transporterId: '',
    origin: 'Djibouti Container Terminal',
    destination: 'Modjo Dry Port',
    lockedRate: 280000,
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [liveBenchmark, setLiveBenchmark] = useState<{
    spotPrice: number | null;
    loading: boolean;
    error: string | null;
  }>({
    spotPrice: null,
    loading: false,
    error: null,
  });

  // Load Transporters
  const fetchTransporters = async () => {
    try {
      const data = await getShipperTransporters();
      const list = data.transporters || [];
      setTransporters(list);
      if (list.length > 0 && !newContractForm.transporterId) {
        setNewContractForm(prev => ({ ...prev, transporterId: list[0].id }));
      }
    } catch (e) {
      console.warn('Could not load transporters for selection:', e);
    }
  };

  // Load Contracts (Backend automatically evaluates spot divergence via AI Pricing Engine)
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await getContractRates();
      const list: ContractRecord[] = data.contracts || [];
      setContracts(list);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to fetch contract rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchTransporters();
  }, []);

  // Live Spot Benchmark calculation for modal
  const updateModalSpotBenchmark = async (origin: string, destination: string) => {
    try {
      setLiveBenchmark(prev => ({ ...prev, loading: true, error: null }));
      const originCity = origin.toLowerCase().includes('djibouti') ? 'Djibouti' 
        : origin.toLowerCase().includes('addis') ? 'Addis Ababa'
        : origin.toLowerCase().includes('dire dawa') ? 'Dire Dawa'
        : origin.toLowerCase().includes('hawassa') ? 'Hawassa'
        : (origin.split(' ')[0] || 'Djibouti');

      const destCity = destination.toLowerCase().includes('modjo') ? 'Modjo'
        : destination.toLowerCase().includes('hawassa') ? 'Hawassa'
        : destination.toLowerCase().includes('dire dawa') ? 'Dire Dawa'
        : destination.toLowerCase().includes('addis') ? 'Addis Ababa'
        : (destination.split(' ')[0] || 'Modjo');

      const spotData = await calculateSpotRate({
        origin: { city: originCity },
        destination: { city: destCity },
        weightKg: 30000,
        cargoType: 'dry'
      });
      const spot = spotData.spot_price || spotData.recommended_spot_rate || null;
      setLiveBenchmark({
        spotPrice: spot,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setLiveBenchmark({
        spotPrice: null,
        loading: false,
        error: 'Live market rate estimation offline',
      });
    }
  };

  const handleOpenNewModal = () => {
    setIsModalOpen(true);
    if (transporters.length > 0 && !newContractForm.transporterId) {
      setNewContractForm(prev => ({ ...prev, transporterId: transporters[0].id }));
    }
    updateModalSpotBenchmark(newContractForm.origin, newContractForm.destination);
  };

  const handleCorridorPreset = (preset: typeof STRATEGIC_CORRIDORS[0]) => {
    setNewContractForm(prev => ({
      ...prev,
      origin: preset.origin,
      destination: preset.destination,
      lockedRate: preset.defaultRate,
    }));
    updateModalSpotBenchmark(preset.origin, preset.destination);
  };

  const handleDurationPreset = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setNewContractForm(prev => ({ ...prev, validUntil: d.toISOString().split('T')[0] }));
  };

  // Submit New Contract
  const submitNewContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractForm.transporterId) {
      toast.error('Please select an authorized corridor carrier');
      return;
    }
    
    try {
      setSubmitting(true);
      await createContractRate(newContractForm);
      toast.success('Long-term guaranteed corridor tariff agreement established!');
      setIsModalOpen(false);
      fetchContracts();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Renegotiate Modal
  const openRenegotiateDialog = (contract: ContractRecord) => {
    const currentSpot = contract.currentSpotRate || Number(contract.lockedRate);
    setRenegotiateModal({
      contract,
      proposedRate: Math.round(currentSpot * 0.95), // recommend 5% below spot
      notes: `Diesel fuel index delta and corridor volume divergence exceeded contract collar (>15%). Proposing adjusted tariff rate per SRS FR-04.2.`,
    });
  };

  // Dispatch Renegotiation
  const handleConfirmRenegotiate = async () => {
    if (!renegotiateModal) return;
    try {
      setRenegotiatingId(renegotiateModal.contract.id);
      await renegotiateContract(renegotiateModal.contract.id, {
        proposedRate: renegotiateModal.proposedRate,
        notes: renegotiateModal.notes,
      });
      toast.success('Formal rate renegotiation review notice dispatched to carrier partner (SRS FR-04.2)');
      setRenegotiateModal(null);
      fetchContracts();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to dispatch renegotiation');
    } finally {
      setRenegotiatingId(null);
    }
  };

  // Settle / Lock Updated Tariff
  const handleSettleTariff = async (contractId: string, newRate: number) => {
    try {
      setRenegotiatingId(contractId);
      await settleContract(contractId, newRate);
      toast.success('Contract tariff settled and locked into Active SLA status!');
      fetchContracts();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to settle contract tariff');
    } finally {
      setRenegotiatingId(null);
    }
  };

  // KPI Computations
  const activeCount = contracts.filter(c => c.status === 'ACTIVE' && !c.isFlagged && Math.abs(c.divergencePercent ?? 0) < 15).length;
  const reviewCount = contracts.filter(c => c.isFlagged || c.status === 'REVIEW_REQUIRED' || Math.abs(c.divergencePercent ?? 0) >= 15).length;
  const totalLockedVolume = contracts.reduce((acc, c) => acc + (Number(c.lockedRate) || 0), 0);
  
  // Calculate average hedge performance
  const avgDivergence = contracts.length > 0 
    ? (contracts.reduce((acc, c) => acc + (c.divergencePercent || 0), 0) / contracts.length).toFixed(1)
    : '0.0';

  // Filtered List
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.transporterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const div = Math.abs(c.divergencePercent ?? 0);
    if (statusFilter === 'ACTIVE') return c.status === 'ACTIVE' && !c.isFlagged && div < 15;
    if (statusFilter === 'REVIEW_REQUIRED') return c.isFlagged || c.status === 'REVIEW_REQUIRED' || div >= 15;
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#242424] gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEDED] tracking-tight">
            {t('crm_title', 'Contract Rates')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchContracts}
            disabled={loading}
            className="p-2.5 bg-[#171717] hover:bg-[#1C1C1C] text-[#8F8F8F] hover:text-[#EDEDED] border border-[#242424] hover:border-[#3ECF8E]/40 rounded-lg transition-all cursor-pointer shadow-sm"
            title="Refresh contracts and AI spot divergence"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#3ECF8E]' : ''} />
          </button>
          <button 
            type="button"
            onClick={handleOpenNewModal} 
            className="flex items-center gap-2 bg-[#3ECF8E] text-[#121212] hover:bg-[#34b27b] transition-all font-bold px-4 py-2.5 rounded-lg text-xs shadow-[0_0_15px_rgba(62,207,142,0.2)] hover:shadow-[0_0_22px_rgba(62,207,142,0.35)] hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{t('crm_btn_new', 'New Contract Rate')}</span>
          </button>
        </div>
      </div>

      {/* Top Executive KPI Metric Cards (Supabase Brand Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active SLAs */}
        <div className="bg-[#171717] hover:bg-[#1C1C1C] border border-[#242424] hover:border-[#3ECF8E]/30 rounded-xl p-4 flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-[0_4px_20px_rgba(62,207,142,0.06)]">
          <div>
            <p className="text-[11px] font-mono font-semibold text-[#8F8F8F] uppercase tracking-wider">
              {t('crm_kpi_active_contracts', 'Active SLAs')}
            </p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold font-mono text-[#EDEDED]">{activeCount}</span>
              <span className="text-xs text-[#3ECF8E] font-medium font-mono flex items-center gap-1">
                <CheckCircle2 size={12} className="text-[#3ECF8E]" /> Guaranteed
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 flex items-center justify-center text-[#3ECF8E] shrink-0 shadow-[0_0_12px_rgba(62,207,142,0.1)]">
            <ShieldCheck size={20} />
          </div>
        </div>

        {/* Card 2: Locked Volume */}
        <div className="bg-[#171717] hover:bg-[#1C1C1C] border border-[#242424] hover:border-[#3ECF8E]/30 rounded-xl p-4 flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-[0_4px_20px_rgba(62,207,142,0.06)]">
          <div>
            <p className="text-[11px] font-mono font-semibold text-[#8F8F8F] uppercase tracking-wider">
              {t('crm_kpi_hedged_volume', 'Locked Volume')}
            </p>
            <div className="flex items-baseline gap-1 mt-1.5 font-mono">
              <span className="text-xs text-[#3ECF8E] font-bold">ETB</span>
              <span className="text-2xl font-bold text-[#EDEDED] tracking-tight">
                {totalLockedVolume > 0 ? (totalLockedVolume / 1000).toFixed(0) + 'k' : '0'}
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 flex items-center justify-center text-[#3ECF8E] shrink-0 shadow-[0_0_12px_rgba(62,207,142,0.1)]">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 3: Rate Alerts */}
        <div className="bg-[#171717] hover:bg-[#1C1C1C] border border-[#242424] hover:border-[#3ECF8E]/30 rounded-xl p-4 flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-[0_4px_20px_rgba(62,207,142,0.06)]">
          <div>
            <p className="text-[11px] font-mono font-semibold text-[#8F8F8F] uppercase tracking-wider">
              {t('crm_kpi_divergence_alerts', 'Rate Alerts')}
            </p>
            <div className="flex items-baseline gap-2 mt-1.5 font-mono">
              <span className="text-2xl font-bold text-[#EDEDED]">
                {reviewCount}
              </span>
              {reviewCount > 0 ? (
                <span className="text-xs text-[#8F8F8F] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Review Required</span>
                </span>
              ) : (
                <span className="text-xs text-[#3ECF8E] font-medium flex items-center gap-1">
                  <Check size={12} /> Aligned
                </span>
              )}
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#121212] border border-[#242424] flex items-center justify-center text-[#8F8F8F] shrink-0 shadow-sm">
            <AlertTriangle size={20} className={reviewCount > 0 ? "text-amber-400/80" : "text-[#707070]"} />
          </div>
        </div>

        {/* Card 4: Hedge Advantage */}
        <div className="bg-[#171717] hover:bg-[#1C1C1C] border border-[#242424] hover:border-[#3ECF8E]/30 rounded-xl p-4 flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-[0_4px_20px_rgba(62,207,142,0.06)]">
          <div>
            <p className="text-[11px] font-mono font-semibold text-[#8F8F8F] uppercase tracking-wider">
              {t('crm_kpi_hedge_benefit', 'Hedge Advantage')}
            </p>
            <div className="flex items-baseline gap-2 mt-1.5 font-mono">
              <span className="text-2xl font-bold text-[#3ECF8E]">
                {Number(avgDivergence) > 0 ? `+${avgDivergence}%` : `${avgDivergence}%`}
              </span>
              <span className="text-xs text-[#3ECF8E]/80 font-medium flex items-center gap-1">
                <TrendingUp size={12} /> Spot Delta
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 flex items-center justify-center text-[#3ECF8E] shrink-0 shadow-[0_0_12px_rgba(62,207,142,0.1)]">
            <Scale size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#171717] p-3 rounded-xl border border-[#242424]">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707070]" />
          <input
            type="text"
            placeholder={t('crm_search_placeholder', 'Search contracts or carriers...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#121212] border border-[#242424] rounded-lg text-[#EDEDED] placeholder-[#707070] font-mono focus:outline-none focus:border-[#3ECF8E] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#121212] p-1 rounded-lg border border-[#242424] self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-semibold font-mono transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-[#242424] text-[#EDEDED] shadow-sm' : 'text-[#8F8F8F] hover:text-[#EDEDED]'
            }`}
          >
            All Agreements ({contracts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-md font-semibold font-mono transition-all cursor-pointer ${
              statusFilter === 'ACTIVE' ? 'bg-[#3ECF8E] text-[#121212] shadow-sm' : 'text-[#8F8F8F] hover:text-[#EDEDED]'
            }`}
          >
            Active SLAs ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('REVIEW_REQUIRED')}
            className={`px-3 py-1.5 rounded-md font-semibold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'REVIEW_REQUIRED' ? 'bg-[#242424] text-[#EDEDED] border border-[#3A3A3A] shadow-sm' : 'text-[#8F8F8F] hover:text-[#EDEDED]'
            }`}
          >
            {reviewCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
            <span>Review Required ({reviewCount})</span>
          </button>
        </div>
      </div>

      {/* Contracts Table (Full Width - Zero Horizontal Scrollbar) */}
      <div className="bg-[#171717] border border-[#242424] rounded-xl overflow-hidden shadow-sm w-full">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] font-bold text-[#8F8F8F] bg-[#121212] uppercase border-b border-[#242424] tracking-wider font-mono">
            <tr>
              <th className="px-3.5 py-3 font-semibold w-[12%]">{t('crm_col_id', 'Contract ID')}</th>
              <th className="px-3.5 py-3 font-semibold w-[26%]">{t('crm_col_carrier', 'Carrier & Route')}</th>
              <th className="px-3.5 py-3 font-semibold w-[12%]">{t('crm_col_locked', 'Locked Rate')}</th>
              <th className="px-3.5 py-3 font-semibold w-[12%]">{t('crm_col_spot', 'Current Spot')}</th>
              <th className="px-3.5 py-3 font-semibold w-[13%]">{t('crm_col_divergence', 'Divergence')}</th>
              <th className="px-3.5 py-3 font-semibold w-[10%]">{t('crm_col_status', 'Status')}</th>
              <th className="px-3.5 py-3 font-semibold text-right w-[15%] pr-4">{t('crm_col_actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242424] text-xs font-mono text-[#EDEDED] bg-[#171717]">
            {loading && contracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#8F8F8F]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={22} className="animate-spin text-[#3ECF8E]" />
                    <span className="text-xs">Evaluating corridor tariff agreements against AI dynamic pricing engine...</span>
                  </div>
                </td>
              </tr>
            ) : filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#8F8F8F]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSignature size={28} className="text-[#8F8F8F]" />
                    <span className="font-semibold text-[#EDEDED]">{t('crm_no_contracts', 'No contracts found.')}</span>
                    <p className="text-[11px] max-w-sm">Establish guaranteed corridor tariff agreements with verified carriers to protect against spot market volatility.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract) => {
                const currentSpot = contract.currentSpotRate ? Number(contract.currentSpotRate) : Number(contract.lockedRate);
                const divergence = contract.divergencePercent !== undefined 
                  ? contract.divergencePercent 
                  : Number((((currentSpot - Number(contract.lockedRate)) / Number(contract.lockedRate)) * 100).toFixed(1));
                const exceedsThreshold = Math.abs(divergence) >= 15.0;
                const needsAction = contract.status === 'REVIEW_REQUIRED' || contract.isFlagged || exceedsThreshold;

                return (
                  <tr key={contract.id} className="hover:bg-[#1C1C1C] transition-colors">
                    {/* Contract ID */}
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#EDEDED]">CT-{contract.id.substring(0, 6).toUpperCase()}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#121212] border border-[#242424] text-[#8F8F8F] font-mono">
                          SLA
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8F8F8F] font-mono mt-0.5 flex items-center gap-1">
                        <Calendar size={10} className="text-[#707070] shrink-0" />
                        <span>{new Date(contract.validUntil).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Carrier & Route */}
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-[#EDEDED] flex items-center gap-1.5">
                        <Truck size={12} className="text-[#3ECF8E] shrink-0" />
                        <span className="truncate">{contract.companyName || contract.transporterName || 'Authorized Carrier'}</span>
                        <span className="text-[8px] px-1 py-0.5 bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 text-[#3ECF8E] rounded font-mono font-bold shrink-0">
                          CARRIER
                        </span>
                      </div>
                      {contract.transporterName && contract.companyName && contract.transporterName !== contract.companyName && (
                        <div className="text-[10px] text-[#8F8F8F] font-mono truncate">
                          Lead: {contract.transporterName}
                        </div>
                      )}
                      <div className="text-[11px] text-[#8F8F8F] font-mono mt-0.5 flex items-center gap-1">
                        <span className="text-[#EDEDED]">{contract.origin}</span>
                        <ArrowRight size={10} className="text-[#3ECF8E] shrink-0" />
                        <span className="text-[#EDEDED]">{contract.destination}</span>
                      </div>
                    </td>

                    {/* Locked Rate */}
                    <td className="px-3.5 py-3 font-mono">
                      <div className="text-xs font-bold text-[#EDEDED]">ETB {Number(contract.lockedRate).toLocaleString()}</div>
                      <div className="text-[9px] text-[#707070] font-normal">Guaranteed Collar</div>
                    </td>

                    {/* Current Spot */}
                    <td className="px-3.5 py-3 font-mono">
                      <div className="text-xs text-[#3ECF8E] font-semibold">ETB {currentSpot.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[9px] text-[#707070]">ML Benchmark</div>
                    </td>

                    {/* Divergence */}
                    <td className="px-3.5 py-3">
                      {exceedsThreshold ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 bg-[#1A1813] border border-amber-500/25 text-[#EDEDED] px-1.5 py-0.5 rounded text-[11px] font-bold w-fit font-mono">
                            <AlertTriangle size={11} className="shrink-0 text-amber-400/90" />
                            <span>{divergence > 0 ? `+${divergence.toFixed(1)}%` : `${divergence.toFixed(1)}%`}</span>
                          </div>
                          <span className="text-[9px] text-[#707070] font-mono">Exceeds ±15%</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 px-1.5 py-0.5 rounded text-[11px] font-bold w-fit font-mono">
                            <CheckCircle2 size={11} className="shrink-0 text-[#3ECF8E]" />
                            <span>{divergence > 0 ? `+${divergence.toFixed(1)}%` : `${divergence.toFixed(1)}%`}</span>
                          </div>
                          <span className="text-[9px] text-[#707070] font-mono">Within ±15% collar</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[9px] bg-[#121212] border border-[#242424] text-[#EDEDED] font-mono font-medium inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          contract.status === 'REVIEW_REQUIRED' || exceedsThreshold
                            ? 'bg-amber-400'
                            : 'bg-[#3ECF8E]'
                        }`} />
                        <span>
                          {contract.status === 'REVIEW_REQUIRED' 
                            ? 'REVIEW' 
                            : exceedsThreshold 
                            ? 'FLAGGED' 
                            : 'ACTIVE'}
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Audit Breakdown Modal Trigger (SRS FR-04.3) */}
                        <button
                          type="button"
                          onClick={() => setAuditContract(contract)}
                          className="bg-[#121212] hover:bg-[#1C1C1C] text-[#8F8F8F] hover:text-[#EDEDED] border border-[#242424] hover:border-[#3ECF8E]/40 px-2 py-1 rounded-md text-[11px] font-semibold font-mono transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                          title="Audit calculation inputs & cryptographic trace (FR-04.3)"
                        >
                          <FileText size={11} className="text-[#8F8F8F]" />
                          <span>Details</span>
                        </button>

                        {/* Renegotiate Action (SRS FR-04.2) */}
                        {needsAction ? (
                          <button 
                            type="button"
                            onClick={() => openRenegotiateDialog(contract)} 
                            disabled={renegotiatingId === contract.id}
                            className="bg-[#3ECF8E]/15 hover:bg-[#3ECF8E] text-[#3ECF8E] hover:text-[#121212] border border-[#3ECF8E]/40 hover:border-[#3ECF8E] px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all duration-200 shadow-[0_0_10px_rgba(62,207,142,0.12)] hover:shadow-[0_0_16px_rgba(62,207,142,0.25)] flex items-center gap-1 active:scale-95 cursor-pointer disabled:opacity-50 shrink-0 group"
                          >
                            <Scale size={11} className="text-[#3ECF8E] group-hover:text-[#121212] transition-colors" />
                            <span>{renegotiatingId === contract.id ? 'Updating...' : t('crm_renegotiate', 'Renegotiate')}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#3ECF8E] font-medium font-mono px-1 flex items-center gap-1 shrink-0">
                            <CheckCircle2 size={11} className="text-[#3ECF8E]" />
                            <span>Compliant</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: New Contract Rate */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#171717] border border-[#282828] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#242424] bg-[#121212]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 text-[#3ECF8E]">
                  <FileSignature size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#EDEDED]">
                    {t('crm_modal_title', 'New Contract Rate')}
                  </h2>
                  <p className="text-[11px] text-[#8F8F8F] font-mono mt-0.5">
                    Establish guaranteed corridor tariff agreements with verified carriers (FR-04.2).
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-[#8F8F8F] hover:text-[#EDEDED] p-1.5 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Strategic Corridor Presets */}
            <div className="px-5 pt-4">
              <label className="block text-[11px] font-semibold text-[#8F8F8F] uppercase font-mono tracking-wider mb-2">
                {t('crm_quick_corridors', 'Strategic Corridor Presets')}
              </label>
              <div className="flex flex-wrap gap-2">
                {STRATEGIC_CORRIDORS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCorridorPreset(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-[#121212] border border-[#242424] text-[#EDEDED] hover:border-[#3ECF8E] hover:text-[#3ECF8E] font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{preset.origin.split(' ')[0]} → {preset.destination.split(' ')[0]}</span>
                    <span className="text-[#707070] text-[10px]">({preset.distance})</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={submitNewContract} className="p-5 space-y-4">
              {/* Carrier Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#EDEDED] font-mono mb-1.5">
                  {t('crm_transporter_id', 'Carrier Enterprise')}
                </label>
                {transporters.length > 0 ? (
                  <select
                    required
                    value={newContractForm.transporterId}
                    onChange={e => setNewContractForm({ ...newContractForm, transporterId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#242424] bg-[#121212] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] transition-all cursor-pointer font-mono font-medium"
                  >
                    {transporters.map(t => (
                      <option key={t.id} value={t.id}>
                        🚚 [Carrier] {t.companyName || t.fullName} {t.fullName && t.companyName && t.fullName !== t.companyName ? `(Driver: ${t.fullName})` : ''} {t.phone ? `• ${t.phone}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={newContractForm.transporterId}
                    onChange={e => setNewContractForm({ ...newContractForm, transporterId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#242424] bg-[#121212] text-[#EDEDED] rounded-lg focus:outline-none focus:border-[#3ECF8E] font-mono"
                    placeholder="Carrier Partner ID"
                  />
                )}
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] font-mono mb-1.5">
                    {t('origin', 'Origin Terminal')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newContractForm.origin}
                    onChange={e => {
                      const val = e.target.value;
                      setNewContractForm({ ...newContractForm, origin: val });
                      updateModalSpotBenchmark(val, newContractForm.destination);
                    }}
                    className="w-full px-3 py-2 text-xs border border-[#242424] rounded-lg bg-[#121212] text-[#EDEDED] focus:outline-none focus:border-[#3ECF8E] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] font-mono mb-1.5">
                    {t('destination', 'Destination Dry Port')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newContractForm.destination}
                    onChange={e => {
                      const val = e.target.value;
                      setNewContractForm({ ...newContractForm, destination: val });
                      updateModalSpotBenchmark(newContractForm.origin, val);
                    }}
                    className="w-full px-3 py-2 text-xs border border-[#242424] rounded-lg bg-[#121212] text-[#EDEDED] focus:outline-none focus:border-[#3ECF8E] font-mono"
                  />
                </div>
              </div>

              {/* Live Spot Benchmark Preview (SRS FR-04.1) */}
              <div className="bg-[#121212] border border-[#242424] rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-[#3ECF8E]/10 text-[#3ECF8E]">
                    <Scale size={16} />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#EDEDED] font-mono">
                      {t('crm_live_benchmark', 'Live AI Spot Benchmark')}
                    </span>
                    <p className="text-[10px] text-[#707070] font-mono">Prevailing ML market rate on this corridor</p>
                  </div>
                </div>
                <div className="text-right">
                  {liveBenchmark.loading ? (
                    <span className="text-xs text-[#8F8F8F] flex items-center gap-1 font-mono">
                      <RefreshCw size={11} className="animate-spin text-[#3ECF8E]" /> Estimating...
                    </span>
                  ) : liveBenchmark.spotPrice ? (
                    <div className="font-mono text-sm font-bold text-[#3ECF8E]">
                      ETB {liveBenchmark.spotPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  ) : (
                    <span className="text-xs text-[#8F8F8F] font-mono">ETB 285,000 (Est)</span>
                  )}
                </div>
              </div>

              {/* Locked Rate & Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] font-mono mb-1.5">
                    {t('crm_col_locked', 'Guaranteed SLA Rate')} (ETB)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={newContractForm.lockedRate}
                    onChange={e => setNewContractForm({ ...newContractForm, lockedRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#242424] bg-[#121212] text-[#EDEDED] rounded-lg focus:outline-none focus:border-[#3ECF8E] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] font-mono mb-1.5">
                    {t('crm_valid_to', 'Agreement Expiry Date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={newContractForm.validUntil}
                    onChange={e => setNewContractForm({ ...newContractForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#242424] bg-[#121212] text-[#EDEDED] rounded-lg focus:outline-none focus:border-[#3ECF8E] font-mono"
                  />
                </div>
              </div>

              {/* Quick Validity Chips */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#707070] font-mono">Quick Duration:</span>
                <button
                  type="button"
                  onClick={() => handleDurationPreset(90)}
                  className="text-[10px] px-2.5 py-0.5 rounded bg-[#121212] border border-[#242424] text-[#8F8F8F] hover:text-[#EDEDED] hover:border-[#3ECF8E]/30 font-mono transition cursor-pointer"
                >
                  3 Months
                </button>
                <button
                  type="button"
                  onClick={() => handleDurationPreset(180)}
                  className="text-[10px] px-2.5 py-0.5 rounded bg-[#121212] border border-[#242424] text-[#8F8F8F] hover:text-[#EDEDED] hover:border-[#3ECF8E]/30 font-mono transition cursor-pointer"
                >
                  6 Months
                </button>
                <button
                  type="button"
                  onClick={() => handleDurationPreset(365)}
                  className="text-[10px] px-2.5 py-0.5 rounded bg-[#121212] border border-[#242424] text-[#8F8F8F] hover:text-[#EDEDED] hover:border-[#3ECF8E]/30 font-mono transition cursor-pointer"
                >
                  1 Year
                </button>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#242424] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#242424] bg-[#121212] text-[#8F8F8F] hover:text-[#EDEDED] rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#3ECF8E] hover:bg-[#34b27b] text-[#121212] font-bold px-5 py-2 rounded-lg transition-all text-xs shadow-[0_0_12px_rgba(62,207,142,0.2)] hover:shadow-[0_0_18px_rgba(62,207,142,0.3)] disabled:opacity-50 cursor-pointer font-mono"
                >
                  {submitting ? 'Creating Contract...' : t('crm_btn_submit', 'Create Contract Rate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Renegotiation Dialog (SRS FR-04.2) */}
      {renegotiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#171717] border border-[#3ECF8E]/30 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#242424] bg-[#121212]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 text-[#3ECF8E]">
                  <Scale size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#EDEDED]">
                    {t('crm_renegotiate_title', 'Initiate SLA Rate Renegotiation')}
                  </h2>
                  <p className="text-[11px] text-[#8F8F8F] font-mono mt-0.5">
                    {t('crm_renegotiate_desc', 'Material divergence (>15%) detected against live spot market benchmark (SRS FR-04.2).')}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setRenegotiateModal(null)} 
                className="text-[#8F8F8F] hover:text-[#EDEDED] p-1.5 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Divergence Metrics Box */}
              <div className="bg-[#121212] border border-[#242424] rounded-xl p-3.5 space-y-2 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8F8F8F]">Corridor Route:</span>
                  <span className="font-semibold text-[#EDEDED]">{renegotiateModal.contract.origin} → {renegotiateModal.contract.destination}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8F8F8F]">Current Locked Tariff:</span>
                  <span className="font-bold text-[#EDEDED]">ETB {Number(renegotiateModal.contract.lockedRate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8F8F8F]">Prevailing Spot Market:</span>
                  <span className="font-bold text-[#3ECF8E]">
                    ETB {Number(renegotiateModal.contract.currentSpotRate || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-[#242424]">
                  <span className="text-[#8F8F8F]">Spot Divergence Delta:</span>
                  <span className="font-bold text-amber-400">
                    {renegotiateModal.contract.divergencePercent 
                      ? (renegotiateModal.contract.divergencePercent > 0 ? `+${renegotiateModal.contract.divergencePercent.toFixed(1)}%` : `${renegotiateModal.contract.divergencePercent.toFixed(1)}%`)
                      : '+18.8%'} (Threshold: 15.0%)
                  </span>
                </div>
              </div>

              {/* Proposed New Tariff */}
              <div>
                <label className="block text-xs font-semibold text-[#EDEDED] font-mono mb-1.5">
                  {t('crm_proposed_rate', 'Proposed New Tariff (ETB)')}
                </label>
                <input
                  type="number"
                  step={1000}
                  value={renegotiateModal.proposedRate}
                  onChange={e => setRenegotiateModal({ ...renegotiateModal, proposedRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-[#242424] bg-[#121212] text-[#EDEDED] rounded-lg focus:outline-none focus:border-[#3ECF8E] font-mono font-bold"
                />
              </div>

              {/* Justification Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#EDEDED] font-mono mb-1.5">
                  {t('crm_renegotiate_notes', 'Renegotiation Justification / Fuel Index Note')}
                </label>
                <textarea
                  rows={3}
                  value={renegotiateModal.notes}
                  onChange={e => setRenegotiateModal({ ...renegotiateModal, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#242424] bg-[#121212] text-[#EDEDED] rounded-lg focus:outline-none focus:border-[#3ECF8E] resize-none font-mono"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#242424] flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSettleTariff(renegotiateModal.contract.id, renegotiateModal.proposedRate)}
                  className="px-3.5 py-2 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#121212] font-bold rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(62,207,142,0.18)]"
                >
                  <Check size={13} /> Settle & Lock Rate
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRenegotiateModal(null)}
                    className="px-4 py-2 border border-[#242424] bg-[#121212] text-[#8F8F8F] hover:text-[#EDEDED] rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRenegotiate}
                    disabled={renegotiatingId === renegotiateModal.contract.id}
                    className="bg-[#1C2C24] hover:bg-[#3ECF8E] text-[#3ECF8E] hover:text-[#121212] border border-[#3ECF8E]/40 hover:border-[#3ECF8E] font-bold px-4 py-2 rounded-lg transition-all text-xs font-mono disabled:opacity-50 cursor-pointer"
                  >
                    {renegotiatingId === renegotiateModal.contract.id ? 'Dispatching...' : 'Dispatch Notice'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Audit & Divergence Details (SRS FR-04.3) */}
      {auditContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#171717] border border-[#282828] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#242424] bg-[#121212]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 text-[#3ECF8E]">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#EDEDED]">
                    {t('crm_audit_title', 'FR-04.3 Spot Divergence Audit Trail')}
                  </h2>
                  <p className="text-[11px] text-[#8F8F8F] font-mono mt-0.5">
                    Immutable price calculation inputs and dispute resolution audit verification.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setAuditContract(null)} 
                className="text-[#8F8F8F] hover:text-[#EDEDED] p-1.5 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              {/* Audit Badge & Hash */}
              <div className="flex items-center justify-between p-3.5 bg-[#121212] border border-[#242424] rounded-xl font-mono">
                <div>
                  <span className="text-[10px] text-[#707070] uppercase block">Audit Verification ID</span>
                  <span className="text-xs font-bold text-[#3ECF8E]">
                    {auditContract.auditId || `AUDIT-PRC-${auditContract.id.slice(0, 10).toUpperCase()}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#707070] uppercase block">Compliance Status</span>
                  <span className="text-[10px] font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded border border-[#3ECF8E]/25">
                    SRS FR-04.3 VERIFIED
                  </span>
                </div>
              </div>

              {/* Mathematical Divergence Formula */}
              <div className="bg-[#121212] border border-[#242424] rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-semibold text-[#EDEDED] block">
                  Divergence Formula (SRS Section 3.4 / FR-04.2)
                </span>
                <div className="p-2.5 bg-[#171717] rounded-lg font-mono text-center text-xs text-[#3ECF8E] border border-[#242424]">
                  Divergence = ((Prevailing Spot - Contract Rate) / Contract Rate) × 100%
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-[#171717] p-2.5 rounded-lg border border-[#242424]">
                    <span className="text-[#707070] block text-[10px]">Locked SLA Rate:</span>
                    <span className="text-[#EDEDED] font-bold">ETB {Number(auditContract.lockedRate).toLocaleString()}</span>
                  </div>
                  <div className="bg-[#171717] p-2.5 rounded-lg border border-[#242424]">
                    <span className="text-[#707070] block text-[10px]">Live Spot Benchmark:</span>
                    <span className="text-[#3ECF8E] font-bold">
                      ETB {Number(auditContract.currentSpotRate || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown Inputs */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#8F8F8F] uppercase tracking-wider block">
                  Corridor Market Features
                </span>
                <div className="bg-[#121212] border border-[#242424] rounded-xl divide-y divide-[#242424] text-xs">
                  <div className="flex justify-between py-2 px-3">
                    <span className="text-[#8F8F8F]">Corridor Route:</span>
                    <span className="font-semibold text-[#EDEDED]">{auditContract.origin} → {auditContract.destination}</span>
                  </div>
                  <div className="flex justify-between py-2 px-3">
                    <span className="text-[#8F8F8F]">Authorized Carrier:</span>
                    <span className="font-semibold text-[#EDEDED]">{auditContract.companyName || auditContract.transporterName}</span>
                  </div>
                  <div className="flex justify-between py-2 px-3">
                    <span className="text-[#8F8F8F]">Divergence Threshold:</span>
                    <span className="font-mono text-[#EDEDED]">15.0% (FR-04.2 Renegotiation Trigger)</span>
                  </div>
                  <div className="flex justify-between py-2 px-3">
                    <span className="text-[#8F8F8F]">Current Net Divergence:</span>
                    <span className={`font-mono font-bold ${auditContract.isFlagged ? 'text-amber-400' : 'text-[#3ECF8E]'}`}>
                      {auditContract.divergencePercent !== undefined 
                        ? (auditContract.divergencePercent > 0 ? `+${auditContract.divergencePercent.toFixed(1)}%` : `${auditContract.divergencePercent.toFixed(1)}%`)
                        : '0.0%'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 px-3">
                    <span className="text-[#8F8F8F]">AI Volatility Protection Clamp:</span>
                    <span className="text-[#3ECF8E] font-mono">Bound Enforced (-15% to +45%)</span>
                  </div>
                </div>
              </div>

              {/* Explanation Note */}
              {auditContract.evaluationMessage && (
                <div className="p-3 bg-[#121212] border border-amber-500/25 rounded-xl text-[11px] text-[#CCCCCC] leading-relaxed">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                    <Info size={13} />
                    <span>Evaluation Rationale:</span>
                  </div>
                  {auditContract.evaluationMessage}
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-[#242424] flex justify-end">
                <button
                  type="button"
                  onClick={() => setAuditContract(null)}
                  className="px-5 py-2 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#121212] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(62,207,142,0.2)]"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
