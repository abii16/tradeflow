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
        resolutionAction: status,
        finalEscrowPayout,
        notes: resolutionNotes
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
      <div className="bg-[#232323] p-5 rounded-xl border border-[#2E2E2E] shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#EDEDED] flex items-center gap-2">
            <Scale size={20} className="text-indigo-400" /> 
            {t('dm_title')}
          </h2>
          <p className="text-xs text-[#8F8F8F] mt-1">{t('dm_desc')}</p>
        </div>
        <div className="bg-indigo-500/10 text-indigo-400 font-bold px-4 py-2 rounded-lg text-sm border border-indigo-500/20 flex items-center gap-2">
          <AlertCircle size={16} /> {disputes.filter(d => d.status === 'OPEN').length} {t('dm_active_disputes')}
        </div>
      </div>

      {/* Main Workspace (Inbox / Chat style) */}
      <div className="flex-1 flex gap-6 min-h-[600px]">
        
        {/* Left Column: Inbox List */}
        <div className="w-1/3 bg-[#232323] rounded-xl border border-[#2E2E2E] shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2E2E2E] bg-[#181818]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" size={14} />
              <input type="text" placeholder={t('dm_search')} className="w-full pl-9 pr-4 py-2 text-xs border border-[#2E2E2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            
            {loading && <div className="p-4 text-center text-[#8F8F8F] text-sm">Loading...</div>}
            
            {disputes.map((d) => (
              <div 
                key={d.id}
                onClick={() => setSelectedDispute(d)}
                className={`p-4 border-b border-[#2E2E2E] cursor-pointer transition-colors ${selectedDispute?.id === d.id ? 'bg-[#1C1C1C] border-l-2 border-[#3ECF8E] shadow-sm' : 'hover:bg-[#181818] border-l-2 border-transparent'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${selectedDispute?.id === d.id ? 'bg-[#3ECF8E]/10 text-[#3ECF8E]' : 'bg-[#181818] border border-[#2E2E2E] text-[#EDEDED]'}`}>INC-{d.id.substring(0,8).toUpperCase()}</span>
                  {d.status === 'OPEN' && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{t('dm_status_open')}</span>}
                  {d.status === 'UNDER_REVIEW' && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{t('dm_status_review')}</span>}
                  {d.status.startsWith('RESOLVED') && <span className="bg-[#181818] border border-[#2E2E2E] text-[#8F8F8F] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{t('dm_status_resolved')}</span>}
                  {d.status === 'ESCALATED_LEGAL' && <span className="bg-rose-500/20 text-rose-500 border border-rose-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">ESCALATED</span>}
                </div>
                <h4 className="font-semibold text-[#EDEDED] text-sm mb-1">{d.shipperName || 'Shipper'} <span className="text-[#8F8F8F] text-[10px] mx-1">{t('dm_vs')}</span> {d.transporterName || 'Transporter'}</h4>
                <p className="text-[11px] text-[#8F8F8F] line-clamp-1">{d.reason}</p>
                <div className="text-[10px] text-[#8F8F8F] mt-3 font-mono">{new Date(d.createdAt).toLocaleString()}</div>
              </div>
            ))}
            
            {disputes.length === 0 && !loading && (
              <div className="p-4 text-center text-[#8F8F8F] text-sm">No disputes found.</div>
            )}

          </div>
        </div>

        {/* Right Column: Ticket Details & Resolution */}
        <div className="w-2/3 flex flex-col space-y-6">
          
          {selectedDispute ? (
            <>
              {/* Ticket Header Card */}
              <div className="bg-[#232323] rounded-xl border border-[#2E2E2E] shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#EDEDED] mb-2 flex items-center gap-3">
                      {t('dm_claim')} <span className="font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded-lg border border-[#3ECF8E]/20 text-lg">INC-{selectedDispute.id.substring(0,8).toUpperCase()}</span>
                      <span className="text-[10px] font-mono bg-[#181818] text-[#8F8F8F] border border-[#2E2E2E] px-2 py-1 rounded-md">
                        JOB-{selectedDispute.jobId?.substring(0,8).toUpperCase() || 'UNKNOWN'}
                      </span>
                    </h3>
                    <div className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                      <span className="text-[#8F8F8F] text-xs font-normal">Importer:</span> {selectedDispute.shipperName || 'Shipper'} 
                      <span className="text-[#8F8F8F] mx-2 text-xs font-normal">{t('dm_vs')}</span> 
                      <span className="text-[#8F8F8F] text-xs font-normal">Carrier:</span> {selectedDispute.transporterName || 'Transporter'}
                    </div>
                  </div>
                  <div className="bg-[#181818] border border-[#2E2E2E] p-3.5 rounded-lg text-right shadow-sm">
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-end">
                      <Lock size={12} className="text-amber-500" /> {t('dm_escrow_multi_sig')}
                    </div>
                    <div className="text-lg font-mono font-bold text-[#EDEDED]">ETB {Number(selectedDispute.amountDisputed).toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-[#181818] border border-rose-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-rose-400 text-sm mb-1">{selectedDispute.reason}</h4>
                    <p className="text-xs text-[#EDEDED]/80 leading-relaxed">{selectedDispute.description || 'The parties have entered mediation regarding the escrow balance for this job. Cargo arrived damaged or delayed.'}</p>
                  </div>
                </div>
              </div>

          {/* Evidence Thread */}
          <div className="bg-[#232323] rounded-xl border border-[#2E2E2E] shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#2E2E2E] bg-[#181818]">
              <h4 className="font-bold text-[#EDEDED] text-sm">{t('dm_evidence_thread')}</h4>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#181818]/50">
              
              {/* Message 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#232323] to-[#2E2E2E] border border-[#2E2E2E] text-[#EDEDED] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">SH</div>
                <div className="flex-1 bg-[#232323] border border-[#2E2E2E] rounded-xl rounded-tl-none p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-[#EDEDED]">{selectedDispute.shipperName || 'Shipper'} <span className="text-xs text-[#8F8F8F] font-normal">({t('dm_importer_label')})</span></span>
                    <span className="text-[10px] font-mono text-[#8F8F8F]">{new Date(selectedDispute.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-[#EDEDED]/90 mb-3">Initiated dispute claim on the platform.</p>
                </div>
              </div>

              {/* Message 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3ECF8E]/20 to-[#3ECF8E]/5 border border-[#3ECF8E]/30 text-[#3ECF8E] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">TR</div>
                <div className="flex-1 bg-[#232323] border border-[#2E2E2E] rounded-xl rounded-tl-none p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-[#EDEDED]">{selectedDispute.transporterName || 'Transporter'} <span className="text-xs text-[#8F8F8F] font-normal">({t('dm_carrier_label')})</span></span>
                    <span className="text-[10px] font-mono text-[#8F8F8F]">{new Date(selectedDispute.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-[#EDEDED]/90 mb-3">Carrier dispute evidence logged automatically via platform.</p>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button className="border border-[#2E2E2E] rounded-lg px-3 py-2 flex items-center gap-2 bg-[#181818] text-xs text-[#EDEDED] w-fit hover:bg-[#232323] hover:border-[#8F8F8F] transition-colors cursor-pointer group shadow-sm">
                      <ShieldCheck size={14} className="text-[#3ECF8E]" />
                      <span className="font-mono text-[#8F8F8F] group-hover:text-[#EDEDED] transition-colors">telemetry_log.pdf</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#3ECF8E] font-bold ml-1">({t('dm_attachment_verified')})</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action / Resolution Panel */}
          <div className="bg-[#232323] border border-[#2E2E2E]/80 rounded-2xl shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2">
              <Gavel size={16} className="text-[#EDEDED]" /> {t('dm_resolution_title')}
            </h4>
            
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8F8F8F]">{t('dm_resolution_note')}</label>
                <textarea 
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl p-3.5 text-xs text-[#EDEDED] placeholder:text-[#8F8F8F] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-colors resize-none" 
                  rows={3}
                  placeholder={t('dm_resolution_note_placeholder')}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <button 
                  disabled={actionLoading || selectedDispute.status.startsWith('RESOLVED')}
                  onClick={() => handleResolve('RESOLVED_FULL_PAYOUT', Number(selectedDispute.amountDisputed))}
                  className="bg-[#1C1C1C] hover:bg-black text-[#EDEDED] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
                >
                  <Unlock size={16} />
                  {t('dm_release_100')}
                </button>
                
                <button 
                  disabled={actionLoading || selectedDispute.status.startsWith('RESOLVED')}
                  onClick={() => setIsRefundModalOpen(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Scale size={16} />
                  {t('dm_issue_refund')}
                </button>
                
                <button 
                  disabled={actionLoading || selectedDispute.status.startsWith('RESOLVED')}
                  onClick={() => handleResolve('ESCALATED_LEGAL')}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Gavel size={16} />
                  {t('dm_escalate_legal')}
                </button>
              </div>
            </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#181818] border border-[#2E2E2E] rounded-xl text-[#8F8F8F]">
              Select a dispute to view details
            </div>
          )}

        </div>

      </div>

      {/* Partial Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1C]/60 backdrop-blur-sm">
          <div className="bg-[#232323] rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#2E2E2E] flex justify-between items-center bg-[#181818]">
              <h3 className="font-bold text-[#EDEDED]">{t('dm_modal_refund_title')}</h3>
              <button onClick={() => setIsRefundModalOpen(false)} className="text-[#8F8F8F] hover:text-[#8F8F8F]">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#EDEDED] mb-2">{t('dm_modal_refund_amount')}</label>
                <input 
                  type="number" 
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full border border-[#2E2E2E] rounded-lg px-4 py-2 text-lg font-mono font-bold text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <p className="text-xs text-[#8F8F8F] mt-2">Maximum allowed: ETB {selectedDispute?.amountDisputed}</p>
              </div>
            </div>
            <div className="p-5 border-t border-[#2E2E2E] bg-[#181818] flex gap-3 justify-end">
              <button 
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 font-semibold text-[#8F8F8F] hover:bg-[#2E2E2E] bg-[#232323] rounded-lg transition-colors text-sm"
              >
                {t('dm_modal_cancel')}
              </button>
              <button 
                disabled={actionLoading}
                onClick={() => handleResolve('RESOLVED_REFUNDED', Number(selectedDispute?.amountDisputed) - refundAmount)}
                className="px-4 py-2 font-bold text-[#EDEDED] bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50"
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
