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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-medium text-slate-800">
            <span className="text-blue-600 mr-2">+</span> {t('post_new_freight_order')}
          </CardTitle>
        </CardHeader>
        <CardContent>
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

            <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
              {t('request_spot_pricing')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {quoteGenerated && (
        <Card className="bg-slate-900 text-white border-none shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center text-teal-400 text-xs font-semibold tracking-wider">
              <BrainCircuit size={14} className="mr-1" />
              {t('ai_spot_pricing_engine')}
            </div>
            <div className="flex items-center text-slate-400 text-xs">
              <Clock size={14} className="mr-1" />
              14:30
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-bold mb-4">{t('market_quote_generated')}</h3>
            
            <div className="flex justify-between items-end border-b border-slate-700 pb-4 mb-4">
              <div>
                <p className="text-slate-400 text-xs mb-1">{t('guaranteed_rate')}</p>
                <div className="text-4xl font-bold text-teal-400">ETB 348,500.00</div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs mb-1">{t('confidence_score')}</p>
                <div className="text-lg font-medium">94.2% {t('high')}</div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button className="flex-1 bg-teal-400 hover:bg-teal-500 text-slate-900 font-bold">
                <Lock size={16} className="mr-2" />
                {t('accept_quote_lock_escrow')}
              </Button>
              <Button variant="outline" className="text-white border-slate-600 hover:bg-slate-800" onClick={() => setQuoteGenerated(false)}>
                {t('decline')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
