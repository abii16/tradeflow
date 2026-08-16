import React from 'react';
import { Scale, AlertCircle, FileText, Lock, Unlock, Gavel, Handshake, CornerUpRight, Search, FileImage } from 'lucide-react';

export default function DisputeMediation() {
  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Scale size={20} className="text-indigo-600" /> 
            Escrow Discrepancy & Cargo Claims Mediation
          </h2>
          <p className="text-xs text-slate-500 mt-1">Resolve escrow payment disputes between Shippers and Transporters (FR-10.3).</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-lg text-sm border border-indigo-100 flex items-center gap-2">
          <AlertCircle size={16} /> 3 Active Disputes
        </div>
      </div>

      {/* Main Workspace (Inbox / Chat style) */}
      <div className="flex-1 flex gap-6 min-h-[600px]">
        
        {/* Left Column: Inbox List */}
        <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search Claim ID or Entity..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            
            {/* Active Ticket */}
            <div className="p-4 border-b border-slate-200 bg-indigo-50/50 border-l-4 border-l-indigo-600 cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold font-mono text-indigo-700">#DSP-204</span>
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Open</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Ethio-Trading PLC <span className="text-slate-400 font-normal mx-1">vs</span> Abyssinia Logistics</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">Weight discrepancy reported at Modjo weighbridge.</p>
              <div className="text-[10px] text-slate-400 mt-2">Opened 2 hours ago</div>
            </div>

            {/* Inactive Tickets */}
            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer opacity-75">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold font-mono text-slate-600">#DSP-203</span>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Under Review</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">BGI Brewery <span className="text-slate-400 font-normal mx-1">vs</span> TransHorn Logistics</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">Delayed arrival SLA breach dispute.</p>
              <div className="text-[10px] text-slate-400 mt-2">Opened yesterday</div>
            </div>

            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer opacity-50">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold font-mono text-slate-600">#DSP-200</span>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Resolved</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Mugher Cement <span className="text-slate-400 font-normal mx-1">vs</span> ET-9021</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">Cargo damage claim rejected.</p>
              <div className="text-[10px] text-slate-400 mt-2">Resolved 3 days ago</div>
            </div>

          </div>
        </div>

        {/* Right Column: Ticket Details & Resolution */}
        <div className="w-2/3 flex flex-col space-y-6">
          
          {/* Ticket Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Claim #DSP-204</h3>
                <div className="text-sm font-semibold text-slate-600">Ethio-Trading PLC (Shipper) <span className="text-slate-400 mx-2">vs</span> Abyssinia Heavy Logistics (Transporter)</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-right">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-end">
                  <Lock size={12} className="text-amber-500" /> Escrow Held (Locked)
                </div>
                <div className="text-lg font-mono font-bold text-slate-900">ETB 348,500.00</div>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-rose-800 text-sm mb-1">Dispute Reason: 1.5 MT Weight Discrepancy</h4>
                <p className="text-xs text-rose-700">The Shipper claims the cargo arrived 1.5 metric tons lighter than dispatched. The Transporter claims no tampering occurred and attributes it to scale calibration differences.</p>
              </div>
            </div>
          </div>

          {/* Evidence Thread */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-700 text-sm">Evidence Thread</h4>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              
              {/* Message 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">SH</div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg rounded-tl-none p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-slate-900">Ethio-Trading PLC (Shipper)</span>
                    <span className="text-[10px] text-slate-400">10:45 AM</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">Modjo weighbridge ticket clearly shows 23.0 MT. We dispatched 24.5 MT from Galafi. We demand a partial refund for the missing 1.5 MT of rebar.</p>
                  
                  <div className="flex gap-2">
                    <div className="border border-slate-200 rounded p-2 flex items-center gap-2 bg-slate-50 text-xs w-fit">
                      <FileImage size={14} className="text-blue-500" />
                      <span>modjo_scale_ticket.jpg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">TR</div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg rounded-tl-none p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-slate-900">Abyssinia Heavy Logistics</span>
                    <span className="text-[10px] text-slate-400">11:15 AM</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">The cargo was sealed with a digital smart lock (Lock ID: DL-889). The telemetry logs show the lock was never tampered with during transit. Attached is the Galafi scale ticket showing 24.5 MT and the lock integrity report.</p>
                  
                  <div className="flex gap-2 flex-wrap">
                    <div className="border border-slate-200 rounded p-2 flex items-center gap-2 bg-slate-50 text-xs w-fit">
                      <FileImage size={14} className="text-blue-500" />
                      <span>galafi_scale_ticket.jpg</span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 flex items-center gap-2 bg-slate-50 text-xs w-fit">
                      <FileText size={14} className="text-emerald-500" />
                      <span>telemetry_lock_log.pdf</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action / Resolution Panel */}
          <div className="bg-[#0F172A] rounded-xl shadow-lg p-5 border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Gavel size={16} className="text-indigo-400" /> Admin Resolution Action (FR-10.3)
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <button className="bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-50 font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex flex-col items-center justify-center gap-1">
                <Unlock size={16} className="text-emerald-400 mb-1" />
                Release 100% to Transporter
              </button>
              
              <button className="bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 text-amber-50 font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex flex-col items-center justify-center gap-1">
                <Handshake size={16} className="text-amber-400 mb-1" />
                Issue Pro-Rata Partial Refund
              </button>
              
              <button className="bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 text-rose-50 font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex flex-col items-center justify-center gap-1">
                <CornerUpRight size={16} className="text-rose-400 mb-1" />
                Escalate to Legal (Freeze)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
