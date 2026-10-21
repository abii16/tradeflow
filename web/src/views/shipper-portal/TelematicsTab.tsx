import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  AlertTriangle, 
  Radar, 
  RefreshCw, 
  Truck, 
  MapPin, 
  ArrowRight, 
  Cpu, 
  Gauge, 
  Navigation,
  Search,
  Crosshair,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { fetchRiskZones } from '@/lib/apiClient';
import { useLiveTelemetry, TruckTelemetry } from '@/hooks/useLiveTelemetry';
import L from 'leaflet';

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || Math.max(map.getZoom(), 8), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

const createTruckIcon = (truck: TruckTelemetry, isSelected: boolean) => {
  const isBreach = truck.status === 'GEOFENCE_BREACH';
  const isSpeeding = truck.status === 'SPEEDING';
  const color = isBreach ? '#F59E0B' : isSpeeding ? '#EF4444' : '#3ECF8E';
  const pulseClass = isBreach || isSpeeding ? 'animate-ping' : '';
  const selectedRing = isSelected ? 'scale-110 ring-2 ring-white shadow-[0_0_15px_rgba(62,207,142,0.9)]' : '';

  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${selectedRing}">
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-1 rounded-full ${pulseClass} opacity-40" style="background-color: ${color}"></div>
          <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-xl border-2 border-[#121212] transition-transform hover:scale-110" style="background-color: ${color}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#121212" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
        </div>
        <div class="mt-0.5 bg-[#121212]/95 border border-[#242424] px-1 py-0.2 rounded shadow text-[9px] font-mono font-bold text-[#EDEDED] whitespace-nowrap pointer-events-none">
          ${truck.id}
        </div>
      </div>
    `,
    iconSize: [36, 40],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const createWaypointIcon = (label: string) => {
  return L.divIcon({
    className: 'custom-waypoint-marker',
    html: `
      <div class="flex items-center gap-1.5 bg-[#121212]/95 border border-[#2E2E2E] px-2 py-0.5 rounded-md shadow-lg text-[10px] text-[#EDEDED] font-mono whitespace-nowrap">
        <div class="w-2 h-2 rounded-full bg-[#3ECF8E] shadow-[0_0_6px_rgba(62,207,142,0.8)]"></div>
        <span class="font-semibold">${label}</span>
      </div>
    `,
    iconSize: [95, 24],
    iconAnchor: [48, 12],
  });
};

export default function TelematicsTab() {
  const { t } = useTranslation();
  const { telemetry, isConnected, loading, refreshTelemetry } = useLiveTelemetry();
  const [riskZones, setRiskZones] = useState<any[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'BREACH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapTarget, setMapTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

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

  const waypoints = useMemo(() => [
    { name: 'Djibouti Port', pos: [11.5890, 43.1458] as [number, number] },
    { name: 'Galafi Checkpoint', pos: [11.7200, 41.8333] as [number, number] },
    { name: 'Semera Hub', pos: [11.7944, 41.0086] as [number, number] },
    { name: 'Awash Junction', pos: [8.9833, 40.1667] as [number, number] },
    { name: 'Modjo Dry Port', pos: [8.5866, 39.1211] as [number, number] },
    { name: 'Addis Ababa (Kality)', pos: [9.0050, 38.7630] as [number, number] },
  ], []);

  const corridorPolyline = useMemo(() => waypoints.map(w => w.pos), [waypoints]);

  const filteredTrucks = useMemo(() => {
    return telemetry.trucks.filter(t => {
      // Filter by status
      if (statusFilter === 'SAFE' && t.status !== 'SAFE') return false;
      if (statusFilter === 'BREACH' && t.status !== 'GEOFENCE_BREACH' && t.status !== 'SPEEDING') return false;
      
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = t.id.toLowerCase().includes(q);
        const matchCargo = (t.cargo || '').toLowerCase().includes(q);
        const matchDriver = (t.driver || '').toLowerCase().includes(q);
        const matchPlate = (t.plate || '').toLowerCase().includes(q);
        const matchOrigin = (t.origin || '').toLowerCase().includes(q);
        const matchDest = (t.destination || '').toLowerCase().includes(q);
        return matchId || matchCargo || matchDriver || matchPlate || matchOrigin || matchDest;
      }
      return true;
    });
  }, [telemetry.trucks, statusFilter, searchQuery]);

  const selectedTruck = useMemo(() => {
    return telemetry.trucks.find(t => t.id === selectedTruckId) || null;
  }, [telemetry.trucks, selectedTruckId]);

  const breachCount = useMemo(() => {
    return telemetry.trucks.filter(t => t.status === 'GEOFENCE_BREACH' || t.status === 'SPEEDING').length;
  }, [telemetry.trucks]);

  const safeCount = useMemo(() => {
    return telemetry.trucks.filter(t => t.status === 'SAFE').length;
  }, [telemetry.trucks]);

  const handleSelectTruck = (truck: TruckTelemetry) => {
    setSelectedTruckId(truck.id);
    setMapTarget({ center: [truck.lat, truck.lng], zoom: 9 });
  };

  const handleSectorJump = (pos: [number, number], zoom: number) => {
    setMapTarget({ center: pos, zoom });
  };

  return (
    <div className="max-w-[1360px] mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-3.5">
      {/* Dark Leaflet Popup Overrides */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: #171717 !important;
          color: #EDEDED !important;
          border: 1px solid #282828 !important;
          border-radius: 12px !important;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7) !important;
          padding: 3px !important;
        }
        .leaflet-popup-tip {
          background: #171717 !important;
          border: 1px solid #282828 !important;
        }
        .leaflet-popup-close-button {
          color: #707070 !important;
          padding: 6px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #EDEDED !important;
        }
      `}</style>

      {/* Header - Clean, No Subtitle */}
      <div className="pb-3 border-b border-[#242424] shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            {t('telematics_title', 'Live Telematics')}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={refreshTelemetry}
            className="px-2.5 py-1.5 rounded-lg bg-[#121212] border border-[#242424] hover:border-[#3ECF8E]/40 text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer flex items-center gap-1.5 text-xs font-mono active:scale-95"
            title="Sync live telematics & recalculate PyTorch ETAs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#3ECF8E]' : ''} />
            <span>Sync</span>
          </button>

          <div className="flex items-center gap-2 bg-[#121212] px-3 py-1.5 rounded-lg border border-[#242424]">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#3ECF8E] animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]' : 'bg-rose-500'}`}></div>
            <span className="text-xs font-medium text-[#8F8F8F] font-mono">
              {isConnected ? 'Live Socket Connected' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Main Grid: Control Tower Map & Fleet Telematics Feed */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-hidden min-h-0">
        {/* Interactive Satellite Radar Map */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-[#242424] bg-[#121212] relative z-0 h-[calc(100vh-14rem)] min-h-[440px] shadow-sm flex flex-col">
          <MapContainer center={[10.3, 41.2]} zoom={7} className="w-full h-full z-0">
            <TileLayer
              attribution="&copy; Google Satellite Hybrid"
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />

            <MapController center={mapTarget?.center} zoom={mapTarget?.zoom} />

            {/* Corridor Artery Polyline */}
            <Polyline positions={corridorPolyline} color="#3ECF8E" weight={2.5} opacity={0.65} dashArray="6, 6" />

            {/* Corridor Waypoint Indicators */}
            {waypoints.map(wp => (
              <Marker key={wp.name} position={wp.pos} icon={createWaypointIcon(wp.name)}>
                <Popup>
                  <div className="font-mono text-xs p-1">
                    <div className="font-bold text-[#EDEDED]">{wp.name}</div>
                    <div className="text-[10px] text-[#8F8F8F] mt-0.5">Corridor Strategic Checkpoint</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Dynamic Geofenced Risk Zones from DB */}
            {riskZones.map(zone => {
              let positions: [number, number][] = [];
              try {
                if (zone.polygon) positions = zone.polygon;
                else if (typeof zone.zone === 'string') {
                  const geoJson = JSON.parse(zone.zone);
                  if (geoJson.coordinates && geoJson.coordinates[0]) {
                     positions = geoJson.coordinates[0].map((coord: any) => [coord[1], coord[0]]);
                  }
                } else if (zone.zone?.data) {
                  const geoJson = JSON.parse(zone.zone.data);
                  if (geoJson.coordinates && geoJson.coordinates[0]) {
                     positions = geoJson.coordinates[0].map((coord: any) => [coord[1], coord[0]]);
                  }
                }
              } catch(e) {}
              
              const isHigh = zone.severity === 'CRITICAL' || zone.severity === 'HIGH';
              const color = isHigh ? '#EF4444' : '#F59E0B';
              
              if (positions.length > 0) {
                return (
                  <Polygon key={zone.id} positions={positions} pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 2 }}>
                    <Popup>
                      <div className="font-bold text-[#EDEDED] font-mono text-xs">{zone.name}</div>
                      <div className="text-[11px] font-semibold mt-1" style={{color}}>Severity: {zone.severity}</div>
                      <div className="text-[10px] text-[#8F8F8F] mt-0.5">{zone.description}</div>
                    </Popup>
                  </Polygon>
                );
              }

              // Fallback polygon if direct coordinates
              if (zone.lat && zone.lng) {
                return (
                  <Polygon 
                    key={zone.id} 
                    positions={[
                      [zone.lat + 0.08, zone.lng - 0.08],
                      [zone.lat + 0.08, zone.lng + 0.08],
                      [zone.lat - 0.08, zone.lng + 0.08],
                      [zone.lat - 0.08, zone.lng - 0.08],
                    ]} 
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 1.5 }}
                  >
                    <Popup>
                      <div className="font-bold text-[#EDEDED] font-mono text-xs">{zone.name || zone.title}</div>
                      <div className="text-[10px] text-amber-400 font-bold mt-1">GEOFENCED HAZARD ZONE</div>
                      <div className="text-[10px] text-[#8F8F8F] mt-0.5">{zone.description}</div>
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            })}

            {/* Active Trucks - Live Markers */}
            {telemetry.trucks.map(truck => (
              <Marker 
                key={truck.id} 
                position={[truck.lat, truck.lng]}
                icon={createTruckIcon(truck, selectedTruckId === truck.id)}
                eventHandlers={{
                  click: () => handleSelectTruck(truck),
                }}
              >
                <Popup>
                  <div className="font-mono text-xs text-[#EDEDED] min-w-[240px] p-1.5">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#282828]">
                      <div className="flex items-center gap-1.5">
                        <Truck size={13} className={truck.status === 'SAFE' ? 'text-[#3ECF8E]' : 'text-amber-400'} />
                        <span className="font-bold text-sm text-[#EDEDED]">{truck.id}</span>
                        {truck.plate && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#202020] text-[#8F8F8F] border border-[#2E2E2E]">
                            {truck.plate}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        truck.status === 'SAFE' 
                          ? 'bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30' 
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {truck.status || 'SAFE'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[#EDEDED] mb-1 truncate">{truck.cargo}</div>
                    <div className="text-[11px] text-[#8F8F8F] mb-2 flex items-center gap-1 truncate">
                      <span className="text-[#EDEDED]">{truck.origin || 'Djibouti'}</span>
                      <ArrowRight size={10} className="text-[#3ECF8E] shrink-0" />
                      <span className="text-[#EDEDED]">{truck.destination || 'Modjo'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 bg-[#121212] p-2 rounded-lg border border-[#242424] text-[11px] mb-2">
                      <div>
                        <span className="text-[9px] text-[#707070] block">Speed</span>
                        <span className="font-bold text-[#EDEDED]">{truck.speed} km/h</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#707070] block">Remaining</span>
                        <span className="font-bold text-[#EDEDED]">{truck.remainingDistanceKm || 0} km</span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-[#242424] flex items-center justify-between text-[11px]">
                      <span className="text-[#707070]">PyTorch ETA:</span>
                      <span className="font-bold text-[#3ECF8E]">{truck.eta} ({truck.estimatedArrival})</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Top-Left HUD Badge: AI Engine */}
          <div className="absolute top-3 left-12 z-[1000] bg-[#121212]/90 backdrop-blur-md border border-[#242424] px-3 py-1.5 rounded-lg text-xs font-mono text-[#EDEDED] shadow-xl flex items-center gap-2 pointer-events-none">
            <Cpu size={14} className="text-[#3ECF8E]" />
            <span>AI ETA: <strong className="text-[#3ECF8E]">PyTorch Deep Model</strong></span>
          </div>

          {/* Top-Right Quick Jump Buttons */}
          <div className="absolute top-3 right-3 z-[1000] hidden sm:flex items-center gap-1 bg-[#121212]/90 backdrop-blur-md border border-[#242424] p-1 rounded-lg text-[10px] font-mono shadow-xl">
            <button
              type="button"
              onClick={() => handleSectorJump([10.3, 41.2], 7)}
              className="px-2 py-1 rounded hover:bg-[#202020] text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer"
            >
              Corridor
            </button>
            <button
              type="button"
              onClick={() => handleSectorJump([11.589, 43.145], 10)}
              className="px-2 py-1 rounded hover:bg-[#202020] text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer"
            >
              Djibouti
            </button>
            <button
              type="button"
              onClick={() => handleSectorJump([11.720, 41.833], 10)}
              className="px-2 py-1 rounded hover:bg-[#202020] text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer"
            >
              Galafi
            </button>
            <button
              type="button"
              onClick={() => handleSectorJump([8.586, 39.121], 10)}
              className="px-2 py-1 rounded hover:bg-[#202020] text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer"
            >
              Modjo
            </button>
          </div>

          {/* Bottom-Left Live Telemetry Stats Pill */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-[#121212]/90 backdrop-blur-md border border-[#242424] px-2.5 py-1 rounded-lg text-[10px] font-mono text-[#8F8F8F] shadow-lg flex items-center gap-2 pointer-events-none">
            <Activity size={12} className="text-[#3ECF8E]" />
            <span>{telemetry.trucks.length} Active Fleet Transponders</span>
          </div>
        </div>

        {/* Side Panel: Live Fleet Control Tower Feed */}
        <div className="lg:col-span-2 relative h-[calc(100vh-14rem)] min-h-[440px] flex flex-col min-h-0 bg-[#171717] border border-[#242424] rounded-xl p-3 shadow-sm">
          {/* Search Input */}
          <div className="relative mb-2.5 shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707070]" />
            <input
              type="text"
              placeholder="Search truck ID, plate, or driver..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#121212] border border-[#242424] rounded-lg text-[#EDEDED] placeholder-[#707070] font-mono focus:outline-none focus:border-[#3ECF8E] transition"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#242424] shrink-0 gap-1 text-xs">
            <div className="flex items-center gap-1 font-mono">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-[#242424] text-[#EDEDED]' : 'text-[#8F8F8F] hover:text-[#EDEDED]'
                }`}
              >
                All ({telemetry.trucks.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SAFE')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'SAFE' ? 'bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/30' : 'text-[#8F8F8F] hover:text-[#EDEDED]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                Safe ({safeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('BREACH')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'BREACH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-[#8F8F8F] hover:text-[#EDEDED]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Alerts ({breachCount})
              </button>
            </div>
            
            <span className="text-[11px] text-[#707070] font-mono">
              {filteredTrucks.length} Units
            </span>
          </div>

          {/* Fleet Stream Cards */}
          <div className="flex-1 space-y-2.5 overflow-y-auto min-h-0 pt-2.5 pr-1 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#282828] [&::-webkit-scrollbar-track]:bg-transparent">
            {/* Critical Incident Alerts */}
            {telemetry.alerts.map(alert => (
              <div key={alert.id} className="bg-rose-500/10 border-l-4 border-l-rose-500 border-y border-r border-[#242424] rounded-lg p-2.5 animate-in fade-in">
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-400 font-mono text-xs">{alert.title}</div>
                    <p className="text-rose-300/80 text-[11px] mt-0.5 leading-relaxed">{alert.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {filteredTrucks.length === 0 && !loading && (
              <div className="text-center text-[#8F8F8F] py-12 px-4 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#121212] border border-[#242424] flex items-center justify-center mb-2.5">
                  <Radar size={20} className="text-[#8F8F8F]" />
                </div>
                <h3 className="text-xs font-bold text-[#EDEDED] font-mono mb-1">No active vehicles found</h3>
                <p className="text-[11px] text-[#707070] leading-relaxed max-w-[220px]">
                  All active GPS transponders report nominal status.
                </p>
              </div>
            )}

            {filteredTrucks.map(truck => {
              const isSelected = selectedTruckId === truck.id;
              const isBreach = truck.status === 'GEOFENCE_BREACH' || truck.status === 'SPEEDING';

              return (
                <div 
                  key={truck.id}
                  onClick={() => handleSelectTruck(truck)}
                  className={`border rounded-xl p-3 transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#1C1C1C] border-[#3ECF8E] shadow-[0_0_18px_rgba(62,207,142,0.15)]' 
                      : 'bg-[#121212] border-[#242424] hover:border-[#383838] hover:bg-[#161616]'
                  }`}
                >
                  {/* Top Bar: Truck ID & Status Pill */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-xs font-mono text-[#EDEDED] flex items-center gap-1.5">
                        <Truck size={13} className={isBreach ? 'text-amber-400' : 'text-[#3ECF8E]'} />
                        <span>{truck.id}</span>
                      </div>
                      {truck.plate && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1C1C1C] border border-[#282828] text-[#8F8F8F] font-mono">
                          {truck.plate}
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider border flex items-center gap-1 ${
                      isBreach 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBreach ? 'bg-amber-400' : 'bg-[#3ECF8E]'}`} />
                      <span>{truck.status || 'SAFE'}</span>
                    </span>
                  </div>

                  {/* Freight & Driver Info */}
                  <div className="text-xs text-[#EDEDED] font-medium truncate mb-1">
                    {truck.cargo}
                  </div>

                  <div className="text-[11px] text-[#8F8F8F] font-mono flex items-center gap-1 mb-2.5 truncate">
                    <span>{truck.driver}</span>
                    <span className="text-[#3A3A3A]">•</span>
                    <span className="text-[#EDEDED]">{truck.origin || 'Djibouti'}</span>
                    <ArrowRight size={10} className="text-[#3ECF8E] shrink-0" />
                    <span className="text-[#EDEDED]">{truck.destination || 'Modjo'}</span>
                  </div>

                  {/* Hazard Note if Breach */}
                  {truck.hazardNote && (
                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-md px-2 py-1 mb-2 text-[10px] text-amber-300 font-mono flex items-center gap-1.5">
                      <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                      <span className="truncate">{truck.hazardNote}</span>
                    </div>
                  )}

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-[#171717] p-2 rounded-lg border border-[#242424] text-[11px] font-mono mb-2.5">
                    <div>
                      <span className="text-[#707070] text-[9px] block">Speed</span>
                      <span className="font-bold text-[#EDEDED] flex items-center gap-1 mt-0.5">
                        <Gauge size={10} className="text-[#8F8F8F]" />
                        {truck.speed} km/h
                      </span>
                    </div>

                    <div>
                      <span className="text-[#707070] text-[9px] block">Remaining</span>
                      <span className="font-bold text-[#EDEDED] flex items-center gap-1 mt-0.5">
                        <Navigation size={10} className="text-[#8F8F8F]" />
                        {truck.remainingDistanceKm || 0} km
                      </span>
                    </div>

                    <div>
                      <span className="text-[#707070] text-[9px] block">PyTorch ETA</span>
                      <span className="font-bold text-[#3ECF8E] flex items-center gap-1 mt-0.5">
                        {truck.eta}
                      </span>
                    </div>
                  </div>

                  {/* Real GPS Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#707070]">
                      <span>Corridor Progress</span>
                      <span className="text-[#EDEDED] font-bold">{truck.progressPercent || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1C1C1C] rounded-full overflow-hidden border border-[#242424]">
                      <div 
                        className={`h-full transition-all duration-500 ${isBreach ? 'bg-amber-400' : 'bg-[#3ECF8E]'}`} 
                        style={{ width: `${Math.max(5, Math.min(100, truck.progressPercent || 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Arrival Time Footer */}
                  {truck.estimatedArrival && (
                    <div className="mt-2 pt-1.5 border-t border-[#1C1C1C] flex justify-between items-center text-[10px] font-mono text-[#707070]">
                      <span>Expected Arrival:</span>
                      <span className="text-[#EDEDED] font-semibold">{truck.estimatedArrival}</span>
                    </div>
                  )}

                  {/* Expanded Telemetry Details on Selection */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-[#242424] flex items-center justify-between text-[10px] font-mono animate-in fade-in">
                      <div className="flex items-center gap-1 text-[#8F8F8F]">
                        <Compass size={11} className="text-[#3ECF8E]" />
                        <span>{truck.lat.toFixed(3)}° N, {truck.lng.toFixed(3)}° E</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#3ECF8E]">
                        <Crosshair size={11} />
                        <span>Focused on Radar</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


