import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, AlertCircle, FileText, Lock, Unlock, Gavel, Handshake, Search, FileImage, ShieldCheck, X } from 'lucide-react';
import { fetchDisputes, resolveDispute } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function DisputeMediation() {
  const { t } = useTranslation();
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadData = async () => {
    try {
      const response = await fetchDisputes();
      setDisputes(response.data || []);
      if (response.data && response.data.length > 0 && !selectedDispute) {
        setSelectedDispute(response.data[0]);
      }
    } catch (err) {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (status: string, finalEscrowPayout?: number) => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      await resolveDispute(selectedDispute.id, {
        status,
        finalEscrowPayout,
        resolutionNotes
      });
      toast.success('Dispute resolved successfully');
      setResolutionNotes('');
      if (status === 'RESOLVED_REFUNDED') {
        setIsRefundModalOpen(false);
      }
      loadData();
      // Optional: re-select first active if needed
    } catch (err) {
      toast.error('Failed to resolve dispute');
    } finally {
      setActionLoading(false);
    }
  };

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
          <AlertCircle size={16} /> {disputes.filter(d => d.status === 'OPEN').length} {t('dm_active_disputes')}
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
            
            {loading && <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>}
            
            {disputes.map((d) => (
              <div 
                key={d.id}
                onClick={() => setSelectedDispute(d)}
                className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${selectedDispute?.id === d.id ? 'bg-slate-50/90 border-l-4 border-slate-900 shadow-sm' : 'hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-bold font-mono ${selectedDispute?.id === d.id ? 'text-indigo-700' : 'text-slate-600'}`}>{d.id.substring(0,8)}</span>
                  {d.status === 'OPEN' && <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{t('dm_status_open')}</span>}
                  {d.status === 'UNDER_REVIEW' && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{t('dm_status_review')}</span>}
                  {d.status.startsWith('RESOLVED') && <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{t('dm_status_resolved')}</span>}
                  {d.status === 'ESCALATED_LEGAL' && <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ESCALATED</span>}
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1">{d.shipperName || 'Shipper'} <span className="text-slate-400 font-normal mx-1">{t('dm_vs')}</span> {d.transporterName || 'Transporter'}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{d.reason}</p>
                <div className="text-[10px] text-slate-400 mt-2">{new Date(d.createdAt).toLocaleString()}</div>
              </div>
            ))}
            
            {disputes.length === 0 && !loading && (
              <div className="p-4 text-center text-slate-500 text-sm">No disputes found.</div>
            )}

          </div>
        </div>

        {/* Right Column: Ticket Details & Resolution */}
        <div className="w-2/3 flex flex-col space-y-6">
          
          {selectedDispute ? (
            <>
              {/* Ticket Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                      {t('dm_claim')} #{selectedDispute.id.substring(0,8)}
                      <a href="#" className="text-[10px] font-mono bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors">
                        [{selectedDispute.jobId}]
                      </a>
                    </h3>
                    <div className="text-sm font-semibold text-slate-600">{selectedDispute.shipperName || 'Shipper'} ({t('dm_importer_label')}) <span className="text-slate-400 mx-2">{t('dm_vs')}</span> {selectedDispute.transporterName || 'Transporter'} ({t('dm_carrier_label')})</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-end">
                      <Lock size={12} className="text-amber-500" /> {t('dm_escrow_multi_sig')}
                    </div>
                    <div className="text-lg font-mono font-bold text-slate-900">ETB {Number(selectedDispute.amountDisputed).toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-rose-800 text-sm mb-1">{t('dm_severity_alert')}: {selectedDispute.reason}</h4>
                    <p className="text-xs text-rose-700">{selectedDispute.description || t('dm_claim_desc')}</p>
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
                    <span className="font-bold text-sm text-slate-900">{selectedDispute.shipperName || 'Shipper'} ({t('dm_importer_label')})</span>
                    <span className="text-[10px] text-slate-400">{new Date(selectedDispute.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Message 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">TR</div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg rounded-tl-none p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-slate-900">{selectedDispute.transporterName || 'Transporter'} ({t('dm_carrier_label')})</span>
                    <span className="text-[10px] text-slate-400">{new Date(selectedDispute.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">Carrier dispute evidence logged automatically via platform.</p>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button className="border border-slate-200 rounded p-2 flex items-center gap-2 bg-slate-50 text-xs w-fit hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer group">
                      <ShieldCheck size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span>telemetry_log.pdf ({t('dm_attachment_verified')})</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action / Resolution Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gavel size={16} className="text-slate-900" /> {t('dm_resolution_title')}
            </h4>
            
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">{t('dm_resolution_note')}</label>
                <textarea 
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-colors resize-none" 
                  rows={3}
                  placeholder={t('dm_resolution_note_placeholder')}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <button 
                  disabled={actionLoading || selectedDispute.status.startsWith('RESOLVED')}
                  onClick={() => handleResolve('RESOLVED_FULL_PAYOUT', Number(selectedDispute.amountDisputed))}
                  className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
                >
                  <Unlock size={16} />
                  {t('dm_release_100')}
                </button>
                
                <button 
                  disabled={actionLoading || selectedDispute.status.startsWith('RESOLVED')}
                  onClick={() => setIsRefundModalOpen(true)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Scale size={16} />
                  {t('dm_issue_refund')}
                </button>
                
                <button 
                  disabled={actionLoading || selectedDispute.status.startsWith('RESOLVED')}
                  onClick={() => handleResolve('ESCALATED_LEGAL')}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Gavel size={16} />
                  {t('dm_escalate_legal')}
                </button>
              </div>
            </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
              Select a dispute to view details
            </div>
          )}

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
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <p className="text-xs text-slate-500 mt-2">Maximum allowed: ETB {selectedDispute?.amountDisputed}</p>
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
                disabled={actionLoading}
                onClick={() => handleResolve('RESOLVED_REFUNDED', Number(selectedDispute?.amountDisputed) - refundAmount)}
                className="px-4 py-2 font-bold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : t('dm_modal_deduct_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
