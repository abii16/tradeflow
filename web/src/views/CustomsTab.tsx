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

      {/* Validation Status */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center gap-2">
        <CheckCircle2 size={16} className="text-slate-500" />
        <div className="text-xs">
          <span className="font-medium text-slate-900">Validated</span>
          <span className="text-slate-500 ml-1">— Submitted to Galafi Border Desk. All documents passed consistency checks.</span>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-900">{t('document_upload')}</span>
        </div>

        <Table>
          <TableHeader className="bg-slate-50 text-[11px] font-semibold text-slate-600">
            <TableRow>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>File Reference</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {documents.map((doc, i) => (
              <TableRow key={i} className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-900">{doc.type}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-slate-600">
                    {doc.status === 'verified' || doc.status === 'cleared' ? (
                      <CheckCircle2 size={12} className="text-slate-400" />
                    ) : doc.status === 'review' ? (
                      <Clock size={12} className="text-slate-400" />
                    ) : null}
                    <span>{doc.statusLabel}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-500 font-mono text-[11px]">
                  {doc.file || <span className="italic text-slate-400">Not provided</span>}
                </TableCell>
                <TableCell className="text-right">
                  {doc.status === 'pending' ? (
                    <button className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded transition-colors">
                      <UploadCloud size={12} />
                      Upload
                    </button>
                  ) : (
                    <button className="px-2.5 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-medium rounded transition-colors">
                      View
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
