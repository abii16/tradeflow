import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, Leaf } from 'lucide-react';

export default function BidsTab() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{t('bids')}</h2>
      
      <Tabs defaultValue="open">
        <TabsList className="mb-6">
          <TabsTrigger value="all">{t('all_loads')} (14)</TabsTrigger>
          <TabsTrigger value="open">{t('open_for_bidding')} (3)</TabsTrigger>
          <TabsTrigger value="transit">{t('in_transit')} (2)</TabsTrigger>
          <TabsTrigger value="completed">{t('completed')} (9)</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <Card>
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg text-slate-800">TF-LOAD-8821</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">40T Structural Steel • Djibouti → Dire Dawa</p>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Active Bidding</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Transporter</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Proximity</TableHead>
                    <TableHead className="text-right">Bid Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-emerald-50/30">
                    <TableCell className="font-medium text-slate-900">TransHorn Logistics</TableCell>
                    <TableCell>
                      <div className="flex items-center text-amber-500">
                        <Star size={14} className="fill-current mr-1" />
                        <span className="font-semibold text-slate-700">4.9</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 flex w-fit items-center">
                        <Leaf size={12} className="mr-1" /> Class A
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">2h away</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">ETB 340,000.00</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {t('accept_bid')}
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium text-slate-900">BlueNile Freighters</TableCell>
                    <TableCell>
                      <div className="flex items-center text-amber-500">
                        <Star size={14} className="fill-current mr-1" />
                        <span className="font-semibold text-slate-700">4.7</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-200 text-blue-700 flex w-fit items-center">
                        Class B+
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">4h away</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">ETB 352,000.00</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                        {t('accept_bid')}
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Other tab contents placeholder */}
      </Tabs>
    </div>
  );
}
