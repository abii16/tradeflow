import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, AlertTriangle, Shield, CheckCircle2, FileText, X, CircleDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCustomsInspections, updateCustomsStatus } from '@/lib/apiClient';

export default function CustomsInspections() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeInspection, setActiveInspection] = useState<any>(null);
  const [toggles, setToggles] = useState({ visual: false, tamper: false, eSeal: false });
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInspections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomsInspections();
      const formatted = data.inspections.map((doc: any, index: number) => {
        let trigger = doc.rejectionReason || 'Random Physical Check';
        let color = 'rose';
        let bay = 'Bay 01 (Security / E-Seals)';

        const r = trigger.toLowerCase();
        if (r.includes('weight') || r.includes('heavy') || r.includes('axle')) {
          color = 'amber';
          bay = 'Bay 03 (Heavy Axle Scale)';
        } else if (r.includes('doc') || r.includes('audit')) {
          color = 'blue';
          bay = 'Bay 02 (Documentation Audit)';
        }

        return {
          id: doc.id.substring(0, 8).toUpperCase(),
          originalId: doc.id,
          transporter: doc.loadTitle || 'TradeFlow Transport',
          trigger,
          color,
          bay,
          officer: `Inspector ${['A. Bekele', 'M. Tadesse', 'S. Alemu'][index % 3]}`,
          action: t('process_action')
        };
      });
      setInspections(formatted);
    } catch (err) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const getTriggerClass = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'amber': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'blue': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-[#181818] text-[#8F8F8F] border-[#2E2E2E]';
    }
  };

  const handleOpenModal = (row: any) => {
    setActiveInspection(row);
    setToggles({ visual: true, tamper: true, eSeal: true }); // Mock state
    setIsModalOpen(true);
  };

  const handleClearInspection = async () => {
    if (!activeInspection) return;
    try {
      await updateCustomsStatus(activeInspection.originalId, 'CLEARED');
      alert(`Manifest ${activeInspection.id} cleared and released successfully.`);
      setIsModalOpen(false);
      loadInspections(); // Refresh the list
    } catch (err) {
      console.error('Failed to clear inspection:', err);
      alert('Failed to clear inspection.');
    }
  };

  return (
    <div className="flex flex-col relative">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <h2 className="text-xl font-bold text-[#EDEDED] flex items-center gap-2">
          {t('sec_inspection_bay_title')}
        </h2>
      </div>

      {/* Main Content */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2E2E2E] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-[#EDEDED] text-sm">{t('active_inspection_queue')}</h3>
            <p className="text-xs text-[#8F8F8F] mt-0.5">{loading ? t('containers_stationed_loading') : t('containers_stationed', { count: inspections.length })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-[#8F8F8F] hover:text-[#3ECF8E] bg-[#181818] border border-[#2E2E2E] rounded transition-colors">
              <Filter size={15} />
            </button>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8F8F8F]" />
              <input
                type="text"
                placeholder={t('search_container_id')}
                className="pl-8 pr-3 py-1.5 text-xs border border-[#2E2E2E] rounded bg-[#181818] text-[#EDEDED] focus:outline-none focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] w-60 placeholder:text-[#8F8F8F]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead className="bg-[#181818] border-b border-[#2E2E2E]">
              <tr>
                <th className="w-[20%] px-5 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">{t('manifest_container_id')}</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">{t('transporter_col')}</th>
                <th className="w-[20%] px-5 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">{t('detected_trigger')}</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">{t('inspection_bay_col')}</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider">{t('officer_assigned_col')}</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-bold text-[#8F8F8F] uppercase tracking-wider text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E] text-xs">
              {inspections.map((row) => (
                <tr key={row.id} className="hover:bg-[#2A2A2A] transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap truncate">
                    <span className="font-mono text-xs font-bold text-[#EDEDED]">{row.id}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap truncate">
                    <span className="text-xs font-medium text-[#EDEDED]">{row.transporter}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap truncate">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getTriggerClass(row.color)}`}>
                      {colorToIcon(row.color)}
                      <span className="ml-1.5">{row.trigger}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap truncate">
                    <span className="text-xs font-medium text-[#8F8F8F]">{row.bay}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap truncate">
                    <span className="text-xs font-medium text-[#8F8F8F]">{row.officer}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right truncate">
                    <button
                      onClick={() => handleOpenModal(row)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded transition-all bg-[#181818] text-[#3ECF8E] border border-[#3ECF8E]/20 hover:bg-[#3ECF8E]/10"
                    >
                      [{row.action}]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Bay Capacity Status Strip */}
        <div className="border-t border-[#2E2E2E] p-3 bg-[#181818] shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center justify-between bg-[#232323] border border-[#2E2E2E] rounded-lg p-2.5">
            <span className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider">{t('bay_01')}</span>
            <div className="flex items-center gap-1.5 text-[#3ECF8E] text-xs font-bold">
              <CircleDot size={13} className="fill-[#3ECF8E]" />
              {t('available')}
            </div>
          </div>
          <div className="flex items-center justify-between bg-[#232323] border border-[#2E2E2E] rounded-lg p-2.5">
            <span className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider">{t('bay_02')}</span>
            <div className="flex items-center gap-1.5 text-[#3ECF8E] text-xs font-bold">
              <CircleDot size={13} className="fill-[#3ECF8E]" />
              {t('available')}
            </div>
          </div>
          <div className="flex items-center justify-between bg-[#232323] border border-[#2E2E2E] rounded-lg p-2.5">
            <span className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider">{t('bay_03')}</span>
            <div className="flex items-center gap-1.5 text-[#3ECF8E] text-xs font-bold">
              <CircleDot size={13} className="fill-[#3ECF8E]" />
              {t('available')}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

          <div className="relative bg-[#232323] rounded-xl shadow-2xl w-full max-w-2xl border border-[#2E2E2E] flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#2E2E2E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center text-[#3ECF8E]">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#EDEDED] text-base">{t('physical_inspection_log')}</h3>
                  <p className="text-xs text-[#8F8F8F] font-mono">{activeInspection?.id}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8F8F8F] hover:text-[#EDEDED] p-2">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Weight Recalibration */}
              <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-lg p-4">
                <label className="block text-sm font-bold text-[#EDEDED] mb-2">{t('reweighed_scale_value')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value="24,550 kg"
                    readOnly
                    className="w-1/2 border border-[#2E2E2E] rounded-md p-2.5 text-sm focus:outline-none font-mono font-bold bg-[#232323] text-[#EDEDED] shadow-inner"
                  />
                  <span className="text-xs font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-3 py-2 rounded-md">
                    {t('variance_reduced')}
                  </span>
                </div>
              </div>

              {/* Contraband & Security Checks */}
              <div>
                <label className="block text-sm font-bold text-[#EDEDED] mb-3">{t('contraband_security_check')}</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setToggles({ ...toggles, visual: !toggles.visual })}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${toggles.visual ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/20 text-[#3ECF8E]' : 'bg-[#181818] border-[#2E2E2E] text-[#8F8F8F]'}`}
                  >
                    <span className="font-medium text-sm">{t('visual_inspection')}</span>
                    {toggles.visual ? <span className="font-bold text-xs bg-[#3ECF8E]/10 px-2 py-1 rounded text-[#3ECF8E]">{t('passed')}</span> : <span className="font-bold text-xs bg-[#181818] px-2 py-1 rounded text-[#8F8F8F]">{t('pending')}</span>}
                  </button>
                  <button
                    onClick={() => setToggles({ ...toggles, tamper: !toggles.tamper })}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${toggles.tamper ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/20 text-[#3ECF8E]' : 'bg-[#181818] border-[#2E2E2E] text-[#8F8F8F]'}`}
                  >
                    <span className="font-medium text-sm">{t('cargo_tamper_inspection')}</span>
                    {toggles.tamper ? <span className="font-bold text-xs bg-[#3ECF8E]/10 px-2 py-1 rounded text-[#3ECF8E]">{t('passed')}</span> : <span className="font-bold text-xs bg-[#181818] px-2 py-1 rounded text-[#8F8F8F]">{t('pending')}</span>}
                  </button>
                  <button
                    onClick={() => setToggles({ ...toggles, eSeal: !toggles.eSeal })}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${toggles.eSeal ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-[#181818] border-[#2E2E2E] text-[#8F8F8F]'}`}
                  >
                    <span className="font-medium text-sm">{t('new_eseal_applied')}</span>
                    {toggles.eSeal ? <span className="font-bold text-xs bg-blue-500/10 px-2 py-1 rounded font-mono text-blue-400">#SEAL-ET-9941</span> : <span className="font-bold text-xs bg-[#181818] px-2 py-1 rounded text-[#8F8F8F]">{t('not_applied')}</span>}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#2E2E2E] flex flex-col gap-2 shrink-0">
              <button
                onClick={handleClearInspection}
                className="w-full py-2.5 bg-[#3ECF8E] hover:bg-[#34b27b] active:scale-[0.99] text-[#1C1C1C] font-bold rounded-lg transition-all text-sm flex justify-center items-center gap-2"
              >
                <CheckCircle2 size={16} />
                ✓ {t('issue_cleared_pass')}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.99] text-rose-400 border border-rose-500/20 font-bold rounded-lg transition-all text-sm flex justify-center items-center gap-2"
              >
                <AlertTriangle size={16} />
                ⚠️ {t('impound_container')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function colorToIcon(color: string) {
  if (color === 'rose') return <AlertTriangle size={12} />;
  if (color === 'amber') return <Shield size={12} />;
  if (color === 'blue') return <FileText size={12} />;
  return null;
}
