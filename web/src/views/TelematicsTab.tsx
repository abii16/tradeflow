import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, AlertTriangle, Battery, Clock, Map } from 'lucide-react';

// Fix for default markers in react-leaflet
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

  // Coordinates for the corridor
  const djibouti = [11.5890, 43.1458] as [number, number];
  const galafi = [11.7200, 41.8333] as [number, number];
  const semera = [11.7944, 41.0086] as [number, number];
  const awash = [8.9833, 40.1667] as [number, number];
  const modjo = [8.5866, 39.1211] as [number, number];
  
  // Current live vehicle position (between Galafi and Semera for example)
  const currentPos = [11.75, 41.5] as [number, number];

  const routeLine = [djibouti, galafi, currentPos, semera, awash, modjo];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 shrink-0">{t('telematics')}</h2>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        <div className="lg:col-span-3 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0">
          <MapContainer center={[10.5, 41.0]} zoom={7} className="w-full h-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Polyline positions={routeLine} color="#2563EB" weight={4} dashArray="8, 8" />
            <Polyline positions={[djibouti, galafi, currentPos]} color="#059669" weight={5} />

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
                <div className="font-bold text-blue-600">ET-3-88204</div>
                <div>Volvo FH16</div>
                <div>62 km/h</div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-1">
          <Card className="border-blue-200 shadow-md">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">ET-3-88204</h3>
                  <p className="text-sm text-slate-500">Volvo FH16 • Yared Tekle</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Online</Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <Navigation className="text-blue-500 mr-3 shrink-0" size={18} />
                  <div>
                    <p className="text-slate-500 text-xs">Current Speed</p>
                    <p className="font-semibold text-slate-800">62 km/h</p>
                  </div>
                </div>
                
                <div className="flex items-center text-sm">
                  <Map className="text-emerald-500 mr-3 shrink-0" size={18} />
                  <div>
                    <p className="text-slate-500 text-xs">Remaining Distance</p>
                    <p className="font-semibold text-slate-800">325 km</p>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <Clock className="text-amber-500 mr-3 shrink-0" size={18} />
                  <div>
                    <p className="text-slate-500 text-xs">Deep ETA</p>
                    <p className="font-semibold text-slate-800">18.2h remaining</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 flex space-x-3 text-red-700">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Risk Alert: Semera Bypass</p>
                <p className="text-xs mt-1">Minor congestion reported near Semera checkpoint. Rerouting algorithms active.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
