import React from 'react';
import { Bell, Settings } from 'lucide-react';
import landingVideo from './landingpage.mp4';

interface PortalSelectorProps {
  onSelectPortal: (portal: 'shipper' | 'finance' | 'admin') => void;
}

export default function PortalSelector({ onSelectPortal }: PortalSelectorProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-10">
        <div className="font-bold text-blue-600 text-lg tracking-tight">
          TradeFlow
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <button className="hover:text-slate-900 transition-colors">Corridor Telematics</button>
          <button className="hover:text-slate-900 transition-colors">Load Board</button>
          <button className="hover:text-slate-900 transition-colors">Dynamic Rates</button>
          <button className="hover:text-slate-900 transition-colors">Customs Sync</button>
        </nav>

        <div className="flex items-center gap-4">
          <button className="bg-black text-white text-sm font-medium px-4 py-1.5 hover:bg-gray-800 transition-colors rounded-sm">
            Launch Platform
          </button>
          <button className="text-slate-600 hover:text-slate-900">
            <Bell size={18} />
          </button>
          <button className="text-slate-600 hover:text-slate-900">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Ticker Bar */}
      <div className="h-8 bg-slate-100/90 backdrop-blur-sm border-b border-slate-200 flex items-center shrink-0 relative z-10 w-full overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap shrink-0">
          <div className="text-[10px] font-mono font-bold text-slate-700 tracking-wider px-4">
            DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 &bull; GALAFI BORDER DWELL: 45 MINS &bull; DIESEL INDEX: ETB 95.50/L &bull; 12 CUSTOMS PASSES CLEARED
          </div>
          <div className="text-[10px] font-mono font-bold text-slate-700 tracking-wider px-4">
            DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 &bull; GALAFI BORDER DWELL: 45 MINS &bull; DIESEL INDEX: ETB 95.50/L &bull; 12 CUSTOMS PASSES CLEARED
          </div>
        </div>
        <div className="flex animate-marquee whitespace-nowrap shrink-0" aria-hidden="true">
          <div className="text-[10px] font-mono font-bold text-slate-700 tracking-wider px-4">
            DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 &bull; GALAFI BORDER DWELL: 45 MINS &bull; DIESEL INDEX: ETB 95.50/L &bull; 12 CUSTOMS PASSES CLEARED
          </div>
          <div className="text-[10px] font-mono font-bold text-slate-700 tracking-wider px-4">
            DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 &bull; GALAFI BORDER DWELL: 45 MINS &bull; DIESEL INDEX: ETB 95.50/L &bull; 12 CUSTOMS PASSES CLEARED
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center px-8 md:px-24">
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0 bg-slate-900"
          src={landingVideo}
        />
        {/* Dark overlay to make text readable */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        
        {/* Main Content Overlay (No White Card) */}
        <div className="w-full max-w-2xl relative z-10 p-4 md:p-0">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-50 border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider mb-6 uppercase backdrop-blur-sm shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            Neural Logistics Engine Active (v4.0.2)
          </div>

          <h1 className="text-4xl md:text-[40px] font-bold text-white tracking-tight leading-[1.1] mb-4 drop-shadow-md">
            AI-Powered Freight Matching for East Africa's Principal Corridor.
          </h1>
          
          <p className="text-slate-200 text-base mb-8 drop-shadow-sm max-w-xl">
            Optimizing the 810km Djibouti-Modjo artery.
          </p>

          <div className="flex flex-col md:flex-row gap-8 border-y border-white/20 py-6 mb-8 backdrop-blur-sm">
            <div>
              <div className="text-xl md:text-2xl font-semibold text-white mb-1 drop-shadow-sm">142</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-mono drop-shadow-sm">Active Heavy Assets</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-semibold text-white mb-1 drop-shadow-sm">ETB 356K</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-mono drop-shadow-sm">Avg Spot Rate</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-semibold text-white mb-1 drop-shadow-sm">98.28%</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-mono drop-shadow-sm">Model Precision</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => onSelectPortal('shipper')}
              className="bg-white text-slate-900 px-5 py-2.5 text-sm font-bold hover:bg-slate-100 transition-colors rounded-sm shadow-lg"
            >
              Launch Freight Marketplace
            </button>
            <button 
              onClick={() => onSelectPortal('finance')}
              className="bg-white/10 text-white border border-white/30 backdrop-blur-md px-5 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors rounded-sm shadow-lg"
            >
              Calculate Spot Quote
            </button>
            <button 
              onClick={() => onSelectPortal('admin')}
              className="bg-blue-600/20 text-blue-50 border border-blue-500/30 backdrop-blur-md px-5 py-2.5 text-sm font-medium hover:bg-blue-600/30 transition-colors rounded-sm shadow-lg"
            >
              Admin Control Tower
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-10 text-[10px] text-slate-500 font-mono">
        <div>
          &copy; 2024 TradeFlow Logistics. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-900 transition-colors">Security Policy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Terms of Transit</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Escrow Rules</a>
        </div>
      </footer>
    </div>
  );
}
