import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, TrendingUp, AlertTriangle, X, Plus, RefreshCw, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { getContractRates, renegotiateContract, createContractRate, calculateSpotRate, getShipperTransporters } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function ContractRates() {
  const { t } = useTranslation();

  const [contracts, setContracts] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [renegotiatingId, setRenegotiatingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newContractForm, setNewContractForm] = useState({
    transporterId: '',
    origin: 'Djibouti Container Terminal',
    destination: 'Modjo Dry Port',
    lockedRate: 300000,
    validUntil: '2026-12-31'
  });

  const fetchTransporters = async () => {
    try {
      const data = await getShipperTransporters();
      setTransporters(data.transporters || []);
      if (data.transporters?.length > 0 && !newContractForm.transporterId) {
        setNewContractForm(prev => ({ ...prev, transporterId: data.transporters[0].id }));
      }
    } catch (e) {
      console.warn('Could not load transporters for selection:', e);
    }
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await getContractRates();
      const loadedContracts = data.contracts || [];
      
      // Fetch live AI spot rate for each contract
      const enrichedContracts = await Promise.all(loadedContracts.map(async (c: any) => {
        try {
          const originCity = c.origin?.toLowerCase().includes('djibouti') ? 'Djibouti' : (c.origin?.split(' ')[0] || 'Djibouti');
          const destCity = c.destination?.toLowerCase().includes('modjo') ? 'Modjo' : (c.destination?.split(' ')[0] || 'Modjo');
          const spotData = await calculateSpotRate({
            origin: { city: originCity },
            destination: { city: destCity },
            weightKg: 30000,
            cargoType: 'dry'
          });
          return { ...c, currentSpotRate: spotData.spot_price || spotData.recommended_spot_rate };
        } catch (e) {
          return c;
        }
      }));
      setContracts(enrichedContracts);
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

  const handleRenegotiate = async (id: string) => {
    try {
      setRenegotiatingId(id);
      await renegotiateContract(id);
      toast.success('Contract renegotiation request dispatched to carrier partner');
      fetchContracts();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to initiate renegotiation');
    } finally {
      setRenegotiatingId(null);
    }
  };

  const handleNewContract = () => {
    setIsModalOpen(true);
    if (transporters.length > 0 && !newContractForm.transporterId) {
      setNewContractForm(prev => ({ ...prev, transporterId: transporters[0].id }));
    }
  };

  const submitNewContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractForm.transporterId) {
      toast.error('Please select an authorized corridor carrier');
      return;
    }
    
    try {
      setSubmitting(true);
      await createContractRate(newContractForm);
      toast.success('Long-term tiered tariff contract created successfully!');
      setIsModalOpen(false);
      setNewContractForm(prev => ({ ...prev, transporterId: transporters[0]?.id || '' }));
      fetchContracts();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#2E2E2E] gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEDED] tracking-tight flex items-center gap-2.5">
            <FileSignature size={24} className="text-[#3ECF8E]" />
            {t('crm_title', 'Contract Tariff Agreements')}
          </h1>
          <p className="text-xs text-[#8F8F8F] mt-1">
            {t('crm_subtitle', 'Manage long-term SLA corridor tariffs with automated AI spot price divergence monitoring')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchContracts}
            disabled={loading}
            className="p-2 bg-[#232323] hover:bg-[#2A2A2A] text-[#8F8F8F] hover:text-[#EDEDED] border border-[#2E2E2E] rounded-lg transition-colors"
            title="Refresh contracts"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            type="button"
            onClick={handleNewContract} 
            className="flex items-center gap-1.5 bg-[#3ECF8E] text-[#1C1C1C] hover:bg-[#34b27b] transition-all font-bold px-4 py-2 rounded-lg text-xs shadow-md hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <Plus size={15} />
            {t('crm_btn_new', 'New Tariff Agreement')}
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl overflow-hidden shadow-lg shadow-black/40">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] font-bold text-[#8F8F8F] bg-[#1C1C1C] uppercase border-b border-[#2E2E2E] tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">{t('crm_col_id', 'Contract ID')}</th>
                <th className="px-5 py-3 font-semibold">{t('crm_col_carrier', 'Carrier Partner')}</th>
                <th className="px-5 py-3 font-semibold">{t('crm_col_locked', 'Contract Rate')}</th>
                <th className="px-5 py-3 font-semibold">{t('crm_col_spot', 'Live AI Spot')}</th>
                <th className="px-5 py-3 font-semibold">{t('crm_col_divergence', 'Spot Divergence')}</th>
                <th className="px-5 py-3 font-semibold">{t('crm_col_status', 'Status')}</th>
                <th className="px-5 py-3 font-semibold text-right">{t('crm_col_actions', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E] text-xs font-mono text-[#EDEDED] bg-[#232323]">
              {loading && contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#8F8F8F]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-[#3ECF8E]" />
                      <span>Fetching contract tariffs & AI pricing benchmarks...</span>
                    </div>
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#8F8F8F]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSignature size={28} className="text-[#8F8F8F]" />
                      <span className="font-semibold text-[#EDEDED]">{t('crm_no_contracts', 'No Active Contract Agreements')}</span>
                      <p className="text-[11px] max-w-sm">Establish guaranteed corridor tariff agreements with verified carriers to protect against spot market volatility.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => {
                  const currentSpot = contract.currentSpotRate ? Number(contract.currentSpotRate) : Number(contract.lockedRate);
                  const divergence = ((currentSpot - Number(contract.lockedRate)) / Number(contract.lockedRate)) * 100;
                  const isFlagged = Math.abs(divergence) > 15;

                  return (
                    <tr key={contract.id} className="hover:bg-[#1C1C1C]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-[#EDEDED]">CT-{contract.id.substring(0, 6).toUpperCase()}</span>
                        <div className="text-[11px] text-[#8F8F8F] font-sans">
                          {t('crm_valid_to', 'Valid to')}: {new Date(contract.validUntil).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#EDEDED] font-sans flex items-center gap-1.5">
                          <Truck size={13} className="text-[#3ECF8E]" />
                          {contract.companyName || contract.transporterName || 'Authorized Carrier'}
                        </div>
                        <div className="text-xs text-[#8F8F8F] font-sans mt-0.5">{contract.origin} → {contract.destination}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-[#EDEDED]">
                        ETB {Number(contract.lockedRate).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#8F8F8F]">
                        ETB {currentSpot.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-5 py-3.5">
                        {isFlagged ? (
                          <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded text-xs font-bold w-fit">
                            <AlertTriangle size={12} className="shrink-0" /> {divergence > 0 ? '+' : ''}{divergence.toFixed(1)}%
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-2 py-1 rounded text-xs font-bold w-fit">
                            <TrendingUp size={12} className="shrink-0" /> {divergence > 0 ? '+' : ''}{divergence.toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] border font-bold uppercase tracking-wider ${
                          contract.status === 'REVIEW_REQUIRED' || isFlagged
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/20'
                        }`}>
                          {contract.status === 'REVIEW_REQUIRED' ? t('crm_review_required', 'Under Review') : isFlagged ? t('crm_flagged', 'Rate Divergence') : t('crm_active', 'Active SLA')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isFlagged && contract.status === 'ACTIVE' ? (
                          <button 
                            type="button"
                            onClick={() => handleRenegotiate(contract.id)} 
                            disabled={renegotiatingId === contract.id}
                            className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {renegotiatingId === contract.id ? 'Requesting...' : t('crm_renegotiate', 'Renegotiate')}
                          </button>
                        ) : (
                          <span className="text-xs text-[#8F8F8F] font-medium font-sans">Compliant</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#2E2E2E] bg-[#1C1C1C]">
              <div>
                <h2 className="text-base font-bold text-[#EDEDED] flex items-center gap-2">
                  <FileSignature size={18} className="text-[#3ECF8E]" />
                  {t('crm_modal_title', 'Establish Long-Term Corridor Tariff')}
                </h2>
                <p className="text-[11px] text-[#8F8F8F] mt-0.5">SLA Agreement with Authorized Transporter Partner</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-[#8F8F8F] hover:text-[#EDEDED] p-1 rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitNewContract} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">
                  {t('crm_transporter_id', 'Carrier Enterprise')}
                </label>
                {transporters.length > 0 ? (
                  <select
                    required
                    value={newContractForm.transporterId}
                    onChange={e => setNewContractForm({ ...newContractForm, transporterId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-all cursor-pointer font-medium"
                  >
                    {transporters.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.companyName || t.fullName} {t.phone ? `(${t.phone})` : ''} — {t.verificationStatus || 'VERIFIED'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={newContractForm.transporterId}
                    onChange={e => setNewContractForm({ ...newContractForm, transporterId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]"
                    placeholder="Enter Carrier User ID"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">{t('origin', 'Origin Terminal')}</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.origin}
                    onChange={e => setNewContractForm({ ...newContractForm, origin: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#2E2E2E] rounded-lg bg-[#1C1C1C] text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">{t('destination', 'Destination Dry Port')}</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.destination}
                    onChange={e => setNewContractForm({ ...newContractForm, destination: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#2E2E2E] rounded-lg bg-[#1C1C1C] text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">
                    {t('crm_col_locked', 'Guaranteed SLA Rate')} (ETB)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={newContractForm.lockedRate}
                    onChange={e => setNewContractForm({ ...newContractForm, lockedRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">
                    {t('crm_valid_to', 'Agreement Expiry Date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={newContractForm.validUntil}
                    onChange={e => setNewContractForm({ ...newContractForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#2E2E2E] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#2E2E2E] bg-[#1C1C1C] text-[#8F8F8F] hover:text-[#EDEDED] rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] font-bold px-5 py-2 rounded-lg transition-all text-xs shadow-md hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] disabled:opacity-50"
                >
                  {submitting ? 'Creating Contract...' : t('crm_btn_submit', 'Create Tariff Agreement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
