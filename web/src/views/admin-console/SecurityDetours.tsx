import React from 'react';
import { ShieldAlert, Map, AlertOctagon, TriangleAlert, Info, Radio, Crosshair, MapPin, Navigation } from 'lucide-react';

export default function SecurityDetours() {
  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert size={20} className="text-rose-600" /> 
          Corridor Hazard Management & Active Geofences
        </h2>
        <p className="text-xs text-slate-500 mt-1">Manage physical risks, road closures, and automated rerouting logic (FR-05 & FR-08).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* Left Column: Active Hazards */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
            <Map size={16} className="text-slate-500" />
            Active Regional Geofences
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
            <div className="p-4 space-y-3">
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
                <button className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors">Edit Radius</button>
                <button className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded transition-colors">Resolve Incident</button>
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
            <div className="p-4 space-y-3">
               <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                <Crosshair size={14} className="text-slate-400" /> Lat: 8.983, Lng: 40.166 | Radius: 2 km
              </div>
              <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-bold">Status:</span> Warning broadcasted to in-transit drivers. Suggest refueling at Dire Dawa intersection.
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors">Edit Radius</button>
                <button className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded transition-colors">Resolve Incident</button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Broadcast Form */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
            <Radio size={16} className="text-slate-500" />
            Broadcast New Incident / Geofence
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">GPS Latitude</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="e.g. 11.794" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">GPS Longitude</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="e.g. 41.008" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Severity Level</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 appearance-none bg-slate-50">
                    <option>Low (Advisory Only)</option>
                    <option>Medium (Warning)</option>
                    <option className="font-bold text-rose-600">Critical (Force Reroute)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Incident Type</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 appearance-none bg-slate-50">
                    <option>Road Closure</option>
                    <option>Customs Congestion</option>
                    <option>Weather Hazard</option>
                    <option>Security / Conflict</option>
                    <option>Resource Shortage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Radius (Meters)</label>
                <input type="number" defaultValue="5000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Advisory Message to Fleet</label>
                <textarea 
                  rows={3} 
                  placeholder="Enter message to push to driver terminals..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 resize-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <button className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2">
                  <Radio size={16} className="text-blue-400" /> Push Fleet Advisory & Enforce
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
