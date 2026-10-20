import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Upload,
  PenTool,
  AlertTriangle,
  Loader2,
  X,
  FileCheck,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  User,
  Phone
} from 'lucide-react';
import {
  getCarrierHauls,
  updateHaulStatus,
  submitHaulCheckin,
  submitProofOfDelivery,
  getHaulEta,
  assignHaulDriver,
  getCarrierDrivers,
  getCarrierVehicles
} from '@/lib/apiClient';
import CarrierLiveGpsMap from '../components/CarrierLiveGpsMap';
import toast from 'react-hot-toast';

interface HaulItem {
  id: string;
  loadId: string;
  transporterId: string;
  driverId: string;
  truckPlate?: string;
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

export interface CorridorWaypoint {
  name: string;
  km: number;
  lat: number;
  lng: number;
}

export function getRouteCorridor(origin: any, destination: any) {
  const o = ((typeof origin === 'string' ? origin : origin?.city || origin?.address || '') + '').toLowerCase();
  const d = ((typeof destination === 'string' ? destination : destination?.city || destination?.address || '') + '').toLowerCase();

  if (d.includes('addis') || (o.includes('modjo') && d.includes('addis'))) {
    return {
      title: 'Modjo ➔ Addis Ababa Artery (74 km Artery)',
      totalKm: 74,
      waypoints: [
        { name: 'Modjo Dry Port Terminal', km: 0, lat: 8.59, lng: 39.12 },
        { name: 'Bishoftu Expressway Toll', km: 25, lat: 8.75, lng: 38.98 },
        { name: 'Dukem Logistics Hub', km: 42, lat: 8.80, lng: 38.90 },
        { name: 'Kaliti Inland Customs', km: 60, lat: 8.92, lng: 38.77 },
        { name: 'Addis Ababa Distribution', km: 74, lat: 9.03, lng: 38.74 },
      ],
    };
  }

  if (d.includes('dire dawa') || o.includes('dire dawa')) {
    return {
      title: 'Djibouti ➔ Dire Dawa Artery (380 km Artery)',
      totalKm: 380,
      waypoints: [
        { name: 'Doraleh Port (Djibouti)', km: 0, lat: 11.59, lng: 43.14 },
        { name: 'Dewele Border Post', km: 110, lat: 11.04, lng: 42.63 },
        { name: 'Ayesha Checkpoint', km: 220, lat: 10.75, lng: 42.56 },
        { name: 'Shinile Waypoint', km: 310, lat: 9.70, lng: 41.85 },
        { name: 'Dire Dawa Free Trade Zone', km: 380, lat: 9.59, lng: 41.86 },
      ],
    };
  }

  return {
    title: 'Djibouti ➔ Modjo Corridor (810 km Artery)',
    totalKm: 810,
    waypoints: [
      { name: 'Doraleh Port (Djibouti)', km: 0, lat: 11.59, lng: 43.14 },
      { name: 'Galafi Border Post', km: 190, lat: 11.71, lng: 41.83 },
      { name: 'Mille / Semera Checkpoint', km: 380, lat: 11.43, lng: 40.80 },
      { name: 'Awash Junction Hub', km: 590, lat: 8.98, lng: 40.16 },
      { name: 'Modjo Dry Port Terminal', km: 810, lat: 8.59, lng: 39.12 },
    ],
  };
}

export function getActiveWaypointIndex(haul: HaulItem, waypoints: CorridorWaypoint[]): number {
  if (haul.status === 'DELIVERED') {
    return waypoints.length - 1;
  }
  if (haul.status === 'DISPATCHED' || haul.status === 'PICKED_UP' || haul.currentLat == null) {
    return 0;
  }

  let closestIdx = 0;
  let minDistanceSq = Number.MAX_VALUE;
  for (let i = 0; i < waypoints.length; i++) {
    const dLat = Number(haul.currentLat) - waypoints[i].lat;
    const dLng = Number(haul.currentLng) - waypoints[i].lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestIdx = i;
    }
  }
  return closestIdx;
}

