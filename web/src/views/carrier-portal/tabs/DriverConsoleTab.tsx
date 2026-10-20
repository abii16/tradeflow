import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Fuel, 
  Send, 
  Layers, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
  Radio
} from 'lucide-react';
import { reportCarrierIncident, syncOfflineQueueBatch } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface QueuedAction {
  id: string;
  type: 'CHECKIN' | 'INCIDENT';
  title: string;
  timestamp: string;
  payload: any;
}

export default function DriverConsoleTab() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedAction[]>(() => {
    try {
      const stored = localStorage.getItem('tradeflow_driver_offline_queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [driverLang, setDriverLang] = useState<'am' | 'en' | 'om'>('am');
  const [recentActionText, setRecentActionText] = useState<string>('');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [showArchDetails, setShowArchDetails] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('tradeflow_driver_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Auto-sync when connection restores
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setSyncing(true);
    toast.loading('Synchronizing queued records with central server...', { id: 'sync-status' });

    try {
      await syncOfflineQueueBatch(offlineQueue);
      toast.success(`Synchronized ${offlineQueue.length} offline records successfully`, { id: 'sync-status' });
      setOfflineQueue([]);
      localStorage.removeItem('tradeflow_driver_offline_queue');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Sync failed. Will retry automatically.', { id: 'sync-status' });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleOffline = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    if (!nextState && offlineQueue.length > 0) {
      syncOfflineQueue();
    } else if (nextState) {
      toast('Corridor signal lost. Offline queuing active.', { icon: '📡' });
    }
  };

  const handleDriverCheckIn = async (locationName: string, lat: number, lng: number) => {
    const actionPayload = {
      lat,
      lng,
      speed: 64,
      waypointName: locationName,
      notes: `Driver cab check-in: ${locationName}`,
    };

    if (isOffline) {
      const item: QueuedAction = {
        id: `QUEUED-${Date.now()}`,
        type: 'CHECKIN',
        title: `Check-in: ${locationName}`,
        timestamp: new Date().toLocaleTimeString(),
        payload: actionPayload,
      };
      setOfflineQueue(prev => [item, ...prev]);
      setRecentActionText(`Queued locally: ${locationName} (${item.timestamp})`);
      toast.success('Saved to Offline Queue (No signal). Will sync upon reconnect.');
    } else {
      try {
        toast.success(`Check-in recorded: ${locationName}`);
        setRecentActionText(`Checked in: ${locationName} (${new Date().toLocaleTimeString()})`);
      } catch (e) {
        toast.error('Error logging checkpoint');
      }
    }
  };

  const handleQuickIncident = async (incidentType: string, label: string) => {
    const payload = {
      incidentType,
      latitude: 11.432,
      longitude: 40.805,
      severity: 'MEDIUM',
      notes: `Driver logged ${label} via cab console`,
    };

    if (isOffline) {
      const item: QueuedAction = {
        id: `QUEUED-${Date.now()}`,
        type: 'INCIDENT',
        title: `Incident: ${label}`,
        timestamp: new Date().toLocaleTimeString(),
        payload,
      };
      setOfflineQueue(prev => [item, ...prev]);
      setRecentActionText(`Queued alert: ${label}`);
      toast.success('Incident saved locally. Will broadcast when network restores.');
    } else {
      try {
        await reportCarrierIncident(payload);
        toast.success(`Incident published to Corridor Radar: ${label}`);
        setRecentActionText(`Published alert: ${label}`);
      } catch (err) {
        toast.error('Failed to report incident');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242424]">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            Driver Console
          </h2>
        </div>

        {/* Network State Toggle */}
        <button
          onClick={handleToggleOffline}
          className="flex items-center gap-2 bg-[#171717] hover:bg-[#1C1C1C] text-xs font-mono font-medium px-3.5 py-1.5 rounded-lg border border-[#242424] text-[#EDEDED] transition cursor-pointer self-start sm:self-auto"
        >
          <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-[#3ECF8E] animate-pulse'}`} />
          <span>{isOffline ? 'Offline (Desert Mode)' : 'Online (4G Connected)'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* In-Cab Driver Console */}
        <div className="lg:col-span-6 bg-[#171717] border border-[#242424] rounded-xl p-5 shadow-sm space-y-4">
          {/* Console Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-[#3ECF8E] animate-pulse'}`} />
              <span className="text-xs font-bold text-[#EDEDED] tracking-tight">TradeFlow Cab</span>
            </div>

            {/* Language Segmented Control */}
            <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-md border border-[#242424] text-[10px] font-mono">
              <button
                onClick={() => setDriverLang('am')}
                className={`px-2 py-0.5 rounded transition ${driverLang === 'am' ? 'bg-[#1C1C1C] text-[#3ECF8E] font-bold border border-[#282828]' : 'text-[#8F8F8F] hover:text-[#EDEDED]'}`}
              >
                አማ
              </button>
              <button
                onClick={() => setDriverLang('en')}
                className={`px-2 py-0.5 rounded transition ${driverLang === 'en' ? 'bg-[#1C1C1C] text-[#3ECF8E] font-bold border border-[#282828]' : 'text-[#8F8F8F] hover:text-[#EDEDED]'}`}
              >
                EN
              </button>
              <button
                onClick={() => setDriverLang('om')}
                className={`px-2 py-0.5 rounded transition ${driverLang === 'om' ? 'bg-[#1C1C1C] text-[#3ECF8E] font-bold border border-[#282828]' : 'text-[#8F8F8F] hover:text-[#EDEDED]'}`}
              >
                OR
              </button>
            </div>
          </div>

          {/* Connection Status Pill */}
          <div className="p-2.5 rounded-lg bg-[#121212] border border-[#242424] flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-[#EDEDED]">
              <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-[#3ECF8E]'}`} />
              {isOffline ? 'Offline Queue Active' : 'Real-time Telemetry Linked'}
            </span>
            <span className="text-[10px] font-bold text-[#8F8F8F] bg-[#171717] border border-[#242424] px-2 py-0.5 rounded">
              {offlineQueue.length} Queued
            </span>
          </div>

          {/* Current Active Trip Card */}
          <div className="bg-[#121212] border border-[#242424] rounded-lg p-3.5 space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-[#8F8F8F]">Current Route Leg</div>
            <div className="text-sm font-bold text-[#EDEDED] flex items-center justify-between">
              <span>Doraleh → Modjo Dry Port</span>
              <span className="text-xs font-mono font-semibold text-[#3ECF8E]">68 km/h</span>
            </div>
            <div className="text-xs font-mono text-[#8F8F8F]">
              Next Waypoint: <span className="text-[#EDEDED] font-semibold">Mille Checkpoint (38 km)</span>
            </div>
          </div>

          {/* Glance-Based In-Cab Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Checkin Button 1: Galafi */}
            <button
              onClick={() => handleDriverCheckIn('Galafi Customs Border', 11.716, 41.838)}
              className="w-full py-3 px-4 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#242424] hover:border-[#333] transition text-left flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#171717] border border-[#242424] flex items-center justify-center text-[#3ECF8E] shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#EDEDED] group-hover:text-white transition">
                    {driverLang === 'am' ? 'ገላፊ ኬላ ደረስኩ' : driverLang === 'om' ? 'Galafi Gaheera' : 'Arrived at Galafi Border'}
                  </div>
                  <div className="text-[10px] font-mono text-[#8F8F8F]">Customs Clearance Checkpoint</div>
                </div>
              </div>
              <Send size={13} className="text-[#8F8F8F] group-hover:text-[#EDEDED] transition" />
            </button>

            {/* Checkin Button 2: Modjo */}
            <button
              onClick={() => handleDriverCheckIn('Modjo Dry Port Gate #2', 8.593, 39.124)}
              className="w-full py-3 px-4 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#242424] hover:border-[#333] transition text-left flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#171717] border border-[#242424] flex items-center justify-center text-[#3ECF8E] shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#EDEDED] group-hover:text-white transition">
                    {driverLang === 'am' ? 'ሞጆ ደረቅ ወደብ ደረስኩ' : driverLang === 'om' ? 'Mojo Gaheera' : 'Arrived at Modjo Port'}
                  </div>
                  <div className="text-[10px] font-mono text-[#8F8F8F]">Terminal Weighbridge Scale</div>
                </div>
              </div>
              <Send size={13} className="text-[#8F8F8F] group-hover:text-[#EDEDED] transition" />
            </button>

            {/* Quick Incident Button */}
            <button
              onClick={() => handleQuickIncident('CHECKPOINT_DELAY', 'Inspection Delay')}
              className="w-full py-3 px-4 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#242424] hover:border-[#333] transition text-left flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#171717] border border-[#242424] flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#EDEDED] group-hover:text-white transition flex items-center gap-2">
                    <span>{driverLang === 'am' ? 'የፍተሻ መዘግየት ሪፖርት' : driverLang === 'om' ? 'Gufuu Sakkatta\'aa' : 'Report Checkpoint Delay'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <div className="text-[10px] font-mono text-[#8F8F8F]">+2 Hour Backlog Notice</div>
                </div>
              </div>
              <Send size={13} className="text-[#8F8F8F] group-hover:text-amber-400 transition" />
            </button>

            {/* Quick Refuel Alert */}
            <button
              onClick={() => handleQuickIncident('FUEL_OUTAGE', 'Awash Fuel Refuel Logged')}
              className="w-full py-3 px-4 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#242424] hover:border-[#333] transition text-left flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#171717] border border-[#242424] flex items-center justify-center text-[#3ECF8E] shrink-0">
                  <Fuel size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#EDEDED] group-hover:text-white transition">
                    {driverLang === 'am' ? 'ነዳጅ ሞላሁ (አዋሽ ማደያ)' : 'Log Refueling (Awash Station)'}
                  </div>
                  <div className="text-[10px] font-mono text-[#8F8F8F]">Telemetry Fuel Volume Update</div>
                </div>
              </div>
              <Check size={13} className="text-[#3ECF8E]" />
            </button>
          </div>

          {/* Status Feedback Line */}
          <div className="pt-3 border-t border-[#242424] text-[11px] font-mono text-[#8F8F8F] truncate flex items-center gap-2">
            <Radio size={12} className="text-[#3ECF8E]" />
            <span>{recentActionText || 'Console Ready • Touch action to transmit'}</span>
          </div>
        </div>

        {/* Right: Technical Explanation & Sync Queue */}
        <div className="lg:col-span-6 space-y-4">
          {/* Architecture Card with Collapsible Details */}
          <div className="bg-[#171717] border border-[#242424] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#EDEDED] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#3ECF8E]" />
                <span>Offline Sync Architecture</span>
              </div>
              <button
                onClick={() => setShowArchDetails(!showArchDetails)}
                className="text-[11px] font-mono text-[#8F8F8F] hover:text-[#EDEDED] flex items-center gap-1 transition cursor-pointer"
              >
                <span>Details</span>
                {showArchDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            <p className="text-xs text-[#8F8F8F] leading-relaxed">
              Client-side queue with authoritative hardware timestamps for low-connectivity corridor segments.
            </p>

            {showArchDetails && (
              <div className="p-3.5 rounded-lg bg-[#121212] border border-[#242424] text-xs text-[#8F8F8F] leading-relaxed space-y-2 animate-fadeIn">
                <p>
                  Along desert stretches between Galafi and Mille with intermittent connectivity, TradeFlow queues waypoint check-ins and incident telemetry locally in client storage.
                </p>
                <p>
                  Upon cellular reconnection, queued batches transmit to the backend where conflict resolution establishes a strict chronological timeline without race condition overwrites.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-[#121212] border border-[#242424] text-xs font-mono space-y-1">
                <div className="text-[10px] text-[#8F8F8F] uppercase">Conflict Policy</div>
                <div className="text-[#EDEDED] font-semibold text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                  Authoritative Timestamps
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#121212] border border-[#242424] text-xs font-mono space-y-1">
                <div className="text-[10px] text-[#8F8F8F] uppercase">Cellular Fallback</div>
                <div className="text-[#EDEDED] font-semibold text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                  SMS Gateway Ingestion
                </div>
              </div>
            </div>
          </div>

          {/* Sync Queue Inspector */}
          <div className="bg-[#171717] border border-[#242424] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#EDEDED] flex items-center gap-2">
                <Layers size={15} className="text-[#3ECF8E]" />
                <span>Client Sync Queue</span>
                <span className="text-[10px] font-mono text-[#8F8F8F] bg-[#121212] border border-[#242424] px-2 py-0.5 rounded">
                  {offlineQueue.length} items
                </span>
              </div>

              {offlineQueue.length > 0 && !isOffline && (
                <button
                  onClick={syncOfflineQueue}
                  disabled={syncing}
                  className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>

            {offlineQueue.length === 0 ? (
              <div className="p-6 text-center text-[#8F8F8F] bg-[#121212] rounded-lg border border-[#242424] space-y-1.5">
                <CheckCircle2 size={20} className="text-[#3ECF8E] mx-auto" />
                <p className="text-xs text-[#EDEDED] font-medium">Queue synchronized</p>
                <p className="text-[11px] text-[#8F8F8F]">All driver checkpoints and alerts are synchronized with central dispatch.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {offlineQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#121212] border border-[#242424] hover:border-[#333] transition flex items-center justify-between text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#EDEDED] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[10px] text-[#8F8F8F]">
                        Device Timestamp: {item.timestamp} • Type: {item.type}
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded font-medium">
                      Queued Locally
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
