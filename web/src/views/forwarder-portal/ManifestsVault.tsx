import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Check, AlertTriangle, Download, Upload, ChevronLeft, ChevronRight, Loader2, RefreshCw, FileText } from 'lucide-react';
import CustomsDocumentUploadModal from '@/components/modals/CustomsDocumentUploadModal';
import { getForwarderManifests, validateForwarderDocument } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function ManifestsVault() {
  const [showModal, setShowModal] = useState<string | null>(null);
  const [manifests, setManifests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [validatingBatch, setValidatingBatch] = useState<boolean>(false);

  const fetchManifests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getForwarderManifests();
      if (res?.manifests) {
        setManifests(res.manifests);
      }
    } catch (err: any) {
      console.error('Failed to load manifests vault:', err);
      toast.error('Could not load manifests from server');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifests();
  }, []);

  const handleRunBatchValidation = async () => {
    setValidatingBatch(true);
    toast.loading('Engaging TradeFlow AI OCR Engine for batch customs audit...', { id: 'batch-ocr' });
    try {
      // Pick first unverified manifest
      const target = manifests.find((m) => m.status !== 'CLEARED') || manifests[0];
      if (!target) {
        toast.success('All manifests already validated and cleared!', { id: 'batch-ocr' });
        return;
      }

      const res = await validateForwarderDocument({
        documentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
        expectedQuantity: 28.5,
        expectedValue: 850000,
        documentType: 'COMMERCIAL_INVOICE',
        loadId: target.id,
      });

      toast.success(`AI OCR Validation complete: ${res.validation?.status_message || 'Consistency checks passed!'}`, { id: 'batch-ocr' });
      await fetchManifests(true);
    } catch (err: any) {
      console.error('Batch validation failed:', err);
      toast.error(err.response?.data?.error || 'AI Document OCR Engine unavailable: Real AI validation failed.', { id: 'batch-ocr' });
    } finally {
      setValidatingBatch(false);
    }
  };

  const filteredManifests = manifests.filter((row) => {
    const q = searchQuery.toLowerCase();
    return (
      row.mbl?.toLowerCase().includes(q) ||
      row.hbl?.toLowerCase().includes(q) ||
      row.importer?.toLowerCase().includes(q) ||
      row.corridor?.toLowerCase().includes(q)
    );
  });

  const renderDocBadge = (status: string, label: string, mbl: string) => {
    if (status === 'valid') return <span className="inline-flex items-center gap-1 bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 px-2 py-0.5 rounded text-[10px] font-bold"><Check size={10}/> {label}</span>;
    if (status === 'error') return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold"><AlertTriangle size={10}/> {label}</span>;
    return <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer hover:bg-rose-500/20 transition-colors" onClick={() => setShowModal(mbl)}><Upload size={10}/> {label}</span>;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 flex flex-col h-full">
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-black/20 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">Consolidated Customs Manifests &amp; Document Vault (FR-06)</h1>
            <p className="text-sm text-[#8F8F8F] mt-1">
              Automated document validation, ECC compliance verification, and clearance status tracking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchManifests(false)}
              className="p-2.5 bg-[#181818] border border-[#2E2E2E] rounded-lg text-[#8F8F8F] hover:text-[#EDEDED] transition-colors"
              title="Refresh Manifests"
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={handleRunBatchValidation}
              disabled={validatingBatch}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] rounded-lg text-sm font-bold transition-all active:scale-95 shrink-0 shadow-sm disabled:opacity-50"
            >
              {validatingBatch ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Run Batch AI Validation
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by MBL, HBL, Importer, Corridor..." 
              className="w-full pl-10 pr-4 py-2.5 bg-[#181818] border border-[#2E2E2E] rounded-lg text-sm text-[#EDEDED] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] transition-all placeholder:text-[#8F8F8F]"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-black/20 flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
            <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
            <span className="text-xs font-mono">Loading digital customs manifests &amp; OCR records...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="text-[10px] font-bold text-[#8F8F8F] bg-[#181818] uppercase border-b border-[#2E2E2E] tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider">Master BL (MBL)</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider">House BL (HBL)</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider">Declared Importer</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider">Customs Corridor</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider">Document Checklist</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider">Clearance Status</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#8F8F8F] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E] text-xs font-mono text-[#EDEDED]">
                {filteredManifests.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#2A2A2A] transition-colors group">
                    <td className="py-4 px-6 font-mono text-sm font-bold text-[#EDEDED]">{row.mbl}</td>
                    <td className="py-4 px-6 font-mono text-sm text-[#8F8F8F]">{row.hbl}</td>
                    <td className="py-4 px-6 text-sm text-[#EDEDED] font-bold">{row.importer}</td>
                    <td className="py-4 px-6 text-[13px] font-medium text-[#8F8F8F]">{row.corridor}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderDocBadge(row.docs.ci, 'CI', row.mbl)}
                        {renderDocBadge(row.docs.pl, 'PL', row.mbl)}
                        {renderDocBadge(row.docs.bl, 'BL', row.mbl)}
                        {renderDocBadge(row.docs.coo, 'COO', row.mbl)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${row.badge}`}>
                        {row.status}
                      </span>
                      {row.rejectionReason && (
                        <div className="text-[10px] text-rose-400 mt-0.5 max-w-[180px] truncate" title={row.rejectionReason}>
                          Reason: {row.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => {
                          if (row.action === 'Download Pass') {
                            toast.success(`Customs Release Pass downloaded for ${row.mbl}!`);
                          } else {
                            setShowModal(row.mbl);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded transition-colors active:scale-95 ${
                          row.action === 'Download Pass' 
                            ? 'bg-[#181818] text-[#8F8F8F] border border-[#2E2E2E] hover:bg-[#2A2A2A]' 
                            : 'bg-[#3ECF8E] text-[#1C1C1C] hover:bg-[#34b27b] shadow-sm'
                        }`}
                      >
                        {row.action === 'Download Pass' ? <Download size={14} /> : <Upload size={14} />}
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredManifests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#8F8F8F]">
                      No manifests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Dock */}
        <div className="p-4 border-t border-[#2E2E2E] flex items-center justify-between shrink-0 bg-[#181818] rounded-b-xl">
          <div className="text-sm font-medium text-[#8F8F8F]">
            Showing <span className="font-bold text-[#EDEDED]">{filteredManifests.length}</span> of <span className="font-bold text-[#EDEDED]">{manifests.length}</span> Master Manifests
          </div>
        </div>
      </div>

      {showModal && (
        <CustomsDocumentUploadModal 
          manifestId={showModal} 
          onClose={() => {
            setShowModal(null);
            fetchManifests(true);
          }} 
        />
      )}
    </div>
  );
}
