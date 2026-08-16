import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Lock, BrainCircuit } from 'lucide-react';

export default function FreightOrderForm() {
  const { t } = useTranslation();
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteGenerated(true);
  };

  return (
    <div className="flex flex-col space-y-0">
      <Card className="bg-white border-slate-200 shadow-sm rounded-xl mb-6">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl text-slate-900 font-bold">{t('post_new_freight_order')}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleRequestQuote} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-xs text-slate-500">{t('origin')}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input id="origin" defaultValue="Djibouti" className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-xs text-slate-500">{t('destination')}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input id="destination" defaultValue="Modjo" className="pl-9" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo" className="text-xs text-slate-500">{t('cargo_details')}</Label>
                <Input id="cargo" defaultValue="30T Rebar" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadTime" className="text-xs text-slate-500">{t('required_lead_time')}</Label>
                <Select defaultValue="24h">
                  <SelectTrigger id="leadTime">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="48h">48 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg text-base font-semibold shadow-sm transition-all">
              {t('request_spot_pricing')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {quoteGenerated && (
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center text-slate-900 text-base font-bold">
              <BrainCircuit size={20} className="mr-2 text-amber-600" />
              {t('ai_spot_pricing_engine')}
            </div>
            <div className="flex items-center text-amber-700 bg-amber-100/50 px-3 py-1 rounded-full text-xs font-semibold">
              <Clock size={14} className="mr-1.5" />
              14:31 mins
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <h3 className="text-lg font-semibold text-slate-600 mb-6">{t('market_quote_generated')}</h3>
            
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-6">
              <div>
                <p className="text-slate-500 text-sm mb-1">{t('guaranteed_rate')}</p>
                <div className="text-4xl font-mono font-bold text-slate-900 tracking-tight">ETB 348,500.00</div>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm mb-1">{t('confidence_score')}</p>
                <div className="text-lg font-bold text-emerald-600">94.2% {t('high')}</div>
                <div className="text-sm font-semibold text-amber-600 mt-1">+12.4% Fuel ADJ</div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-lg text-base shadow-sm">
                <Lock size={18} className="mr-2" />
                {t('accept_quote_lock_escrow')}
              </Button>
              <Button variant="outline" className="h-12 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-base font-semibold px-8 transition-colors" onClick={() => setQuoteGenerated(false)}>
                {t('decline')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
