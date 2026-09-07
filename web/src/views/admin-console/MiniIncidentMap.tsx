import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const DJIBOUTI_PORT: [number, number] = [11.588, 43.145];
const GALAFI: [number, number] = [11.716, 41.838];
const SEMERA: [number, number] = [11.794, 41.008];
const AWASH: [number, number] = [8.983, 40.166];
const MODJO: [number, number] = [8.591, 39.124];
const CORRIDOR_POINTS = [DJIBOUTI_PORT, GALAFI, SEMERA, AWASH, MODJO];
const bounds: L.LatLngBoundsExpression = [[8.4, 38.8], [11.9, 43.4]];

const MapController = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [10, 10] });
  }, [map]);
  return null;
};

interface MiniIncidentMapProps {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  severity: 'low' | 'medium' | 'critical';
  onLocationSelect: (lat: number, lng: number) => void;
}

const LocationMarker = ({ latitude, longitude, radius, severity, onLocationSelect }: MiniIncidentMapProps) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!latitude || !longitude) return null;

  const color = severity === 'critical' ? '#EF4444' : severity === 'medium' ? '#F59E0B' : '#3B82F6';
  const fillColor = severity === 'critical' ? '#DC2626' : severity === 'medium' ? '#D97706' : '#2563EB';

  return (
    <Circle 
      center={[latitude, longitude]} 
      radius={radius} 
      pathOptions={{ color, fillColor, fillOpacity: 0.35, weight: 2, dashArray: "4, 4" }} 
    />
  );
};

export default function MiniIncidentMap(props: MiniIncidentMapProps) {
  return (
    <div className="relative w-full h-full min-h-[220px] rounded-lg overflow-hidden border border-[#2E2E2E]">
      <MapContainer 
        bounds={bounds}
        zoomControl={false}
        minZoom={5}
        maxZoom={12}
        className="absolute inset-0 z-0 bg-[#0B0F17]"
        style={{ cursor: 'crosshair' }}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          attribution="&copy; Google"
        />

        <Polyline 
          positions={CORRIDOR_POINTS} 
          pathOptions={{ color: "#38BDF8", weight: 3, opacity: 0.6, dashArray: "4, 4" }} 
        />

        <MapController />
        
        <LocationMarker {...props} />
      </MapContainer>

      {/* Crosshair Overlay hint */}
      {!props.latitude && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
          <div className="bg-[#1C1C1C]/80 backdrop-blur text-[#EDEDED] text-[10px] font-mono px-3 py-1.5 rounded border border-[#2E2E2E] animate-pulse">
            Click anywhere on corridor to set incident coordinates
          </div>
        </div>
      )}
    </div>
  );
}
