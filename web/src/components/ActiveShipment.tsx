import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Truck, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [20, 32],
    iconAnchor: [10, 32]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ActiveShipment() {
  const { t } = useTranslation();
  
  const djibouti = [11.5890, 43.1458] as [number, number];
  const galafi = [11.7200, 41.8333] as [number, number];
  const awash = [8.9833, 40.1667] as [number, number];
  const modjo = [8.5866, 39.1211] as [number, number];
  const routeLine = [djibouti, galafi, awash, modjo];

  return (
    <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
      <CardHeader className="p-6 pb-4 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900">{t('active_shipment')}</CardTitle>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">SHP-9021-DJM</span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        
        {/* Map Preview Section */}
        <div className="h-48 rounded-lg overflow-hidden border border-slate-200 mb-8 bg-slate-100 z-0 relative">
          <MapContainer center={[10.1, 41.5]} zoom={6} className="w-full h-full z-0" zoomControl={false} scrollWheelZoom={false}>
            <TileLayer
              attribution=''
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={routeLine} color="#94A3B8" weight={3} dashArray="5, 5" />
            <Polyline positions={[djibouti, galafi, awash]} color="#059669" weight={4} />
            <Marker position={awash} />
          </MapContainer>
        </div>

        {/* 4-Stage Stepper */}
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-emerald-500 before:to-slate-200">
          
          {/* Step 1: Port Clearance */}
          <div className="relative flex items-start justify-between">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 shadow ring-4 ring-white z-10 shrink-0">
              <Check size={12} className="text-white" />
            </div>
            <div className="ml-4 w-full">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900">{t('port_clearance')}</h4>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center">
                  <Check size={10} className="mr-1" /> {t('completed')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Djibouti Terminal Doral</p>
            </div>
          </div>

          {/* Step 2: Customs Transit */}
          <div className="relative flex items-start justify-between">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 shadow ring-4 ring-white z-10 shrink-0">
              <Check size={12} className="text-white" />
            </div>
            <div className="ml-4 w-full">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900">{t('customs_transit')}</h4>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center">
                  <Check size={10} className="mr-1" /> {t('completed')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Galafi Border Post</p>
            </div>
          </div>

          {/* Step 3: In Transit (Live) */}
          <div className="relative flex items-start justify-between">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 shadow ring-4 ring-white z-10 shrink-0 relative">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
              <Truck size={12} className="text-white relative" />
            </div>
            <div className="ml-4 w-full p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-blue-700">{t('in_transit')}</h4>
                <span className="text-xs font-bold text-blue-700 flex items-center uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1.5 animate-pulse"></span> {t('live')}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2 font-medium">A1 Highway, Near Awash</p>
              <div className="flex space-x-3 text-xs bg-white p-2 rounded border border-slate-100">
                <div className="flex-1">
                  <span className="text-slate-400 block mb-0.5">Speed</span>
                  <span className="font-semibold text-slate-800">62 km/h</span>
                </div>
                <div className="flex-1 border-l border-slate-100 pl-3">
                  <span className="text-slate-400 block mb-0.5">ETA</span>
                  <span className="font-semibold text-slate-800">14:30 EAT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Arrival Modjo */}
          <div className="relative flex items-start justify-between">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 ring-4 ring-white z-10 shrink-0">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            </div>
            <div className="ml-4 w-full">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-600">{t('arrival_modjo')}</h4>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center">
                  <Clock size={10} className="mr-1" /> {t('pending')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Modjo Dry Port Terminal</p>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
