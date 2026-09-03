import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Lock, Map, Search, Filter, CheckCircle2, FileText, FileBadge, FileSpreadsheet } from 'lucide-react';
import { getCustomsQueue, updateCustomsStatus } from '@/lib/apiClient';

export default function CustomsWorkspace() {
  const { t } = useTranslation();
  const [activeManifestId, setActiveManifestId] = useState<string | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomsQueue();
      
      const formattedQueue = data.queue.map((doc: any) => ({
        id: doc.id.substring(0, 8).toUpperCase(),
        originalId: doc.id,
        forwarder: doc.loadTitle || 'TradeFlow Logistics',
        eta: new Date(doc.createdAt).toLocaleDateString(),
        status: doc.status,
        color: doc.status === 'SUBMITTED' ? 'amber' : doc.status === 'UNDER_REVIEW' ? 'blue' : 'emerald',
        originalData: doc
      }));
      
      setQueue(formattedQueue);
    } catch(err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const activeDoc = queue.find(q => q.id === activeManifestId);

  const handleUpdateStatus = async (status: string) => {
    if (!activeDoc) return;
    
    let reason = undefined;
    if (status === 'REJECTED') {
      const input = prompt('Please enter the reason for rejection (e.g. Weight Discrepancy):');
      if (input === null) return; // User cancelled
      reason = input;
    }

    try {
      await updateCustomsStatus(activeDoc.originalId, status, reason);
      alert(`Manifest successfully marked as ${status}`);
      // Optimistically clear selection so we don't look at a stale document
      setActiveManifestId(null);
      fetchQueue();
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update manifest status');
    }
  };

  const getStatusClasses = (color: string) => {
    switch (color) {
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rose': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* LEFT COLUMN: Incoming Manifest Queue (48%) */}
      <div className="w-full lg:w-[48%] bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-sm h-full">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900">{t('incoming_manifest_queue')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('select_manifest_check')} (FR-06.3)</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm transition-colors">
              <Filter size={16} />
            </button>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Manifest ID, Forwarder..." 
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-56"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="w-3/12 px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('manifest_id')}</th>
                <th className="w-4/12 px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('freight_forwarder')}</th>
                <th className="w-2/12 px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('eta_galafi')}</th>
                <th className="w-3/12 px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('status_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((row) => {
                const isActive = activeManifestId === row.id;
                return (
                  <tr 
                    key={row.id} 
                    className={`group cursor-pointer transition-colors ${isActive ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'border-l-4 border-transparent hover:bg-slate-50'}`}
                    onClick={() => setActiveManifestId(row.id)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap truncate">
                      <span className="font-mono text-sm font-bold text-slate-900">{row.id}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap truncate">
                      <span className="text-sm font-medium text-slate-700">{row.forwarder}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap truncate">
                      <span className="font-mono text-sm font-medium text-slate-600">{row.eta}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap truncate flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border shadow-sm ${getStatusClasses(row.color)}`}>
                        {row.status}
                      </span>
                      <button className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded transition-all shadow-sm ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}>
                        {isActive ? '[Active Selection]' : '[Inspect]'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: Automated Consistency Checker (52%) */}
      <div className="w-full lg:w-[52%] bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-sm h-full">
        {activeDoc ? (
          <>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border ${
                  activeDoc.status === 'SUBMITTED' ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-blue-100 border-blue-200 text-blue-600'
                }`}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('selected_manifest')} {activeManifestId}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{t('freight_forwarder')}: {activeDoc.forwarder} • Date: {activeDoc.eta}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Alert Box */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 shadow-sm">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                  <FileText size={18} className="text-blue-500" />
                  {t('extracted_data_validation')} (FR-06.2)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 p-3 rounded border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">{t('invoice_total')}</div>
                    <div className="font-mono text-lg font-bold text-slate-800">
                      {activeDoc.originalData.extractedData?.invoice?.totalAmount 
                        ? `${activeDoc.originalData.extractedData.invoice.currency || 'USD'} ${activeDoc.originalData.extractedData.invoice.totalAmount.toLocaleString()}`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white/60 p-3 rounded border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">{t('packing_list_weight')}</div>
                    <div className="font-mono text-lg font-bold text-slate-800">
                      {activeDoc.originalData.extractedData?.packingList?.totalWeight 
                        ? `${activeDoc.originalData.extractedData.packingList.totalWeight.toLocaleString()} kg` 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('invoice_number')}</div>
                  <div className="text-xs font-bold text-slate-800 font-mono">
                    {activeDoc.originalData.extractedData?.invoice?.invoiceNumber || 'Unknown'}
                  </div>
                </div>
                
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('smart_eseal')}</div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-[11px] font-bold shadow-sm w-fit">
                    <Lock size={12} className="text-emerald-500" />
                    🔒 {t('intact_seal')}
                  </div>
                </div>
              </div>

              {/* Document Checklist */}
              <div className="p-4 rounded-lg border border-slate-200 shadow-sm bg-white">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">{t('attached_clearance_docs')}</div>
                <div className="flex flex-wrap items-center gap-3">
                  <a href={activeDoc.originalData.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border shadow-sm transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    <FileText size={12} />
                    [Invoice]
                  </a>
                  <a href={activeDoc.originalData.packingListUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border shadow-sm transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    <FileText size={12} />
                    [Packing List]
                  </a>
                  <a href={activeDoc.originalData.billOfLadingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border shadow-sm transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    <FileText size={12} />
                    [Bill of Lading]
                  </a>
                  <a href={activeDoc.originalData.certificateOfOriginUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border shadow-sm transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    <FileText size={12} />
                    [Cert Origin]
                  </a>
                </div>
              </div>

              {/* Mini Map */}
              <div className="rounded-lg border border-slate-200 overflow-hidden relative shadow-sm group bg-slate-100 h-28 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <Map size={24} className="text-slate-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-1 rounded backdrop-blur border border-slate-200">Satellite Snapshot: Galafi Scale Station</span>
                </div>
                
                {/* Simulated check point highlight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 border-2 border-blue-500 rounded bg-blue-500/10 flex items-center justify-center z-10 animate-pulse">
                  <span className="text-[10px] font-bold text-blue-700 bg-white/90 px-1 rounded shadow-sm">Vehicle Lane Pin</span>
                </div>
              </div>
            </div>

            {/* Action Triggers */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-4 shrink-0 mt-auto">
              <button 
                onClick={() => handleUpdateStatus('CLEARED')}
                className="flex-1 h-11 bg-[#059669] hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 border border-emerald-800/20 text-sm"
              >
                <CheckCircle2 size={18} />
                ✓ {t('validate_issue_pass')}
              </button>
              <button 
                onClick={() => handleUpdateStatus('REJECTED')}
                className="flex-1 h-11 bg-[#DC2626] hover:bg-rose-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 border border-rose-800/20 text-sm"
              >
                <AlertTriangle size={18} />
                ⚠️ {t('flag_inspection')}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Search size={24} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{t('select_a_manifest')}</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {t('click_manifest_desc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
