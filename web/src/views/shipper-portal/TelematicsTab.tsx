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
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-md overflow-hidden relative shadow-xs">
          <MapContainer center={[10.5, 41.5]} zoom={7} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={routeLine} color="#2563eb" weight={4} dashArray="5, 10" />
            <Marker position={djibouti}><Popup>Djibouti Port (Origin)</Popup></Marker>
            <Marker position={galafi}><Popup>Galafi Border Post</Popup></Marker>
            <Marker position={currentPos}><Popup>Current: Galafi Sector (62 km/h)</Popup></Marker>
            <Marker position={modjo}><Popup>Modjo Dry Port (Destination)</Popup></Marker>
          </MapContainer>

          <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-xs p-3 rounded border border-slate-200 shadow-sm text-xs space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry Feed
            </div>
            <p className="text-slate-500 text-[11px]">Plate: ET-3-A9901 • TransHorn Fleet</p>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-3 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trip Telemetry Status</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Speed</span>
                <span className="font-semibold font-mono text-slate-800">62 km/h</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Corridor ETA</span>
                <span className="font-semibold font-mono text-emerald-600">Today, 17:30</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Distance Remaining</span>
                <span className="font-semibold font-mono text-slate-800">340 km</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Geofence Compliance</span>
                <span className="font-semibold text-emerald-600">In Corridor</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-md p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
              <AlertTriangle size={14} className="text-amber-600" />
              Galafi Bottleneck Notice
            </div>
            <p className="text-amber-700 text-[11px] leading-relaxed">
              Average border clearance wait at Galafi is currently 45 mins. Automatic customs pre-clearance active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
