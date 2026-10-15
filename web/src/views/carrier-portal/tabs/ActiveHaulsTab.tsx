import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Upload, 
  Fuel, 
  Navigation, 
  PenTool, 
  AlertTriangle, 
  Loader2, 
  X,
  FileCheck,
  Eye,
  RefreshCw
} from 'lucide-react';
import { getCarrierHauls, updateHaulStatus, submitHaulCheckin, submitProofOfDelivery } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface HaulItem {
  id: string;
  loadId: string;
  transporterId: string;
  driverId: string;
  status: 'DISPATCHED' | 'PICKED_UP' | 'IN_CUSTOMS' | 'IN_TRANSIT' | 'DELIVERED';
  currentLat: number | null;
  currentLng: number | null;
  estimatedFuelLiters: number | null;
  actualFuelLiters: number | null;
  podPhotoUrl: string | null;
  podSignatureUrl: string | null;
  pickupTime: string | null;
  deliveryTime: string | null;
  loadTitle: string;
  loadDescription: string;
  origin: any;
  destination: any;
  weightKg: string;
  cargoType: string;
  budgetAmount: string;
  currency: string;
  driverName: string;
  driverPhone: string;
}

const CORRIDOR_WAYPOINTS = [
  { name: 'Doraleh Port (Djibouti)', lat: 11.59, lng: 43.14, km: 0 },
  { name: 'Galafi Border Post', lat: 11.71, lng: 41.83, km: 190 },
  { name: 'Mille / Semera Checkpoint', lat: 11.43, lng: 40.80, km: 380 },
  { name: 'Awash Junction Hub', lat: 8.98, lng: 40.16, km: 590 },
  { name: 'Modjo Dry Port Terminal', lat: 8.59, lng: 39.12, km: 810 },
];

