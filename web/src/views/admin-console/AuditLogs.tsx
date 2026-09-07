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
      
      if (format === 'csv') {
        // Generate CSV content from the current logs on screen
        const header = "Time,Action,Actor,Event,IP,Status\n";
        const rows = logs.map(l => {
          const time = new Date(l.createdAt || l.timestamp).toLocaleString().replace(/,/g, '');
          const action = l.action || '';
          const actor = l.actorEmail || l.actorId || '';
          const event = (l.message || (typeof l.details === 'object' ? JSON.stringify(l.details) : l.details) || '').replace(/,/g, ';');
          const ip = l.ipAddress || '';
          const status = (l.statusCode && l.statusCode < 400) ? 'SUCCESS' : (l.status || 'FAILED');
          return `${time},${action},${actor},${event},${ip},${status}`;
        });
        const csvContent = header + rows.join("\n");
        
        // Create a Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

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
      <div className="bg-[#232323] p-5 rounded-xl border border-[#2E2E2E] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#EDEDED] flex items-center gap-2">
            <Database size={20} className="text-[#3ECF8E]" /> 
            {t('al_title')}
          </h2>
          <p className="text-xs text-[#8F8F8F] mt-1">{t('al_desc')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExport('csv')}
            disabled={exportingCSV}
            className="bg-[#232323] text-[#EDEDED] hover:text-[#EDEDED] font-semibold py-2 px-4 border border-[#2E2E2E] hover:border-[#2E2E2E] rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> {exportingCSV ? 'Exporting...' : t('al_export_csv')}
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            disabled={exportingPDF}
            className="bg-[#0F172A] hover:bg-[#232323] text-[#EDEDED] font-semibold py-2 px-4 rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> {exportingPDF ? 'Exporting...' : t('al_export_pdf')}
          </button>
        </div>
      </div>

      {/* Main Workspace (Data Grid) */}
      <div className="bg-[#232323] rounded-xl border border-[#2E2E2E] shadow-sm flex-1 flex flex-col overflow-hidden min-h-[500px]">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-[#2E2E2E] bg-[#181818] flex flex-wrap gap-4 items-center">
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" size={14} />
            <input type="text" placeholder={t('al_search')} className="w-full pl-9 pr-4 py-2 text-xs border border-[#2E2E2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" size={14} />
              <input type="text" placeholder={t('al_date_today')} readOnly className="w-32 pl-9 pr-4 py-2 text-xs border border-[#2E2E2E] rounded-lg bg-[#232323] cursor-pointer" />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" size={14} />
              <select 
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-40 pl-9 pr-4 py-2 text-xs border border-[#2E2E2E] rounded-lg bg-[#232323] appearance-none cursor-pointer"
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
          <table className="w-full text-left text-sm text-[#8F8F8F]">
            <thead className="text-[10px] font-bold text-[#8F8F8F] bg-[#232323] uppercase border-b border-[#2E2E2E] tracking-wider">
              <tr>
                <th className="px-6 py-3">{t('al_col_time')}</th>
                <th className="px-6 py-3">{t('al_col_action')}</th>
                <th className="px-6 py-3">{t('al_col_actor')}</th>
                <th className="px-6 py-3">{t('al_col_event')}</th>
                <th className="px-6 py-3">{t('al_col_ip')}</th>
                <th className="px-6 py-3 text-right">{t('al_col_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E] text-xs font-mono">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#8F8F8F] font-sans">
                    Loading logs...
                  </td>
                </tr>
              )}
              
              {!loading && logs.map((log, index) => (
                <tr key={index} className="hover:bg-[#181818]/80 transition-colors">
                  <td className="px-6 py-3 text-[#8F8F8F]">[{new Date(log.createdAt || log.timestamp).toLocaleString()}]</td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-[#EDEDED]">{log.action}</span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-[#EDEDED]">{log.actorEmail || log.actorId}</td>
                  <td className="px-6 py-3 text-[#8F8F8F] max-w-md truncate" title={log.message || (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details)}>
                    {log.message || (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) || '-'}
                  </td>
                  <td className="px-6 py-3 text-[#8F8F8F]">{log.ipAddress || '10.0.4.12'}</td>
                  <td className="px-6 py-3 text-right">
                    {((log.statusCode && log.statusCode < 400) || log.status === 'SUCCESS') && <span className="text-emerald-600 font-bold">{t('al_status_success')}</span>}
                    {log.status === 'WARNING' && <span className="text-amber-600 font-bold">{t('al_status_warning')}</span>}
                    {((log.statusCode && log.statusCode >= 400) || log.status === 'FAILED') && <span className="text-rose-600 font-bold">{t('al_status_failed')}</span>}
                  </td>
                </tr>
              ))}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#8F8F8F] font-sans">
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
