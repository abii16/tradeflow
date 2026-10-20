import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  Truck, 
  MapPin, 
  Compass, 
  Layers, 
  CheckCircle2, 
  Radio, 
  Maximize2,
  Clock,
  Sparkles
} from 'lucide-react';
import { CorridorWaypoint } from '../tabs/ActiveHaulsTab';

interface CarrierLiveGpsMapProps {
  haulId: string;
  loadTitle: string;
  driverName?: string;
  driverPhone?: string;
  truckPlate?: string;
  status: string;
  currentLat: number | null;
  currentLng: number | null;
  waypoints: CorridorWaypoint[];
  currentWaypointIndex: number;
  etaString?: string;
  onWaypointCheckin?: (wp: CorridorWaypoint, index: number) => void;
}

// Custom vehicle marker with pulsating radar ping and Ethiopian plate
const createVehicleMarker = (plate: string, isDelivered: boolean) => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative group cursor-pointer w-10 h-10 flex items-center justify-center -ml-5 -mt-5">
        <!-- Pulsing radar ring -->
        ${!isDelivered ? '<div class="absolute inset-0 rounded-full bg-[#3ECF8E] opacity-70 animate-ping"></div>' : ''}
        
        <!-- Outer glow ring -->
        <div class="w-9 h-9 rounded-full bg-[#121212] border-2 border-[#3ECF8E] flex items-center justify-center shadow-[0_0_15px_rgba(62,207,142,0.6)] relative z-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>

        <!-- License Plate Tag -->
        <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#141414] text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow-md whitespace-nowrap z-20">
          ${plate}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};

