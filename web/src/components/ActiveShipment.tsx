import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Truck, Star } from 'lucide-react';
import RatingModal from './RatingModal';
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
  const [showRatingModal, setShowRatingModal] = useState(false);

  const djibouti = [11.5890, 43.1458] as [number, number];
  const galafi = [11.7200, 41.8333] as [number, number];
  const awash = [8.9833, 40.1667] as [number, number];
  const modjo = [8.5866, 39.1211] as [number, number];
  const routeLine = [djibouti, galafi, awash, modjo];

  return (
    <div className="bg-white border border-slate-200 rounded-md">
      {showRatingModal && (
        <RatingModal
          transporterName="Kangaroo Freight"
          shipmentId="SHP-9021-DJM"
          onClose={() => setShowRatingModal(false)}
          onSubmit={(rating, comment) => console.log('Rating submitted:', rating, comment)}
        />
      )}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-900">{t('active_shipment')}</h2>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">SHP-9021-DJM</span>
        </div>
        <button
          onClick={() => setShowRatingModal(true)}
          className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded hover:bg-amber-100 transition-colors flex items-center gap-1"
        >
          <Star size={12} className="fill-amber-600" /> Complete & Rate
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Map */}
        <div className="h-40 rounded overflow-hidden border border-slate-200 bg-slate-100 z-0 relative">
          <MapContainer center={[10.1, 41.5]} zoom={6} className="w-full h-full z-0" zoomControl={false} scrollWheelZoom={false}>
            <TileLayer
              attribution=''
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={routeLine} color="#cbd5e1" weight={2} dashArray="4, 4" />
            <Polyline positions={[djibouti, galafi, awash]} color="#334155" weight={3} />
            <Marker position={awash} />
          </MapContainer>
        </div>

        {/* Stepper */}
        <div className="space-y-0 relative">
          {/* Step 1: Port Clearance */}
          <div className="relative flex items-start pb-5">
            <div className="absolute left-[9px] top-[14px] bottom-0 w-px bg-slate-900 z-0"></div>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 z-10 shrink-0 mt-0.5">
              <Check size={10} className="text-white stroke-[3]" />
            </div>
            <div className="ml-3 w-full flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold text-slate-900">{t('port_clearance')}</div>
                <div className="text-[11px] text-slate-500">Djibouti Terminal Doraleh</div>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Completed</span>
            </div>
          </div>

          {/* Step 2: Customs Transit */}
          <div className="relative flex items-start pb-5">
            <div className="absolute left-[9px] top-0 bottom-0 w-px bg-slate-900 z-0"></div>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 z-10 shrink-0 mt-0.5">
              <Check size={10} className="text-white stroke-[3]" />
            </div>
            <div className="ml-3 w-full flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold text-slate-900">{t('customs_transit')}</div>
                <div className="text-[11px] text-slate-500">Galafi Border Post</div>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Completed</span>
            </div>
          </div>

          {/* Step 3: In Transit */}
          <div className="relative flex items-start pb-5">
            <div className="absolute left-[9px] top-0 h-[12px] w-px bg-slate-900 z-0"></div>
            <div className="absolute left-[9px] top-[12px] bottom-0 w-px bg-slate-200 z-0"></div>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 z-10 shrink-0 mt-0.5">
              <Truck size={10} className="text-white" />
            </div>

            <div className="ml-3 w-full bg-slate-50 border border-slate-200 rounded p-3">
              <div className="flex justify-between items-start mb-1.5">
                <div className="text-xs font-semibold text-slate-900">{t('in_transit')}</div>
                <span className="text-[11px] font-mono text-slate-700 font-medium">Live</span>
              </div>
              <div className="text-[11px] text-slate-600 mb-2">A1 Highway, Near Awash</div>

              <div className="flex gap-4 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 font-sans">Speed:</span> <span className="font-medium text-slate-900">62 km/h</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">ETA:</span> <span className="font-medium text-slate-900">14:30 EAT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Arrival */}
          <div className="relative flex items-start">
            <div className="absolute left-[9px] top-0 h-[12px] w-px bg-slate-200 z-0"></div>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 z-10 shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
            </div>
            <div className="ml-3 w-full flex justify-between items-start">
              <div>
                <div className="text-xs font-medium text-slate-600">{t('arrival_modjo')}</div>
                <div className="text-[11px] text-slate-400">Modjo Dry Port Terminal</div>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
