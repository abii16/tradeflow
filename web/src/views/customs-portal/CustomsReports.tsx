import React from 'react';
import { Layers, Download, FileBarChart, Clock, ShieldAlert, DollarSign, CheckCircle2 } from 'lucide-react';

export default function CustomsReports() {
  const ledgerRows = [
    { time: '14:32:10', officer: 'GA-772', action: 'Flagged for Inspection (Weight)', id: 'TFM-9943', hash: '0x9a8f...b2e4' },
    { time: '14:28:45', officer: 'GA-409', action: 'Clearance Issued', id: 'TFM-9940', hash: '0x1c3d...f9a1' },
    { time: '14:15:22', officer: 'GA-112', action: 'Penalty Assessed (ETB 45,000)', id: 'TFM-9915', hash: '0x7b4a...c8f3' },
    { time: '13:55:01', officer: 'AUTO-SYS', action: 'Manifest Submitted (API)', id: 'TFM-9944', hash: '0x3d2e...a1b4' },
    { time: '13:42:19', officer: 'GA-772', action: 'Clearance Issued', id: 'TFM-9938', hash: '0x8f9c...d4e5' },
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col relative overflow-y-auto pr-2">
      {/* Header */}
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-blue-600" />
            Regulatory Reports & Audit Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">Immutable records per SRS Section 6 Data Retention (7-Year Policy).</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
            <Download size={16} className="text-slate-500" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
            <FileBarChart size={16} />
            Export Official ECC PDF Pass Log
          </button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Daily Clearance Volume</div>
            <div className="text-xl font-bold text-slate-900">142 Containers</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">+8.5% vs yesterday</div>
          </div>
        </div>
        
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Checkpoint Dwell</div>
            <div className="text-xl font-bold text-slate-900">45 Minutes</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">Down from 3.2 hours</div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border border-amber-100">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Discrepancy Flag Rate</div>
            <div className="text-xl font-bold text-slate-900">2.1%</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Within national target</div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tariff & Fines</div>
            <div className="text-xl font-mono font-bold text-slate-900">ETB 1,420,500</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Collected today</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Placeholder Chart */}
        <div className="w-full lg:w-1/3 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col shrink-0">
          <h3 className="font-bold text-slate-900 mb-1">Corridor Throughput</h3>
          <p className="text-xs text-slate-500 mb-6">Inbound vs Outbound Dwell-Time (Djibouti -&gt; Galafi -&gt; Modjo)</p>
          
          <div className="flex-1 bg-slate-50 border border-slate-200 border-dashed rounded-lg flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <FileBarChart size={32} className="text-slate-300 mx-auto mb-2" />
              <span className="text-sm font-bold text-slate-400">Chart Visualization Placeholder</span>
            </div>
          </div>
        </div>

        {/* Audit Ledger */}
        <div className="w-full lg:w-2/3 bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col flex-1 min-h-0">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h3 className="font-bold text-slate-900">Immutable Regulatory Audit Ledger</h3>
            <p className="text-xs text-slate-500 mt-1">Read-only event stream of all customs actions.</p>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10 shadow-sm">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">TIMESTAMP (EAT)</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">OFFICER ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ACTION LOG</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">MANIFEST ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">DIGITAL SIGNATURE HASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-700">{row.time}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{row.officer}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-800">{row.action}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-slate-900">{row.id}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded select-all">{row.hash}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
