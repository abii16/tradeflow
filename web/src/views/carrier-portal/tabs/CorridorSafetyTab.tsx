import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Fuel, 
  AlertTriangle, 
  CheckCircle2, 
  Navigation, 
  Compass, 
  Radio, 
  Plus, 
  X, 
  Loader2, 
  TrendingUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { getRiskZones, reportCarrierIncident } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface RiskZoneItem {
  id: string;
  title: string;
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  lat: number;
  lng: number;
  radius: number;
}

const FUEL_STATIONS_STATUS = [
  { name: 'Awash Junction Highway Hub', stockPercent: 88, status: 'STOCKED', dieselPrice: '95.50 ETB/L', distanceKm: 590 },
  { name: 'Mille Oasis Commercial Depot', stockPercent: 62, status: 'LIMITED', dieselPrice: '96.20 ETB/L', distanceKm: 380 },
  { name: 'Semera Gateway Station', stockPercent: 91, status: 'STOCKED', dieselPrice: '95.50 ETB/L', distanceKm: 420 },
  { name: 'Galafi Border Outpost Terminal', stockPercent: 44, status: 'CRITICAL', dieselPrice: '97.80 ETB/L', distanceKm: 190 },
  { name: 'Modjo Dry Port Fueling Station', stockPercent: 98, status: 'STOCKED', dieselPrice: '94.80 ETB/L', distanceKm: 810 },
];

