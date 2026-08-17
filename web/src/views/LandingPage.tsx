import React from 'react';
import { Bell, Settings, Package, Compass, FileText, Monitor, ShieldCheck, ChevronDown } from 'lucide-react';
import landingVideo from './landingpage.mp4';

interface LandingPageProps {
  onLaunch?: () => void;
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-slate-900 font-inter text-slate-900 smooth-scroll">
      {/* =================================================================================
          SECTION 1: HERO SECTION
          ================================================================================= */}
      <section className="relative w-full h-screen flex flex-col justify-between overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0 bg-slate-900">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          >
            <source src={landingVideo} type="video/mp4" />
          </video>
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/80"></div>
        </div>

        {/* TOP NAVIGATION HEADER */}
        <header className="absolute top-0 left-0 w-full h-16 border-b border-white/10 px-8 flex items-center justify-between z-50 bg-slate-900/20 backdrop-blur-md">
          <div className="flex items-center">
            <span className="font-bold text-[20px] text-white tracking-tight">TradeFlow</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-2">
            <a href="#" className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-4">Corridor Telematics</a>
            <a href="#" className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-4">Load Board</a>
            <a href="#" className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-4">Dynamic Rates</a>
            <a href="#" className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-4">Customs Sync</a>
          </nav>

          <div className="flex items-center">
            <button 
              onClick={onLaunch}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
            >
              System Login
            </button>
            <div className="flex items-center space-x-3 ml-4">
              <button className="text-slate-300 hover:text-white relative">
                <Bell size={18} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
              </button>
              <button className="text-slate-300 hover:text-white">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* LIVE CORRIDOR TICKER MARQUEE */}
        <div className="absolute top-16 left-0 w-full h-8 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center overflow-hidden z-40">
          <div className="animate-marquee whitespace-nowrap flex items-center space-x-6 text-[10px] font-mono text-emerald-400 font-medium tracking-wide">
            <span>DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 • GALAFI BORDER DWELL: 45 MINS • DIESEL INDEX: ETB 95.50/L • 12 CUSTOMS PASSES CLEARED</span>
            <span className="px-6 text-slate-500">•</span>
            <span>DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 • GALAFI BORDER DWELL: 45 MINS • DIESEL INDEX: ETB 95.50/L • 12 CUSTOMS PASSES CLEARED</span>
            <span className="px-6 text-slate-500">•</span>
            <span>DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 • GALAFI BORDER DWELL: 45 MINS • DIESEL INDEX: ETB 95.50/L • 12 CUSTOMS PASSES CLEARED</span>
          </div>
        </div>

        {/* FOREGROUND HERO METRIC CARD (Center-Left) */}
        <div className="relative z-30 pt-48 px-12 md:px-24 max-w-4xl">
          {/* Engine Status Pill */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-full px-3 py-1.5 inline-flex items-center space-x-2 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-widest">
              NEURAL LOGISTICS ENGINE ACTIVE (v4.0.2)
            </span>
          </div>

          {/* Headline & Subtitle */}
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            AI-Powered Freight Matching for East Africa's Principal Corridor.
          </h1>
          <p className="text-lg text-slate-300 font-normal mb-10 max-w-2xl leading-relaxed">
            Optimizing the 810km Djibouti-Modjo artery through real-time telematics, dynamic spot pricing, and digital customs escrow.
          </p>
        </div>

        {/* Quick Portals Dock (Bottom Anchored) */}
        <div className="relative z-30 pb-12 px-12 md:px-24 w-full">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button 
              onClick={onLaunch}
              className="group bg-white p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 transition-all shadow-xl shadow-black/20"
            >
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Package size={20} />
              </div>
              <span className="text-sm font-bold text-slate-900 text-left">Launch Freight Marketplace</span>
            </button>

            <button 
              onClick={onLaunch}
              className="group bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 hover:bg-white/20 transition-all"
            >
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-slate-700 transition-colors">
                <Compass size={20} />
              </div>
              <span className="text-sm font-bold text-white text-left">Forwarder Console</span>
            </button>

            <button 
              onClick={onLaunch}
              className="group bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 hover:bg-white/20 transition-all"
            >
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-slate-700 transition-colors">
                <FileText size={20} />
              </div>
              <span className="text-sm font-bold text-white text-left">Calculate Spot Quote</span>
            </button>

            <button 
              onClick={onLaunch}
              className="group bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 hover:bg-white/20 transition-all"
            >
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-slate-700 transition-colors">
                <Monitor size={20} />
              </div>
              <span className="text-sm font-bold text-white text-left">Admin Control Tower</span>
            </button>

            <button 
              onClick={onLaunch}
              className="group bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 hover:bg-white/20 transition-all"
            >
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-slate-700 transition-colors">
                <ShieldCheck size={20} />
              </div>
              <span className="text-sm font-bold text-white text-left">Customs Terminal</span>
            </button>
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-50">
            <span className="text-[10px] text-white font-mono uppercase tracking-widest mb-1">Explore</span>
            <ChevronDown size={16} className="text-white" />
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .smooth-scroll {
          scroll-behavior: smooth;
        }
      `}} />
    </div>
  );
}
