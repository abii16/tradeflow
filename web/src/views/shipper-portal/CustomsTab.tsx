import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, CheckCircle2, Clock, X, ShieldCheck, FileText, Fingerprint, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { getCustomsDocuments, uploadCustomsDocument, getShipperActiveShipment, getShipperLoads } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function CustomsTab() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [files, setFiles] = useState<{
    invoice: File | null;
    packingList: File | null;
    billOfLading: File | null;
    certificateOfOrigin: File | null;
  }>({
    invoice: null,
    packingList: null,
    billOfLading: null,
    certificateOfOrigin: null,
  });

  const [hashes, setHashes] = useState<{
    invoice: string | null;
    packingList: string | null;
    billOfLading: string | null;
    certificateOfOrigin: string | null;
  }>({
    invoice: null,
    packingList: null,
    billOfLading: null,
    certificateOfOrigin: null,
  });
  
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [loadId, setLoadId] = useState<string | null>(null);
  const [loadsList, setLoadsList] = useState<any[]>([]);

  const fetchDocs = async (targetLoadId?: string) => {
    try {
      setLoading(true);
      const activeShipmentRes = await getShipperActiveShipment();
      const currentShipmentId = activeShipmentRes?.shipment?.id;
      const currentLoadId = targetLoadId || activeShipmentRes?.shipment?.loadId;
      
      const loadsRes = await getShipperLoads();
      const userLoads = loadsRes?.loads || [];
      setLoadsList(userLoads);

      const effectiveLoadId = currentLoadId || (userLoads.length > 0 ? userLoads[0].id : null);

      if (currentShipmentId) setShipmentId(currentShipmentId);
      if (effectiveLoadId) {
        setLoadId(effectiveLoadId);
        const data = await getCustomsDocuments(effectiveLoadId);
        setDocuments(data.documents || []);
      } else {
        const data = await getCustomsDocuments('my-documents');
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching customs docs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const computeSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileChange = async (type: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    if (file) {
      try {
        const hash = await computeSHA256(file);
        setHashes(prev => ({ ...prev, [type]: hash }));
      } catch (e) {
        console.error(`Failed to calculate SHA-256 for ${type}`, e);
      }
    } else {
      setHashes(prev => ({ ...prev, [type]: null }));
    }
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.invoice || !files.packingList || !files.billOfLading || !files.certificateOfOrigin) {
      toast.error('All 4 regulatory documents are required per ERCA customs clearance compliance.');
      return;
    }
    if (!loadId) {
      toast.error('No active shipment or load found. Please create a load first before submitting customs declarations.');
      return;
    }
    
    try {
      setUploading(true);
      const invoiceHash = hashes.invoice || await computeSHA256(files.invoice);
      const packingListHash = hashes.packingList || await computeSHA256(files.packingList);
      const blHash = hashes.billOfLading || await computeSHA256(files.billOfLading);
      const cooHash = hashes.certificateOfOrigin || await computeSHA256(files.certificateOfOrigin);
      
      const formData = new FormData();
      formData.append('invoice', files.invoice);
      formData.append('packing_list', files.packingList);
      formData.append('bill_of_lading', files.billOfLading);
      formData.append('certificate_of_origin', files.certificateOfOrigin);
      formData.append('loadId', loadId);
      formData.append('invoice_sha256', invoiceHash);
      formData.append('packing_list_sha256', packingListHash);
      formData.append('bill_of_lading_sha256', blHash);
      formData.append('certificate_of_origin_sha256', cooHash);
      
      await uploadCustomsDocument(formData);
      
      toast.success('Customs Dossier uploaded & cryptographic SHA-256 hashes registered with ERCA!');
      setIsModalOpen(false);
      setFiles({ invoice: null, packingList: null, billOfLading: null, certificateOfOrigin: null });
      fetchDocs(loadId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Failed to process customs dossier');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#2E2E2E] gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEDED] tracking-tight flex items-center gap-2.5">
            <Fingerprint size={24} className="text-[#3ECF8E]" />
            {t('customs_vault', 'Customs e-Vault & Declarations')}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2.5 py-0.5 rounded-full border border-[#3ECF8E]/20">
              <CheckCircle2 size={12} /> ERCA Synced (Single Window)
            </span>
            <span className="text-xs text-[#8F8F8F] font-mono flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-[#3ECF8E]" /> SHA-256 Tamper-Proof Cryptographic Hashing
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDocs(loadId || undefined)}
            disabled={loading}
            className="p-2 bg-[#232323] hover:bg-[#2A2A2A] text-[#8F8F8F] hover:text-[#EDEDED] border border-[#2E2E2E] rounded-lg transition-colors"
            title="Refresh Dossier"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#3ECF8E] text-[#1C1C1C] hover:bg-[#34b27b] font-bold px-4 py-2 rounded-lg text-xs shadow-md hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] transition-all hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <UploadCloud size={16} /> 
            <span>Upload Regulatory Manifest</span>
          </button>
        </div>
      </div>

      {/* Main Dossier Card */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-lg shadow-black/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2E2E2E] bg-[#1C1C1C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2">
              <FileText size={16} className="text-[#3ECF8E]" />
              Active Consignment Regulatory Dossier
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#8F8F8F]">
              <span>Shipment Reference:</span>
              <span className="font-mono font-bold bg-[#232323] border border-[#2E2E2E] px-2 py-0.5 rounded text-[#EDEDED]">
                {shipmentId ? `SHP-${shipmentId.substring(0, 8).toUpperCase()}-DJM` : 'Consignment Direct'}
              </span>
            </div>
          </div>

          {loadsList.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8F8F8F] font-medium">Select Load:</span>
              <select
                value={loadId || ''}
                onChange={(e) => {
                  setLoadId(e.target.value);
                  fetchDocs(e.target.value);
                }}
                className="bg-[#232323] border border-[#2E2E2E] text-xs text-[#EDEDED] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#3ECF8E] font-medium cursor-pointer"
              >
                {loadsList.map(l => (
                  <option key={l.id} value={l.id}>
                    TF-LOAD-{l.id.substring(0, 4).toUpperCase()} ({l.title || l.cargoType})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Table>
          <TableHeader className="bg-[#1C1C1C]/80">
            <TableRow className="border-[#2E2E2E] hover:bg-transparent">
              <TableHead className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider py-3 px-5">Document Type</TableHead>
              <TableHead className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider py-3 px-5">ERCA Status</TableHead>
              <TableHead className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider py-3 px-5">Attached File</TableHead>
              <TableHead className="text-xs font-bold text-[#8F8F8F] uppercase tracking-wider py-3 px-5 text-right">Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#2E2E2E]">
            {loading && documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-[#8F8F8F] py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-[#3ECF8E]" />
                    <span>Verifying cryptographic customs seals with ERCA Single Window...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-[#8F8F8F] py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Fingerprint size={28} className="text-[#8F8F8F]" />
                    <span className="font-semibold text-[#EDEDED]">No Customs Dossier Submitted Yet</span>
                    <p className="text-[11px] max-w-sm">Upload your 4 mandatory ERCA documents (Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin) to initiate automated customs clearance.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc, idx) => {
                const renderStatus = () => {
                  switch (doc.status) {
                    case 'CLEARED':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/20">
                          <CheckCircle2 size={12} /> Cleared (Green Channel)
                        </span>
                      );
                    case 'REJECTED':
                      return (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/20 w-fit">
                            <X size={12} /> Rejected (Requires Rectification)
                          </span>
                          {doc.rejectionReason && (
                            <span className="text-[11px] text-rose-400/90 leading-tight">
                              Reason: {doc.rejectionReason}
                            </span>
                          )}
                        </div>
                      );
                    case 'UNDER_REVIEW':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                          <Clock size={12} /> Under Customs Inspection
                        </span>
                      );
                    case 'SUBMITTED':
                    default:
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                          <Clock size={12} /> Submitted & Sealed
                        </span>
                      );
                  }
                };

                const docTypes = [
                  { name: 'Commercial Invoice', url: doc.invoiceUrl, key: 'inv' },
                  { name: 'Packing List', url: doc.packingListUrl, key: 'pkl' },
                  { name: 'Bill of Lading', url: doc.billOfLadingUrl, key: 'bol' },
                  { name: 'Certificate of Origin', url: doc.certificateOfOriginUrl, key: 'coo' },
                ];

                return (
                  <React.Fragment key={doc.id || idx}>
                    {docTypes.map((item) => (
                      <TableRow key={`${doc.id}-${item.key}`} className="border-[#2E2E2E] hover:bg-[#1C1C1C]/50 transition-colors">
                        <TableCell className="font-semibold text-xs text-[#EDEDED] py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1C1C1C] flex items-center justify-center border border-[#2E2E2E]">
                              <FileText size={15} className="text-[#3ECF8E]" />
                            </div>
                            <div>
                              <div className="font-bold text-[#EDEDED]">{item.name}</div>
                              <span className="text-[10px] text-[#8F8F8F] font-mono">ERCA Mandate SRS Sec 3.5</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-5">
                          {renderStatus()}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-medium text-[#8F8F8F] truncate max-w-[240px] py-3 px-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.url ? 'bg-[#3ECF8E]' : 'bg-amber-400'}`} />
                            <span className="truncate">{item.url ? item.url.split('/').pop() : 'Pending Upload'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3 px-5">
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#3ECF8E] hover:text-[#34b27b] bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 px-2.5 py-1 rounded transition-colors"
                            >
                              <span>Inspect Seal</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-xs text-[#8F8F8F]">Awaiting</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#2E2E2E] bg-[#1C1C1C]">
              <div>
                <h2 className="text-base font-bold text-[#EDEDED] flex items-center gap-2">
                  <UploadCloud size={18} className="text-[#3ECF8E]" />
                  Upload Customs Clearance Dossier
                </h2>
                <p className="text-[11px] text-[#8F8F8F] mt-0.5">Automated SHA-256 seal computation for ERCA Single Window</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED] p-1 rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitUpload} className="p-5 space-y-4">
              {/* Load assignment selector */}
              {loadsList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">
                    Assign to Freight Order
                  </label>
                  <select
                    value={loadId || ''}
                    onChange={(e) => setLoadId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] font-medium cursor-pointer"
                  >
                    {loadsList.map(l => (
                      <option key={l.id} value={l.id}>
                        TF-LOAD-{l.id.substring(0, 4).toUpperCase()} — {l.title || l.cargoType}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 4 Required Documents */}
              {[
                { label: 'Commercial Invoice (PDF)', key: 'invoice' as const },
                { label: 'Packing List (PDF)', key: 'packingList' as const },
                { label: 'Bill of Lading (PDF)', key: 'billOfLading' as const },
                { label: 'Certificate of Origin (PDF)', key: 'certificateOfOrigin' as const },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#EDEDED]">{label}</label>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    required
                    onChange={e => handleFileChange(key, e.target.files?.[0] || null)}
                    className="w-full text-xs text-[#8F8F8F] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#1C1C1C] file:text-[#3ECF8E] hover:file:bg-[#2A2A2A] cursor-pointer border border-[#2E2E2E] bg-[#181818] rounded-lg"
                  />
                  {hashes[key] && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#3ECF8E]">
                      <Fingerprint size={10} className="shrink-0" />
                      <span className="truncate">SHA-256: {hashes[key]}</span>
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-3 border-t border-[#2E2E2E] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#2E2E2E] bg-[#1C1C1C] text-[#8F8F8F] hover:text-[#EDEDED] rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !files.invoice || !files.packingList || !files.billOfLading || !files.certificateOfOrigin}
                  className="bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] font-bold px-5 py-2 rounded-lg transition-all text-xs shadow-md hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] disabled:opacity-50"
                >
                  {uploading ? 'Cryptographically Sealing & Uploading...' : 'Upload & Seal Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
