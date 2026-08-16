import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Radar } from 'lucide-react';

const DJIBOUTI_PORT: [number, number] = [11.588, 43.145];
const GALAFI: [number, number] = [11.716, 41.838];
const SEMERA: [number, number] = [11.794, 41.008];
const AWASH: [number, number] = [8.983, 40.166];
const MODJO: [number, number] = [8.591, 39.124];

const CORRIDOR_POINTS = [DJIBOUTI_PORT, GALAFI, SEMERA, AWASH, MODJO];

// Custom HTML marker for the vehicles
const createVehicleMarker = (id: string, colorClass = "bg-cyan-400") => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative group cursor-pointer w-6 h-6 flex items-center justify-center -ml-3 -mt-3">
        <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          ${id}
        </div>
        <div class="w-3 h-3 rounded-full bg-white flex items-center justify-center z-10 relative shadow-md">
          <div class="w-1.5 h-1.5 rounded-full ${colorClass}"></div>
        </div>
        <div class="absolute inset-0 rounded-full bg-cyan-400 opacity-60 animate-ping"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const MapResetter = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    const btn = document.getElementById('reset-map-btn');
    if (btn) {
      btn.onclick = () => map.setView(center, zoom, { animate: true });
    }
  }, [map, center, zoom]);
  return null;
};

export default function LiveRadarMap() {
  const initialCenter: [number, number] = [10.5, 41.5];
  const initialZoom = 7;

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        zoomControl={false}
        className="absolute inset-0 z-0 bg-[#0B0F17]"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* The 810km Artery */}
        <Polyline 
          positions={CORRIDOR_POINTS} 
          pathOptions={{ color: "#38BDF8", weight: 4, opacity: 0.85, dashArray: "8, 4" }} 
        />

        {/* Hazard Zone RISK-04 */}
        <Circle 
          center={SEMERA} 
          radius={25000} 
          pathOptions={{ color: "#EF4444", fillColor: "#DC2626", fillOpacity: 0.25, weight: 1.5, dashArray: "4, 4" }} 
        >
          <Popup>
            <div className="font-bold text-red-600 text-sm mb-1">RISK-04: Active Detour Enforced</div>
            <div className="text-xs text-slate-600">Semera Bypass Congestion</div>
          </Popup>
        </Circle>

        {/* Live Vehicles */}
        <Marker position={[11.652, 42.493]} icon={createVehicleMarker('ET-9021')}>
          <Popup className="rounded shadow-xl">
            <div className="text-[11px] space-y-1.5 font-mono text-slate-700 min-w-[180px]">
              <div className="border-b border-slate-100 pb-1 mb-1">
                <strong className="text-slate-900">Truck ID:</strong> ET-9021
              </div>
              <div className="flex justify-between"><strong>Cargo:</strong> 30T Rebar</div>
              <div className="flex justify-between"><strong>Speed:</strong> 64 km/h</div>
              <div className="flex justify-between"><strong>Driver:</strong> Yared Tekle</div>
              <div className="flex justify-between text-blue-600 mt-2 border-t border-slate-100 pt-1">
                <strong>ETA Modjo:</strong> 6.2h
              </div>
            </div>
          </Popup>
        </Marker>

        <Marker position={[10.354, 40.591]} icon={createVehicleMarker('BHL-8892')}>
           <Popup className="rounded shadow-xl">
            <div className="text-[11px] space-y-1.5 font-mono text-slate-700 min-w-[180px]">
              <div className="border-b border-slate-100 pb-1 mb-1">
                <strong className="text-slate-900">Truck ID:</strong> BHL-8892
              </div>
              <div className="flex justify-between"><strong>Cargo:</strong> 40ft Container</div>
              <div className="flex justify-between"><strong>Speed:</strong> 58 km/h</div>
              <div className="flex justify-between"><strong>Driver:</strong> Alazar M.</div>
              <div className="flex justify-between text-blue-600 mt-2 border-t border-slate-100 pt-1">
                <strong>ETA Modjo:</strong> 3.8h
              </div>
            </div>
          </Popup>
        </Marker>

        <MapResetter center={initialCenter} zoom={initialZoom} />
      </MapContainer>

      {/* Floating HUD */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg p-4 shadow-xl text-slate-300 w-[280px] pointer-events-auto">
          <div className="flex justify-between items-center mb-3 border-b border-slate-700/50 pb-2">
            <h2 className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
              <Radar size={14} className="text-blue-500 animate-pulse" />
              LIVE SATELLITE RADAR
            </h2>
            <div className="text-[10px] font-mono flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              14:32 EAT
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-[11px] flex justify-between items-center bg-slate-950/50 px-2 py-1.5 rounded border border-slate-800">
              <span className="text-slate-400 uppercase font-semibold">Corridor Status:</span>
              <span className="text-emerald-400 font-bold font-mono">OPERATIONAL (96%)</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 text-center leading-relaxed">
              142 Active Heavy Assets <br />
              Avg Speed: 68 km/h | Galafi Dwell: 45m
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col items-end gap-2 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-1 flex gap-1 pointer-events-auto shadow-lg text-[10px] font-mono">
          <button className="bg-slate-800 text-white px-2.5 py-1.5 rounded shadow-sm border border-slate-600 transition-colors hover:bg-slate-700">
            [● Satellite]
          </button>
          <button className="text-slate-400 hover:text-white px-2.5 py-1.5 rounded transition-colors hover:bg-slate-800/50">
            [○ Vector Road]
          </button>
          <button className="text-slate-400 hover:text-white px-2.5 py-1.5 rounded transition-colors hover:bg-slate-800/50">
            [○ Weather Radar]
          </button>
        </div>
        
        <button id="reset-map-btn" className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-[11px] font-mono pointer-events-auto transition-all hover:bg-slate-800 shadow-lg">
          Reset Corridor Extent
        </button>
      </div>
    </div>
  );
}
