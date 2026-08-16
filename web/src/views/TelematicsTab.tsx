import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle } from 'lucide-react';

import L from 'leaflet';
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function TelematicsTab() {
  const { t } = useTranslation();

  const djibouti = [11.5890, 43.1458] as [number, number];
  const galafi = [11.7200, 41.8333] as [number, number];
  const semera = [11.7944, 41.0086] as [number, number];
  const awash = [8.9833, 40.1667] as [number, number];
  const modjo = [8.5866, 39.1211] as [number, number];
  const currentPos = [11.75, 41.5] as [number, number];
  const routeLine = [djibouti, galafi, currentPos, semera, awash, modjo];

  return (
    <div className="max-w-[1320px] mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="pb-4 border-b border-slate-200 shrink-0">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{t('telematics')}</h1>
        <p className="text-xs text-slate-500 mt-0.5">Live GPS tracking and ETA prediction across the Djibouti–Modjo corridor (FR-03)</p>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Map */}
        <div className="lg:col-span-3 rounded-md overflow-hidden border border-slate-200 relative z-0">
          <MapContainer center={[10.5, 41.0]} zoom={7} className="w-full h-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={routeLine} color="#cbd5e1" weight={2} dashArray="4, 4" />
            <Polyline positions={[djibouti, galafi, currentPos]} color="#334155" weight={3} />

            <Marker position={djibouti}>
              <Popup>Djibouti Port</Popup>
            </Marker>
            <Marker position={galafi}>
              <Popup>Galafi Border</Popup>
            </Marker>
            <Marker position={semera}>
              <Popup>Semera (Warning Area)</Popup>
            </Marker>
            <Marker position={modjo}>
              <Popup>Modjo Dry Port</Popup>
            </Marker>
            <Marker position={currentPos}>
              <Popup>
                <div className="font-semibold text-slate-900">ET-3-88204</div>
                <div className="text-slate-600">Volvo FH16 • 62 km/h</div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-1 space-y-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-md p-3">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-sm text-slate-900">ET-3-88204</div>
                <div className="text-xs text-slate-500">Volvo FH16 • Yared Tekle</div>
              </div>
              <span className="text-[11px] text-slate-700 font-medium">Online</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Speed</span>
                <span className="font-medium text-slate-900">62 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining</span>
                <span className="font-medium text-slate-900">325 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ETA</span>
                <span className="font-medium text-slate-900">18.2h remaining</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-3">
            <div className="flex items-start gap-2 text-xs">
              <AlertTriangle size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Risk Alert: Semera Bypass</div>
                <p className="text-slate-500 mt-0.5">Minor congestion reported near Semera checkpoint. Rerouting algorithms active.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
