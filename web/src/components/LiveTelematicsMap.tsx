import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Route from Djibouti to Modjo
const routeCoords: [number, number][] = [
  [11.5873, 43.1450], // Djibouti Port
  [11.5, 42.5],
  [11.7303, 41.8361], // Galafi
  [11.7925, 41.0083], // Semera
  [11.1, 40.6],
  [8.9897, 40.1706],  // Awash
  [8.5878, 39.1179]   // Modjo
];

// Helper to interpolate between two points
function interpolatePoint(p1: [number, number], p2: [number, number], t: number): [number, number] {
  return [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t
  ];
}

const LiveTelematicsMap = () => {
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(routeCoords[0]);

  useEffect(() => {
    // Total animation time: 20 seconds, loop continuously
    const totalFrames = 400; // 50ms per frame = 20s
    let frame = 0;

    const interval = setInterval(() => {
      frame = (frame + 1) % totalFrames;

      const t = frame / totalFrames; // 0 to 1 over the whole route

      // Find which segment we're in
      const numSegments = routeCoords.length - 1;
      const scaledT = t * numSegments;
      const segmentIndex = Math.floor(scaledT);
      const segmentT = scaledT - segmentIndex;

      if (segmentIndex < numSegments) {
        setCurrentPosition(interpolatePoint(
          routeCoords[segmentIndex],
          routeCoords[segmentIndex + 1],
          segmentT
        ));
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const truckIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="relative w-8 h-8 flex items-center justify-center">
             <div class="absolute inset-0 bg-[#3ECF8E] rounded-full animate-ping opacity-60"></div>
             <div class="relative w-4 h-4 bg-[#3ECF8E] rounded-full shadow-[0_0_15px_rgba(62,207,142,1)] border-2 border-[#141414]"></div>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <div className="w-full h-full relative z-10 rounded-3xl overflow-hidden isolate bg-[#0f0f0f]">
      <MapContainer
        center={[10.3, 41.2]}
        zoom={6.5}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          className="[filter:brightness(85%)_contrast(110%)]"
        />

        {/* Route Line */}
        <Polyline
          positions={routeCoords}
          pathOptions={{ color: '#3ECF8E', weight: 2.5, dashArray: '4, 4' }}
          className="filter drop-shadow-[0_0_10px_rgba(62,207,142,0.9)] animate-pulse"
        />

        {/* Moving Truck Marker */}
        <Marker position={currentPosition} icon={truckIcon} />

        {/* Start/End Points */}
        <Marker position={routeCoords[0]} icon={L.divIcon({
          className: 'bg-transparent',
          html: '<div class="relative w-3 h-3"><div class="absolute inset-0 bg-[#3ECF8E] rounded-full animate-ping opacity-75"></div><div class="relative w-3 h-3 bg-[#3ECF8E] rounded-full"></div></div>',
          iconSize: [12, 12], iconAnchor: [6, 6]
        })} />
        <Marker position={routeCoords[routeCoords.length - 1]} icon={L.divIcon({
          className: 'bg-transparent',
          html: '<div class="relative w-3 h-3"><div class="absolute inset-0 bg-[#3ECF8E] rounded-full animate-ping opacity-75"></div><div class="relative w-3 h-3 bg-[#3ECF8E] rounded-full"></div></div>',
          iconSize: [12, 12], iconAnchor: [6, 6]
        })} />
      </MapContainer>

      {/* Decorative Overlay for premium feel */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl border border-white/10 z-20 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]"></div>
    </div>
  );
};

export default LiveTelematicsMap;
