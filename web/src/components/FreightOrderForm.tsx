import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowDownUp, FileText, BrainCircuit, Clock, Lock, Scale, Package } from 'lucide-react';

export default function FreightOrderForm() {
  const { t } = useTranslation();
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [leadTime, setLeadTime] = useState('24h');

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteGenerated(true);
  };

  return (
    <div className="flex flex-col space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:shadow-slate-100 rounded-xl transition-all duration-200">
        <CardHeader className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <FileText size={18} className="text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900 font-bold leading-none mb-1.5">{t('post_new_freight_order')}</CardTitle>
              <p className="text-xs text-slate-500 font-medium">Submit cargo specs for automated corridor matching</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleRequestQuote} className="space-y-6">
            
            {/* Row 1: Dual-Column Segment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Route Inputs */}
              <div className="relative flex flex-col space-y-3 h-full justify-between">
                <div className="relative">
                  <Label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1.5 block">Origin</Label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input className="pl-9 bg-white border-slate-200 h-11 text-sm font-medium focus-visible:ring-slate-400" defaultValue="Djibouti Container Terminal" />
                  </div>
                </div>

                <div className="absolute top-[48%] left-8 -translate-y-1/2 z-10 hidden sm:flex">
                   <button type="button" className="p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-400 transition-colors">
                     <ArrowDownUp size={12} />
                   </button>
                </div>

                <div className="relative">
                  <Label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1.5 block">Destination</Label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <Input className="pl-9 bg-white border-slate-200 h-11 text-sm font-medium focus-visible:ring-slate-400" defaultValue="Modjo Dry Port" />
                  </div>
                </div>
              </div>

              {/* Right Column: Cargo Specs */}
              <div className="flex flex-col space-y-3 h-full justify-between">
                <div className="relative">
                  <Label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1.5 block">Cargo Details</Label>
                  <div className="relative">
                    <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input className="pl-9 bg-white border-slate-200 h-11 text-sm font-medium" defaultValue="30T Construction Rebar (Flatbed)" />
                  </div>
                </div>

                <div className="relative">
                  <Label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1.5 block">Total Weight</Label>
                  <div className="relative flex items-center">
                    <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input className="pl-9 pr-12 bg-white border-slate-200 h-11 text-sm font-medium font-mono" defaultValue="30.00" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">MT</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Row 2: Full-Width Lead Time */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block">Required Lead Time</Label>
              <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/60 w-full">
                <button type="button" onClick={() => setLeadTime('24h')} className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-md transition-all ${leadTime === '24h' ? 'bg-white shadow-sm border border-slate-300 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Immediate 24h</button>
                <button type="button" onClick={() => setLeadTime('48h')} className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-md transition-all ${leadTime === '48h' ? 'bg-white shadow-sm border border-slate-300 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>48h Flexible</button>
                <button type="button" onClick={() => setLeadTime('schedule')} className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-md transition-all ${leadTime === 'schedule' ? 'bg-white shadow-sm border border-slate-300 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Scheduled Date</button>
              </div>
            </div>

            {/* Row 3: Action CTA */}
            <div className="pt-2">
              <Button type="submit" className="w-full bg-slate-50 border border-slate-300 border-l-[3px] border-l-transparent text-slate-800 h-11 rounded-r-lg rounded-l-sm text-xs tracking-wide uppercase font-semibold hover:bg-emerald-50 hover:border-slate-300 hover:border-l-emerald-500 hover:text-emerald-900 transition-all duration-200">
                {t('request_spot_pricing')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {quoteGenerated && (
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between border-b border-slate-100">
            <div className="flex items-center text-slate-900 text-sm font-bold">
              <BrainCircuit size={16} className="mr-2 text-slate-500" />
              {t('ai_spot_pricing_engine')}
            </div>
            <div className="flex items-center text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Clock size={10} className="mr-1.5" />
              14:31 mins
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-100 pb-6 mb-6">
              <div>
                <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-2">{t('guaranteed_rate')}</p>
                <div className="text-3xl font-mono font-bold text-slate-900 tracking-tight">ETB 348,500.00</div>
              </div>
              <div className="text-left sm:text-right mt-4 sm:mt-0">
                <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1.5">{t('confidence_score')}</p>
                <div className="text-sm font-bold text-slate-900 flex items-center justify-start sm:justify-end">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span> 94.2% {t('high')}
                </div>
                <div className="text-[10px] font-semibold text-amber-600 mt-1 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded inline-block">+12.4% Fuel ADJ</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Button className="flex-1 bg-slate-50 border border-slate-300 border-l-[3px] border-l-transparent text-slate-800 font-semibold h-11 rounded-r-lg rounded-l-sm text-sm hover:bg-emerald-50 hover:border-slate-300 hover:border-l-emerald-500 hover:text-emerald-900 transition-all duration-200">
                <Lock size={16} className="mr-2" />
                {t('accept_quote_lock_escrow')}
              </Button>
              <Button variant="outline" className="h-11 rounded-r-lg rounded-l-sm bg-white border border-slate-200 border-l-[3px] border-l-transparent text-slate-700 hover:bg-emerald-50 hover:border-slate-200 hover:border-l-emerald-500 hover:text-emerald-900 text-sm font-medium px-8 transition-all" onClick={() => setQuoteGenerated(false)}>
                {t('decline')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
