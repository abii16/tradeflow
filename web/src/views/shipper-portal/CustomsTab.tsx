import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, CheckCircle2, Clock } from 'lucide-react';
import { getCustomsDocuments, uploadCustomsDocument } from '@/lib/apiClient';

export default function CustomsTab() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const shipmentId = '00000000-0000-0000-0000-000000000000'; // Mock UUID for demo

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await getCustomsDocuments(shipmentId);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUploadClick = () => {
    // Quick mock for upload action
    const invoiceFile = new File(["dummy content"], "invoice.pdf", { type: "application/pdf" });
    const packingListFile = new File(["dummy content"], "packing_list.pdf", { type: "application/pdf" });
    
    const formData = new FormData();
    formData.append('invoice', invoiceFile);
    formData.append('packing_list', packingListFile);
    formData.append('loadId', shipmentId);
    
    uploadCustomsDocument(formData).then(() => {
      alert('Documents uploaded successfully!');
      fetchDocs();
    }).catch(err => {
      console.error(err);
      alert('Failed to upload document');
    });
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{t('customs_vault')}</h1>
        <p className="text-xs text-slate-500 mt-0.5">Upload and validate clearance documents for customs submission (FR-06)</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Shipment SHP-9021 Clearance Vault</h2>
            <p className="text-xs text-slate-500">Linked to Single-Window ERCA / ASYCUDA interface</p>
          </div>
          <button
            type="button"
            onClick={handleUploadClick}
            className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            <UploadCloud size={14} /> Upload Document
          </button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-xs font-medium text-slate-500">Document Type</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Attached File</TableHead>
              <TableHead className="text-xs font-medium text-slate-500 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 && !loading && (
              <TableRow><TableCell colSpan={4} className="text-center text-xs text-slate-500 py-4">No documents found. Click upload.</TableCell></TableRow>
            )}
            {documents.map((doc, idx) => (
              <React.Fragment key={idx}>
                {/* Invoice Row */}
                <TableRow className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="font-medium text-xs text-slate-900">Commercial Invoice</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-emerald-50 text-emerald-700 border-emerald-100">
                      <CheckCircle2 size={11} /> Uploaded
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500 truncate max-w-[150px]">{doc.invoiceUrl.split('/').pop()}</TableCell>
                  <TableCell className="text-right">
                    <button type="button" className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded transition-colors">
                      View
                    </button>
                  </TableCell>
                </TableRow>
                {/* Packing List Row */}
                <TableRow className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="font-medium text-xs text-slate-900">Packing List</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-emerald-50 text-emerald-700 border-emerald-100">
                      <CheckCircle2 size={11} /> Uploaded
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500 truncate max-w-[150px]">{doc.packingListUrl.split('/').pop()}</TableCell>
                  <TableCell className="text-right">
                    <button type="button" className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded transition-colors">
                      View
                    </button>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
