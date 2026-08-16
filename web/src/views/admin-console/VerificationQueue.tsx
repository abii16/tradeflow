import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle, XCircle, Search, FileSignature, X, Image as ImageIcon } from 'lucide-react';

export default function VerificationQueue() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const requests = [
    {
      id: 'REQ-8492',
      entity: 'TransHorn Logistics',
      tin: 'TIN-ET-99421A',
      fleet: '14 Trucks',
      status: t('vq_status_roadworthy'),
      statusType: 'success',
      type: 'pending'
    },
    {
      id: 'REQ-8491',
      entity: 'BlueNile Freighters',
      tin: 'LIC-DJ-44219B',
      fleet: '8 Trucks',
      status: t('vq_status_mismatch'),
      statusType: 'error',
      type: 'mismatch'
    },
    {
      id: 'REQ-8490',
      entity: 'Afar Transport Co.',
      tin: 'TIN-ET-11093C',
      fleet: '22 Trucks',
      status: t('vq_status_pending_doc'),
      statusType: 'warning',
      type: 'pending'
    }
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('vq_title')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('vq_desc')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-xs font-semibold text-slate-700">12 {t('vq_pending_metric')}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-emerald-800">48 {t('vq_verified_metric')}</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-xs font-semibold text-rose-800">2 {t('vq_suspended_metric')}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace (Table + Drawer) */}
      <div className="flex-1 flex gap-6 relative min-h-[500px]">
        
        {/* Left/Main Column: Table */}
        <div className={`flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all duration-300 ${selectedRequest ? 'lg:w-2/3' : 'w-full'}`}>
          
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('vq_tab_all')}</button>
              <button onClick={() => setActiveTab('pending')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('vq_tab_pending')}</button>
              <button onClick={() => setActiveTab('mismatch')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'mismatch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('vq_tab_mismatch')}</button>
              <button onClick={() => setActiveTab('verified')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'verified' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('vq_tab_verified')}</button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder={t('vq_search')} className="pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-6 py-3">{t('vq_col_app_id')}</th>
                  <th className="px-6 py-3">{t('vq_col_entity')}</th>
                  <th className="px-6 py-3">{t('vq_col_tin')}</th>
                  <th className="px-6 py-3">{t('vq_col_fleet')}</th>
                  <th className="px-6 py-3">{t('vq_col_insurance')}</th>
                  <th className="px-6 py-3 text-right">{t('vq_col_action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className={`transition-colors hover:bg-slate-50 ${selectedRequest === req.id ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{req.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{req.entity}</td>
                    <td className="px-6 py-4 font-mono text-xs">{req.tin}</td>
                    <td className="px-6 py-4">{req.fleet}</td>
                    <td className="px-6 py-4">
                      {req.statusType === 'success' && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <CheckCircle size={12} className="text-emerald-500" /> {req.status}
                        </span>
                      )}
                      {req.statusType === 'error' && (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <AlertTriangle size={12} className="text-rose-500" /> {req.status}
                        </span>
                      )}
                      {req.statusType === 'warning' && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <FileText size={12} className="text-amber-500" /> {req.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.statusType === 'error' ? (
                        <button 
                          onClick={() => setSelectedRequest(req.id)}
                          className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                        >
                          {t('vq_action_escalate')}
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedRequest(req.id)}
                          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                        >
                          {t('vq_action_review')}
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
              <h3 className="font-bold text-slate-900 mb-1">{t('vq_app_title')} {selectedRequest}</h3>
              <p className="text-xs text-slate-500">{t('vq_drawer_inspection')}</p>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-6">
              
              <div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">{t('vq_drawer_entity_details')}</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('vq_drawer_legal_name')}</span>
                    <span className="font-semibold text-slate-900">TransHorn Logistics</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('vq_drawer_tin')}</span>
                    <span className="font-mono font-semibold text-slate-900">TIN-ET-99421A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('vq_drawer_fleet')}</span>
                    <span className="font-semibold text-slate-900">14 Heavy Trucks</span>
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
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 hover:border-blue-400 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded flex items-center justify-center group-hover:bg-slate-100">
                      <ImageIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{t('vq_drawer_inspection_cert')}</div>
                      <div className="text-[10px] text-slate-500">{t('vq_drawer_scanned_size')}</div>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">{t('vq_drawer_check_expiry')}</span>
                  </div>

                </div>
              </div>

            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl flex gap-3">
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-2">
                <CheckCircle size={16} /> {t('vq_btn_approve')}
              </button>
              <button className="flex-1 bg-white hover:bg-rose-50 text-rose-600 font-bold py-2.5 rounded-lg text-sm shadow-sm border border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center gap-2">
                <XCircle size={16} /> {t('vq_btn_reject')}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
