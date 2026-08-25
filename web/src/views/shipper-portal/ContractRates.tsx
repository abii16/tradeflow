import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { getContractRates, renegotiateContract, createContractRate } from '@/lib/apiClient';

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
      setContracts(data.contracts || []);
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
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSignature size={24} className="text-slate-700" />
            Contract Rates Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage long-term locked rates and monitor spot market divergence (FR-04).
          </p>
        </div>
        <button onClick={handleNewContract} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition-colors">
          + New Contract Rate
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Contract ID</th>
                <th className="px-6 py-4 font-semibold">Carrier & Route</th>
                <th className="px-6 py-4 font-semibold">Locked Rate</th>
                <th className="px-6 py-4 font-semibold">Current Spot</th>
                <th className="px-6 py-4 font-semibold">Divergence</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-slate-500">No contracts found.</td></tr>
              )}
              {contracts.map((contract) => {
                // TODO: Fetch real spot rate from AI Engine or pricing service when available on backend
                const currentSpot = contract.currentSpotRate ? Number(contract.currentSpotRate) : Number(contract.lockedRate);
                const divergence = ((currentSpot - Number(contract.lockedRate)) / Number(contract.lockedRate)) * 100;

                return (
                  <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-900">{contract.id.split('-')[0]}...</span>
                      <div className="text-[11px] text-slate-500">Valid to: {new Date(contract.validUntil).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{contract.companyName || contract.transporterName || 'Transporter'}</div>
                      <div className="text-xs text-slate-500">{contract.origin} → {contract.destination}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      ETB {Number(contract.lockedRate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      ETB {currentSpot.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4">
                      {divergence > 15 ? (
                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold w-fit">
                          <AlertTriangle size={12} /> +{divergence.toFixed(1)}%
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold w-fit">
                          <TrendingUp size={12} /> +{divergence.toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        divergence > 15
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {divergence > 15 ? 'REVIEW REQUIRED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {divergence > 15 && contract.status === 'ACTIVE' ? (
                        <button onClick={() => handleRenegotiate(contract.id)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">
                          Renegotiate
                        </button>
                      ) : (
                        <button className="text-slate-500 hover:text-slate-800 text-xs font-bold">
                          View Details
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">New Contract Rate</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitNewContract} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Transporter ID (UUID)</label>
                <input
                  type="text"
                  required
                  value={newContractForm.transporterId}
                  onChange={e => setNewContractForm({ ...newContractForm, transporterId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Origin</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.origin}
                    onChange={e => setNewContractForm({ ...newContractForm, origin: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.destination}
                    onChange={e => setNewContractForm({ ...newContractForm, destination: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Locked Rate (ETB)</label>
                  <input
                    type="number"
                    required
                    value={newContractForm.lockedRate}
                    onChange={e => setNewContractForm({ ...newContractForm, lockedRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={newContractForm.validUntil}
                    onChange={e => setNewContractForm({ ...newContractForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                >
                  Create Contract Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
