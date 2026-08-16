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

        {/* 4-Stage Stepper Matching Image */}
        <div className="space-y-0 relative">
          
          {/* Step 1: Port Clearance */}
          <div className="relative flex items-start pb-8">
            <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-emerald-500"></div>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 shadow-sm z-10 shrink-0 mt-0.5">
              <Check size={12} className="text-white stroke-[3]" />
            </div>
            <div className="ml-5 w-full flex justify-between items-start">
              <div>
                <h4 className="text-[15px] font-bold text-slate-900 leading-none mb-1.5">{t('port_clearance')}</h4>
                <p className="text-sm text-slate-500">Djibouti Terminal Doral</p>
              </div>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center shadow-sm border border-emerald-100/50">
                <Check size={12} className="mr-1" /> Completed
              </span>
            </div>
          </div>

          {/* Step 2: Customs Transit */}
          <div className="relative flex items-start pb-8">
            <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-emerald-500"></div>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 shadow-sm z-10 shrink-0 mt-0.5">
              <Check size={12} className="text-white stroke-[3]" />
            </div>
            <div className="ml-5 w-full flex justify-between items-start">
              <div>
                <h4 className="text-[15px] font-bold text-slate-900 leading-none mb-1.5">{t('customs_transit')}</h4>
                <p className="text-sm text-slate-500">Galafi Border Post</p>
              </div>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center shadow-sm border border-emerald-100/50">
                <Check size={12} className="mr-1" /> Completed
              </span>
            </div>
          </div>

          {/* Step 3: In Transit (Live Box) */}
          <div className="relative flex items-start pb-8">
            <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-300"></div>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 shadow-sm z-10 shrink-0 mt-2">
              <Truck size={12} className="text-white" />
            </div>
            
            <div className="ml-5 w-full bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-[15px] font-bold text-blue-700 leading-none">{t('in_transit')}</h4>
                <span className="text-xs font-bold text-blue-700 flex items-center uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1.5"></span> LIVE
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-4 font-medium">A1 Highway, Near Awash</p>
              
              <div className="flex bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                <div className="flex-1">
                  <span className="text-slate-400 text-xs block mb-1">Speed</span>
                  <span className="font-semibold text-sm text-slate-900">62 km/h</span>
                </div>
                <div className="w-px bg-slate-200 mx-4"></div>
                <div className="flex-1">
                  <span className="text-slate-400 text-xs block mb-1">ETA</span>
                  <span className="font-semibold text-sm text-slate-900">14:30 EAT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Arrival Modjo */}
          <div className="relative flex items-start">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 z-10 shrink-0 mt-0.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            </div>
            <div className="ml-5 w-full flex justify-between items-start">
              <div>
                <h4 className="text-[15px] font-bold text-slate-700 leading-none mb-1.5">{t('arrival_modjo')}</h4>
                <p className="text-sm text-slate-400">Modjo Dry Port Terminal</p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md flex items-center border border-slate-200/50">
                <Clock size={12} className="mr-1" /> Pending
              </span>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