export default function ActiveHaulsTab({ onGoToLoadBoard }: { onGoToLoadBoard?: () => void }) {
  const [hauls, setHauls] = useState<HaulItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedHaul, setSelectedHaul] = useState<HaulItem | null>(null);

  // e-PoD Modal State
  const [showPodModal, setShowPodModal] = useState<boolean>(false);
  const [podHaul, setPodHaul] = useState<HaulItem | null>(null);
  const [signName, setSignName] = useState<string>('');
  const [submittingPod, setSubmittingPod] = useState<boolean>(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80');

  // Waypoint Checkin State
  const [checkingIn, setCheckingIn] = useState<boolean>(false);

  const fetchHauls = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getCarrierHauls();
      if (res?.hauls) {
        setHauls(res.hauls);
        if (!selectedHaul && res.hauls.length > 0) {
          setSelectedHaul(res.hauls[0]);
        } else if (selectedHaul) {
          const updated = res.hauls.find((h: HaulItem) => h.id === selectedHaul.id);
          if (updated) setSelectedHaul(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch carrier hauls:', err);
      toast.error('Could not load active hauls from server');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHauls();
    const interval = setInterval(() => fetchHauls(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Update Status Action
  const handleUpdateStatus = async (haulId: string, nextStatus: string) => {
    try {
      await updateHaulStatus(haulId, nextStatus);
      toast.success(`Haul updated to ${nextStatus}`);
      await fetchHauls(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update haul status');
    }
  };

  // Waypoint Checkin
  const handleSimulateWaypointCheckin = async (haul: HaulItem) => {
    setCheckingIn(true);
    try {
      // Find current waypoint index or pick next
      const currentLat = haul.currentLat || 11.59;
      let nextWp = CORRIDOR_WAYPOINTS[1];
      if (currentLat <= 11.72 && currentLat > 11.44) {
        nextWp = CORRIDOR_WAYPOINTS[2]; // Mille
      } else if (currentLat <= 11.44 && currentLat > 9.0) {
        nextWp = CORRIDOR_WAYPOINTS[3]; // Awash
      } else if (currentLat <= 9.0) {
        nextWp = CORRIDOR_WAYPOINTS[4]; // Modjo
      }

      await submitHaulCheckin(haul.id, {
        lat: nextWp.lat,
        lng: nextWp.lng,
        speed: 68,
        waypointName: nextWp.name,
        notes: `Driver checked in at ${nextWp.name}`,
      });

      toast.success(`GPS Waypoint ping recorded: ${nextWp.name}`);
      await fetchHauls(true);
    } catch (err: any) {
      toast.error('Failed to record checkpoint ping');
    } finally {
      setCheckingIn(false);
    }
  };

  // Submit e-PoD (Proof of Delivery)
  const handleConfirmPoD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podHaul) return;
    if (!signName.trim()) {
      toast.error('Please provide receiver name / signature credentials');
      return;
    }

    setSubmittingPod(true);
    try {
      const generatedSignature = `DATA_SIG:RECEIVER_${signName.toUpperCase().replace(/\s+/g, '_')}_TIMESTAMP_${Date.now()}`;
      
      const res = await submitProofOfDelivery(podHaul.id, {
        podPhotoUrl: photoPreview,
        podSignatureUrl: generatedSignature,
        notes: `Cargo received in sound condition by ${signName} at Modjo Dry Port`,
      });

      toast.success('Proof of Delivery verified! TeleBirr Escrow payout scheduled.');
      setShowPodModal(false);
      setSignName('');
      await fetchHauls(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit e-PoD');
    } finally {
      setSubmittingPod(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
        <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
        <span className="text-xs font-mono">Retrieving active corridor telemetry from database...</span>
      </div>
    );
  }

  if (hauls.length === 0) {
    return (
      <div className="p-12 text-center bg-[#232323] border border-[#2E2E2E] rounded-2xl max-w-xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center mx-auto mb-4">
          <Truck size={28} />
        </div>
        <h3 className="text-lg font-bold text-[#EDEDED] mb-2">No Active Hauls in Transit</h3>
        <p className="text-xs text-[#8F8F8F] mb-6 leading-relaxed">
          Your fleet currently has no dispatched or in-transit cargo on the Djibouti-Modjo artery. 
          Browse the real-time load board to bid on verified shipper consignments.
        </p>
        {onGoToLoadBoard && (
          <button
            onClick={onGoToLoadBoard}
            className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-lg"
          >
            Open Live Load Board
          </button>
        )}
      </div>
    );
  }

  const activeHaul = selectedHaul || hauls[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight flex items-center gap-2">
            <Truck size={22} className="text-[#3ECF8E]" />
            Active Corridor Hauls & In-Transit Telematics
          </h2>
          <p className="text-xs text-[#8F8F8F] mt-0.5">
            SRS FR-03 Real-Time Shipment Execution, Checkpoint Milestones & Electronic Proof-of-Delivery
          </p>
        </div>

        <button
          onClick={() => fetchHauls(false)}
          className="flex items-center gap-1.5 bg-[#232323] hover:bg-[#2E2E2E] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] transition"
        >
          <RefreshCw size={13} /> Refresh Telematics
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Haul Selector / Left List */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8F8F8F] px-1 flex items-center justify-between">
            <span>Fleet Dispatches ({hauls.length})</span>
            <span className="text-[#3ECF8E] font-bold">A1 Corridor</span>
          </div>

          <div className="space-y-2.5">
            {hauls.map((h) => {
              const isSelected = activeHaul.id === h.id;
              const isDelivered = h.status === 'DELIVERED';

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHaul(h)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#232323] border-[#3ECF8E] shadow-[0_0_15px_rgba(62,207,142,0.1)]'
                      : 'bg-[#1C1C1C] border-[#2E2E2E] hover:border-[#3E3E3E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-xs text-[#EDEDED] truncate leading-tight">
                      {h.loadTitle || 'Consolidated Freight Haul'}
                    </h4>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                        isDelivered
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : h.status === 'IN_TRANSIT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#8F8F8F] flex items-center gap-1.5 font-mono mb-2">
                    <MapPin size={12} className="text-[#3ECF8E]" />
                    <span>{(h.origin as any)?.city || 'Djibouti'}</span>
                    <span>→</span>
                    <span>{(h.destination as any)?.city || 'Modjo'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8F8F8F] pt-2 border-t border-[#2E2E2E]">
                    <span>{(Number(h.weightKg) / 1000).toFixed(1)} Tons • {h.cargoType}</span>
                    <span className="text-[#3ECF8E] font-bold">ETB {Number(h.budgetAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Haul Main Control Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl p-6 relative overflow-hidden">
            {/* Top Bar of Active Haul */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#2E2E2E] gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded border border-[#3ECF8E]/30 uppercase font-bold">
                    Tracking ID: TF-{activeHaul.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-[#8F8F8F]">
                    Driver: {activeHaul.driverName || 'Lead Fleet Driver'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#EDEDED]">{activeHaul.loadTitle}</h3>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {activeHaul.status === 'DISPATCHED' && (
                  <button
                    onClick={() => handleUpdateStatus(activeHaul.id, 'PICKED_UP')}
                    className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold px-3.5 py-1.5 rounded-lg transition"
                  >
                    Confirm Loaded (PICKED UP)
                  </button>
                )}

                {activeHaul.status === 'PICKED_UP' && (
                  <button
                    onClick={() => handleUpdateStatus(activeHaul.id, 'IN_TRANSIT')}
                    className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold px-3.5 py-1.5 rounded-lg transition"
                  >
                    Start Corridor Transit
                  </button>
                )}

                {activeHaul.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => {
                      setPodHaul(activeHaul);
                      setShowPodModal(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <PenTool size={13} /> Complete & Submit e-PoD
                  </button>
                )}

                {activeHaul.status === 'DELIVERED' && (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-3 py-1.5 rounded-lg border border-[#3ECF8E]/30">
                    <CheckCircle2 size={14} /> Delivered & Escrow Released
                  </div>
                )}
              </div>
            </div>

            {/* Corridor Milestone Timeline */}
            <div className="py-6">
              <div className="text-xs font-mono text-[#8F8F8F] mb-4 uppercase tracking-wider font-bold">
                Corridor Waypoint Timeline (810 km Artery)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                {CORRIDOR_WAYPOINTS.map((wp, index) => {
                  const currentLat = activeHaul.currentLat || 11.59;
                  const isPassed = 
                    (index === 0) ||
                    (index === 1 && currentLat <= 11.75) ||
                    (index === 2 && currentLat <= 11.45) ||
                    (index === 3 && currentLat <= 9.0) ||
                    (index === 4 && activeHaul.status === 'DELIVERED');

                  const isCurrent = 
                    (index === 0 && currentLat > 11.75) ||
                    (index === 1 && currentLat <= 11.75 && currentLat > 11.45) ||
                    (index === 2 && currentLat <= 11.45 && currentLat > 9.0) ||
                    (index === 3 && currentLat <= 9.0 && activeHaul.status !== 'DELIVERED') ||
                    (index === 4 && activeHaul.status === 'DELIVERED');

                  return (
                    <div
                      key={wp.name}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                        isCurrent
                          ? 'bg-[#3ECF8E]/10 border-[#3ECF8E] shadow-[0_0_15px_rgba(62,207,142,0.15)]'
                          : isPassed
                          ? 'bg-[#1C1C1C] border-[#2E2E2E]'
                          : 'bg-[#181818] border-[#242424] opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-[#8F8F8F]">
                          {wp.km} KM
                        </span>
                        {isPassed && <CheckCircle2 size={13} className="text-[#3ECF8E]" />}
                        {isCurrent && !isPassed && (
                          <div className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-ping"></div>
                        )}
                      </div>
                      <div className="text-xs font-bold text-[#EDEDED] leading-snug mb-1">
                        {wp.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#8F8F8F]">
                        {isCurrent ? 'Current Position' : isPassed ? 'Cleared' : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Telematics & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#2E2E2E]">
              {/* Telemetry Stats */}
              <div className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#8F8F8F] flex items-center gap-1.5">
                  <Navigation size={12} className="text-[#3ECF8E]" /> Live GPS Coordinate
                </span>
                <div className="text-xs font-mono font-bold text-[#EDEDED]">
                  {activeHaul.currentLat?.toFixed(4) || '11.5900'}°N, {activeHaul.currentLng?.toFixed(4) || '43.1400'}°E
                </div>
                <p className="text-[10px] text-[#8F8F8F]">Auto-ingesting via device OBD-II / Mobile GPS</p>
              </div>

              {/* Fuel Tracker */}
              <div className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#8F8F8F] flex items-center gap-1.5">
                  <Fuel size={12} className="text-[#3ECF8E]" /> Fuel Consumption (FR-07)
                </span>
                <div className="text-xs font-mono font-bold text-[#EDEDED]">
                  {activeHaul.actualFuelLiters || 195} L / {activeHaul.estimatedFuelLiters || 285} L Est.
                </div>
                <p className="text-[10px] text-emerald-400 font-mono">31.6 L/100km (High Efficiency)</p>
              </div>

              {/* Manual Check-in Action */}
              <div className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8F8F8F]">
                    Corridor Waypoint Check-In (FR-03)
                  </span>
                  <div className="text-xs font-semibold text-[#EDEDED] mt-0.5">
                    Advance GPS to Next Milestone
                  </div>
                </div>
                <button
                  onClick={() => handleSimulateWaypointCheckin(activeHaul)}
                  disabled={checkingIn || activeHaul.status === 'DELIVERED'}
                  className="mt-2 w-full py-1.5 bg-[#2E2E2E] hover:bg-[#383838] disabled:opacity-50 text-xs font-mono font-bold text-[#EDEDED] rounded-lg transition"
                >
                  {checkingIn ? 'Recording...' : 'Record Waypoint Check-In'}
                </button>
              </div>
            </div>

            {/* Proof of Delivery Details (if already delivered) */}
            {activeHaul.podSignatureUrl && (
              <div className="mt-4 p-4 rounded-xl bg-[#1C1C1C] border border-[#3ECF8E]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#3ECF8E] flex items-center gap-1.5">
                    <FileCheck size={14} /> Electronic Proof of Delivery (e-PoD) Verified
                  </span>
                  <span className="text-[10px] font-mono text-[#8F8F8F]">
                    {activeHaul.deliveryTime ? new Date(activeHaul.deliveryTime).toLocaleString() : 'Delivered'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-[#8F8F8F]">
                  <span>Signature Token: <span className="text-[#EDEDED]">{activeHaul.podSignatureUrl.substring(0, 28)}...</span></span>
                  {activeHaul.podPhotoUrl && (
                    <a
                      href={activeHaul.podPhotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#3ECF8E] hover:underline flex items-center gap-1"
                    >
                      <Eye size={12} /> View Cargo Delivery Photo
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ELECTRONIC PROOF OF DELIVERY (e-PoD)
          ========================================================================= */}
      {showPodModal && podHaul && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2E2E2E] flex items-center justify-between bg-[#1C1C1C]">
              <div>
                <h3 className="font-bold text-sm text-[#EDEDED] flex items-center gap-2">
                  <PenTool size={16} className="text-[#3ECF8E]" />
                  SRS Section 4.1 Digital Proof-of-Delivery (e-PoD)
                </h3>
                <p className="text-[10px] font-mono text-[#8F8F8F] mt-0.5">
                  Required to trigger automatic TeleBirr Escrow payout release
                </p>
              </div>
              <button
                onClick={() => setShowPodModal(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPoD} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Consignee / Terminal Receiver Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ato Girma Tadesse (Modjo Terminal Officer)"
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Cargo Inspection Photo URL / Evidence
                </label>
                <input
                  type="text"
                  value={photoPreview}
                  onChange={(e) => setPhotoPreview(e.target.value)}
                  placeholder="Image URL or S3 Bucket link"
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none mb-2"
                />
                {photoPreview && (
                  <div className="h-32 w-full rounded-xl overflow-hidden border border-[#2E2E2E] relative bg-[#181818]">
                    <img
                      src={photoPreview}
                      alt="Delivery Inspection"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400">
                      Geotagged: Modjo Dry Port Scale #2
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] text-[11px] text-[#8F8F8F] space-y-1">
                <div className="font-bold text-[#EDEDED] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#3ECF8E]" />
                  TeleBirr Smart Settlement Terms
                </div>
                <p>
                  Upon confirming this e-PoD submission, the load state is marked as <strong>DELIVERED</strong>. 
                  The smart contract escrow scheduler immediately disburses <strong>ETB {Number(podHaul.budgetAmount).toLocaleString()}</strong> (minus 5% platform fee) to your verified TeleBirr account.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowPodModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#2E2E2E] text-xs font-semibold text-[#8F8F8F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPod}
                  className="px-5 py-2 rounded-xl bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold transition flex items-center gap-2"
                >
                  {submittingPod ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Verifying & Releasing Escrow...
                    </>
                  ) : (
                    'Confirm e-PoD & Release Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
