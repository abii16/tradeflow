import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Scale, Package } from 'lucide-react';

export default function FreightOrderForm() {
  const { t } = useTranslation();
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [leadTime, setLeadTime] = useState('24h');

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteGenerated(true);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-md p-4">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Post New Freight Order</h2>
          <p className="text-xs text-slate-500 mt-0.5">Submit cargo details for corridor matching (FR-02)</p>
        </div>

        <form onSubmit={handleRequestQuote} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Origin</Label>
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-8 bg-slate-50/50 border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white" defaultValue="Djibouti Container Terminal" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Cargo Details</Label>
              <div className="relative">
                <Package size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-8 bg-slate-50/50 border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white" defaultValue="30T Construction Rebar (Flatbed)" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Destination</Label>
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-8 bg-slate-50/50 border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white" defaultValue="Modjo Dry Port" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Total Weight</Label>
              <div className="relative">
                <Scale size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-8 pr-10 bg-slate-50/50 border-slate-200 h-8 text-xs font-mono font-medium rounded text-slate-900 focus:bg-white" defaultValue="30.00" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">MT</span>
              </div>
            </div>
          </div>

          {/* Lead Time */}
          <div>
            <Label className="text-xs font-medium text-slate-700 mb-1.5 block">Required Lead Time</Label>
            <div className="flex border border-slate-200 rounded p-0.5 bg-slate-50">
              {([
                { key: '24h', label: 'Immediate 24h' },
                { key: '48h', label: '48h Flexible' },
                { key: 'schedule', label: 'Scheduled Date' }
              ] as const).map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLeadTime(opt.key)}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${leadTime === opt.key
                      ? 'bg-white text-slate-900 border border-slate-200 shadow-none'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
          >
            {t('request_spot_pricing')}
          </button>
        </form>
      </div>

      {/* Quote Result */}
      {quoteGenerated && (
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
            <div>
              <div className="text-xs text-slate-500 font-medium">Guaranteed Spot Rate (FR-04)</div>
              <div className="text-xl font-bold font-mono text-slate-900 tracking-tight mt-0.5">
                ETB 348,500.00
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="text-slate-500">Confidence: 94.2%</div>
              <div className="text-slate-500 mt-0.5">Fuel adjustment: +12.4%</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
            >
              {t('accept_quote_lock_escrow')}
            </button>
            <button
              type="button"
              onClick={() => setQuoteGenerated(false)}
              className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded transition-colors"
            >
              {t('decline')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
