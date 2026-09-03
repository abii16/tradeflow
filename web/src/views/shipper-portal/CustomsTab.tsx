import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, CheckCircle2, Clock, X, ShieldCheck, FileText, Download, Fingerprint } from 'lucide-react';
import { getCustomsDocuments, uploadCustomsDocument, getShipperActiveShipment } from '@/lib/apiClient';

export default function CustomsTab() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState<{invoice: File | null, packingList: File | null, billOfLading: File | null, certificateOfOrigin: File | null}>({ invoice: null, packingList: null, billOfLading: null, certificateOfOrigin: null });
  const [hashes, setHashes] = useState<{invoice: string | null, packingList: string | null, billOfLading: string | null, certificateOfOrigin: string | null}>({ invoice: null, packingList: null, billOfLading: null, certificateOfOrigin: null });
  
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [loadId, setLoadId] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const activeShipmentRes = await getShipperActiveShipment();
      const currentShipmentId = activeShipmentRes?.shipment?.id;
      const currentLoadId = activeShipmentRes?.shipment?.loadId;
      
      if (currentShipmentId && currentLoadId) {
        setShipmentId(currentShipmentId);
        setLoadId(currentLoadId);
        const data = await getCustomsDocuments(currentLoadId);
        setDocuments(data.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const computeSHA256 = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleUploadClick = () => {
    setIsModalOpen(true);
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.invoice || !files.packingList || !files.billOfLading || !files.certificateOfOrigin) return;
    if (!loadId) return alert('No active shipment found.');
    
    try {
      const invoiceHash = await computeSHA256(files.invoice);
      const packingListHash = await computeSHA256(files.packingList);
      const blHash = await computeSHA256(files.billOfLading);
      const cooHash = await computeSHA256(files.certificateOfOrigin);
      
      const formData = new FormData();
      formData.append('invoice', files.invoice);
      formData.append('packing_list', files.packingList);
      formData.append('bill_of_lading', files.billOfLading);
      formData.append('certificate_of_origin', files.certificateOfOrigin);
      formData.append('loadId', loadId);
      
      await uploadCustomsDocument(formData);
      
      setHashes({ invoice: invoiceHash, packingList: packingListHash, billOfLading: blHash, certificateOfOrigin: cooHash });
      alert('Documents uploaded successfully!');
      setIsModalOpen(false);
      fetchDocs();
    } catch (err) {
      console.error(err);
      alert('Failed to upload document');
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('customs_vault')}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={12} /> ERCA Synced
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Fingerprint size={12} /> 256-bit AES Encryption
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleUploadClick}
          className="group relative flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <UploadCloud size={18} className="relative z-10 group-hover:-translate-y-0.5 transition-transform" /> 
          <span className="relative z-10">Secure Upload</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Active Shipment Dossier
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ID: <span className="font-mono font-bold bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-700 ml-1">{shipmentId ? shipmentId.substring(0, 8).toUpperCase() : 'AWAITING'}</span>
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4">Document Type</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4">Attached File</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 && !loading && (
              <TableRow><TableCell colSpan={4} className="text-center text-xs text-slate-500 py-4">No documents found. Click upload.</TableCell></TableRow>
            )}
            {documents.map((doc, idx) => {
              const renderStatus = () => {
                switch (doc.status) {
                  case 'CLEARED':
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-emerald-50 text-emerald-700 border-emerald-100">
                        <CheckCircle2 size={11} /> Cleared
                      </span>
                    );
                  case 'REJECTED':
                    return (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-red-50 text-red-700 border-red-100">
                          <X size={11} /> Rejected
                        </span>
                        {doc.rejectionReason && (
                          <span className="text-[10px] text-red-600 max-w-[150px] leading-tight" title={doc.rejectionReason}>
                            {doc.rejectionReason}
                          </span>
                        )}
                      </div>
                    );
                  case 'UNDER_REVIEW':
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-blue-50 text-blue-700 border-blue-100">
                        <Clock size={11} /> Under Review
                      </span>
                    );
                  case 'SUBMITTED':
                  default:
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-amber-50 text-amber-700 border-amber-100">
                        <Clock size={11} /> Submitted
                      </span>
                    );
                }
              };

              return (
              <React.Fragment key={idx}>
                {/* Invoice Row */}
                <TableRow className="border-slate-100 hover:bg-indigo-50/40 transition-colors group">
                  <TableCell className="font-semibold text-sm text-slate-900 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors border border-indigo-100/50">
                        <FileText size={16} className="text-indigo-600" />
                      </div>
                      Commercial Invoice
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStatus()}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-slate-600 truncate max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${doc.invoiceUrl ? 'bg-indigo-400' : 'bg-slate-300'}`}></div>
                      {doc.invoiceUrl ? doc.invoiceUrl.split('/').pop() : 'Pending'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button type="button" className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded transition-colors">
                      View
                    </button>
                  </TableCell>
                </TableRow>
                {/* Packing List Row */}
                <TableRow className="border-slate-100 hover:bg-indigo-50/40 transition-colors group">
                  <TableCell className="font-semibold text-sm text-slate-900 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors border border-indigo-100/50">
                        <FileText size={16} className="text-indigo-600" />
                      </div>
                      Packing List
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStatus()}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-slate-600 truncate max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${doc.packingListUrl ? 'bg-indigo-400' : 'bg-slate-300'}`}></div>
                      {doc.packingListUrl ? doc.packingListUrl.split('/').pop() : 'Pending'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button type="button" className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded transition-colors">
                      View
                    </button>
                  </TableCell>
                </TableRow>
                {/* Bill of Lading Row */}
                <TableRow className="border-slate-100 hover:bg-indigo-50/40 transition-colors group">
                  <TableCell className="font-semibold text-sm text-slate-900 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors border border-indigo-100/50">
                        <FileText size={16} className="text-indigo-600" />
                      </div>
                      Bill of Lading
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStatus()}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-slate-600 truncate max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${doc.billOfLadingUrl ? 'bg-indigo-400' : 'bg-slate-300'}`}></div>
                      {doc.billOfLadingUrl ? doc.billOfLadingUrl.split('/').pop() : 'Pending'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button type="button" className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded transition-colors">
                      View
                    </button>
                  </TableCell>
                </TableRow>
                {/* Certificate of Origin Row */}
                <TableRow className="border-slate-100 hover:bg-indigo-50/40 transition-colors group">
                  <TableCell className="font-semibold text-sm text-slate-900 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors border border-indigo-100/50">
                        <FileText size={16} className="text-indigo-600" />
                      </div>
                      Certificate of Origin
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStatus()}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-slate-600 truncate max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${doc.certificateOfOriginUrl ? 'bg-indigo-400' : 'bg-slate-300'}`}></div>
                      {doc.certificateOfOriginUrl ? doc.certificateOfOriginUrl.split('/').pop() : 'Pending'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button type="button" className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded transition-colors">
                      View
                    </button>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Upload Customs Documents</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitUpload} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Commercial Invoice (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={e => setFiles({ ...files, invoice: e.target.files?.[0] || null })}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Packing List (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={e => setFiles({ ...files, packingList: e.target.files?.[0] || null })}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bill of Lading (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={e => setFiles({ ...files, billOfLading: e.target.files?.[0] || null })}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Certificate of Origin (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={e => setFiles({ ...files, certificateOfOrigin: e.target.files?.[0] || null })}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!files.invoice || !files.packingList || !files.billOfLading || !files.certificateOfOrigin}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  Upload & Generate SHA-256 Hash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
