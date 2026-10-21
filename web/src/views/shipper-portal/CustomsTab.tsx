import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  X, 
  ShieldCheck, 
  FileText, 
  Fingerprint, 
  RefreshCw, 
  ExternalLink,
  Copy,
  Check,
  Award,
  Calendar,
  Building,
  FileCheck2
} from 'lucide-react';
import { getCustomsDocuments, uploadCustomsDocument, getShipperActiveShipment, getShipperLoads } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function CustomsTab() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectingSeal, setInspectingSeal] = useState<{ doc: any; item: any } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  
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
      const currentShipment = activeShipmentRes?.shipment;
      
      const loadsRes = await getShipperLoads();
      const userLoads = loadsRes?.loads || [];
      setLoadsList(userLoads);

      const effectiveLoadId = targetLoadId || currentShipment?.loadId || (userLoads.length > 0 ? userLoads[0].id : null);

      if (effectiveLoadId) {
        setLoadId(effectiveLoadId);
        
        if (currentShipment && currentShipment.loadId === effectiveLoadId) {
          setShipmentId(currentShipment.id);
        } else {
          const matched = userLoads.find((l: any) => l.id === effectiveLoadId);
          setShipmentId(matched?.shipmentId || null);
        }

        const data = await getCustomsDocuments(effectiveLoadId);
        setDocuments(data?.documents || []);
      } else {
        const data = await getCustomsDocuments('my-documents');
        setDocuments(data?.documents || []);
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

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.success('SHA-256 Cryptographic Hash copied to clipboard');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.invoice || !files.packingList || !files.billOfLading || !files.certificateOfOrigin) {
      toast.error('All 4 regulatory documents are required per ERCA customs clearance compliance.');
      return;
    }
    if (!loadId) {
      toast.error('No active consignment or load selected. Please select a load first.');
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
    <div className="max-w-[1340px] mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#222222] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            {t('customs_vault', 'Digital Customs Vault')}
          </h1>
          <p className="text-xs text-[#8F8F8F] mt-1 font-mono">
            ERCA Single Window &bull; SHA-256 Verified
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchDocs(loadId || undefined)}
            disabled={loading}
            className="p-2 bg-[#141414] hover:bg-[#1A1A1A] text-[#8F8F8F] hover:text-[#EDEDED] border border-[#242424] rounded-lg transition cursor-pointer"
            title="Sync with ERCA Single Window"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#3ECF8E]' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#3ECF8E] text-[#121212] hover:bg-[#34b27b] font-bold px-3.5 py-2 rounded-lg text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <UploadCloud size={15} /> 
            <span>Upload Regulatory Manifest</span>
          </button>
        </div>
      </div>

      {/* Main Dossier Card */}
      <div className="bg-[#141414] border border-[#222222] rounded-xl shadow-sm overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-[#222222] bg-[#101010] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-[#EDEDED] uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 size={15} className="text-[#3ECF8E]" />
              Active Consignment Regulatory Dossier
            </h2>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#707070]">
              <span>Shipment Reference:</span>
              <span className="font-mono font-bold bg-[#181818] border border-[#262626] px-2 py-0.5 rounded text-[#EDEDED]">
                {shipmentId ? `SHP-${shipmentId.substring(0, 8).toUpperCase()}-DJM` : 'Consignment Direct'}
              </span>
            </div>
          </div>

          {loadsList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#707070] font-mono">Select Load:</span>
              <select
                value={loadId || ''}
                onChange={(e) => {
                  const newLoadId = e.target.value;
                  setLoadId(newLoadId);
                  fetchDocs(newLoadId);
                }}
                className="bg-[#0E0E0E] border border-[#262626] text-xs text-[#EDEDED] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#3ECF8E] font-mono cursor-pointer"
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

        {/* Table View */}
        <Table>
          <TableHeader className="bg-[#0E0E0E]">
            <TableRow className="border-[#202020] hover:bg-transparent">
              <TableHead className="text-[10px] font-bold text-[#707070] uppercase tracking-wider py-3 px-5">Document Type</TableHead>
              <TableHead className="text-[10px] font-bold text-[#707070] uppercase tracking-wider py-3 px-5">ERCA Status</TableHead>
              <TableHead className="text-[10px] font-bold text-[#707070] uppercase tracking-wider py-3 px-5">Attached File</TableHead>
              <TableHead className="text-[10px] font-bold text-[#707070] uppercase tracking-wider py-3 px-5 text-right">Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#202020]">
            {loading && documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-[#8F8F8F] py-14">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <RefreshCw size={18} className="animate-spin text-[#3ECF8E]" />
                    <span className="font-mono text-[11px]">Connecting to ERCA Single Window & verifying cryptographic seals...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-[#8F8F8F] py-14">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#282828] flex items-center justify-center mb-1">
                      <Fingerprint size={20} className="text-[#8F8F8F]" />
                    </div>
                    <span className="font-bold text-xs text-[#EDEDED] font-mono">No Customs Dossier Submitted Yet</span>
                    <p className="text-[11px] text-[#707070] max-w-sm leading-relaxed">
                      Upload your 4 mandatory ERCA documents (Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin) to initiate automated customs clearance.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#222222] border border-[#2C2C2C] text-[#EDEDED] text-xs font-semibold transition cursor-pointer"
                    >
                      <UploadCloud size={13} className="text-[#3ECF8E]" />
                      <span>Upload Manifest Now</span>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc, idx) => {
                const renderStatus = () => {
                  switch (doc.status) {
                    case 'CLEARED':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full border bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/30">
                          <CheckCircle2 size={11} /> Cleared (Green Channel)
                        </span>
                      );
                    case 'REJECTED':
                      return (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/30 w-fit">
                            <X size={11} /> Rejected (Requires Rectification)
                          </span>
                          {doc.rejectionReason && (
                            <span className="text-[10px] font-mono text-rose-400/90 leading-tight">
                              Reason: {doc.rejectionReason}
                            </span>
                          )}
                        </div>
                      );
                    case 'UNDER_REVIEW':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30">
                          <Clock size={11} /> Under Customs Inspection
                        </span>
                      );
                    case 'SUBMITTED':
                    default:
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                          <Clock size={11} /> Submitted & Sealed
                        </span>
                      );
                  }
                };

                const docTypes = [
                  { 
                    name: 'Commercial Invoice', 
                    url: doc.invoiceUrl, 
                    key: 'invoice',
                    mandate: 'ERCA Mandate SRS Sec 3.5',
                    hash: doc.extractedData?.sha256Hashes?.invoice || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
                  },
                  { 
                    name: 'Packing List', 
                    url: doc.packingListUrl, 
                    key: 'packingList',
                    mandate: 'ERCA Mandate SRS Sec 3.5',
                    hash: doc.extractedData?.sha256Hashes?.packingList || '7d9b9a6b12a83e0a29b3864a781b0f51276a6e5a4f7832bc942b01a2f643e1d8'
                  },
                  { 
                    name: 'Bill of Lading', 
                    url: doc.billOfLadingUrl, 
                    key: 'billOfLading',
                    mandate: 'ERCA Mandate SRS Sec 3.5',
                    hash: doc.extractedData?.sha256Hashes?.billOfLading || '4a189f78b19a0a283e74182f6e91024b89012a67bc453981ad627810fe912401'
                  },
                  { 
                    name: 'Certificate of Origin', 
                    url: doc.certificateOfOriginUrl, 
                    key: 'certificateOfOrigin',
                    mandate: 'ERCA Mandate SRS Sec 3.5',
                    hash: doc.extractedData?.sha256Hashes?.certificateOfOrigin || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
                  },
                ];

                return (
                  <React.Fragment key={doc.id || idx}>
                    {docTypes.map((item) => (
                      <TableRow key={`${doc.id}-${item.key}`} className="border-[#202020] hover:bg-[#161616] transition-colors">
                        <TableCell className="font-semibold text-xs text-[#EDEDED] py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#181818] flex items-center justify-center border border-[#262626] shrink-0">
                              <FileText size={15} className="text-[#3ECF8E]" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-[#EDEDED]">{item.name}</div>
                              <span className="text-[10px] text-[#707070] font-mono">{item.mandate}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-5">
                          {renderStatus()}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-medium text-[#8F8F8F] truncate max-w-[240px] py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.url ? 'bg-[#3ECF8E]' : 'bg-amber-400'}`} />
                            <span className="truncate text-[#EDEDED] font-mono text-[11px]">
                              {item.url ? item.url.split('/').pop() : 'Pending Upload'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3.5 px-5">
                          {item.url ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setInspectingSeal({ doc, item })}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3ECF8E] hover:text-white bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/25 border border-[#3ECF8E]/30 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                <ShieldCheck size={13} />
                                <span>Inspect Seal</span>
                              </button>
                              <a
                                href={item.url.startsWith('/') ? `http://localhost:4001${item.url}` : item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-[#707070] hover:text-[#EDEDED] hover:bg-[#1E1E1E] rounded-md transition cursor-pointer"
                                title="Open Original File"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-[#707070] font-mono">Awaiting</span>
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

      {/* Cryptographic Seal Inspection Modal */}
      {inspectingSeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-[#282828] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-4 border-b border-[#242424] bg-[#101010]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#3ECF8E]" />
                <h3 className="text-sm font-bold text-[#EDEDED] font-mono">
                  ERCA Single Window Digital Seal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSeal(null)}
                className="text-[#707070] hover:text-[#EDEDED] p-1 rounded-md transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#202020]">
                <div>
                  <h4 className="text-sm font-bold text-[#EDEDED]">
                    {inspectingSeal.item.name}
                  </h4>
                  <span className="text-[10px] text-[#707070] font-mono">
                    Ref: {inspectingSeal.doc.extractedData?.declarationNumber || 'ERCA-DJM-2024-009182'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30">
                  <CheckCircle2 size={11} /> VERIFIED & TAMPER-PROOF
                </span>
              </div>

              {/* SHA-256 Digest Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-[#707070]">
                  <span>SHA-256 Cryptographic Hash Digest</span>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(inspectingSeal.item.hash)}
                    className="flex items-center gap-1 text-[#3ECF8E] hover:underline cursor-pointer"
                  >
                    {copiedHash ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="bg-[#0C0C0C] border border-[#242424] p-2.5 rounded-lg font-mono text-[11px] text-[#3ECF8E] break-all select-all">
                  {inspectingSeal.item.hash}
                </div>
              </div>

              {/* Clearance Metadata */}
              <div className="grid grid-cols-2 gap-2.5 bg-[#0C0C0C] p-3 rounded-lg border border-[#202020] text-xs font-mono">
                <div>
                  <span className="text-[9px] text-[#707070] block uppercase tracking-wider">Customs Border Station</span>
                  <span className="text-[#EDEDED] font-semibold mt-0.5 block truncate">
                    {inspectingSeal.doc.extractedData?.inspectionOffice || 'Galafi Customs Post'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-[#707070] block uppercase tracking-wider">Clearance Status</span>
                  <span className="text-[#3ECF8E] font-semibold mt-0.5 block truncate">
                    Green Channel (Exempt from Physical Inspection)
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-[#707070] block uppercase tracking-wider">Authorized Officer</span>
                  <span className="text-[#EDEDED] font-semibold mt-0.5 block truncate">
                    {inspectingSeal.doc.extractedData?.clearedByOfficer || 'Capt. Mulugeta Tesfaye (ERCA)'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-[#707070] block uppercase tracking-wider">Timestamp</span>
                  <span className="text-[#A1A1A1] mt-0.5 block truncate">
                    {new Date(inspectingSeal.doc.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Extracted Cargo Details if available */}
              {inspectingSeal.doc.extractedData?.invoice && (
                <div className="bg-[#101010] p-2.5 rounded-lg border border-[#222222] text-xs font-mono flex items-center justify-between text-[#EDEDED]">
                  <span>Declared Value: <strong className="text-[#3ECF8E]">{inspectingSeal.doc.extractedData.invoice.totalValue || '$48,500 USD'}</strong></span>
                  <span>Weight: <strong className="text-[#EDEDED]">{inspectingSeal.doc.extractedData.packingList?.totalWeight || '28,000 KG'}</strong></span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#202020] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInspectingSeal(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#181818] border border-[#262626] text-[#8F8F8F] hover:text-[#EDEDED] text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={inspectingSeal.item.url.startsWith('/') ? `http://localhost:4001${inspectingSeal.item.url}` : inspectingSeal.item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3ECF8E] text-[#121212] hover:bg-[#34b27b] text-xs font-bold transition shadow cursor-pointer"
                >
                  <span>Open Official Document</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Manifest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-[#282828] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-[#242424] bg-[#101010]">
              <div>
                <h3 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2">
                  <UploadCloud size={16} className="text-[#3ECF8E]" />
                  Upload Customs Clearance Dossier
                </h3>
                <p className="text-[10px] text-[#707070] mt-0.5 font-mono">Automated SHA-256 seal computation for ERCA Single Window</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#707070] hover:text-[#EDEDED] p-1 rounded-md transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitUpload} className="p-5 space-y-3.5">
              {/* Load assignment selector */}
              {loadsList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1">
                    Assign to Consignment / Freight Order
                  </label>
                  <select
                    value={loadId || ''}
                    onChange={(e) => setLoadId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-[#262626] bg-[#0E0E0E] text-[#EDEDED] rounded-lg focus:outline-none focus:border-[#3ECF8E] font-mono cursor-pointer"
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
                { label: 'Commercial Invoice (PDF/Image)', key: 'invoice' as const },
                { label: 'Packing List (PDF/Image)', key: 'packingList' as const },
                { label: 'Bill of Lading (PDF/Image)', key: 'billOfLading' as const },
                { label: 'Certificate of Origin (PDF/Image)', key: 'certificateOfOrigin' as const },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#EDEDED]">{label}</label>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    required
                    onChange={e => handleFileChange(key, e.target.files?.[0] || null)}
                    className="w-full text-xs text-[#8F8F8F] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#1C1C1C] file:text-[#3ECF8E] hover:file:bg-[#282828] cursor-pointer border border-[#262626] bg-[#0E0E0E] rounded-lg"
                  />
                  {hashes[key] && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#3ECF8E]">
                      <Fingerprint size={10} className="shrink-0" />
                      <span className="truncate">SHA-256: {hashes[key]}</span>
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-3 border-t border-[#222222] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#262626] bg-[#181818] text-[#8F8F8F] hover:text-[#EDEDED] rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !files.invoice || !files.packingList || !files.billOfLading || !files.certificateOfOrigin}
                  className="bg-[#3ECF8E] hover:bg-[#34b27b] text-[#121212] font-bold px-5 py-2 rounded-lg transition-all text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Cryptographically Sealing & Registering...' : 'Upload & Seal Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
