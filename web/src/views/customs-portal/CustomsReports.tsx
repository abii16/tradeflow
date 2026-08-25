import React, { useState, useEffect } from 'react';
import { Layers, Download, FileBarChart, Clock, ShieldAlert, DollarSign, CheckCircle2, Shield, X, Copy } from 'lucide-react';

export default function CustomsReports() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHashModalOpen, setIsHashModalOpen] = useState(false);
  const [activeHashRow, setActiveHashRow] = useState<any>(null);

  const ledgerRows: any[] = [];

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleExport = (type: string) => {
    setToastMessage(`Initiating ${type} Export... Establishing secure connection to ECC Data Lake.`);
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
    <div className="h-[calc(100vh-140px)] flex flex-col relative overflow-y-auto pr-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toastMessage}
          </div>
        </div>
      )}

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
          <button 
            onClick={() => handleExport('CSV')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 shadow-sm transition-colors active:scale-95"
          >
            <Download size={16} className="text-slate-500" />
            Export CSV
          </button>
          <button 
            onClick={() => handleExport('Official ECC PDF Pass Log')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors active:scale-95"
          >
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
            <div className="text-xl font-bold text-slate-900">0 Containers</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">-- vs yesterday</div>
          </div>
        </div>
        
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Checkpoint Dwell</div>
            <div className="text-xl font-bold text-slate-900">-- Minutes</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">--</div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border border-amber-100">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Discrepancy Flag Rate</div>
            <div className="text-xl font-bold text-slate-900">0.0%</div>
            <div className="text-xs font-medium text-slate-500 mt-1">--</div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tariff & Fines</div>
            <div className="text-xl font-mono font-bold text-slate-900">ETB 0</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Collected today</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Corridor Throughput Chart */}
        <div className="w-full lg:w-1/3 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col shrink-0 min-h-[300px]">
          <h3 className="font-bold text-slate-900 mb-1">Corridor Throughput</h3>
          <p className="text-xs text-slate-500 mb-6">Inbound vs Outbound Dwell-Time (Djibouti -&gt; Galafi -&gt; Modjo)</p>
          
          <div className="flex-1 flex items-end justify-between px-2 pb-8 relative mt-4">
            {/* Y-Axis Lines & Labels */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
              {[4, 3, 2, 1, 0].map((h) => (
                <div key={h} className="w-full border-t border-slate-100 relative flex items-center">
                  <span className="absolute -left-6 text-[10px] font-bold text-slate-400 bg-white pr-1 -translate-y-1/2">{h}h</span>
                </div>
              ))}
            </div>

            {/* X-Axis Data Bars */}
            <div className="relative z-10 w-full flex justify-between px-4 h-full items-end gap-2">
              {/* Djibouti */}
              <div className="flex flex-col items-center justify-end h-full w-12 group cursor-pointer">
                <div className="w-full flex items-end gap-1">
                  <div className="w-full bg-slate-300 h-0 rounded-t-sm group-hover:bg-slate-400 transition-colors relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-slate-800 text-white text-[10px] py-1 px-2 rounded">No Data</div>
                  </div>
                  <div className="w-full bg-blue-500 h-0 rounded-t-sm group-hover:bg-blue-600 transition-colors relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-blue-800 text-white text-[10px] py-1 px-2 rounded">No Data</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-500 mt-3 text-center leading-tight absolute -bottom-8 w-16">Djibouti Doraleh</span>
              </div>

              {/* Galafi */}
              <div className="flex flex-col items-center justify-end h-full w-12 group cursor-pointer">
                <div className="w-full flex items-end gap-1">
                  <div className="w-full bg-slate-300 h-0 rounded-t-sm group-hover:bg-slate-400 transition-colors relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-slate-800 text-white text-[10px] py-1 px-2 rounded">No Data</div>
                  </div>
                  <div className="w-full bg-blue-500 h-0 rounded-t-sm group-hover:bg-blue-600 transition-colors relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-blue-800 text-white text-[10px] py-1 px-2 rounded">No Data</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-500 mt-3 text-center leading-tight absolute -bottom-8 w-16">Galafi Border</span>
              </div>

              {/* Mille */}
              <div className="flex flex-col items-center justify-end h-full w-12 group cursor-pointer">
                <div className="w-full flex items-end gap-1">
                  <div className="w-full bg-slate-300 h-0 rounded-t-sm group-hover:bg-slate-400 transition-colors relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-slate-800 text-white text-[10px] py-1 px-2 rounded">No Data</div>
                  </div>
                  <div className="w-full bg-blue-500 h-0 rounded-t-sm group-hover:bg-blue-600 transition-colors relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-blue-800 text-white text-[10px] py-1 px-2 rounded">No Data</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-500 mt-3 text-center leading-tight absolute -bottom-8 w-16">Mille Station</span>
              </div>

              {/* Modjo */}
              <div className="flex flex-col items-center justify-end h-full w-12 group cursor-pointer">
                <div className="w-full flex items-end gap-1">
                  <div className="w-full bg-slate-300 h-0 rounded-t-sm group-hover:bg-slate-400 transition-colors relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-slate-800 text-white text-[10px] py-1 px-2 rounded">No Data</div>
                  </div>
                  <div className="w-full bg-blue-500 h-0 rounded-t-sm group-hover:bg-blue-600 transition-colors relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-blue-800 text-white text-[10px] py-1 px-2 rounded">No Data</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-500 mt-3 text-center leading-tight absolute -bottom-8 w-16">Modjo Dry Port</span>
              </div>
            </div>
            
            {/* X-Axis Line */}
            <div className="absolute bottom-8 left-0 right-0 border-b-2 border-slate-200 z-0"></div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-6">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-slate-300 rounded-sm"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Historical Peak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Current Average</span>
            </div>
          </div>
        </div>

        {/* Audit Ledger */}
        <div className="w-full lg:w-2/3 bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col flex-1 min-h-[300px]">
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
                      <button 
                        onClick={() => handleHashClick(row)}
                        className="font-mono text-xs text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded border border-slate-200 transition-colors w-24 truncate block"
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
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm rounded-xl" onClick={() => setIsHashModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Cryptographic Hash Inspector</h3>
                  <p className="text-xs text-slate-500 font-medium">Immutable Record Verification</p>
                </div>
              </div>
              <button onClick={() => setIsHashModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ECC Immutable Block Timestamp</span>
                <span className="font-mono text-sm font-bold text-slate-800">2026-08-16 {activeHashRow.time} EAT</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Officer / Actor</span>
                <span className="text-sm font-medium text-slate-800">{activeHashRow.officer} (Kassahun Bekele)</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Status</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md w-fit">
                  <CheckCircle2 size={16} /> Verified Unaltered
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">SHA-256 Checksum</span>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-100 border border-slate-200 p-3 rounded-lg font-mono text-xs text-slate-600 break-all">
                    {activeHashRow.hash}
                  </div>
                  <button 
                    onClick={handleCopyHash}
                    className="px-4 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-sm shrink-0 flex items-center justify-center"
                    title="Copy Hash"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 text-right">
              <button 
                onClick={() => setIsHashModalOpen(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm transition-all text-sm"
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