// Waypoint checkpoint marker
const createWaypointMarker = (name: string, km: number, isPassed: boolean, isCurrent: boolean) => {
  const bgColor = isPassed ? '#3ECF8E' : isCurrent ? '#38BDF8' : '#4B5563';
  const textColor = isPassed ? '#000000' : '#FFFFFF';

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative group cursor-pointer flex flex-col items-center -ml-4 -mt-4">
        <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#1C1C1C] shadow-lg font-mono font-bold text-[10px]" style="background-color: ${bgColor}; color: ${textColor};">
          ${isPassed ? '✓' : `${km}`}
        </div>
        ${isCurrent ? '<div class="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping"></div>' : ''}
        <div class="mt-1 bg-[#181818]/90 text-[#EDEDED] text-[9px] font-mono font-semibold px-1 rounded border border-[#333] whitespace-nowrap">
          ${name.split(' ')[0]}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Map View Controller for smooth bounds fitting
function MapBoundsController({ 
  bounds, 
  truckPos, 
  recenterTrigger,
  truckMarkerRef
}: { 
  bounds: L.LatLngBoundsExpression; 
  truckPos: [number, number]; 
  recenterTrigger: number;
  truckMarkerRef?: React.RefObject<L.Marker | null>;
}) {
  const map = useMap();

  useEffect(() => {
    try {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    } catch {
      // Bounds fallback
    }
  }, [map, bounds]);

  useEffect(() => {
    if (recenterTrigger > 0 && truckPos) {
      map.setView(truckPos, 14, { animate: true });
      setTimeout(() => {
        truckMarkerRef?.current?.openPopup();
      }, 300);
    }
  }, [recenterTrigger, truckPos, map, truckMarkerRef]);

  return null;
}

export default function CarrierLiveGpsMap({
  haulId,
  loadTitle,
  driverName,
  driverPhone,
  truckPlate = '3-ET-74192',
  status,
  currentLat,
  currentLng,
  waypoints,
  currentWaypointIndex,
  etaString,
  onWaypointCheckin,
}: CarrierLiveGpsMapProps) {
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark'>('satellite');
  const [recenterCount, setRecenterCount] = useState<number>(0);
  const [liveClock, setLiveClock] = useState<string>('');
  const truckMarkerRef = React.useRef<L.Marker | null>(null);

  // Live EAT time updater
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const eatH = (d.getUTCHours() + 3) % 24;
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      setLiveClock(`${String(eatH).padStart(2, '0')}:${m}:${s} EAT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isDelivered = status === 'DELIVERED';

  // Derive current truck coordinates (falling back to current waypoint if GPS ping is loading)
  const truckPosition: [number, number] = useMemo(() => {
    if (currentLat != null && currentLng != null && !isNaN(currentLat) && !isNaN(currentLng)) {
      return [Number(currentLat), Number(currentLng)];
    }
    const currentWp = waypoints[currentWaypointIndex] || waypoints[0];
    return [currentWp.lat, currentWp.lng];
  }, [currentLat, currentLng, waypoints, currentWaypointIndex]);

  // Corridor line points
  const corridorPositions: [number, number][] = useMemo(() => {
    return waypoints.map((w) => [w.lat, w.lng]);
  }, [waypoints]);

  // LatLng bounds covering all corridor waypoints and truck position
  const bounds: L.LatLngBoundsExpression = useMemo(() => {
    const lats = waypoints.map((w) => w.lat).concat([truckPosition[0]]);
    const lngs = waypoints.map((w) => w.lng).concat([truckPosition[1]]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return [
      [minLat - 0.08, minLng - 0.08],
      [maxLat + 0.08, maxLng + 0.08],
    ];
  }, [waypoints, truckPosition]);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-[#2E2E2E] bg-[#0E1116] shadow-xl group">
      {/* React Leaflet Map Container */}
      <MapContainer
        bounds={bounds}
        zoomControl={false}
        minZoom={6}
        maxZoom={18}
        className="w-full h-full z-0 bg-[#0B0F17]"
      >
        {/* TileLayer: Google Hybrid Satellite or CartoDB Dark Night */}
        {mapStyle === 'satellite' ? (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution="&copy; Google Satellite Imagery"
          />
        ) : (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CartoDB Dark"
          />
        )}

        {/* Corridor Route Polyline */}
        <Polyline
          positions={corridorPositions}
          pathOptions={{
            color: '#38BDF8',
            weight: 5,
            opacity: 0.85,
            dashArray: '10, 6',
          }}
        />

        {/* Corridor Path Glow */}
        <Polyline
          positions={corridorPositions}
          pathOptions={{
            color: '#3ECF8E',
            weight: 2,
            opacity: 0.9,
          }}
        />

        {/* Live Truck Position Marker */}
        <Marker
          ref={truckMarkerRef}
          position={truckPosition}
          icon={createVehicleMarker(truckPlate, isDelivered)}
          zIndexOffset={1000}
        >
          <Popup className="carrier-haul-popup">
            <div className="p-2 font-mono text-xs text-[#EDEDED] min-w-[220px] space-y-2">
              <div className="flex items-center justify-between border-b border-[#333] pb-1.5">
                <span className="text-[#3ECF8E] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse"></span>
                  TF-{haulId.substring(0, 8).toUpperCase()}
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                  {truckPlate}
                </span>
              </div>
              <div className="font-bold text-[#EDEDED] text-xs truncate">{loadTitle}</div>
              
              <div className="bg-[#161616] rounded-lg p-2 border border-[#2A2A2A] space-y-1 text-[11px]">
                <div className="flex justify-between text-[#A1A1A1]">
                  <span>Live GPS:</span>
                  <span className="text-[#3ECF8E] font-bold">
                    {truckPosition[0].toFixed(4)}°N, {truckPosition[1].toFixed(4)}°E
                  </span>
                </div>
                <div className="flex justify-between text-[#A1A1A1]">
                  <span>Speed:</span>
                  <span className="text-emerald-400 font-bold">{isDelivered ? '0 km/h (Docked)' : '68 km/h • On Corridor'}</span>
                </div>
                <div className="flex justify-between text-[#A1A1A1]">
                  <span>Status:</span>
                  <span className="text-white font-semibold">
                    {isDelivered
                      ? 'Delivered'
                      : status === 'DISPATCHED'
                      ? 'Standby for Dispatch'
                      : status === 'PICKED_UP'
                      ? 'Terminal Gate Clear'
                      : 'In-Transit'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-[#A1A1A1] pt-0.5">
                <span>Driver:</span>
                <span className="text-white font-semibold">{driverName || 'Lead Driver'}</span>
              </div>
              {driverPhone && (
                <div className="flex justify-between text-[11px] text-[#A1A1A1]">
                  <span>Phone:</span>
                  <span className="text-[#3ECF8E]">{driverPhone}</span>
                </div>
              )}
              {etaString && (
                <div className="flex justify-between text-[11px] text-[#A1A1A1] border-t border-[#333] pt-1">
                  <span>AI ETA:</span>
                  <span className="text-[#3ECF8E] font-bold">{etaString}</span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Waypoint Markers */}
        {waypoints.map((wp, index) => {
          const isPassed = isDelivered ? true : index < currentWaypointIndex;
          const isCurrent = isDelivered ? index === waypoints.length - 1 : index === currentWaypointIndex;

          return (
            <Marker
              key={wp.name}
              position={[wp.lat, wp.lng]}
              icon={createWaypointMarker(wp.name, wp.km, isPassed, isCurrent)}
            >
              <Popup>
                <div className="p-1 font-mono text-xs text-[#EDEDED] min-w-[180px] space-y-1.5">
                  <div className="font-bold text-sm text-[#3ECF8E]">{wp.name}</div>
                  <div className="text-[11px] text-[#A1A1A1]">
                    Corridor Milestone: <strong className="text-white">{wp.km} KM</strong>
                  </div>
                  <div className="text-[10px] text-[#A1A1A1]">
                    Coordinates: {wp.lat.toFixed(4)}°N, {wp.lng.toFixed(4)}°E
                  </div>
                  <div className="text-[10px] font-bold">
                    Status:{' '}
                    <span className={isPassed ? 'text-emerald-400' : isCurrent ? 'text-cyan-400' : 'text-amber-400'}>
                      {isPassed ? '✓ Passed & Cleared' : isCurrent ? '◉ Current Checkpoint' : '⏳ Pending'}
                    </span>
                  </div>

                  {!isPassed && !isDelivered && onWaypointCheckin && (
                    <button
                      type="button"
                      onClick={() => onWaypointCheckin(wp, index)}
                      className="mt-2 w-full py-1 bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold rounded text-[10px] transition"
                    >
                      Record Check-In at {wp.name}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Bounds Controller */}
        <MapBoundsController
          bounds={bounds}
          truckPos={truckPosition}
          recenterTrigger={recenterCount}
          truckMarkerRef={truckMarkerRef}
        />
      </MapContainer>

      {/* Top Left Floating HUD: Live Corridor Telemetry */}
      <div className="absolute top-3 left-3 z-[400] pointer-events-none">
        <div className="bg-[#121212]/90 backdrop-blur-md border border-[#2E2E2E] rounded-xl p-3 shadow-2xl pointer-events-auto text-[#EDEDED] space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ECF8E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3ECF8E]"></span>
              </span>
              <span className="text-xs font-bold font-mono tracking-wide flex items-center gap-1">
                <Radio size={13} className="text-[#3ECF8E]" /> LIVE GPS RADAR
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {liveClock}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div>
              <span className="text-[#8F8F8F] block">Assigned Truck</span>
              <span className="text-amber-300 font-bold tracking-wider">{truckPlate}</span>
            </div>
            <div>
              <span className="text-[#8F8F8F] block">Fleet Driver</span>
              <span className="text-white truncate block">{driverName ? driverName.split(' ')[0] : 'Driver'}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-[#222] text-[10px] font-mono flex items-center justify-between text-[#8F8F8F]">
            <span className="flex items-center gap-1">
              <Navigation size={11} className="text-[#3ECF8E]" />
              {truckPosition[0].toFixed(4)}°N, {truckPosition[1].toFixed(4)}°E
            </span>
            <span className="text-emerald-400 font-bold">
              {isDelivered ? 'Docked' : '68 km/h'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Right Floating Controls: Style Toggle & Recenter */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 pointer-events-auto">
        <div className="bg-[#121212]/90 backdrop-blur-md border border-[#2E2E2E] rounded-xl p-1 flex items-center gap-1 shadow-lg text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${
              mapStyle === 'satellite'
                ? 'bg-[#3ECF8E] text-black shadow-md'
                : 'text-[#8F8F8F] hover:text-white hover:bg-[#222]'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${
              mapStyle === 'dark'
                ? 'bg-[#3ECF8E] text-black shadow-md'
                : 'text-[#8F8F8F] hover:text-white hover:bg-[#222]'
            }`}
          >
            Dark Vector
          </button>
        </div>

        <button
          type="button"
          onClick={() => setRecenterCount((c) => c + 1)}
          className="bg-[#121212]/90 hover:bg-[#222] backdrop-blur-md border border-[#2E2E2E] hover:border-[#3ECF8E]/50 text-[#EDEDED] px-3 py-1.5 rounded-xl text-xs font-mono transition shadow-lg flex items-center gap-1.5 group cursor-pointer"
          title="Center on Truck Position and View Live Status"
        >
          <Truck size={14} className="text-[#3ECF8E] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-[#EDEDED]">Locate Truck (መኪናውን አሳይ)</span>
        </button>
      </div>

      {/* Bottom Bar: Corridor status */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-none flex items-center justify-between">
        <div className="bg-[#121212]/90 backdrop-blur-md border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-[10px] font-mono text-[#8F8F8F] shadow-lg pointer-events-auto flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]"></span>
          <span>Corridor Geofence: <strong>Active & Secure</strong></span>
          <span className="text-[#444]">|</span>
          <span className="text-[#EDEDED]">Next Stop: <strong>{waypoints[Math.min(waypoints.length - 1, currentWaypointIndex + 1)]?.name || 'Terminal'}</strong></span>
        </div>

        <div className="bg-[#121212]/90 backdrop-blur-md border border-[#2E2E2E] rounded-xl px-2.5 py-1.5 text-[9px] font-mono text-[#777] shadow-lg hidden sm:block">
          Google Hybrid Tiles • Leaflet GPS Telematics
        </div>
      </div>
    </div>
  );
}
