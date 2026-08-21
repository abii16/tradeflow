import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Download, Search, Filter, Calendar } from 'lucide-react';
import { fetchAuditLogs, exportAuditLogs } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetchAuditLogs(actionFilter ? { actionType: actionFilter } : undefined);
      setLogs(response.logs || []);
    } catch (err) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [actionFilter]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') setExportingCSV(true);
    if (format === 'pdf') setExportingPDF(true);
    
    try {
      await exportAuditLogs(format);
      toast.success(`${format.toUpperCase()} export generated`);
    } catch (err) {
      toast.error('Failed to export logs');
    } finally {
      if (format === 'csv') setExportingCSV(false);
      if (format === 'pdf') setExportingPDF(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database size={20} className="text-blue-600" /> 
            {t('al_title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('al_desc')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExport('csv')}
            disabled={exportingCSV}
            className="bg-white text-slate-700 hover:text-slate-900 font-semibold py-2 px-4 border border-slate-200 hover:border-slate-300 rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> {exportingCSV ? 'Exporting...' : t('al_export_csv')}
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            disabled={exportingPDF}
            className="bg-[#0F172A] hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> {exportingPDF ? 'Exporting...' : t('al_export_pdf')}
          </button>
        </div>
      </div>

      {/* Main Workspace (Data Grid) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[500px]">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center">
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder={t('al_search')} className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder={t('al_date_today')} readOnly className="w-32 pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white cursor-pointer" />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select 
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-40 pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white appearance-none cursor-pointer"
              >
                <option value="">{t('al_filter_all')}</option>
                <option value="AUTH">AUTH</option>
                <option value="ESCROW_MUTATION">ESCROW_MUTATION</option>
                <option value="PRICING_ENGINE">PRICING_ENGINE</option>
                <option value="DISPUTE_RAISED">DISPUTE</option>
              </select>
            </div>
          </div>

        </div>

        {/* Dense Data Grid */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[10px] font-bold text-slate-500 bg-slate-100 uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-3">{t('al_col_time')}</th>
                <th className="px-6 py-3">{t('al_col_action')}</th>
                <th className="px-6 py-3">{t('al_col_actor')}</th>
                <th className="px-6 py-3">{t('al_col_event')}</th>
                <th className="px-6 py-3">{t('al_col_ip')}</th>
                <th className="px-6 py-3 text-right">{t('al_col_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-sans">
                    Loading logs...
                  </td>
                </tr>
              )}
              
              {!loading && logs.map((log, index) => (
                <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3 text-slate-400">[{new Date(log.timestamp).toLocaleString()}]</td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-slate-700">{log.action}</span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-800">{log.actorId}</td>
                  <td className="px-6 py-3 text-slate-600 max-w-md truncate" title={log.message || log.details}>
                    {log.message || log.details || '-'}
                  </td>
                  <td className="px-6 py-3 text-slate-400">{log.ipAddress || '10.0.4.12'}</td>
                  <td className="px-6 py-3 text-right">
                    {log.status === 'SUCCESS' && <span className="text-emerald-600 font-bold">{t('al_status_success')}</span>}
                    {log.status === 'WARNING' && <span className="text-amber-600 font-bold">{t('al_status_warning')}</span>}
                    {log.status === 'FAILED' && <span className="text-rose-600 font-bold">{t('al_status_failed')}</span>}
                  </td>
                </tr>
              ))}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-sans">
                    No logs found.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