export default function CorridorSafetyTab() {
  const [riskZones, setRiskZones] = useState<RiskZoneItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Incident Modal State
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [incidentType, setIncidentType] = useState<string>('CHECKPOINT_DELAY');
  const [severity, setSeverity] = useState<string>('MEDIUM');
  const [incidentLat, setIncidentLat] = useState<string>('11.4320');
  const [incidentLng, setIncidentLng] = useState<string>('40.8050');
  const [notes, setNotes] = useState<string>('');
  const [reportingIncident, setReportingIncident] = useState<boolean>(false);

  // Reroute Proposal Confirmation State (SRS FR-05.3)
  const [showReroutePrompt, setShowReroutePrompt] = useState<boolean>(true);
  const [rerouteAccepted, setRerouteAccepted] = useState<boolean>(false);

  const fetchZones = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getRiskZones();
      if (res?.data) {
        setRiskZones(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch risk zones:', err);
      toast.error('Could not load corridor safety zones');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportingIncident(true);
    try {
      await reportCarrierIncident({
        incidentType,
        severity,
        latitude: parseFloat(incidentLat),
        longitude: parseFloat(incidentLng),
        notes: notes || 'Driver crowdsourced corridor advisory',
      });

      toast.success('Incident logged in central system! Broadcasted to corridor operators.');
      setShowIncidentModal(false);
      setNotes('');
      await fetchZones(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to report incident');
    } finally {
      setReportingIncident(false);
    }
  };

  const handleAcceptReroute = () => {
    setRerouteAccepted(true);
    setShowReroutePrompt(false);
    toast.success('Detour accepted! Active navigation synced to bypass Mille delay (saves 42 mins).');
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
        <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
        <span className="text-xs font-mono">Connecting to Corridor Safety Radar & Fuel Feeds...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight flex items-center gap-2">
            <ShieldAlert size={22} className="text-[#3ECF8E]" />
            Corridor Safety Radar & Fuel Stock Monitor
          </h2>
          <p className="text-xs text-[#8F8F8F] mt-0.5">
            SRS FR-05 &amp; FR-08 Geofenced Hazard Zones, Highway Stock Levels &amp; Mid-Trip Detour Optimization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIncidentModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} /> Report Hazard / Delay
          </button>
          <button
            onClick={() => fetchZones(false)}
            className="bg-[#232323] hover:bg-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] p-2 rounded-xl border border-[#2E2E2E] transition"
            title="Refresh Radar"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* SRS FR-05.3 Mid-Trip Rerouting Proposal Banner */}
      {showReroutePrompt && !rerouteAccepted && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Navigation size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300">
                  SRS FR-05.3 AI Mid-Trip Rerouting Recommendation
                </span>
                <span className="text-[9px] font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-bold">
                  SAVES 42 MINS
                </span>
              </div>
              <p className="text-xs text-[#EDEDED] mt-0.5">
                Heavy customs backlog detected at <strong>Mille Checkpoint (A1)</strong>. 
                Neural routing proposes detour via <strong>B51 Arterial Bypass</strong>: +14 km distance, but saves 42 minutes dwell and 11 liters diesel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setShowReroutePrompt(false)}
              className="px-3 py-1.5 rounded-lg bg-[#232323] hover:bg-[#2E2E2E] text-xs font-semibold text-[#8F8F8F]"
            >
              Decline & Stay on A1
            </button>
            <button
              onClick={handleAcceptReroute}
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 size={13} /> Confirm & Apply Detour
            </button>
          </div>
        </div>
      )}

      {rerouteAccepted && (
        <div className="p-3.5 rounded-xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-xs text-[#3ECF8E] flex items-center justify-between font-mono font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} /> Active Route: B51 Arterial Detour Confirmed & Transmitted to Driver App
          </span>
          <span className="text-[10px] text-[#8F8F8F]">ETA Adjusted: -42 Mins</span>
        </div>
      )}

      {/* Main Grid: Hazard Zones + Fuel Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Risk & Conflict Zones */}
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-[#8F8F8F] flex items-center gap-2">
              <Radio size={15} className="text-[#3ECF8E] animate-pulse" />
              Active Corridor Hazards & Advisories ({riskZones.length})
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              LIVE RADAR
            </span>
          </div>

          <div className="space-y-3">
            {riskZones.map((zone) => {
              const isHigh = zone.severity === 'HIGH' || zone.severity === 'CRITICAL';
              const isMed = zone.severity === 'MEDIUM';

              return (
                <div
                  key={zone.id}
                  className={`p-4 rounded-xl border transition ${
                    isHigh
                      ? 'bg-red-500/5 border-red-500/30'
                      : isMed
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-[#1C1C1C] border-[#2E2E2E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={15}
                        className={isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-blue-400'}
                      />
                      <h4 className="text-xs font-bold text-[#EDEDED]">{zone.title || zone.name}</h4>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        isHigh
                          ? 'bg-red-500/20 text-red-400'
                          : isMed
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {zone.severity}
                    </span>
                  </div>

                  <p className="text-xs text-[#8F8F8F] leading-relaxed mb-3">
                    {zone.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8F8F8F] pt-2 border-t border-[#2E2E2E]/60">
                    <span>GPS: {zone.lat}°N, {zone.lng}°E</span>
                    <span>Geofence: {(zone.radius / 1000).toFixed(0)} km buffer</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Fuel Stations Stock Monitor (FR-05.1) */}
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-[#8F8F8F] flex items-center gap-2">
              <Fuel size={15} className="text-[#3ECF8E]" />
              Corridor Fuel Station Telemetry (FR-05.1)
            </h3>
            <span className="text-[10px] font-mono text-[#8F8F8F]">Diesel Stock Index</span>
          </div>

          <div className="space-y-3">
            {FUEL_STATIONS_STATUS.map((st) => {
              const isCrit = st.stockPercent < 50;
              const isLim = st.stockPercent >= 50 && st.stockPercent < 75;

              return (
                <div
                  key={st.name}
                  className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#EDEDED]">{st.name}</div>
                      <div className="text-[10px] font-mono text-[#8F8F8F]">
                        Corridor KM {st.distanceKm} • Current Tariff: {st.dieselPrice}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        isCrit
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : isLim
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {st.status} ({st.stockPercent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#2E2E2E] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCrit ? 'bg-red-500' : isLim ? 'bg-amber-400' : 'bg-[#3ECF8E]'
                      }`}
                      style={{ width: `${st.stockPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] text-[11px] text-[#8F8F8F] font-mono">
            💡 <strong>Route Optimizer Note:</strong> Refueling at Awash or Modjo is recommended for maximum fuel efficiency and avoidance of Galafi border retail surcharges.
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: REPORT ROAD INCIDENT OR DELAY
          ========================================================================= */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2E2E2E] flex items-center justify-between bg-[#1C1C1C]">
              <div>
                <h3 className="font-bold text-sm text-[#EDEDED] flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  Log Corridor Incident (FR-05.2)
                </h3>
                <p className="text-[10px] font-mono text-[#8F8F8F] mt-0.5">
                  Updates central route optimization in near-real-time
                </p>
              </div>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportIncident} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Incident Classification *
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                >
                  <option value="CHECKPOINT_DELAY">Checkpoint / Customs Congestion Delay</option>
                  <option value="ACCIDENT">Road Accident / Vehicle Breakdown</option>
                  <option value="FUEL_OUTAGE">Fuel Station Stock Shortage</option>
                  <option value="ROAD_HAZARD">Flood / Landslide / Damaged Highway</option>
                  <option value="SECURITY">Elevated Security Caution</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                >
                  <option value="LOW">Low (Informational delay &lt; 30 mins)</option>
                  <option value="MEDIUM">Medium (1-2 hour delay)</option>
                  <option value="HIGH">High (3+ hours or road closure)</option>
                  <option value="CRITICAL">Critical (Impacting corridor passage)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={incidentLat}
                    onChange={(e) => setIncidentLat(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={incidentLng}
                    onChange={(e) => setIncidentLng(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Situation Details / Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Overturned trailer blocking one lane near Mille bridge. Traffic moving slowly."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#2E2E2E] text-xs font-semibold text-[#8F8F8F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportingIncident}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition flex items-center gap-2"
                >
                  {reportingIncident ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Recording...
                    </>
                  ) : (
                    'Publish Incident to Radar'
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
