import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, UploadCloud, CheckCircle2, Clock } from 'lucide-react';

export default function CustomsTab() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('customs_vault')}</h2>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex items-center space-x-3 mb-6">
        <CheckCircle2 className="text-emerald-600" size={24} />
        <div>
          <h4 className="text-emerald-800 font-bold tracking-wider text-sm">VALIDATED - SUBMITTED TO GALAFI BORDER DESK</h4>
          <p className="text-emerald-600 text-xs mt-0.5">All required documents have passed automated consistency checks.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-200">
          <CardTitle className="text-lg text-slate-800">{t('document_upload')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File Reference</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-slate-900">Commercial Invoice</TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none flex w-fit items-center">
                    <CheckCircle2 size={12} className="mr-1" /> Uploaded - Hash Verified
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 font-mono text-xs">inv_88204_ethio.pdf</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium text-slate-900">Bill of Lading (MBL/HBL)</TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none flex w-fit items-center">
                    <CheckCircle2 size={12} className="mr-1" /> Uploaded - Cleared
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 font-mono text-xs">bl_dj_mod_9921.pdf</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium text-slate-900">Packing List</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex w-fit items-center">
                    Pending Upload
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-xs italic">Not provided</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" className="bg-slate-900 text-white flex items-center space-x-2 w-full justify-center md:w-auto md:ml-auto">
                    <UploadCloud size={14} /> <span>Upload</span>
                  </Button>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium text-slate-900">Certificate of Origin</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex w-fit items-center">
                    <Clock size={12} className="mr-1" /> Under Review
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 font-mono text-xs">cert_org_991.pdf</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
