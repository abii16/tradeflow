import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ContractRates() {
  const { t } = useTranslation();

  const mockContracts = [
    {
      id: 'CTR-2026-A1',
      carrier: 'Kangaroo Freight',
      route: 'Djibouti Port → Modjo Dry Port',
      lockedRate: 345000,
      currentSpot: 356229,
      validUntil: '2026-12-31',
      status: 'Active',
      divergence: 3.2
    },
    {
      id: 'CTR-2026-B4',
      carrier: 'Tana Logistics',
      route: 'Djibouti Port → Semera',
      lockedRate: 210000,
      currentSpot: 255000,
      validUntil: '2026-09-30',
      status: 'Review Required',
      divergence: 21.4
    }
  ];

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
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition-colors">
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
              {mockContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-900">{contract.id}</span>
                    <div className="text-[11px] text-slate-500">Valid to: {contract.validUntil}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{contract.carrier}</div>
                    <div className="text-xs text-slate-500">{contract.route}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-900">
                    ETB {contract.lockedRate.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">
                    ETB {contract.currentSpot.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {contract.divergence > 15 ? (
                      <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold w-fit">
                        <AlertTriangle size={12} /> +{contract.divergence}%
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold w-fit">
                        <TrendingUp size={12} /> +{contract.divergence}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      contract.status === 'Active' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-bold">
                      {contract.divergence > 15 ? 'Renegotiate' : 'View Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
