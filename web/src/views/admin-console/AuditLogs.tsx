import React from 'react';
import { Database, Download, Search, Filter, Calendar } from 'lucide-react';

export default function AuditLogs() {
  const logs = [
    {
      time: "2026-08-16 14:31:02 EAT",
      action: "AUTH",
      actor: "Admin Habtamu Zewde",
      message: "Approved verification for TransHorn Logistics (TIN-ET-99421A)",
      ip: "196.189.15.22",
      status: "SUCCESS"
    },
    {
      time: "2026-08-16 14:15:44 EAT",
      action: "PRICING_ENGINE",
      actor: "System Auto-Trigger",
      message: "Spot rate recalculated (+4.8% fuel adjustment applied to Djibouti-Modjo route)",
      ip: "10.0.4.12",
      status: "SUCCESS"
    },
    {
      time: "2026-08-16 13:58:10 EAT",
      action: "ESCROW_MUTATION",
      actor: "TeleBirr Gateway API",
      message: "Webhook received for SHP-9021-DJM (ETB 348,500.00 locked)",
      ip: "197.156.99.102",
      status: "SUCCESS"
    },
    {
      time: "2026-08-16 13:42:05 EAT",
      action: "GEO_FENCE_ALERT",
      actor: "System Radar",
      message: "RISK-04 detour triggered at Semera (Radius: 25km)",
      ip: "10.0.4.18",
      status: "WARNING"
    },
    {
      time: "2026-08-16 13:10:55 EAT",
      action: "AUTH_FAILED",
      actor: "Unknown",
      message: "Failed login attempt for admin console (Invalid 2FA)",
      ip: "192.168.1.45",
      status: "FAILED"
    },
    {
      time: "2026-08-16 12:45:00 EAT",
      action: "DISPUTE_RAISED",
      actor: "Ethio-Trading PLC",
      message: "Opened dispute ticket #DSP-204 vs Abyssinia Logistics (Weight discrepancy)",
      ip: "196.188.10.5",
      status: "SUCCESS"
    }
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database size={20} className="text-blue-600" /> 
            Immutable Security & Regulatory Audit Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">7-Year Data Retention enforced for Ethiopian Customs Commission compliance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-white text-slate-700 hover:text-slate-900 font-semibold py-2 px-4 border border-slate-200 hover:border-slate-300 rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <button className="bg-[#0F172A] hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2">
            <Download size={16} /> Export PDF Report
          </button>
        </div>
      </div>

      {/* Main Workspace (Data Grid) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[500px]">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center">
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Search by ID, TIN, or IP..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Today" readOnly className="w-32 pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white cursor-pointer" />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select className="w-40 pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white appearance-none cursor-pointer">
                <option>All Actions</option>
                <option>AUTH</option>
                <option>ESCROW_MUTATION</option>
                <option>PRICING_ENGINE</option>
              </select>
            </div>
          </div>

        </div>

        {/* Dense Data Grid */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[10px] font-bold text-slate-500 bg-slate-100 uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-3">Timestamp (EAT)</th>
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">Actor / Principal</th>
                <th className="px-6 py-3">Event Details</th>
                <th className="px-6 py-3">Source IP</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              
              {logs.map((log, index) => (
                <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3 text-slate-400">[{log.time}]</td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-slate-700">{log.action}</span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-800">{log.actor}</td>
                  <td className="px-6 py-3 text-slate-600 max-w-md truncate" title={log.message}>
                    {log.message}
                  </td>
                  <td className="px-6 py-3 text-slate-400">{log.ip}</td>
                  <td className="px-6 py-3 text-right">
                    {log.status === 'SUCCESS' && <span className="text-emerald-600 font-bold">SUCCESS</span>}
                    {log.status === 'WARNING' && <span className="text-amber-600 font-bold">WARNING</span>}
                    {log.status === 'FAILED' && <span className="text-rose-600 font-bold">FAILED</span>}
                  </td>
                </tr>
              ))}

              {/* Extra mock rows to fill space */}
              {[...Array(10)].map((_, i) => (
                <tr key={`mock-${i}`} className="hover:bg-slate-50/80 transition-colors opacity-50">
                  <td className="px-6 py-3 text-slate-400">[2026-08-16 11:{59 - i}:00 EAT]</td>
                  <td className="px-6 py-3 font-bold text-slate-700">READ_QUERY</td>
                  <td className="px-6 py-3 font-semibold text-slate-800">System Analytics</td>
                  <td className="px-6 py-3 text-slate-600">Batch export of corridor spot rates</td>
                  <td className="px-6 py-3 text-slate-400">10.0.1.55</td>
                  <td className="px-6 py-3 text-right text-emerald-600 font-bold">SUCCESS</td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
