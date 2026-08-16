import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export default function ActiveShipment() {
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-medium text-slate-800 flex items-center">
          <Truck className="mr-2 text-blue-600" size={20} />
          {t('active_shipment')}
        </CardTitle>
        <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">SHP-9821-DJM</div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-32 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 text-sm overflow-hidden relative">
          <img src="https://via.placeholder.com/400x200?text=Map+Placeholder" alt="Map View" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100/80 to-transparent"></div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="mt-1 mr-3 h-3 w-3 bg-blue-600 rounded-full shrink-0"></div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-800">{t('port_clearance')}</p>
                <span className="text-xs font-medium text-blue-600">{t('completed')}</span>
              </div>
              <p className="text-xs text-slate-500">Djibouti Terminal Doral</p>
            </div>
          </div>

          <div className="w-0.5 h-4 bg-slate-200 ml-1.5 -my-2"></div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 h-3 w-3 bg-blue-600 rounded-full shrink-0"></div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-800">{t('customs_transit')}</p>
                <span className="text-xs font-medium text-blue-600">{t('completed')}</span>
              </div>
              <p className="text-xs text-slate-500">Galafi Border Post</p>
            </div>
          </div>

          <div className="w-0.5 h-4 bg-slate-200 ml-1.5 -my-2"></div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 h-3 w-3 border-2 border-blue-600 bg-white rounded-full shrink-0"></div>
            <div className="flex-1 bg-blue-50/50 p-3 rounded-md border border-blue-100">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-blue-700">{t('in_transit')}</p>
                <span className="text-xs font-medium text-slate-500 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse"></span>
                  {t('live')}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">A1 Highway, Near Awash</p>
              
              <div className="flex justify-between border-t border-blue-200/50 pt-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">{t('current_speed')}</p>
                  <p className="text-sm font-medium text-slate-800">62 km/h</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase">{t('live_eta')}</p>
                  <p className="text-sm font-medium text-slate-800">14:30 EAT</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-0.5 h-4 bg-slate-200 ml-1.5 -my-2"></div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 h-3 w-3 border-2 border-slate-300 bg-white rounded-full shrink-0"></div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-400">{t('arrival_modjo')}</p>
                <span className="text-xs font-medium text-slate-400">{t('pending')}</span>
              </div>
              <p className="text-xs text-slate-400">Modjo Dry Port Terminal</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
