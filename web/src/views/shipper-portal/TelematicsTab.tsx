import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Radar } from 'lucide-react';
import { fetchRiskZones } from '@/lib/apiClient';
import { useLiveTelemetry } from '@/hooks/useLiveTelemetry';

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
  const { telemetry, isConnected } = useLiveTelemetry();
  const [riskZones, setRiskZones] = useState<any[]>([]);

  useEffect(() => {
    async function loadZones() {
      try {
        const data = await fetchRiskZones();
        setRiskZones(Array.isArray(data) ? data : (data?.data || []));
      } catch (err) {
        console.error('Failed to fetch risk zones:', err);
      }
    }
    loadZones();
  }, []);

  const djibouti = [11.5890, 43.1458] as [number, number];
  const galafi = [11.7200, 41.8333] as [number, number];
  const semera = [11.7944, 41.0086] as [number, number];
  const awash = [8.9833, 40.1667] as [number, number];
  const modjo = [8.5866, 39.1211] as [number, number];
  
  // Create a dynamic route line based on static waypoints
  const routeLine = [djibouti, galafi, semera, awash, modjo];

  return (
    <div className="max-w-[1320px] mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="pb-4 border-b border-[#2E2E2E] shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">{t('telematics')}</h1>
          <p className="text-xs text-[#8F8F8F] mt-0.5">Live GPS tracking and ETA prediction across the Djibouti–Modjo corridor (FR-03)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs font-medium text-[#8F8F8F]">{isConnected ? 'Live Socket Connected' : 'Reconnecting...'}</span>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden">
        {/* Map */}
        <div className="lg:col-span-3 rounded-md overflow-hidden border border-[#2E2E2E] relative z-0 h-[calc(100vh-16rem)] min-h-[400px]">
          <MapContainer center={[10.5, 41.0]} zoom={7} className="w-full h-full z-0">
            <TileLayer
              attribution="&copy; Google"
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
            <Polyline positions={routeLine} color="#cbd5e1" weight={2} dashArray="4, 4" />

            {/* Static Waypoints */}
            <Marker position={djibouti}><Popup>Djibouti Port</Popup></Marker>
            <Marker position={galafi}><Popup>Galafi Border</Popup></Marker>
            <Marker position={semera}><Popup>Semera</Popup></Marker>
            <Marker position={modjo}><Popup>Modjo Dry Port</Popup></Marker>

            {/* Dynamic Risk Zones */}
            {riskZones.map(zone => {
              let positions: [number, number][] = [];
              try {
                if (zone.polygon) positions = zone.polygon;
                else if (typeof zone.zone === 'string') {
                  const geoJson = JSON.parse(zone.zone);
                  if (geoJson.coordinates && geoJson.coordinates[0]) {
                     positions = geoJson.coordinates[0].map((coord: any) => [coord[1], coord[0]]); // [lng, lat] to [lat, lng]
                  }
                } else if (zone.zone?.data) {
                  const geoJson = JSON.parse(zone.zone.data);
                  if (geoJson.coordinates && geoJson.coordinates[0]) {
                     positions = geoJson.coordinates[0].map((coord: any) => [coord[1], coord[0]]);
                  }
                }
              } catch(e) {}
              
              const color = zone.severity === 'CRITICAL' || zone.severity === 'HIGH' ? '#DC2626' : '#EAB308';
              
              if (positions.length > 0) {
                return (
                  <Polygon key={zone.id} positions={positions} pathOptions={{ color, fillColor: color, fillOpacity: 0.3, weight: 2 }}>
                    <Popup>
                      <div className="font-bold text-[#EDEDED]">{zone.name}</div>
                      <div className="text-xs font-semibold mt-1" style={{color}}>Severity: {zone.severity}</div>
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            })}

            {/* Real-time WebSocket Alert Zones */}
            {telemetry.alerts.map(alert => {
              if (alert.polygon && alert.polygon.length > 0) {
                return (
                  <Polygon key={`alert-${alert.id}`} positions={alert.polygon} pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.4, weight: 2 }}>
                    <Popup>
                      <div className="font-bold text-red-700">{alert.title}</div>
                      <div className="text-xs text-[#8F8F8F] mt-1">{alert.description}</div>
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            })}

            {/* Dynamic Trucks from WebSocket */}
            {telemetry.trucks.map(truck => (
              <Marker key={truck.id} position={[truck.lat, truck.lng]}>
                <Popup>
                  <div className="font-bold text-[#EDEDED]">{truck.id}</div>
                  <div className="text-[#EDEDED] text-sm mt-1">{truck.cargo} • {truck.speed} km/h</div>
                  <div className="text-[#8F8F8F] text-xs mt-1">Driver: {truck.driver}</div>
                  <div className="text-[#8F8F8F] text-xs">ETA: {truck.eta}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Side Panel Container with relative positioning for scroll indicator */}
        <div className="lg:col-span-2 relative h-full flex flex-col min-h-0">
          <div className="flex-1 space-y-3 overflow-y-auto min-h-0 pr-1 pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {telemetry.alerts.map(alert => (
            <div key={alert.id} className="bg-red-50 border-l-4 border-l-red-500 border-y border-r border-[#2E2E2E] rounded-md p-3 shadow-sm animate-in fade-in slide-in-from-right-4">
              <div className="flex items-start gap-2 text-xs">
                <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-900 text-sm">{alert.title ? t(alert.title) : 'Risk Alert'}</div>
                  <p className="text-red-700 mt-1 leading-relaxed">{alert.description ? t(alert.description) : ''}</p>
                </div>
              </div>
            </div>
          ))}

          {telemetry.trucks.length === 0 && !isConnected && (
            <div className="text-center text-[#8F8F8F] py-8 text-sm flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#2E2E2E] border-t-slate-600 rounded-full animate-spin"></div>
              Connecting to Telemetry Stream...
            </div>
          )}

          {telemetry.trucks.length === 0 && isConnected && (
            <div className="text-center text-[#8F8F8F] py-12 px-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#181818] flex items-center justify-center mb-3">
                <Radar size={24} className="text-[#8F8F8F]" />
              </div>
              <h3 className="text-sm font-semibold text-[#EDEDED] mb-1">No active shipments in transit</h3>
              <p className="text-xs text-[#8F8F8F] leading-relaxed max-w-[200px]">
                Post a freight order to start live corridor tracking.
              </p>
            </div>
          )}

          {telemetry.trucks.map(truck => (
            <div key={truck.id} className="bg-[#232323] border border-[#2E2E2E] rounded-md p-3 hover:border-blue-300 transition-colors shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-sm text-[#EDEDED]">{truck.id}</div>
                  <div className="text-xs text-[#8F8F8F] mt-0.5">{truck.cargo} • {truck.driver}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${truck.status === 'SAFE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {truck.status || 'ONLINE'}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#8F8F8F] font-medium">Speed</span>
                  <span className="font-bold text-[#EDEDED]">{truck.speed} km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8F8F8F] font-medium">Remaining</span>
                  <span className="font-bold text-[#EDEDED]">{Math.round(Number(truck.speed) * 2.5)} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8F8F8F] font-medium">ETA</span>
                  <span className="font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded">{truck.eta}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-[#181818] rounded-full overflow-hidden border border-[#2E2E2E]">
                   <div className="h-full bg-emerald-500" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
            ))}
          </div>
          
          {/* Custom Scroll Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-100 to-transparent pointer-events-none flex items-end justify-center pb-2">
            <div className="bg-[#232323]/80 backdrop-blur shadow-sm rounded-full p-1 animate-bounce text-[#8F8F8F] border border-[#2E2E2E]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
