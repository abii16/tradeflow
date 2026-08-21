import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, TrendingUp, AlertTriangle } from 'lucide-react';
import { getContractRates, renegotiateContract, createContractRate } from '@/lib/apiClient';
import { FileSignature, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ContractRates() {
  const { t } = useTranslation();

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleNewContract = async () => {
    // Quick prompt for demo purposes
    const transporterId = window.prompt("Enter Transporter ID (UUID):");
    if (!transporterId) return;
    
    try {
      await createContractRate({
        transporterId,
        origin: 'Djibouti Container Terminal',
        destination: 'Modjo Dry Port',
        lockedRate: 300000,
        validUntil: '2026-12-31'
      });
      alert('Contract created');
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
                // Mock current spot for divergence calculation
                const currentSpot = Number(contract.lockedRate) * 1.18; // Mock 18% higher
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
                        contract.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {contract.status.replace('_', ' ')}
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
    </div>
  );
}