export default function ActiveHaulsTab({ onGoToLoadBoard }: { onGoToLoadBoard?: () => void }) {
  const [hauls, setHauls] = useState<HaulItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedHaul, setSelectedHaul] = useState<HaulItem | null>(null);
  const [showTimeline, setShowTimeline] = useState<boolean>(true);
  const [showMap, setShowMap] = useState<boolean>(true);

  // AI ETA State (SRS FR-03.2)
  const [etaData, setEtaData] = useState<{
    predictedHours: number;
    predictedEtaMinutes: number;
    estimatedArrival: string;
    remainingDistanceKm: number;
    model: string;
  } | null>(null);
  const [etaLoading, setEtaLoading] = useState<boolean>(false);
  const [etaError, setEtaError] = useState<string | null>(null);

  // e-PoD Modal State
  const [showPodModal, setShowPodModal] = useState<boolean>(false);
  const [podHaul, setPodHaul] = useState<HaulItem | null>(null);
  const [signName, setSignName] = useState<string>('');
  const [submittingPod, setSubmittingPod] = useState<boolean>(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Waypoint Checkin State
  const [checkingIn, setCheckingIn] = useState<boolean>(false);

  // Live IoT Fuel Telematics Simulation State
  const [liveFuelOffset, setLiveFuelOffset] = useState<number>(0);

  // Reset live fuel offset when selected haul changes or new server fuel received
  useEffect(() => {
    setLiveFuelOffset(0);
  }, [selectedHaul?.id, selectedHaul?.actualFuelLiters]);

  // Dynamic live fuel ticking when haul is in transit
  useEffect(() => {
    const currentStatus = selectedHaul?.status || (hauls.length > 0 ? hauls[0].status : null);
    if (currentStatus !== 'IN_TRANSIT') return;

    // Simulate real vehicle CAN-bus sensor consumption (e.g. ~0.02 L every 3.5 seconds at 68 km/h)
    const timer = setInterval(() => {
      setLiveFuelOffset((prev) => Number((prev + 0.02).toFixed(2)));
    }, 3500);

    return () => clearInterval(timer);
  }, [selectedHaul?.id, selectedHaul?.status, hauls]);

  // Driver & Truck Assignment State
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedTruckPlate, setSelectedTruckPlate] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  const loadFleetResources = async () => {
    try {
      const [dRes, vRes] = await Promise.all([
        getCarrierDrivers(),
        getCarrierVehicles(),
      ]);
      if (dRes?.drivers) setAvailableDrivers(dRes.drivers);
      if (vRes?.vehicles) setAvailableVehicles(vRes.vehicles);
    } catch (err) {
      console.warn('Could not load fleet resources:', err);
    }
  };

  const handleAssignDriverAndTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHaul) return;
    setAssigning(true);
    try {
      await assignHaulDriver(activeHaul.id, {
        driverId: selectedDriverId || undefined,
        truckPlate: selectedTruckPlate || undefined,
      });
      toast.success('Driver and truck assigned to haul!');
      setShowAssignModal(false);
      await fetchHauls(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  const fetchEta = async (haulId: string) => {
    setEtaLoading(true);
    setEtaError(null);
    try {
      const res = await getHaulEta(haulId);
      if (res?.success) {
        setEtaData(res);
      }
    } catch (err: any) {
      console.warn('AI ETA prediction error:', err);
      setEtaData(null);
      setEtaError(err.response?.data?.error || 'AI Prediction Engine (Port 8000) unreachable. Live ETA inference failed.');
    } finally {
      setEtaLoading(false);
    }
  };

  const fetchHauls = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getCarrierHauls();
      if (res?.hauls) {
        setHauls(res.hauls);
        if (!selectedHaul && res.hauls.length > 0) {
          setSelectedHaul(res.hauls[0]);
          fetchEta(res.hauls[0].id);
        } else if (selectedHaul) {
          const updated = res.hauls.find((h: HaulItem) => h.id === selectedHaul.id);
          if (updated) {
            setSelectedHaul(updated);
          }
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

  useEffect(() => {
    if (selectedHaul?.id) {
      fetchEta(selectedHaul.id);
    }
  }, [selectedHaul?.id]);

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

  // Waypoint Checkin (advances to next waypoint along this route)
  const handleSimulateWaypointCheckin = async (haul: HaulItem) => {
    if (haul.status === 'DELIVERED') {
      toast('Haul is already delivered.', { icon: 'ℹ️' });
      return;
    }
    const corridor = getRouteCorridor(haul.origin, haul.destination);
    const currentIdx = getActiveWaypointIndex(haul, corridor.waypoints);
    const nextIdx = Math.min(corridor.waypoints.length - 1, currentIdx + 1);
    const nextWp = corridor.waypoints[nextIdx];
    const fuelUsed = Math.round((nextWp.km / 100) * 35);

    setCheckingIn(true);
    try {
      await submitHaulCheckin(haul.id, {
        lat: nextWp.lat,
        lng: nextWp.lng,
        speed: 68,
        waypointName: nextWp.name,
        fuelLiters: fuelUsed,
        notes: `Driver check-in at ${nextWp.name} (${nextWp.km} KM)`,
      });

      toast.success(`GPS ping recorded: ${nextWp.name} (${nextWp.km} KM)`);
      await fetchHauls(true);
      fetchEta(haul.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Backend error: Failed to record checkpoint ping');
    } finally {
      setCheckingIn(false);
    }
  };

  // Click on a specific waypoint card directly to record check-in at that waypoint
  const handleWaypointClick = async (haul: HaulItem, wp: CorridorWaypoint, index: number) => {
    if (haul.status === 'DELIVERED') {
      toast(`Milestone "${wp.name}" was completed upon final delivery.`, { icon: '✅' });
      return;
    }
    const fuelUsed = Math.round((wp.km / 100) * 35);
    setCheckingIn(true);
    try {
      await submitHaulCheckin(haul.id, {
        lat: wp.lat,
        lng: wp.lng,
        speed: 65,
        waypointName: wp.name,
        fuelLiters: fuelUsed,
        notes: `Driver checkpoint ping at ${wp.name} (${wp.km} KM)`,
      });
      toast.success(`Checked in at ${wp.name} (${wp.km} KM)! GPS & AI ETA updated.`);
      await fetchHauls(true);
      fetchEta(haul.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Backend error: Failed to record checkpoint ping');
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
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            Active Hauls
          </h2>
        </div>

        <button
          onClick={() => fetchHauls(false)}
          className="flex items-center gap-1.5 bg-[#232323] hover:bg-[#2E2E2E] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Haul Selector / Left List */}
        <div className="xl:col-span-3 space-y-2.5 -mt-2">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8F8F8F] px-1 flex items-center justify-between">
            <span>Dispatches ({hauls.length})</span>
          </div>

          <div className="space-y-2.5">
            {hauls.map((h) => {
              const isSelected = activeHaul.id === h.id;
              const isDelivered = h.status === 'DELIVERED';

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHaul(h)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${isSelected
                      ? 'bg-[#232323] border-[#3ECF8E] shadow-[0_0_15px_rgba(62,207,142,0.1)]'
                      : 'bg-[#1C1C1C] border-[#2E2E2E] hover:border-[#3E3E3E]'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-xs text-[#EDEDED] truncate leading-tight">
                      {(h.loadTitle || 'Consolidated Freight Haul').replace(/^Freight:\s*/i, '')}
                    </h4>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${isDelivered
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                          : h.status === 'IN_TRANSIT'
                            ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/25'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        }`}
                    >
                      {h.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#8F8F8F] flex items-center gap-1.5 font-mono mb-2">
                    <span>{(h.origin as any)?.city || 'Djibouti'}</span>
                    <span>→</span>
                    <span>{(h.destination as any)?.city || 'Modjo'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8F8F8F] pt-1.5 border-t border-[#2E2E2E]">
                    <span className="text-[#3ECF8E] font-bold">ETB {Number(h.budgetAmount || 0).toLocaleString()}</span>
                    {isSelected && etaData && (
                      <span className="text-amber-400 font-bold">
                        {etaData.remainingDistanceKm} km to terminal
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Haul Main Control Panel */}
        <div className="xl:col-span-9 space-y-4">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl p-5 relative overflow-hidden">
            {/* Top Bar of Active Haul */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3.5 border-b border-[#2E2E2E] gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-bold text-[#EDEDED]">
                  {(activeHaul.loadTitle || 'Consolidated Freight Haul').replace(/^Freight:\s*/i, '')}
                </h3>
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
                    className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-[0_0_18px_rgba(62,207,142,0.25)] hover:shadow-[0_0_24px_rgba(62,207,142,0.35)] cursor-pointer"
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

            {/* Live Telematics & Quick Actions */}
            {(() => {
              const corridor = getRouteCorridor(activeHaul.origin, activeHaul.destination);
              const currentWpIdx = getActiveWaypointIndex(activeHaul, corridor.waypoints);
              const currentWp = corridor.waypoints[currentWpIdx];
              const nextWpIdx = Math.min(corridor.waypoints.length - 1, currentWpIdx + 1);
              const nextWp = corridor.waypoints[nextWpIdx];

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">

                  {/* AI Predicted ETA (SRS FR-03.2) */}
                  <div
                    className={`px-5 py-2.5 rounded-xl border flex flex-col justify-between min-h-[76px] transition-colors ${activeHaul.status === 'DELIVERED'
                        ? 'bg-[#1C1C1C] border-[#2E2E2E]'
                        : etaError
                          ? 'bg-rose-500/10 border-rose-500/40'
                          : 'bg-[#1C1C1C] border-[#2E2E2E] hover:border-[#383838]'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${etaError ? 'text-rose-400' : 'text-[#EDEDED]'}`}>
                        AI ETA
                      </span>
                      {etaError && (
                        <button
                          type="button"
                          onClick={() => fetchEta(activeHaul.id)}
                          className="text-[9px] font-mono text-rose-400 hover:text-white underline cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                    </div>

                    {activeHaul.status === 'DELIVERED' ? (
                      <div className="flex items-baseline justify-between font-mono my-auto">
                        <span className="text-xs font-bold text-[#3ECF8E]">Delivered</span>
                        <span className="text-xs font-semibold text-[#3ECF8E]">0h left</span>
                      </div>
                    ) : etaLoading ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-[#8F8F8F] my-auto">
                        <Loader2 size={12} className="animate-spin text-[#3ECF8E]" />
                        <span>Querying AI Engine...</span>
                      </div>
                    ) : etaError ? (
                      <div className="my-auto">
                        <div className="text-xs font-bold text-rose-400 leading-tight">AI Engine Offline</div>
                      </div>
                    ) : etaData ? (
                      <div className="flex items-baseline justify-between font-mono my-auto">
                        <span className="text-xs font-bold text-[#3ECF8E] truncate">
                          {etaData.estimatedArrival}
                        </span>
                        <span className="text-xs font-semibold text-[#3ECF8E] shrink-0 ml-2">
                          {etaData.predictedHours}h left
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-[#8F8F8F] my-auto">Awaiting dispatch</div>
                    )}
                  </div>

                  {/* Fuel Telematics (Live IoT Sensor) */}
                  {(() => {
                    const rawActual = activeHaul.actualFuelLiters != null && activeHaul.actualFuelLiters > 0
                      ? Number(activeHaul.actualFuelLiters)
                      : (activeHaul.status === 'DELIVERED' ? Number(activeHaul.estimatedFuelLiters || 28) : (activeHaul.status === 'IN_TRANSIT' ? 15.0 : 0));
                    
                    const estFuel = Number(activeHaul.estimatedFuelLiters) || 28.0;
                    const isLive = activeHaul.status === 'IN_TRANSIT';
                    const currentFuel = isLive 
                      ? Number((rawActual + liveFuelOffset).toFixed(2))
                      : Number(rawActual.toFixed(1));
                    
                    const burnPct = Math.min(100, Math.round((currentFuel / estFuel) * 100));

                    return (
                      <div
                        className="px-5 py-2.5 rounded-xl border border-[#2E2E2E] hover:border-[#383838] bg-[#1C1C1C] flex flex-col justify-between min-h-[76px] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#EDEDED]">
                            Fuel
                          </span>
                          {isLive ? (
                            <span className="flex items-center gap-1 text-[9px] font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 px-1.5 py-0.5 rounded border border-[#3ECF8E]/20 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse"></span>
                              LIVE SENSOR
                            </span>
                          ) : activeHaul.status === 'DELIVERED' ? (
                            <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold">
                              TRIP COMPLETE
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                              STANDBY
                            </span>
                          )}
                        </div>

                        <div className="my-auto space-y-1">
                          <div className="flex items-baseline justify-between font-mono">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs font-bold text-[#EDEDED]">
                                {currentFuel.toFixed(1)} L
                              </span>
                              <span className="text-xs font-medium text-[#8F8F8F]">
                                / {estFuel.toFixed(0)} L
                              </span>
                            </div>
                            <span className="text-[10px] text-[#3ECF8E] font-semibold font-mono">
                              {burnPct}% burned
                            </span>
                          </div>

                          {/* Live Consumption Progress Bar */}
                          <div className="w-full bg-[#121212] h-1.5 rounded-full overflow-hidden border border-[#262626]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#3ECF8E] to-emerald-400 transition-all duration-700 ease-out"
                              style={{ width: `${burnPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Waypoint Check-in Action */}
                  <div className="px-5 py-2.5 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] flex flex-col justify-between min-h-[76px]">
                    <div className="flex items-center justify-end">
                      <span className="text-[9px] font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 px-1.5 py-0.5 rounded border border-[#3ECF8E]/20 font-bold">
                        {currentWpIdx + 1}/{corridor.waypoints.length}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-[#EDEDED] truncate my-auto flex items-center justify-between">
                      <span className="truncate">{currentWp.name}</span>
                      <span className="text-[10px] text-[#8F8F8F] shrink-0 font-normal ml-2">({currentWp.km} km)</span>
                    </div>
                    {activeHaul.status === 'DELIVERED' || currentWpIdx >= corridor.waypoints.length - 1 ? (
                      <div className="text-[10px] font-mono text-[#3ECF8E] font-bold">
                        ✓ At Terminal
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSimulateWaypointCheckin(activeHaul)}
                        disabled={checkingIn}
                        className="w-full py-1 px-2.5 bg-[#2E2E2E] hover:bg-[#383838] disabled:opacity-50 text-[10px] font-mono font-bold text-[#EDEDED] hover:text-[#3ECF8E] rounded-lg border border-[#3A3A3A] transition flex items-center justify-between cursor-pointer"
                      >
                        <span>{checkingIn ? 'Saving...' : 'Check-in'}</span>
                        <span className="text-[#3ECF8E]">+{nextWp.km - currentWp.km} km →</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Live Corridor GPS Radar Map (SRS FR-03.1 / Admin-grade Google Hybrid Telematics) */}
            <div className="mt-4 pt-3.5 border-t border-[#2E2E2E] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#EDEDED] tracking-wider uppercase font-mono">
                  Live GPS Tracking
                </h4>

                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-1.5 text-[10px] font-mono bg-[#1C1C1C] hover:bg-[#2A2A2A] text-[#8F8F8F] hover:text-[#EDEDED] px-2.5 py-1 rounded-lg border border-[#2E2E2E] transition cursor-pointer"
                >
                  {showMap ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
                </button>
              </div>

              {showMap && (
                <CarrierLiveGpsMap
                  haulId={activeHaul.id}
                  loadTitle={activeHaul.loadTitle}
                  driverName={activeHaul.driverName}
                  driverPhone={activeHaul.driverPhone}
                  truckPlate={activeHaul.truckPlate || '3-ET-74192'}
                  status={activeHaul.status}
                  currentLat={activeHaul.currentLat}
                  currentLng={activeHaul.currentLng}
                  waypoints={getRouteCorridor(activeHaul.origin, activeHaul.destination).waypoints}
                  currentWaypointIndex={getActiveWaypointIndex(
                    activeHaul,
                    getRouteCorridor(activeHaul.origin, activeHaul.destination).waypoints
                  )}
                  etaString={etaData ? `${etaData.estimatedArrival} (${etaData.predictedHours}h left)` : undefined}
                  onWaypointCheckin={(wp, idx) => handleWaypointClick(activeHaul, wp, idx)}
                />
              )}

              {/* Haul Tracking & Fleet Telematics Badges (Below Map) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#2E2E2E]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded border border-[#3ECF8E]/30 uppercase font-bold">
                    Tracking ID: TF-{activeHaul.id.substring(0, 8).toUpperCase()}
                  </span>

                  {/* Assigned Driver Badge */}
                  <div className="flex items-center gap-1.5 bg-[#181818] border border-[#2E2E2E] px-2 py-0.5 rounded text-[11px] font-mono">
                    <User size={12} className="text-[#3ECF8E]" />
                    <span className="text-[#8F8F8F]">Driver:</span>
                    <span className="text-[#EDEDED] font-semibold">{activeHaul.driverName || 'Lead Fleet Driver'}</span>
                    {activeHaul.driverPhone && (
                      <span className="text-[#8F8F8F] text-[10px] flex items-center gap-1 ml-1 border-l border-[#333] pl-1.5">
                        <Phone size={10} className="text-[#3ECF8E]" />
                        {activeHaul.driverPhone}
                      </span>
                    )}
                  </div>

                  {/* Assigned Truck / Plate Badge */}
                  <div className="flex items-center gap-1.5 bg-[#181818] border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-mono">
                    <Truck size={12} className="text-amber-400" />
                    <span className="text-[#8F8F8F]">Plate / ታርጋ:</span>
                    <span className="text-amber-300 font-bold tracking-wider">
                      {activeHaul.truckPlate || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Reassign Driver & Truck Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDriverId(activeHaul.driverId || '');
                    setSelectedTruckPlate(activeHaul.truckPlate || '');
                    loadFleetResources();
                    setShowAssignModal(true);
                  }}
                  className="text-[10px] font-mono bg-[#2E2E2E] hover:bg-[#383838] text-[#3ECF8E] px-2.5 py-1 rounded-lg border border-[#3ECF8E]/30 transition flex items-center gap-1.5 font-semibold"
                  title="Assign or change driver and truck plate"
                >
                  <PenTool size={11} className="text-[#3ECF8E]" />
                  <span>Assign Driver / Truck</span>
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
                  Cargo Inspection Photo Evidence *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-[#8F8F8F] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#3ECF8E] file:text-black hover:file:bg-[#34b27b] cursor-pointer mb-2"
                />
                <input
                  type="text"
                  value={photoPreview.startsWith('data:') ? '' : photoPreview}
                  onChange={(e) => setPhotoPreview(e.target.value)}
                  placeholder="Or paste image URL / document link"
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none mb-2"
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
      {/* Driver & Truck Assignment Modal */}
      {showAssignModal && activeHaul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#2E2E2E] flex items-center justify-between bg-[#232323]">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[#3ECF8E]" />
                <h3 className="font-bold text-sm text-[#EDEDED]">
                  Assign Driver & Truck Asset
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-[#8F8F8F] hover:text-white transition p-1 rounded-lg hover:bg-[#2E2E2E]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignDriverAndTruck} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-[#232323] border border-[#2E2E2E] space-y-1">
                <span className="text-[10px] font-mono text-[#3ECF8E] font-bold">
                  TF-{activeHaul.id.substring(0, 8).toUpperCase()} • {activeHaul.loadTitle}
                </span>
                <p className="text-xs text-[#8F8F8F]">
                  Select a registered fleet driver and commercial transport vehicle plate for this active haul on the corridor.
                </p>
              </div>

              {/* Driver Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8F8F8F] block">
                  Assign Fleet Driver (የተመደበ ሹፌር)
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-[#151515] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:border-[#3ECF8E] focus:outline-none"
                >
                  <option value="">-- Choose fleet driver --</option>
                  {availableDrivers.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone || 'No phone'}) - {d.companyName || 'Driver'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#707070]">
                  Drivers receive trip dispatch instructions and waypoint GPS logging on their mobile terminal.
                </p>
              </div>

              {/* Truck Plate Select / Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8F8F8F] block">
                  Truck License Plate Number (የመኪና ታርጋ ቁጥር)
                </label>
                {availableVehicles.length > 0 && (
                  <div className="mb-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) setSelectedTruckPlate(e.target.value);
                      }}
                      className="w-full bg-[#151515] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:border-[#3ECF8E] focus:outline-none"
                    >
                      <option value="">-- Choose from registered fleet vehicles --</option>
                      {availableVehicles.map((v: any) => (
                        <option key={v.id} value={v.plateNumber || ''}>
                          {v.plateNumber || 'No plate'} • {v.vehicleType} ({v.capacityTons}T)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="e.g. 3-ET-74192 or 3-AA-98214"
                  value={selectedTruckPlate}
                  onChange={(e) => setSelectedTruckPlate(e.target.value)}
                  className="w-full bg-[#151515] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs font-mono text-[#3ECF8E] focus:border-[#3ECF8E] focus:outline-none uppercase placeholder:text-[#555]"
                />
                <p className="text-[10px] text-[#707070]">
                  Format standard: Regional Code - Code - Number (e.g., 3-AA-98214 or 3-ET-74192).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#232323] hover:bg-[#2E2E2E] text-xs font-semibold text-[#8F8F8F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 rounded-xl bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold transition flex items-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Assigning Asset...
                    </>
                  ) : (
                    'Save Driver & Truck'
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
