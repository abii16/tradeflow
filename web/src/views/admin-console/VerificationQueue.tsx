import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle, XCircle, Search, FileSignature, X, Image as ImageIcon, Eye } from 'lucide-react';
import { getAllVerifications, reviewVerification } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function VerificationQueue() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadVerifications = async () => {
    try {
      const response = await getAllVerifications();
      setRequests(response.data || []);
    } catch (err) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const handleReview = async (id: string, status: string, rejectionReason?: string) => {
    setActionLoading(true);
    try {
      await reviewVerification(id, { status, rejectionReason });
      toast.success(`Verification ${status.toLowerCase()} successfully`);
      setSelectedRequest(null);
      loadVerifications();
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const verifiedRequests = requests.filter(r => r.status === 'VERIFIED');
  const suspendedRequests = requests.filter(r => r.status === 'SUSPENDED');
  const mismatchRequests = requests.filter(r => r.status === 'REJECTED');

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return req.status === 'PENDING';
    if (activeTab === 'mismatch') return req.status === 'REJECTED';
    if (activeTab === 'verified') return req.status === 'VERIFIED';
    return true;
  });

  return (
    <div className="h-full flex flex-col space-y-6">

      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('vq_title')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('vq_desc')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-xs font-semibold text-slate-700">{pendingRequests.length} {t('vq_pending_metric')}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-emerald-800">{verifiedRequests.length} {t('vq_verified_metric')}</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-xs font-semibold text-rose-800">{suspendedRequests.length} {t('vq_suspended_metric')}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace (Table + Drawer) */}
      <div className="flex-1 flex gap-6 relative min-h-[500px]">

        {/* Left/Main Column: Table */}
        <div className={`flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col transition-all duration-300 p-6 ${selectedRequest ? 'lg:w-2/3' : 'w-full'}`}>

          <div className="pb-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 text-xs rounded-lg transition-colors ${activeTab === 'all' ? 'bg-slate-900 text-white font-medium shadow-sm' : 'text-slate-500 font-medium hover:text-slate-700'}`}>{t('vq_tab_all')} ({requests.length})</button>
              <button onClick={() => setActiveTab('pending')} className={`px-4 py-1.5 text-xs rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-slate-900 text-white font-medium shadow-sm' : 'text-slate-500 font-medium hover:text-slate-700'}`}>{t('vq_tab_pending').replace(/\s*\(\d+\)/, '')} ({pendingRequests.length})</button>
              <button onClick={() => setActiveTab('mismatch')} className={`px-4 py-1.5 text-xs rounded-lg transition-colors ${activeTab === 'mismatch' ? 'bg-slate-900 text-white font-medium shadow-sm' : 'text-slate-500 font-medium hover:text-slate-700'}`}>{t('vq_tab_mismatch').replace(/\s*\(\d+\)/, '')} ({mismatchRequests.length})</button>
              <button onClick={() => setActiveTab('verified')} className={`px-4 py-1.5 text-xs rounded-lg transition-colors ${activeTab === 'verified' ? 'bg-slate-900 text-white font-medium shadow-sm' : 'text-slate-500 font-medium hover:text-slate-700'}`}>{t('vq_tab_verified')} ({verifiedRequests.length})</button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder={t('vq_search')} className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 w-64 bg-slate-50 transition-colors" />
            </div>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-sm text-slate-600">
              {filteredRequests.length > 0 && (
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-6 py-3 rounded-tl-lg">{t('vq_col_app_id')}</th>
                    <th className="px-6 py-3">{t('vq_col_entity')}</th>
                    <th className="px-6 py-3">{t('vq_col_tin')}</th>
                    <th className="px-6 py-3">{t('vq_col_fleet')}</th>
                    <th className="px-6 py-3">{t('vq_col_insurance')}</th>
                    <th className="px-6 py-3 text-right rounded-tr-lg">{t('vq_col_action')}</th>
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                          <ShieldCheck size={32} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[15px] font-bold text-slate-900">
                            {t('vq_empty_title', { defaultValue: i18n.language === 'am' ? 'ሁሉም ግምገማዎች ተጠናቀዋል' : 'All Compliance Reviews Complete' })}
                          </p>
                          <p className="text-[13px] text-slate-500 max-w-[320px] mx-auto leading-relaxed">
                            {t('vq_empty_desc', { defaultValue: i18n.language === 'am' ? 'በአሁኑ ጊዜ የሚጠብቁ የ KYC ወይም የተሽከርካሪ ግምገማ ጥያቄዎች የሉም።' : 'There are currently no entity KYC or fleet roadworthiness applications waiting for verification.' })}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredRequests.map((req) => (
                  <tr key={req.id} className={`transition-colors hover:bg-slate-50 border-l-4 ${selectedRequest?.id === req.id ? 'bg-indigo-50/50 border-indigo-600 font-medium' : 'border-transparent'}`}>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{req.id.substring(0, 8)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{req.userFullName || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{req.taxId || 'N/A'}</td>
                    <td className="px-6 py-4">{req.tradeLicenseNumber || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {req.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <FileText size={12} className="text-amber-500" /> {t('vq_status_pending', 'Pending Review')}
                        </span>
                      )}
                      {req.status === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <CheckCircle size={12} className="text-emerald-500" /> {t('vq_status_verified', 'Verified')}
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <AlertTriangle size={12} className="text-rose-500" /> {t('vq_status_mismatch', 'Mismatch Flagged')}
                        </span>
                      )}
                      {req.status === 'SUSPENDED' && (
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <XCircle size={12} className="text-slate-500" /> {t('vq_status_suspended', 'Suspended')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' ? (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                        >
                          {t('vq_action_review', 'Review')}
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1 border border-slate-200"
                        >
                          {t('vq_action_view', 'View Details')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Slide-over Document Review Drawer */}
        {selectedRequest && (
          <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col animate-in slide-in-from-right-8 duration-300 relative">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 mb-1">{t('vq_app_title')} {selectedRequest.id.substring(0, 8)}</h3>
              <p className="text-xs text-slate-500">{t('vq_drawer_inspection')}</p>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-6">

              <div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">{t('vq_drawer_entity_details')}</h4>
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">{t('vq_drawer_legal_name')}</span>
                    <span className="text-slate-900 font-semibold font-mono">{selectedRequest.userFullName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">{t('vq_drawer_tin')}</span>
                    <span className="text-slate-900 font-semibold font-mono">{selectedRequest.taxId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">{t('vq_drawer_trade_license', 'Trade License')}</span>
                    <span className="text-slate-900 font-semibold font-mono">{selectedRequest.tradeLicenseNumber}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">{t('vq_drawer_docs')}</h4>
                <div className="space-y-3">

                  <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 hover:border-blue-400 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center group-hover:bg-blue-100">
                      <FileSignature size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{t('vq_drawer_trade_license')}</div>
                      <div className="text-[10px] text-slate-500">{t('vq_drawer_pdf_size')}</div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                      <Eye size={16} />
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 hover:border-blue-400 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded flex items-center justify-center group-hover:bg-slate-100">
                      <ImageIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{t('vq_drawer_inspection_cert')}</div>
                      <div className="text-[10px] text-slate-500">{t('vq_drawer_scanned_size')}</div>
                    </div>
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-md font-semibold">{t('vq_drawer_check_expiry')}</span>
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all ml-1">
                      <Eye size={16} />
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {selectedRequest.status === 'PENDING' ? (
              <div className="p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl flex gap-3">
                <button
                  disabled={actionLoading}
                  onClick={() => handleReview(selectedRequest.id, 'VERIFIED')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={16} /> {actionLoading ? 'Saving...' : t('vq_btn_approve')}
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleReview(selectedRequest.id, 'REJECTED', 'Documents failed review')}
                  className="flex-1 bg-white hover:bg-rose-50 text-rose-600 font-bold py-2.5 rounded-lg text-sm shadow-sm border border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={16} /> {t('vq_btn_reject')}
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => {
                    const reason = window.prompt(t('vq_prompt_suspend', "Enter optional reason for suspension:"), "Non-compliant KYC");
                    if (reason !== null) {
                      handleReview(selectedRequest.id, 'SUSPENDED', reason);
                    }
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <AlertTriangle size={16} /> {t('vq_btn_reject_suspend', 'Reject & Suspend')}
                </button>
              </div>
            ) : (
              <div className="p-6 pb-8 space-y-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex flex-col gap-3">
                 <div className="flex justify-between items-center w-full">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                     selectedRequest.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                     selectedRequest.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                     selectedRequest.status === 'SUSPENDED' ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                     'bg-slate-100 text-slate-700 border border-slate-200'
                   }`}>
                     ● {t('vq_status_label', 'Status')}: {selectedRequest.status === 'VERIFIED' ? t('vq_status_verified', 'Verified') : selectedRequest.status === 'REJECTED' ? t('vq_status_rejected', 'Rejected') : selectedRequest.status === 'SUSPENDED' ? t('vq_status_suspended', 'Suspended') : selectedRequest.status}
                   </span>
                   {selectedRequest.rejectionReason && (
                     <span className="text-xs text-rose-500 ml-2">{t('vq_reason_label', 'Reason')}: {selectedRequest.rejectionReason}</span>
                   )}
                 </div>
                 {selectedRequest.status === 'VERIFIED' && (
                   <button 
                     disabled={actionLoading}
                     onClick={() => {
                       const reason = window.prompt(t('vq_prompt_suspend', "Enter optional reason for suspension:"), "Non-compliant KYC");
                       if (reason !== null) {
                         handleReview(selectedRequest.id, 'SUSPENDED', reason);
                       }
                     }}
                     className="w-full bg-rose-600 hover:bg-rose-700 transition shadow-sm text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                   >
                     <AlertTriangle size={16} /> {t('vq_btn_suspend', 'Suspend Account')}
                   </button>
                 )}
                 {selectedRequest.status === 'SUSPENDED' && (
                   <button 
                     disabled={actionLoading}
                     onClick={() => handleReview(selectedRequest.id, 'VERIFIED')}
                     className="w-full bg-emerald-600 hover:bg-emerald-700 transition shadow-sm text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                   >
                     <CheckCircle size={16} /> {t('vq_btn_lift_suspension', 'Lift Suspension / Re-activate Account')}
                   </button>
                 )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
