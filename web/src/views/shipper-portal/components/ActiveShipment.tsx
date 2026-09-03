import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Truck, Star } from 'lucide-react';
import RatingModal from '@/components/modals/RatingModal';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getShipperActiveShipment } from '@/lib/apiClient';

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
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShipment() {
      try {
        const data = await getShipperActiveShipment();
        setShipment(data.shipment);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadShipment();

    const handleRefresh = () => loadShipment();
    window.addEventListener('shipper:load_posted', handleRefresh);
    return () => window.removeEventListener('shipper:load_posted', handleRefresh);
  }, []);

  const handleDownloadWaybill = () => {
    if (!shipment) return;
    
    const waybillText = `
=========================================
      SMART e-CMR WAYBILL (FR-04)
=========================================
Tracking Number: ${shipment.trackingNumber || 'N/A'}
Status: ${shipment.status || 'IN_TRANSIT'}

ORIGIN:
${shipment.load?.origin?.address || 'Djibouti Port / Doraleh Container Terminal (DCT)'}

DESTINATION:
${shipment.load?.destination?.address || 'Modjo Dry Port & Terminal, Ethiopia'}

CARGO DETAILS:
Type: ${shipment.load?.cargoType || '30T Construction Rebar (Flatbed)'}
Weight: ${shipment.load?.weightKg || '32000'} kg

TRANSPORTER / DRIVER:
Name: ${shipment.driver?.fullName || 'Unknown Driver'}

---
Digital Signature Verified
TradeFlow MVP Platform
=========================================
    `;

    const blob = new Blob([waybillText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `e-CMR_${shipment.trackingNumber || 'Waybill'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-4 text-xs text-slate-500">Loading active shipment...</div>;
  if (!shipment) return <div className="p-4 bg-white border border-slate-200 rounded-md text-xs text-slate-500 text-center">No active shipments in transit.</div>;

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

      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Live Shipment Track</span>
          <h2 className="text-sm font-semibold text-slate-900">{shipment?.trackingNumber || 'SHP-9021-DJM'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRatingModal(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded transition-colors"
          >
            <Star size={11} className="fill-amber-500 text-amber-500" /> Rate Carrier
          </button>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded border border-blue-100">
            {shipment?.status === 'IN_TRANSIT' ? 'In Transit' : shipment?.status || 'In Transit'}
          </span>
        </div>
      </div>

      {/* Mini Map */}
      <div className="h-44 w-full border-b border-slate-100 relative">
        <MapContainer center={[10.5, 41.5]} zoom={6} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution="&copy; Google"
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          />
          <Polyline positions={routeLine} color="#2563eb" weight={3} dashArray="4, 4" />
          <Marker position={djibouti} />
          <Marker position={awash} />
          <Marker position={modjo} />
        </MapContainer>
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2 py-1 rounded text-[10px] font-mono border border-slate-200 shadow-xs">
          GPS: Awash Checkpoint • Speed: 62 km/h
        </div>
      </div>

      {/* Progress Track */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span>Milestone Progress (68%)</span>
            <span>ETA: Today, 17:30</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-900 h-full w-[68%]" />
          </div>
        </div>

        {/* Milestones list */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          {[
            { title: 'Djibouti Port Customs Cleared', time: 'Yesterday 14:00', state: 'done' },
            { title: 'Galafi Border Crossing Verified', time: 'Today 06:15', state: 'done' },
            { title: 'Awash RFID Toll Gate', time: 'Today 11:45', state: 'done' },
            { title: 'Modjo Dry Port Ingate Scan', time: 'Est. 17:30', state: 'upcoming' },
          ].map((m, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                  m.state === 'done'
                    ? 'bg-emerald-100 text-emerald-700 font-bold'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {m.state === 'done' ? '✓' : idx + 1}
              </div>
              <span className={`flex-1 truncate ${m.state === 'done' ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                {m.title}
              </span>
              <span className="text-[11px] text-slate-500 font-mono shrink-0">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDownloadWaybill}
            className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-1.5 rounded text-xs font-medium transition-colors"
          >
            Download Smart e-CMR Waybill (TXT)
          </button>
        </div>
      </div>
    </div>
  );
}
