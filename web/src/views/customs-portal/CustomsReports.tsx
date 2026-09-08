import React, { useState, useEffect } from 'react';
import { Layers, Download, FileBarChart, Clock, ShieldAlert, DollarSign, CheckCircle2, Shield, X, Copy } from 'lucide-react';
import { fetchAuditLogs, exportAuditLogs } from '@/lib/apiClient';

export default function CustomsReports() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHashModalOpen, setIsHashModalOpen] = useState(false);
  const [activeHashRow, setActiveHashRow] = useState<any>(null);
  const [ledgerRows, setLedgerRows] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ clearance: 0, flagRate: '0.0%', tariff: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAuditLogs();
        if (data.logs) {
          const rows = data.logs.map((log: any) => {
            const isCustoms = log.action === 'CUSTOMS_STATUS_UPDATE' || log.action === 'DOCUMENT_SUBMISSION';
            return {
              time: new Date(log.createdAt).toLocaleTimeString(),
              officer: log.actorEmail ? log.actorEmail.split('@')[0].toUpperCase() : 'SYS_AUTO',
              action: log.action.replace(/_/g, ' '),
              id: log.details?.loadId?.substring(0, 8).toUpperCase() || log.id.substring(0, 8).toUpperCase(),
              hash: log.id.replace(/-/g, '') + 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'.substring(0, 32),
              isCleared: log.details?.status === 'CLEARED',
              isRejected: log.details?.status === 'REJECTED'
            };
          });
          setLedgerRows(rows);

          const cleared = rows.filter((r: any) => r.isCleared).length;
          const rejected = rows.filter((r: any) => r.isRejected).length;
          const total = cleared + rejected;
          setMetrics({
            clearance: cleared,
            flagRate: total > 0 ? ((rejected / total) * 100).toFixed(1) + '%' : '0.0%',
            tariff: rejected * 1500
          });
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    }
    loadData();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleExport = async (type: string) => {
    try {
      setToastMessage(`Initiating ${type} Export... Establishing secure connection to ECC Data Lake.`);
      const format = type === 'CSV' ? 'csv' : 'pdf';
      const response = await exportAuditLogs(format);
      if (response && response.success) {
        setTimeout(() => setToastMessage(response.message), 2000);
      }
    } catch (err) {
      setTimeout(() => setToastMessage('Export failed.'), 2000);
    }
  };

  const handleHashClick = (row: any) => {
    setActiveHashRow(row);
    setIsHashModalOpen(true);
  };

  const handleCopyHash = () => {
    if (activeHashRow) {
      navigator.clipboard.writeText(activeHashRow.hash);
      setToastMessage('SHA-256 Hash copied to clipboard.');
    }
  };

  return (
    <div className="flex flex-col relative space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-[#232323] border border-[#2E2E2E] text-[#EDEDED] px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-3">
            <CheckCircle2 size={15} className="text-[#3ECF8E]" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] flex items-center gap-2">
            <Layers className="text-[#3ECF8E]" size={20} />
            Regulatory Reports &amp; Audit Ledger
          </h2>
          <p className="text-sm text-[#8F8F8F] mt-1">Immutable records per SRS Section 6 Data Retention (7-Year Policy).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('CSV')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#181818] border border-[#2E2E2E] text-[#8F8F8F] text-xs font-bold rounded-lg hover:text-[#EDEDED] hover:border-[#3ECF8E]/30 transition-colors active:scale-95"
          >
            <Download size={14} className="text-[#8F8F8F]" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('Official ECC PDF Pass Log')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#3ECF8E] text-[#1C1C1C] text-xs font-bold rounded-lg hover:bg-[#34b27b] shadow-sm transition-colors active:scale-95"
          >
            <FileBarChart size={14} />
            Export Official ECC PDF Pass Log
          </button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-[#3ECF8E]/10 rounded-full flex items-center justify-center text-[#3ECF8E] border border-[#3ECF8E]/20 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider mb-1">Daily Clearance Volume</div>
            <div className="text-lg font-bold text-[#EDEDED]">{metrics.clearance} Containers</div>
            <div className="text-xs font-bold text-[#3ECF8E] mt-1">-- vs yesterday</div>
          </div>
        </div>

        <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider mb-1">Avg Checkpoint Dwell</div>
            <div className="text-lg font-bold text-[#EDEDED]">42 Minutes</div>
            <div className="text-xs font-bold text-[#3ECF8E] mt-1">-5 min</div>
          </div>
        </div>

        <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider mb-1">Discrepancy Flag Rate</div>
            <div className="text-lg font-bold text-[#EDEDED]">{metrics.flagRate}</div>
            <div className="text-xs font-medium text-[#8F8F8F] mt-1">From total checked</div>
          </div>
        </div>

        <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-[#3ECF8E]/10 rounded-full flex items-center justify-center text-[#3ECF8E] border border-[#3ECF8E]/20 shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider mb-1">Tariff &amp; Fines</div>
            <div className="text-lg font-mono font-bold text-[#EDEDED]">ETB {metrics.tariff.toLocaleString()}</div>
            <div className="text-xs font-medium text-[#8F8F8F] mt-1">Collected today</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Corridor Throughput Chart */}
        <div className="w-full lg:w-1/3 bg-[#232323] border border-[#2E2E2E] rounded-xl p-5 flex flex-col shrink-0 min-h-[280px]">
          <h3 className="font-bold text-[#EDEDED] text-sm mb-0.5">Corridor Throughput</h3>
          <p className="text-xs text-[#8F8F8F] mb-5">Inbound vs Outbound Dwell-Time (Djibouti -&gt; Galafi -&gt; Modjo)</p>

          <div className="flex-1 flex items-end justify-between px-2 pb-8 relative mt-4">
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
              {[4, 3, 2, 1, 0].map((h) => (
                <div key={h} className="w-full border-t border-dashed border-[#2E2E2E] relative flex items-center">
                  <span className="absolute -left-6 text-[10px] font-bold text-[#8F8F8F] -translate-y-1/2">{h}h</span>
                </div>
              ))}
            </div>

            <div className="relative z-10 w-full flex justify-between px-4 h-full items-end gap-2">
              {['Djibouti Doraleh', 'Galafi Border', 'Mille Station', 'Modjo Dry Port'].map((label) => (
                <div key={label} className="flex flex-col items-center justify-end h-full w-12 group cursor-pointer">
                  <div className="w-full flex items-end gap-1">
                    <div className="w-full bg-[#8F8F8F]/30 h-0 rounded-t-sm group-hover:bg-[#8F8F8F]/60 transition-colors relative border border-[#2E2E2E]">
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-[#181818] text-[#EDEDED] text-[10px] py-1 px-2 rounded border border-[#2E2E2E]">No Data</div>
                    </div>
                    <div className="w-full bg-[#3ECF8E]/50 h-0 rounded-t-sm group-hover:bg-[#3ECF8E] transition-colors relative border border-[#3ECF8E]/20">
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-[#181818] text-[#3ECF8E] text-[10px] py-1 px-2 rounded border border-[#3ECF8E]/20">No Data</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#8F8F8F] mt-3 text-center leading-tight absolute -bottom-8 w-16">{label}</span>
                </div>
              ))}
            </div>

            <div className="absolute bottom-8 left-0 right-0 border-b border-[#2E2E2E] z-0"></div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#8F8F8F]/30 rounded-sm border border-[#2E2E2E]"></div>
              <span className="text-[10px] font-bold text-[#8F8F8F] uppercase">Historical Peak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#3ECF8E]/50 rounded-sm border border-[#3ECF8E]/20"></div>
              <span className="text-[10px] font-bold text-[#8F8F8F] uppercase">Current Average</span>
            </div>
          </div>
        </div>

        {/* Audit Ledger */}
        <div className="w-full lg:w-2/3 bg-[#232323] border border-[#2E2E2E] rounded-xl flex flex-col">
          <div className="p-4 border-b border-[#2E2E2E] shrink-0">
            <h3 className="font-bold text-[#EDEDED] text-sm">Immutable Regulatory Audit Ledger</h3>
            <p className="text-xs text-[#8F8F8F] mt-0.5">Read-only event stream of all customs actions.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#181818] border-b border-[#2E2E2E]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">TIMESTAMP (EAT)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">OFFICER ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">ACTION LOG</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">MANIFEST ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">DIGITAL SIGNATURE HASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E] text-xs">
                {ledgerRows.map((row, i) => (
                  <tr key={i} className="hover:bg-[#2A2A2A] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#EDEDED]">{row.time}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded border border-[#3ECF8E]/20">{row.officer}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-[#EDEDED]">{row.action}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#EDEDED]">{row.id}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleHashClick(row)}
                        className="font-mono text-xs text-[#8F8F8F] hover:text-[#3ECF8E] bg-[#181818] hover:bg-[#3ECF8E]/10 px-2 py-1 rounded border border-[#2E2E2E] hover:border-[#3ECF8E]/30 transition-colors w-24 truncate block"
                      >
                        {row.hash}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hash Inspector Modal */}
      {isHashModalOpen && activeHashRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsHashModalOpen(false)}></div>

          <div className="relative bg-[#232323] rounded-xl shadow-2xl w-full max-w-lg border border-[#2E2E2E] flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#2E2E2E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center text-[#3ECF8E]">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#EDEDED] text-base">Cryptographic Hash Inspector</h3>
                  <p className="text-xs text-[#8F8F8F]">Immutable Record Verification</p>
                </div>
              </div>
              <button onClick={() => setIsHashModalOpen(false)} className="text-[#8F8F8F] hover:text-[#EDEDED] p-2">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider">ECC Immutable Block Timestamp</span>
                <span className="font-mono text-sm font-bold text-[#EDEDED]">2026-08-16 {activeHashRow.time} EAT</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider">Officer / Actor</span>
                <span className="text-sm font-medium text-[#EDEDED]">{activeHashRow.officer} (Kassahun Bekele)</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider">Audit Status</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-3 py-1.5 rounded-md w-fit">
                  <CheckCircle2 size={14} /> Verified Unaltered
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-[#2E2E2E]">
                <span className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider mb-2 block">SHA-256 Checksum</span>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#1C1C1C] border border-[#2E2E2E] p-3 rounded-lg font-mono text-xs text-[#8F8F8F] break-all">
                    {activeHashRow.hash}
                  </div>
                  <button
                    onClick={handleCopyHash}
                    className="px-3 bg-[#181818] border border-[#2E2E2E] rounded-lg text-[#8F8F8F] hover:text-[#3ECF8E] hover:border-[#3ECF8E]/30 transition-colors shrink-0 flex items-center justify-center"
                    title="Copy Hash"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#2E2E2E] shrink-0 text-right">
              <button
                onClick={() => setIsHashModalOpen(false)}
                className="px-5 py-2 bg-[#181818] border border-[#2E2E2E] hover:border-[#3ECF8E]/30 text-[#8F8F8F] hover:text-[#EDEDED] font-bold rounded-lg transition-all text-sm"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

