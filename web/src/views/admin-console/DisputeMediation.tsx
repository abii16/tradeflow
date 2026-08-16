import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, AlertCircle, FileText, Lock, Unlock, Gavel, Handshake, Search, FileImage, ShieldCheck, X } from 'lucide-react';

export default function DisputeMediation() {
  const { t } = useTranslation();
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Scale size={20} className="text-indigo-600" /> 
            {t('dm_title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('dm_desc')}</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-lg text-sm border border-indigo-100 flex items-center gap-2">
          <AlertCircle size={16} /> 3 {t('dm_active_disputes')}
        </div>
      </div>

      {/* Main Workspace (Inbox / Chat style) */}
      <div className="flex-1 flex gap-6 min-h-[600px]">
        
        {/* Left Column: Inbox List */}
        <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder={t('dm_search')} className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            
            {/* Active Ticket */}
            <div className="p-4 border-b border-slate-200 bg-indigo-50/50 border-l-4 border-l-indigo-600 cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold font-mono text-indigo-700">#DSP-204</span>
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{t('dm_status_open')}</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Ethio-Trading PLC <span className="text-slate-400 font-normal mx-1">{t('dm_vs')}</span> Abyssinia Logistics</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">Weight discrepancy reported at Modjo weighbridge.</p>
              <div className="text-[10px] text-slate-400 mt-2">Opened 2 hours ago</div>
            </div>

            {/* Inactive Tickets */}
            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer opacity-75">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold font-mono text-slate-600">#DSP-203</span>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{t('dm_status_review')}</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">BGI Brewery <span className="text-slate-400 font-normal mx-1">{t('dm_vs')}</span> TransHorn Logistics</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">Delayed arrival SLA breach dispute.</p>
              <div className="text-[10px] text-slate-400 mt-2">Opened yesterday</div>
            </div>

            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer opacity-50">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold font-mono text-slate-600">#DSP-200</span>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{t('dm_status_resolved')}</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Mugher Cement <span className="text-slate-400 font-normal mx-1">{t('dm_vs')}</span> ET-9021</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">Cargo damage claim rejected.</p>
              <div className="text-[10px] text-slate-400 mt-2">Resolved 3 days ago</div>
            </div>

          </div>
        </div>

        {/* Right Column: Ticket Details & Resolution */}
        <div className="w-2/3 flex flex-col space-y-6">
          
          {/* Ticket Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                  {t('dm_claim')} #DSP-204
                  <a href="#" className="text-[10px] font-mono bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors">
                    [SHP-9021-DJM • 30T Rebar • Djibouti -&gt; Modjo]
                  </a>
                </h3>
                <div className="text-sm font-semibold text-slate-600">Ethio-Trading PLC ({t('dm_importer_label')}) <span className="text-slate-400 mx-2">{t('dm_vs')}</span> Abyssinia Heavy Logistics ({t('dm_carrier_label')})</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-right">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-end">
                  <Lock size={12} className="text-amber-500" /> {t('dm_escrow_multi_sig')}
                </div>
                <div className="text-lg font-mono font-bold text-slate-900">ETB 348,500.00</div>
              </div>
            </div>

            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-rose-800 text-sm mb-1">{t('dm_severity_alert')}: 1.5 MT Weight Discrepancy</h4>
                <p className="text-xs text-rose-700">{t('dm_claim_desc')}</p>
              </div>
            </div>
          </div>

          {/* Evidence Thread */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-700 text-sm">{t('dm_evidence_thread')}</h4>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              
              {/* Message 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">SH</div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg rounded-tl-none p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-slate-900">Ethio-Trading PLC ({t('dm_importer_label')})</span>
                    <span className="text-[10px] text-slate-400">10:45 AM</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">{t('dm_evidence_shipper_msg')}</p>
                  
                  <div className="flex gap-2">
                    <button className="border border-slate-200 rounded p-2 flex items-center gap-2 bg-slate-50 text-xs w-fit hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer group">
                      <FileImage size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
                      <span>modjo_scale_ticket.jpg (2.4 MB)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Message 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">TR</div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg rounded-tl-none p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-slate-900">Abyssinia Heavy Logistics ({t('dm_carrier_label')})</span>
                    <span className="text-[10px] text-slate-400">11:15 AM</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">{t('dm_evidence_carrier_msg')}</p>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button className="border border-slate-200 rounded p-2 flex items-center gap-2 bg-slate-50 text-xs w-fit hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer group">
                      <FileImage size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span>galafi_scale_ticket.jpg (1.8 MB)</span>
                    </button>
                    <button className="border border-slate-200 rounded p-2 flex items-center gap-2 bg-slate-50 text-xs w-fit hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer group">
                      <ShieldCheck size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span>telemetry_lock_log.pdf ({t('dm_attachment_verified')})</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action / Resolution Panel */}
          <div className="bg-[#0F172A] rounded-xl shadow-lg p-6 border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Gavel size={16} className="text-indigo-400" /> {t('dm_resolution_title')}
            </h4>
            
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-300 mb-2">{t('dm_resolution_note')}</label>
              <textarea 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none" 
                rows={3}
                placeholder={t('dm_resolution_note_placeholder')}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-[#059669] hover:bg-[#047857] text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
                <Unlock size={16} />
                {t('dm_release_100')}
              </button>
              
              <button 
                onClick={() => setIsRefundModalOpen(true)}
                className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Scale size={16} />
                {t('dm_issue_refund')}
              </button>
              
              <button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
                <Gavel size={16} />
                {t('dm_escalate_legal')}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Partial Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">{t('dm_modal_refund_title')}</h3>
              <button onClick={() => setIsRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('dm_modal_refund_amount')}</label>
                <input 
                  type="number" 
                  defaultValue={21336.73}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <p className="text-xs text-slate-500 mt-2">Pre-calculated pro-rata for 1.5 MT discrepancy.</p>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
              <button 
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors text-sm"
              >
                {t('dm_modal_cancel')}
              </button>
              <button 
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 font-bold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors shadow-sm text-sm"
              >
                {t('dm_modal_deduct_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
