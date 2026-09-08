import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { getContractRates, renegotiateContract, createContractRate, calculateSpotRate } from '@/lib/apiClient';

export default function ContractRates() {
  const { t } = useTranslation();

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContractForm, setNewContractForm] = useState({
    transporterId: '',
    origin: 'Djibouti Container Terminal',
    destination: 'Modjo Dry Port',
    lockedRate: 300000,
    validUntil: '2026-12-31'
  });

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await getContractRates();
      const loadedContracts = data.contracts || [];
      
      // Fetch live AI spot rate for each contract
      const enrichedContracts = await Promise.all(loadedContracts.map(async (c: any) => {
        try {
          const spotData = await calculateSpotRate({
            originLat: 11.5890,
            originLng: 43.1450,
            destLat: 8.9806,
            destLng: 38.7578,
            weightKg: 32000,
            cargoType: 'General'
          });
          return { ...c, currentSpotRate: spotData.totalEtb };
        } catch (e) {
          return c;
        }
      }));
      setContracts(enrichedContracts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleRenegotiate = async (id: string) => {
    try {
      await renegotiateContract(id);
      alert('Renegotiation initiated');
      fetchContracts();
    } catch (error) {
      console.error(error);
      alert('Failed to initiate renegotiation');
    }
  };

  const handleNewContract = () => {
    setIsModalOpen(true);
  };

  const submitNewContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractForm.transporterId) return;
    
    try {
      await createContractRate(newContractForm);
      alert('Contract created');
      setIsModalOpen(false);
      setNewContractForm({ ...newContractForm, transporterId: '' });
      fetchContracts();
    } catch (error) {
      console.error(error);
      alert('Failed to create contract');
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#2E2E2E]">
        <div>
          <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight flex items-center gap-2">
            <FileSignature size={24} className="text-[#EDEDED]" />
            {t('crm_title')}
          </h1>
          <p className="text-xs text-[#8F8F8F] mt-0.5">
            {t('crm_subtitle')}
          </p>
        </div>
        <button onClick={handleNewContract} className="bg-[#3ECF8E] text-[#1C1C1C] hover:bg-[#34b27b] transition-all font-bold px-4 py-2 rounded-lg text-sm shadow-md hover:-translate-y-0.5">
          {t('crm_btn_new')}
        </button>
      </div>

      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] font-bold text-[#8F8F8F] bg-[#1C1C1C] uppercase border-b border-[#2E2E2E] tracking-wider">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t('crm_col_id')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('crm_col_carrier')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('crm_col_locked')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('crm_col_spot')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('crm_col_divergence')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('crm_col_status')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('crm_col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E] text-xs font-mono text-[#EDEDED] bg-[#232323]">
              {contracts.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-4 text-center text-[#8F8F8F]">{t('crm_no_contracts')}</td></tr>
              )}
              {contracts.map((contract) => {
                const currentSpot = contract.currentSpotRate ? Number(contract.currentSpotRate) : Number(contract.lockedRate);
                const divergence = ((currentSpot - Number(contract.lockedRate)) / Number(contract.lockedRate)) * 100;

                return (
                  <tr key={contract.id} className="hover:bg-[#2A2A2A] transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-bold text-[#EDEDED]">{contract.id.split('-')[0]}...</span>
                      <div className="text-[11px] text-[#8F8F8F]">{t('crm_valid_to')} {new Date(contract.validUntil).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-[#EDEDED]">{contract.companyName || contract.transporterName || 'Transporter'}</div>
                      <div className="text-xs text-[#8F8F8F]">{contract.origin} → {contract.destination}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-medium text-[#EDEDED]">
                      ETB {Number(contract.lockedRate).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[#8F8F8F]">
                      ETB {currentSpot.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-2.5">
                      {Math.abs(divergence) > 15 ? (
                        <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded text-xs font-bold w-fit">
                          <AlertTriangle size={12} /> {divergence > 0 ? '+' : ''}{divergence.toFixed(1)}%
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-bold w-fit ${divergence > 0 ? 'text-[#3ECF8E] bg-[#3ECF8E]/10 border-[#3ECF8E]/20' : 'text-[#3ECF8E] bg-[#3ECF8E]/10 border-[#3ECF8E]/20'}`}>
                          <TrendingUp size={12} /> {divergence > 0 ? '+' : ''}{divergence.toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] border font-bold uppercase tracking-wider ${
                        contract.status === 'REVIEW_REQUIRED' || Math.abs(divergence) > 15
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/20'
                      }`}>
                        {contract.status === 'REVIEW_REQUIRED' ? t('crm_review_required') : Math.abs(divergence) > 15 ? t('crm_flagged') : t('crm_active')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {Math.abs(divergence) > 15 && contract.status === 'ACTIVE' ? (
                        <button onClick={() => handleRenegotiate(contract.id)} className="text-[#3ECF8E] hover:text-blue-800 text-xs font-bold">
                          {t('crm_renegotiate')}
                        </button>
                      ) : (
                        <button className="text-[#8F8F8F] hover:text-[#EDEDED] text-xs font-bold">
                          {t('crm_view_details')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1C]/50 backdrop-blur-sm p-4">
          <div className="bg-[#232323] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#2E2E2E]">
              <h2 className="text-lg font-semibold text-[#EDEDED]">{t('crm_modal_title')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8F8F8F] hover:text-[#8F8F8F] transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitNewContract} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#EDEDED] mb-1">{t('crm_transporter_id')}</label>
                <input
                  type="text"
                  required
                  value={newContractForm.transporterId}
                  onChange={e => setNewContractForm({ ...newContractForm, transporterId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#2E2E2E] bg-[#181818] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#EDEDED] mb-1">{t('origin')}</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.origin}
                    onChange={e => setNewContractForm({ ...newContractForm, origin: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#2E2E2E] rounded-lg bg-[#181818] text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#EDEDED] mb-1">{t('destination')}</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.destination}
                    onChange={e => setNewContractForm({ ...newContractForm, destination: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#2E2E2E] rounded-lg bg-[#181818] text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#EDEDED] mb-1">{t('crm_col_locked')} (ETB)</label>
                  <input
                    type="number"
                    required
                    value={newContractForm.lockedRate}
                    onChange={e => setNewContractForm({ ...newContractForm, lockedRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-[#2E2E2E] bg-[#181818] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#EDEDED] mb-1">{t('crm_valid_to').replace(':', '')}</label>
                  <input
                    type="date"
                    required
                    value={newContractForm.validUntil}
                    onChange={e => setNewContractForm({ ...newContractForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#2E2E2E] bg-[#181818] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] font-bold py-2 rounded-lg transition-colors text-sm shadow-md"
                >
                  {t('crm_btn_submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
