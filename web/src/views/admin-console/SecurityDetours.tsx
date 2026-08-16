import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Map, AlertOctagon, TriangleAlert, Info, Radio, Crosshair, Navigation, FileSignature, CheckCircle, Clock } from 'lucide-react';
import MiniIncidentMap from './MiniIncidentMap';

export default function SecurityDetours() {
  const { t } = useTranslation();
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(5000);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'critical'>('low');

  const resolvedIncidents = [
    { id: 'INC-7702', segment: 'Galafi Border Approach', type: 'Customs Checkpoint Delay', severity: 'Critical', duration: '3h 45m', fleets: '22 Hauls Rerouted', time: '2026-08-15 18:20 EAT' },
    { id: 'INC-7698', segment: 'Awash Curve', type: 'Road Closure / Accident', severity: 'Critical', duration: '6h 10m', fleets: '45 Hauls Rerouted', time: '2026-08-14 09:15 EAT' },
    { id: 'INC-7685', segment: 'Mille Bypass', type: 'Weather Hazard (Flooding)', severity: 'Warning', duration: '12h 00m', fleets: 'Speed Limits Enforced', time: '2026-08-12 14:30 EAT' },
    { id: 'INC-7650', segment: 'Dire Dawa Intersection', type: 'Fuel Outage', severity: 'Warning', duration: '1d 4h', fleets: 'Advisory Broadcasted', time: '2026-08-10 08:45 EAT' },
  ];

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
          
          {/* Alert 1 */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <div className="p-4 bg-rose-50/50 flex justify-between items-start border-b border-rose-100">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertOctagon size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">[RISK-04] Critical</div>
                  <h4 className="font-semibold text-slate-900 text-sm">Semera Highway Congestion / Checkpoint Delay</h4>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200">
                  8 Active Trucks Impacted
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle size={12} /> 14 Trucks Successfully Diverted
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                <Crosshair size={14} className="text-slate-400" /> Lat: 11.794, Lng: 41.008 | Radius: 25 km
              </div>
              
              <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg border border-rose-100 flex items-start gap-2">
                <Navigation size={14} className="shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-bold">Active Reroute Enforced:</span> All inbound traffic diverted via Mille Bypass (+12m ETA penalty).
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded transition-colors">Edit Radius</button>
                <button className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded transition-colors shadow-sm">Resolve Incident</button>
              </div>
            </div>
          </div>

          {/* Alert 2 */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="p-4 bg-amber-50/50 flex justify-between items-start border-b border-amber-100">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <TriangleAlert size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">[FUEL-02] Warning</div>
                  <h4 className="font-semibold text-slate-900 text-sm">Awash Fuel Station Stock Depletion</h4>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
               <div className="flex flex-wrap items-center gap-3">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200">
                  5 Vehicles in Warning Zone (Radius: 2 km)
                </span>
              </div>

               <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                <Crosshair size={14} className="text-slate-400" /> Lat: 8.983, Lng: 40.166 | Radius: 2 km
              </div>

              <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-bold">Status:</span> Advisory broadcasted — Suggested refueling at Dire Dawa intersection.
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded transition-colors">Edit Radius</button>
                <button className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded transition-colors shadow-sm">Resolve Incident</button>
              </div>
            </div>
          </div>

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

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              
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
                  <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 appearance-none bg-white font-medium">
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
                  placeholder="Enter message to push to driver mobile terminals..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 resize-none"
                ></textarea>
              </div>

              <div className="pt-1">
                <button className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2">
                  <Radio size={16} className="text-blue-400" /> {t('sec_btn_broadcast')}
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
              {resolvedIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono font-bold text-slate-800">{inc.id}</td>
                  <td className="px-6 py-3 font-semibold text-slate-700">{inc.segment}</td>
                  <td className="px-6 py-3">
                    <div className="font-semibold text-slate-900">{inc.type}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{inc.severity}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-semibold text-slate-700 flex items-center gap-1"><Clock size={12}/> {inc.duration}</div>
                    <div className="text-[10px] text-slate-500">{inc.fleets}</div>
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-500">{inc.time}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                      <CheckCircle size={12} className="text-emerald-500" /> Resolved & Normal Route Restored
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
