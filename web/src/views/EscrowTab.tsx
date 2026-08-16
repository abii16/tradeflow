import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ShieldCheck, ArrowRightLeft, Plus } from 'lucide-react';

export default function EscrowTab() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('escrow_settlements')}</h2>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
          <Plus size={16} className="mr-2" /> Top Up via TeleBirr / Bank
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Escrow Locked</p>
                <h3 className="text-2xl font-bold text-slate-900">ETB 1,850,000.00</h3>
              </div>
              <div className="p-2 bg-slate-100 rounded-md text-slate-600">
                <ShieldCheck size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Available Operational Balance</p>
                <h3 className="text-2xl font-bold text-emerald-900">ETB 600,000.00</h3>
              </div>
              <div className="p-2 bg-emerald-100 rounded-md text-emerald-600">
                <Wallet size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Settled (Lifetime)</p>
                <h3 className="text-2xl font-bold text-slate-900">ETB 14,280,000.00</h3>
              </div>
              <div className="p-2 bg-slate-100 rounded-md text-slate-600">
                <ArrowRightLeft size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-200">
          <CardTitle className="text-lg text-slate-800">Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Shipment Reference</TableHead>
                <TableHead>Transporter</TableHead>
                <TableHead className="text-right">Amount (ETB)</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-slate-600">Oct 24, 2026</TableCell>
                <TableCell className="font-mono text-xs text-slate-500">TX-88291-A</TableCell>
                <TableCell className="font-medium text-blue-600 cursor-pointer">TF-LOAD-8821</TableCell>
                <TableCell>TransHorn Logistics</TableCell>
                <TableCell className="text-right font-bold text-slate-900">340,000.00</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Locked
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-slate-600">Oct 22, 2026</TableCell>
                <TableCell className="font-mono text-xs text-slate-500">TX-88102-B</TableCell>
                <TableCell className="font-medium text-blue-600 cursor-pointer">TF-LOAD-8810</TableCell>
                <TableCell>BlueNile Freighters</TableCell>
                <TableCell className="text-right font-medium text-slate-900">285,000.00</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Released to TeleBirr
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-slate-600">Oct 19, 2026</TableCell>
                <TableCell className="font-mono text-xs text-slate-500">TX-87994-C</TableCell>
                <TableCell className="font-medium text-blue-600 cursor-pointer">TF-LOAD-8799</TableCell>
                <TableCell>Ethio-Djibouti Railway</TableCell>
                <TableCell className="text-right font-medium text-slate-900">1,220,000.00</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Released to TeleBirr
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-slate-600">Oct 15, 2026</TableCell>
                <TableCell className="font-mono text-xs text-slate-500">TX-87550-D</TableCell>
                <TableCell className="font-medium text-blue-600 cursor-pointer">TF-LOAD-8755</TableCell>
                <TableCell>Abyssinia Heavy</TableCell>
                <TableCell className="text-right font-medium text-slate-900">410,000.00</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Disputed
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
