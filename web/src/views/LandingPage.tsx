import React, { useState } from 'react';
import { Bell, Settings, Package, Compass, FileText, Monitor, ShieldCheck, ChevronDown, Zap, Navigation, TrendingUp, Shield, MapPin, Building2, Truck, Briefcase, X, ExternalLink, Activity } from 'lucide-react';
import RegistrationFlow from './auth/RegistrationFlow';
import LoginModal from './auth/LoginModal';
import { useAuth } from '../hooks/useAuth';

interface LandingPageProps {
  onSelectPortal: (portal: 'shipper' | 'finance' | 'admin' | 'forwarder' | 'customs') => void;
}

export default function LandingPage({ onSelectPortal }: LandingPageProps) {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [activeComplianceModal, setActiveComplianceModal] = useState<{title: string, content: string} | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderRoleModal = () => {
    if (!showRoleModal) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-lg text-slate-900">Select Operating Portal</h3>
            <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 gap-4">
            <button onClick={() => onSelectPortal('shipper')} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Building2 size={24} />
              </div>
              <div>
                <div className="font-bold text-slate-900">Cargo Shipper / Importer</div>
                <div className="text-xs text-slate-500">Access Spot Quotes & Track Milestones</div>
              </div>
            </button>
            <button onClick={() => onSelectPortal('forwarder')} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left group">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Briefcase size={24} />
              </div>
              <div>
                <div className="font-bold text-slate-900">Freight Forwarder Console</div>
                <div className="text-xs text-slate-500">Multi-Shipper Vault & Consolidation</div>
              </div>
            </button>
            <button onClick={() => onSelectPortal('admin')} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-100 transition-colors text-left group">
              <div className="bg-slate-200 text-slate-700 p-3 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <Monitor size={24} />
              </div>
              <div>
                <div className="font-bold text-slate-900">Admin Control Tower</div>
                <div className="text-xs text-slate-500">System Oversight & Dispute Resolution</div>
              </div>
            </button>
            <button onClick={() => onSelectPortal('customs')} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left group">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="font-bold text-slate-900">Customs Terminal</div>
                <div className="text-xs text-slate-500">Automated Clearance & Escrow Triggers</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderComplianceModal = () => {
    if (!activeComplianceModal) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-600" />
              {activeComplianceModal.title}
            </h3>
            <button onClick={() => setActiveComplianceModal(null)} className="text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
              {activeComplianceModal.content}
            </p>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button onClick={() => setActiveComplianceModal(null)} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold">
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    );
  };

  const nodeTelemetry = [
    { name: 'Doraleh Port', metrics: 'Active Container Dwell: 3.1h | Ready for Haul' },
    { name: 'Galafi Border', metrics: 'FR-06.3 Automated Clearance | Dwell: 45 mins' },
    { name: 'Mille / Semera', metrics: 'RISK-04 Active Detour Zone | Speed: 62 km/h' },
    { name: 'Awash Station', metrics: 'Fuel Telemetry Hub | Stock: 88%' },
    { name: 'Modjo Dry Port', metrics: 'Final Axle Scale & TeleBirr Escrow Release Trigger' }
  ];

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-slate-900 font-inter text-slate-900 smooth-scroll relative">
      {renderRoleModal()}
      {renderComplianceModal()}
      {showRegistration && <RegistrationFlow onClose={() => setShowRegistration(false)} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={() => setShowRoleModal(true)} />}
      
      {/* =================================================================================
          SECTION 1: HERO SECTION
          ================================================================================= */}
      <section className="relative w-full h-screen flex flex-col justify-between overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-60"
          >
            <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
          </video>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* TOP NAVIGATION HEADER */}
        <header className="fixed top-0 left-0 w-full h-16 border-b border-white/10 px-8 flex items-center justify-between z-[60] bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center">
            <span className="font-bold text-[20px] text-white tracking-tight">TradeFlow</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-2">
            <a href="#corridor-artery" onClick={(e) => handleSmoothScroll(e, 'corridor-artery')} className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-4">Corridor Telematics</a>
            <a href="#ecosystem-roles" onClick={(e) => handleSmoothScroll(e, 'ecosystem-roles')} className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-4">Load Board</a>
            <a href="#system-pillars" onClick={(e) => handleSmoothScroll(e, 'system-pillars')} className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-4">Dynamic Rates</a>
            <a href="#corridor-artery" onClick={(e) => handleSmoothScroll(e, 'corridor-artery')} className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-4">Customs Sync</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowRegistration(true)}
              className="text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:text-emerald-400 transition-colors"
            >
              Sign Up
            </button>
            {!isAuthenticated ? (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-[#0F172A] text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-lg border border-slate-700"
              >
                System Login
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowRoleModal(true)}
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg"
                >
                  Access Portals
                </button>
                <button 
                  onClick={logout}
                  className="text-slate-400 hover:text-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
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

        {/* FOREGROUND HERO METRIC CARD */}
        <div className="relative z-30 pt-48 px-12 md:px-24 max-w-4xl">
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-full px-3 py-1.5 inline-flex items-center space-x-2 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-widest">
              NEURAL LOGISTICS ENGINE ACTIVE (v4.0.2)
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            AI-Powered Freight Matching for East Africa's Principal Corridor.
          </h1>
          <p className="text-lg text-slate-300 font-normal mb-10 max-w-2xl leading-relaxed">
            Optimizing the 810km Djibouti-Modjo artery through real-time telematics, dynamic spot pricing, and digital customs escrow.
          </p>
        </div>

        {/* Quick Portals Dock */}
        <div className="relative z-30 pb-12 px-12 md:px-24 w-full">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button 
              onClick={() => onSelectPortal('shipper')}
              className="group bg-white p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-blue-900/20"
            >
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Package size={20} />
              </div>
              <span className="text-sm font-bold text-slate-900 text-left">Launch Freight Marketplace</span>
            </button>

            <button 
              onClick={() => onSelectPortal('forwarder')}
              className="group bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 transition-all duration-300 hover:bg-white/20"
            >
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-slate-700 transition-colors">
                <Compass size={20} />
              </div>
              <span className="text-sm font-bold text-white text-left">Forwarder Console</span>
            </button>

            <button 
              onClick={() => onSelectPortal('finance')}
              className="group bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 transition-all duration-300 hover:bg-white/20"
            >
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-slate-700 transition-colors">
                <FileText size={20} />
              </div>
              <span className="text-sm font-bold text-white text-left">Calculate Spot Quote</span>
            </button>

            <button 
              onClick={() => onSelectPortal('admin')}
              className="group bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 transition-all duration-300 hover:bg-white/20"
            >
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-slate-700 transition-colors">
                <Monitor size={20} />
              </div>
              <span className="text-sm font-bold text-white text-left">Admin Control Tower</span>
            </button>

            <button 
              onClick={() => onSelectPortal('customs')}
              className="group bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-start gap-3 hover:-translate-y-1 transition-all duration-300 hover:bg-white/20"
            >
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-slate-700 transition-colors">
                <ShieldCheck size={20} />
              </div>
              <span className="text-sm font-bold text-white text-left">Customs Terminal</span>
            </button>
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-50 cursor-pointer" onClick={(e) => handleSmoothScroll(e as any, 'system-pillars')}>
            <span className="text-[10px] text-white font-mono uppercase tracking-widest mb-1">Explore</span>
            <ChevronDown size={16} className="text-white" />
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 2: 4 CORE SYSTEM PILLARS
          ================================================================================= */}
      <section id="system-pillars" className="w-full bg-[#F8FAFC] py-24 relative z-40 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-8 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Engineering Autonomous Logistics for Landlocked Ethiopia
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Built for shippers, fleet operators, freight forwarders, and regulatory authorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div onClick={() => setActivePillar(activePillar === 'ai' ? null : 'ai')} className={`cursor-pointer bg-white p-6 rounded-2xl shadow-sm border ${activePillar === 'ai' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[#E2E8F0]'} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col h-full`}>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">AI-Powered Freight Matching</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Sub-second multi-objective ranking algorithm evaluating cost, carrier reliability, fuel rating, and proximity.
              </p>
              <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md w-fit">
                &lt; 1.0s Matching Latency
              </div>
            </div>

            <div onClick={() => setActivePillar(activePillar === 'telematics' ? null : 'telematics')} className={`cursor-pointer bg-white p-6 rounded-2xl shadow-sm border ${activePillar === 'telematics' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-[#E2E8F0]'} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col h-full`}>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Navigation size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Corridor Telematics & Deep ETA</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Gradient-boosted ETA models calculating live arrival windows with security-aware rerouting.
              </p>
              <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md w-fit">
                98.28% ETA Precision
              </div>
            </div>

            <div onClick={() => setActivePillar(activePillar === 'pricing' ? null : 'pricing')} className={`cursor-pointer bg-white p-6 rounded-2xl shadow-sm border ${activePillar === 'pricing' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[#E2E8F0]'} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col h-full`}>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Dynamic Pricing & Fuel Governance</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Real-time spot and contract rate calculation accounting for live diesel indices and dwell surcharges.
              </p>
              <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md w-fit">
                Automated Rate Bounds
              </div>
            </div>

            <div onClick={() => setActivePillar(activePillar === 'customs' ? null : 'customs')} className={`cursor-pointer bg-white p-6 rounded-2xl shadow-sm border ${activePillar === 'customs' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-[#E2E8F0]'} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col h-full`}>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Digital Customs Vault & Escrow</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Immutable multi-document consistency checking with multi-sig milestone payment releases (e-PoD).
              </p>
              <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md w-fit">
                Zero Paperwork Transit
              </div>
            </div>
          </div>

          {/* Mini-Explainer Drawer */}
          {activePillar && (
            <div className="bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xl text-white animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-bold flex items-center gap-2">
                  <Activity size={20} className="text-emerald-400" />
                  System Specification Detail
                </h4>
                <button onClick={() => setActivePillar(null)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              {activePillar === 'ai' && (
                <div className="font-mono text-sm text-slate-300 space-y-2">
                  <p>SRS FR-02.2 & 8.1 - Carrier Ranking Matrix:</p>
                  <p className="text-blue-400">Score = (w1 × BaseCost) + (w2 × ETA_Variance) + (w3 × SafetyRating) - Proximity_Bonus</p>
                  <p>Resolves top 5 carriers in under 1.0s utilizing distributed Redis caching.</p>
                </div>
              )}
              {activePillar === 'telematics' && (
                <div className="font-mono text-sm text-slate-300 space-y-2">
                  <p>SRS FR-03.2 & FR-08 - Gradient-Boosted ETA & Security:</p>
                  <p className="text-indigo-400">ETA = BaseDistance / AvgSpeed + Σ(Dwell_nodes) + TrafficFactor(time) + Security_Delay</p>
                  <p>Live geofencing automatically triggers RISK-04 detours if conflict density &gt; threshold.</p>
                </div>
              )}
              {activePillar === 'pricing' && (
                <div className="font-mono text-sm text-slate-300 space-y-2">
                  <p>SRS FR-04 - Dynamic Pricing Equation:</p>
                  <p className="text-emerald-400">SpotRate = BaseLine + (DieselIndex_Delta × 0.4) + Equipment_Surcharge</p>
                  <p>Bounds enforced strictly between -15% and +45% of historical moving averages.</p>
                </div>
              )}
              {activePillar === 'customs' && (
                <div className="font-mono text-sm text-slate-300 space-y-2">
                  <p>SRS FR-06 & FR-10 - Customs Document Hashing & Escrow:</p>
                  <p className="text-amber-400">SHA-256( CI || PL || BL || COO ) == Ledger_Hash</p>
                  <p>Escrow release (TeleBirr API) requires e-PoD boolean = TRUE &amp; Inspector Override = FALSE.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =================================================================================
          SECTION 3: THE 810KM ARTERY INTERACTIVE TIMELINE
          ================================================================================= */}
      <section id="corridor-artery" className="w-full bg-slate-900 py-24 relative z-40 border-t border-white/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              The Principal Trade Artery
            </h2>
            <p className="text-slate-400 font-medium text-lg">
              Djibouti Port to Modjo Dry Port (810km)
            </p>
          </div>

          <div className="relative mb-32">
            {/* Horizontal Line connecting nodes */}
            <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-slate-800 rounded-full hidden md:block z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {[0, 1, 2, 3, 4].map((index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center text-center cursor-pointer group relative"
                  onMouseEnter={() => setActiveNode(index)}
                  onClick={() => setActiveNode(index)}
                >
                  <div className={`w-12 h-12 border-4 border-slate-900 rounded-full flex items-center justify-center mb-4 transition-all duration-300 relative z-10 shadow-xl ${
                    activeNode === index 
                      ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/50 shadow-cyan-500/50' 
                      : 'bg-slate-800 text-slate-400 group-hover:bg-cyan-900 group-hover:text-cyan-400'
                  }`}>
                    {index === 0 && <MapPin size={20} />}
                    {index === 1 && <Shield size={20} />}
                    {index === 2 && <Monitor size={20} />}
                    {index === 3 && <Navigation size={20} />}
                    {index === 4 && <Package size={20} />}
                  </div>
                  <h4 className={`text-sm font-bold mb-2 transition-colors ${activeNode === index ? 'text-cyan-400' : 'text-white'}`}>
                    {nodeTelemetry[index].name}
                  </h4>
                  <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">
                    {index === 0 ? 'Djibouti (0 KM)' : index === 1 ? 'Ethiopia (240 KM)' : index === 2 ? 'Intersection (380 KM)' : index === 3 ? 'Waypoint (620 KM)' : 'Terminal (810 KM)'}
                  </div>

                  {/* HUD Overlay triggered on active node */}
                  {activeNode === index && (
                    <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-t border-l border-slate-700 rotate-45"></div>
                      <div className="relative z-10 flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Live Telemetry</span>
                      </div>
                      <p className="text-[11px] font-mono text-cyan-400 text-left">
                        {nodeTelemetry[index].metrics}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 4: ROLE-BASED ECOSYSTEM ACCESS
          ================================================================================= */}
      <section id="ecosystem-roles" className="w-full bg-[#F8FAFC] py-24 relative z-40 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-8 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Role-Based Ecosystem Access
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Unified operating picture across the logistics value chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E2E8F0] hover:shadow-lg transition-all group overflow-hidden relative flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-6 relative z-10">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 relative z-10">For Cargo Owners</h3>
              <p className="text-sm text-slate-600 leading-relaxed relative z-10 mb-8 flex-1">
                Instant Spot Quotes, Verified Carriers, and Live Milestones from Doraleh to your Warehouse.
              </p>
              <button onClick={() => onSelectPortal('shipper')} className="relative z-10 w-full py-3 px-4 border-2 border-sky-600 text-sky-600 font-bold text-sm rounded-lg hover:bg-sky-50 transition-colors flex justify-center items-center gap-2">
                Post Cargo & Get Spot Rate <ExternalLink size={16} />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E2E8F0] hover:shadow-lg transition-all group overflow-hidden relative flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 relative z-10">
                <Truck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 relative z-10">For Fleet Owners & Carriers</h3>
              <p className="text-sm text-slate-600 leading-relaxed relative z-10 mb-8 flex-1">
                Maximize Truck Utilization, Eliminate Empty Backhauls, and Receive Guaranteed Instant TeleBirr Payouts.
              </p>
              <button onClick={() => onSelectPortal('finance')} className="relative z-10 w-full py-3 px-4 border-2 border-emerald-600 text-emerald-600 font-bold text-sm rounded-lg hover:bg-emerald-50 transition-colors flex justify-center items-center gap-2">
                Access Carrier Freight Board <ExternalLink size={16} />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E2E8F0] hover:shadow-lg transition-all group overflow-hidden relative flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 relative z-10">
                <Briefcase size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 relative z-10">For Freight Forwarders</h3>
              <p className="text-sm text-slate-600 leading-relaxed relative z-10 mb-8 flex-1">
                Manage Multi-Shipper Manifests, Consolidate Customs Document Vaults, and Run Competitive Auctions.
              </p>
              <button onClick={() => onSelectPortal('forwarder')} className="relative z-10 w-full py-3 px-4 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
                Launch Multi-Shipper Vault <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 5: ENTERPRISE STATS & COMPLIANCE FOOTER
          ================================================================================= */}
      <footer className="w-full bg-[#0B0F17] border-t border-white/10 pt-16 pb-8 relative z-40">
        <div className="max-w-7xl mx-auto px-8 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">TradeFlow Logistics Engine</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Aligned with Ethiopian Customs Commission &amp; Ethiopian Shipping and Logistics Services Enterprise specifications.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded border border-emerald-400/20">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  System Status: OPERATIONAL (99.9% SLA)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Platform</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><button className="hover:text-blue-400 transition-colors">Platform Specs</button></li>
                  <li><button onClick={(e) => handleSmoothScroll(e as any, 'corridor-artery')} className="hover:text-blue-400 transition-colors">Corridor Telematics</button></li>
                  <li><button onClick={() => setActiveComplianceModal({ title: 'Pricing Formulas', content: 'SRS FR-04: Dynamic Pricing Equation\n\nSpotRate = BaseLine + (DieselIndex_Delta × 0.4) + Equipment_Surcharge\n\nAll pricing bounds are algorithmically enforced strictly between -15% and +45% of the 30-day historical moving average for the respective corridor segment.' })} className="hover:text-blue-400 transition-colors">Pricing Formulas</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Compliance</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><button onClick={() => setActiveComplianceModal({ title: 'Escrow Mediation Rules', content: 'SRS FR-10: TeleBirr Escrow Rules\n\n1. Funds are locked into a smart-contract multi-sig wallet upon load assignment.\n2. Payment is automatically released only when e-PoD (Proof of Delivery) is validated by the receiving terminal.\n3. Dispute mediation relies on GPS timestamps and immutable scale weighbridge logs.'})} className="hover:text-blue-400 transition-colors">Escrow Mediation Rules</button></li>
                  <li><button onClick={() => setActiveComplianceModal({ title: '7-Year Audit Ledger', content: 'SRS Section 6: Audit & Data Retention\n\nTo comply with Ethiopian federal regulatory standards, all manifest data, inspection logs, and financial transactions are cryptographically hashed and retained in immutable storage for a minimum of 7 calendar years.'})} className="hover:text-blue-400 transition-colors">7-Year Audit Ledger</button></li>
                  <li><button className="hover:text-blue-400 transition-colors">Data Retention Policy</button></li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-4">Verified Security</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <ShieldCheck size={18} className="text-blue-400" />
                  <span>AES-256 Encrypted Ledger</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <MapPin size={18} className="text-blue-400" />
                  <span>Regional East Africa Data Residency</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <FileText size={18} className="text-blue-400" />
                  <span>TeleBirr API Integrated Escrow</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] font-mono text-slate-500">
            <p>© 2026 TradeFlow Logistics Platform. Developed for East Africa's Principal Corridor.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

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
