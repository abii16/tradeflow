import React from 'react';
import { Bell, Settings, Package, Compass, FileText, Monitor, ShieldCheck, ChevronDown, Zap, Navigation, TrendingUp, Shield, MapPin } from 'lucide-react';
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

      {/* =================================================================================
          SECTION 2: 4 CORE SYSTEM PILLARS
          ================================================================================= */}
      <section className="w-full bg-[#F8FAFC] py-24 relative z-40 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-8 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Engineering Autonomous Logistics for Landlocked Ethiopia
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Built for shippers, fleet operators, freight forwarders, and regulatory authorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow group flex flex-col h-full">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">AI-Powered Freight Matching</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Sub-second multi-objective ranking algorithm evaluating cost, carrier reliability, fuel rating, and proximity (SRS FR-02.2 & 8.1).
              </p>
              <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md w-fit">
                &lt; 1.0s Matching Latency
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow group flex flex-col h-full">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Navigation size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Corridor Telematics & Deep ETA</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Gradient-boosted ETA models calculating live arrival windows with security-aware rerouting around flagged conflict zones (SRS FR-03.2, FR-08).
              </p>
              <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md w-fit">
                98.28% ETA Precision
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow group flex flex-col h-full">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Dynamic Pricing & Fuel Governance</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Real-time spot and contract rate calculation accounting for live diesel indices, dwell surcharges, and backhaul empty-mile optimization.
              </p>
              <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md w-fit">
                Automated Rate Floor/Ceiling
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow group flex flex-col h-full">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Digital Customs Vault & Escrow</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Immutable multi-document consistency checking (CI, PL, BL, COO) with multi-sig milestone payment releases upon verified delivery (e-PoD).
              </p>
              <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md w-fit">
                Zero Paperwork Transit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 3: THE 810KM ARTERY INTERACTIVE TIMELINE
          ================================================================================= */}
      <section className="w-full bg-slate-900 py-24 relative z-40 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              The Principal Trade Artery
            </h2>
            <p className="text-slate-400 font-medium text-lg">
              Djibouti Port to Modjo Dry Port (810km)
            </p>
          </div>

          <div className="relative">
            {/* Horizontal Line connecting nodes */}
            <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-slate-800 rounded-full hidden md:block z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {/* Node 1 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 bg-slate-800 text-blue-400 border-4 border-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors relative z-10 shadow-xl">
                  <MapPin size={20} />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">Doraleh Terminal</h4>
                <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Djibouti (0 KM)</div>
                <p className="text-xs text-slate-400 leading-relaxed">Vessel Discharge -&gt; Master BL Generation -&gt; Cargo Bond Initiation</p>
              </div>

              {/* Node 2 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 bg-slate-800 text-amber-400 border-4 border-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors relative z-10 shadow-xl">
                  <Shield size={20} />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">Galafi Border</h4>
                <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Ethiopia (240 KM)</div>
                <p className="text-xs text-slate-400 leading-relaxed">Automated Weighbridge Consistency -&gt; E-Seal Verification -&gt; Digital Transit Pass Issuance (FR-06.3)</p>
              </div>

              {/* Node 3 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 bg-slate-800 text-rose-400 border-4 border-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-rose-500 group-hover:text-white transition-colors relative z-10 shadow-xl">
                  <Monitor size={20} />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">Mille / Semera</h4>
                <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Intersection (380 KM)</div>
                <p className="text-xs text-slate-400 leading-relaxed">Fuel Telemetry Monitoring -&gt; Real-time Conflict &amp; Hazard Geofencing (FR-05, FR-08)</p>
              </div>

              {/* Node 4 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 bg-slate-800 text-indigo-400 border-4 border-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors relative z-10 shadow-xl">
                  <Navigation size={20} />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">Awash Station</h4>
                <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Waypoint (620 KM)</div>
                <p className="text-xs text-slate-400 leading-relaxed">Driver Waypoint Check-in -&gt; En-route Fuel Stock Level Assessment</p>
              </div>

              {/* Node 5 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 bg-slate-800 text-emerald-400 border-4 border-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors relative z-10 shadow-xl">
                  <Package size={20} />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">Modjo Dry Port</h4>
                <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Terminal (810 KM)</div>
                <p className="text-xs text-slate-400 leading-relaxed">Final Axle Weighing -&gt; Digital Proof-of-Delivery (e-PoD) -&gt; TeleBirr Escrow Settlement Release (FR-10.1)</p>
              </div>
            </div>
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
