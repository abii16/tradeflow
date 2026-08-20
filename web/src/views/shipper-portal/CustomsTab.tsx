import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, CheckCircle2, Clock } from 'lucide-react';

export default function CustomsTab() {
  const { t } = useTranslation();

  const documents = [
    {
      type: 'Commercial Invoice',
      status: 'verified',
      statusLabel: 'Uploaded — Hash Verified',
      file: 'inv_88204_ethio.pdf',
    },
    {
      type: 'Bill of Lading (MBL/HBL)',
      status: 'cleared',
      statusLabel: 'Uploaded — Cleared',
      file: 'bl_dj_mod_9921.pdf',
    },
    {
      type: 'Packing List',
      status: 'pending',
      statusLabel: 'Pending Upload',
      file: null,
    },
    {
      type: 'Certificate of Origin',
      status: 'review',
      statusLabel: 'Under Review',
      file: 'cert_org_991.pdf',
    },
  ];

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
            {documents.map((doc, idx) => (
              <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50">
                <TableCell className="font-medium text-xs text-slate-900">{doc.type}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border ${
                      doc.status === 'cleared'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : doc.status === 'verified'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : doc.status === 'review'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {doc.status === 'cleared' || doc.status === 'verified' ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <Clock size={11} />
                    )}
                    {doc.statusLabel}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-500">{doc.file || '—'}</TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded transition-colors"
                  >
                    {doc.file ? 'View / Replace' : 'Upload'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
