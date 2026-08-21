import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Map, AlertOctagon, TriangleAlert, Info, Radio, Crosshair, Navigation, FileSignature, CheckCircle, Clock } from 'lucide-react';
import MiniIncidentMap from './MiniIncidentMap';
import { fetchRiskZones, broadcastRiskZone, resolveRiskZone, fetchSecurityHistory } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function SecurityDetours() {
  const { t } = useTranslation();
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(5000);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'critical'>('low');
  const [name, setName] = useState('');
  const [incidentType, setIncidentType] = useState('Road Closure');
  const [description, setDescription] = useState('');

  const [activeZones, setActiveZones] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);

  const loadData = async () => {
    try {
      const [zonesRes, historyRes] = await Promise.all([
        fetchRiskZones(),
        fetchSecurityHistory()
      ]);
      setActiveZones(zonesRes.geofences || []);
      setHistory(historyRes.history || []);
    } catch (err) {
      console.error('Failed to load security data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng || !name) {
      toast.error('Please select location and enter name');
      return;
    }
    setBroadcasting(true);
    try {
      await broadcastRiskZone({
        name,
        type: incidentType,
        severity,
        radiusKm: radius / 1000,
        lat,
        lng,
        description
      });
      toast.success('Geofence broadcasted successfully');
      setName('');
      setDescription('');
      loadData();
    } catch (err) {
      toast.error('Failed to broadcast geofence');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveRiskZone(id);
      toast.success('Incident resolved');
      loadData();
    } catch (err) {
      toast.error('Failed to resolve incident');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert size={20} className="text-rose-600" /> 
          {t('sec_detours_title')}
        </h2>
        <p className="text-xs text-slate-500 mt-1">{t('sec_detours_subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 shrink-0">
        
        {/* Left Column (55%): Active Hazards */}
        <div className="w-full lg:w-[55%] space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
            <Map size={16} className="text-slate-500" />
            {t('sec_active_geofences')}
          </h3>
          
          {activeZones.length === 0 && !loading && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
              No active security incidents or geofences.
            </div>
          )}

          {activeZones.map((zone) => (
            <div key={zone.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden relative ${zone.severity === 'critical' ? 'border-rose-200' : zone.severity === 'medium' ? 'border-amber-200' : 'border-blue-200'}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${zone.severity === 'critical' ? 'bg-rose-500' : zone.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
              <div className={`p-4 flex justify-between items-start border-b ${zone.severity === 'critical' ? 'bg-rose-50/50 border-rose-100' : zone.severity === 'medium' ? 'bg-amber-50/50 border-amber-100' : 'bg-blue-50/50 border-blue-100'}`}>
                <div className="flex gap-3 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${zone.severity === 'critical' ? 'bg-rose-100 text-rose-600' : zone.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    {zone.severity === 'critical' ? <AlertOctagon size={16} /> : zone.severity === 'medium' ? <TriangleAlert size={16} /> : <Info size={16} />}
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${zone.severity === 'critical' ? 'text-rose-600' : zone.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'}`}>[{zone.type}] {zone.severity}</div>
                    <h4 className="font-semibold text-slate-900 text-sm">{zone.name}</h4>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                  <Crosshair size={14} className="text-slate-400" /> Lat: {Number(zone.latitude).toFixed(3)}, Lng: {Number(zone.longitude).toFixed(3)} | Radius: {zone.radiusKm} km
                </div>
                
                {zone.description && (
                  <div className={`text-xs p-3 rounded-lg border flex items-start gap-2 ${zone.severity === 'critical' ? 'bg-rose-50 text-rose-800 border-rose-100' : zone.severity === 'medium' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                    <Navigation size={14} className={`shrink-0 mt-0.5 ${zone.severity === 'critical' ? 'text-rose-600' : zone.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'}`} />
                    <div>{zone.description}</div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button onClick={() => handleResolve(zone.id)} className={`text-xs font-bold px-4 py-2 rounded transition-colors shadow-sm ${zone.severity === 'critical' ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : zone.severity === 'medium' ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
                    Resolve Incident
                  </button>
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* Right Column (45%): Broadcast Form */}
        <div className="w-full lg:w-[45%]">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
            <Radio size={16} className="text-slate-500" />
            {t('sec_broadcast_new')}
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
            
            {/* Interactive Mini Map */}
            <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-200 shadow-inner">
              <MiniIncidentMap 
                latitude={lat} 
                longitude={lng} 
                radius={radius} 
                severity={severity} 
                onLocationSelect={(l_lat, l_lng) => { setLat(l_lat); setLng(l_lng); }} 
              />
            </div>

            <form className="space-y-5" onSubmit={handleBroadcast}>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Incident Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Semera Highway Blockage" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-blue-500" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('sec_gps_lat')}</label>
                  <input type="text" readOnly value={lat ? lat.toFixed(5) : ''} placeholder="Click map..." className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('sec_gps_lng')}</label>
                  <input type="text" readOnly value={lng ? lng.toFixed(5) : ''} placeholder="Click map..." className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">{t('sec_radius')}</label>
                  <span className="text-xs font-mono font-bold text-blue-600">{radius.toLocaleString()}m</span>
                </div>
                <input 
                  type="range" 
                  min="1000" 
                  max="50000" 
                  step="1000"
                  value={radius} 
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1km</span>
                  <span>50km</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('sec_severity')}</label>
                  <select 
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 appearance-none bg-white font-medium"
                  >
                    <option value="low">Low Advisory</option>
                    <option value="medium">Moderate Warning</option>
                    <option value="critical">Critical Blockage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('sec_incident_type')}</label>
                  <select 
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 appearance-none bg-white font-medium"
                  >
                    <option>Road Closure</option>
                    <option>Security / Conflict</option>
                    <option>Fuel Outage</option>
                    <option>Checkpoint Delay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('sec_message')}</label>
                <textarea 
                  rows={2} 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter message to push to driver mobile terminals..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 resize-none"
                ></textarea>
              </div>

              <div className="pt-1">
                <button 
                  type="submit"
                  disabled={broadcasting}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Radio size={16} className="text-blue-400" /> {broadcasting ? 'Broadcasting...' : t('sec_btn_broadcast')}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

      {/* Bottom Row: Resolved Incidents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[300px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileSignature size={16} className="text-slate-500" />
            {t('sec_resolved_history')}
          </h3>
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[10px] font-bold text-slate-500 bg-white uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-3">Incident ID</th>
                <th className="px-6 py-3">Route Segment</th>
                <th className="px-6 py-3">Type & Severity</th>
                <th className="px-6 py-3">Duration & Impact</th>
                <th className="px-6 py-3">Resolution Timestamp</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {history.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono font-bold text-slate-800">{inc.id.substring(0,8)}</td>
                  <td className="px-6 py-3 font-semibold text-slate-700">{inc.name}</td>
                  <td className="px-6 py-3">
                    <div className="font-semibold text-slate-900">{inc.type}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{inc.severity}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-semibold text-slate-700 flex items-center gap-1"><Clock size={12}/> {new Date(inc.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-500">{new Date(inc.updatedAt).toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                      <CheckCircle size={12} className="text-emerald-500" /> Resolved
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No historical incidents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
