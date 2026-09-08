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
        color: doc.status === 'SUBMITTED' ? 'amber' : doc.status === 'UNDER_REVIEW' ? 'purple' : 'emerald',
        originalData: doc
      }));

      setQueue(formattedQueue);
    } catch (err) {
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
      case 'amber': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'purple': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'rose': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'emerald': return 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/20';
      default: return 'bg-[#181818] text-[#8F8F8F] border-[#2E2E2E]';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* LEFT COLUMN: Incoming Manifest Queue (48%) */}
      <div className="w-full lg:w-[48%] bg-[#232323] border border-[#2E2E2E] rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2E2E2E] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-[#EDEDED] text-sm">{t('incoming_manifest_queue')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-[#8F8F8F] hover:text-[#3ECF8E] bg-[#181818] border border-[#2E2E2E] rounded transition-colors">
              <Filter size={15} />
            </button>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8F8F8F]" />
              <input
                type="text"
                placeholder={t('search_manifest_id')}
                className="pl-8 pr-3 py-1.5 text-xs border border-[#2E2E2E] rounded bg-[#181818] text-[#EDEDED] focus:outline-none focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] w-52 placeholder:text-[#8F8F8F]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-[#181818] border-b border-[#2E2E2E]">
              <tr>
                <th className="w-2/12 px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">{t('manifest_id')}</th>
                <th className="w-3/12 px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">{t('freight_forwarder')}</th>
                <th className="w-2/12 px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">{t('eta_galafi')}</th>
                <th className="w-5/12 px-4 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider text-right">{t('status_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E] text-xs font-mono text-[#EDEDED]">
              {queue.map((row) => {
                const isActive = activeManifestId === row.id;
                return (
                  <tr
                    key={row.id}
                    className={`group cursor-pointer transition-colors ${isActive ? 'bg-[#3ECF8E]/5 border-l-2 border-[#3ECF8E]' : 'border-l-2 border-transparent hover:bg-[#2A2A2A]'}`}
                    onClick={() => setActiveManifestId(row.id)}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap truncate">
                      <span className="font-mono text-xs font-bold text-[#EDEDED]">{row.id}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap truncate">
                      <span className="text-xs font-medium text-[#EDEDED]">{row.forwarder}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap truncate">
                      <span className="font-mono text-xs text-[#8F8F8F]">{row.eta}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusClasses(row.color)}`}>
                          {t(`status_${row.status}`)}
                        </span>
                        <button className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-all ${
                          isActive
                            ? 'bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E]'
                            : 'bg-[#181818] text-[#8F8F8F] border border-[#2E2E2E] hover:text-[#EDEDED] hover:border-[#3ECF8E]/30'
                          }`}>
                          {isActive ? t('active_selection') : t('inspect')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: Automated Consistency Checker (52%) */}
      <div className="w-full lg:w-[52%] bg-[#232323] border border-[#2E2E2E] rounded-xl flex flex-col overflow-hidden">
        {activeDoc ? (
          <>
            <div className="p-4 border-b border-[#2E2E2E] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                  activeDoc.status === 'SUBMITTED' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                }`}>
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-[#EDEDED] text-sm">{t('selected_manifest')} {activeManifestId}</h3>
                  <p className="text-xs text-[#8F8F8F] mt-0.5">{t('freight_forwarder')}: {activeDoc.forwarder} • {t('date')}: {activeDoc.eta}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Alert Box */}
              <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-lg p-3.5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-[#EDEDED] mb-3">
                  <FileText size={16} className="text-[#3ECF8E]" />
                  {t('extracted_data_validation')} (FR-06.2)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-[#232323] p-3 rounded border border-[#2E2E2E]">
                    <div className="text-[10px] uppercase font-bold text-[#8F8F8F] mb-1 tracking-wider">{t('invoice_total')}</div>
                    <div className="font-mono text-base font-bold text-[#EDEDED]">
                      {activeDoc.originalData.extractedData?.invoice?.totalAmount
                        ? `${activeDoc.originalData.extractedData.invoice.currency || 'USD'} ${activeDoc.originalData.extractedData.invoice.totalAmount.toLocaleString()}`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-[#232323] p-3 rounded border border-[#2E2E2E]">
                    <div className="text-[10px] uppercase font-bold text-[#8F8F8F] mb-1 tracking-wider">{t('packing_list_weight')}</div>
                    <div className="font-mono text-base font-bold text-[#EDEDED]">
                      {activeDoc.originalData.extractedData?.packingList?.totalWeight
                        ? `${activeDoc.originalData.extractedData.packingList.totalWeight.toLocaleString()} kg`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-[#2E2E2E] bg-[#1C1C1C] flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider mb-2">{t('invoice_number')}</div>
                  <div className="text-xs font-bold text-[#EDEDED] font-mono">
                    {activeDoc.originalData.extractedData?.invoice?.invoiceNumber || 'Unknown'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-[#2E2E2E] bg-[#1C1C1C] flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider mb-2">{t('smart_eseal')}</div>
                  <div className="inline-flex items-center gap-1.5 bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 px-2.5 py-1 rounded text-[11px] font-bold w-fit">
                    <Lock size={11} className="text-[#3ECF8E]" />
                    🔒 {t('intact_seal')}
                  </div>
                </div>
              </div>

              {/* Document Checklist */}
              <div className="p-3.5 rounded-lg border border-[#2E2E2E] bg-[#1C1C1C]">
                <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider mb-3">{t('attached_clearance_docs')}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={activeDoc.originalData.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded border transition-colors bg-[#232323] text-[#8F8F8F] border-[#2E2E2E] hover:text-[#EDEDED] hover:border-[#3ECF8E]/30">
                    <FileText size={11} />
                    {t('invoice')}
                  </a>
                  <a href={activeDoc.originalData.packingListUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded border transition-colors bg-[#232323] text-[#8F8F8F] border-[#2E2E2E] hover:text-[#EDEDED] hover:border-[#3ECF8E]/30">
                    <FileText size={11} />
                    {t('packing_list')}
                  </a>
                  <a href={activeDoc.originalData.billOfLadingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded border transition-colors bg-[#232323] text-[#8F8F8F] border-[#2E2E2E] hover:text-[#EDEDED] hover:border-[#3ECF8E]/30">
                    <FileText size={11} />
                    {t('bill_of_lading')}
                  </a>
                  <a href={activeDoc.originalData.certificateOfOriginUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded border transition-colors bg-[#232323] text-[#8F8F8F] border-[#2E2E2E] hover:text-[#EDEDED] hover:border-[#3ECF8E]/30">
                    <FileText size={11} />
                    {t('cert_origin')}
                  </a>
                </div>
              </div>

              {/* Mini Map */}
              <div className="rounded-lg border border-[#2E2E2E] overflow-hidden relative group bg-[#1C1C1C] h-24 flex items-center justify-center">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3ECF8E 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <Map size={22} className="text-[#8F8F8F] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-[#8F8F8F] bg-[#232323]/80 px-2 py-1 rounded border border-[#2E2E2E]">{t('satellite_snapshot')}</span>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-12 border border-[#3ECF8E]/30 rounded bg-[#3ECF8E]/5 flex items-center justify-center z-10 animate-pulse">
                  <span className="text-[10px] font-bold text-[#3ECF8E] px-1">{t('vehicle_lane_pin')}</span>
                </div>
              </div>
            </div>

            {/* Action Triggers */}
            <div className="p-4 border-t border-[#2E2E2E] flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => handleUpdateStatus('CLEARED')}
                className="flex-1 h-10 px-5 bg-[#3ECF8E] hover:bg-[#34b27b] active:scale-[0.98] text-[#1C1C1C] font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 size={16} />
                ✓ {t('validate_issue_pass')}
              </button>
              <button
                onClick={() => handleUpdateStatus('REJECTED')}
                className="w-fit px-5 h-10 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 active:scale-[0.98] font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <AlertTriangle size={16} />
                ⚠️ {t('flag_inspection')}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 bg-[#1C1C1C] border border-[#2E2E2E] rounded-full flex items-center justify-center mb-4">
              <Search size={22} className="text-[#8F8F8F]" />
            </div>
            <h3 className="font-bold text-[#EDEDED] text-sm mb-2">{t('select_a_manifest')}</h3>
            <p className="text-xs text-[#8F8F8F] max-w-sm">
              {t('click_manifest_desc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
