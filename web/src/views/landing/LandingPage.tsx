import React, { useState } from 'react';
import { Bell, Settings, Package, Compass, FileText, Monitor, ShieldCheck, ChevronDown, Zap, Navigation, TrendingUp, Shield, MapPin, Building2, Truck, Briefcase, X, ExternalLink, Activity, Check } from 'lucide-react';
import RegistrationFlow from '@/views/auth/RegistrationFlow';
import LoginModal from '@/views/auth/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import LiveTelematicsMap from '@/components/LiveTelematicsMap';

interface LandingPageProps {
  onSelectPortal: (portal: 'shipper' | 'finance' | 'admin' | 'forwarder' | 'customs') => void;
}

export default function LandingPage({ onSelectPortal }: LandingPageProps) {
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [activeComplianceModal, setActiveComplianceModal] = useState<{ title: string, content: string } | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Live Data Simulation State
  const [liveSpotIndex, setLiveSpotIndex] = useState(356000);
  const [liveBids, setLiveBids] = useState([
    { id: 103, score: 98.4 },
    { id: 104, score: 97.2 },
    { id: 105, score: 94.8 }
  ]);
  const [etaMins, setEtaMins] = useState(45);
  const [etaConfidence, setEtaConfidence] = useState(94.2);
  
  // Calculator State
  const [calcFrom, setCalcFrom] = useState('');
  const [calcTo, setCalcTo] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcState, setCalcState] = useState<'idle' | 'loading' | 'result'>('idle');
  const [calcRate, setCalcRate] = useState<number | null>(null);

  const handleCalculate = async () => {
    if (!calcFrom || !calcTo || !calcWeight) return;
    setCalcState('loading');
    try {
      const payload = {
        origin: { city: calcFrom },
        destination: { city: calcTo },
        weightKg: parseFloat(calcWeight) * 1000, // convert tons to kg
        cargoType: 'dry'
      };
      
      const response = await fetch('http://localhost:3000/api/v1/pricing/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Assuming data returns totalRate or baseRate
        setCalcRate(data.totalRate || data.baseRate || 45000);
        setCalcState('result');
      } else {
        throw new Error('Failed to fetch quote');
      }
    } catch (error) {
      console.error(error);
      // Fallback for demo purposes if backend quote fails
      const base = 45000;
      const weightMultiplier = parseFloat(calcWeight) * 1200;
      setCalcRate(base + weightMultiplier + 2500);
      setCalcState('result');
    }
  };

  const { isAuthenticated, user, logout } = useAuth();

  // Impact Metrics State
  const [impactMetrics, setImpactMetrics] = useState({
    activeTransporters: '12.4K',
    tonsDelivered: '3.2M',
    uptime: '99.9'
  });

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Initial fetch
    fetchLandingMetrics();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchLandingMetrics();
    }, 10000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const fetchLandingMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/public/landing-metrics');
      if (response.ok) {
        const data = await response.json();
        if (data.liveBids) setLiveBids(data.liveBids);
        if (data.spotIndex) setLiveSpotIndex(data.spotIndex);
        if (data.telematics) {
          setEtaMins(data.telematics.etaMins);
          setEtaConfidence(data.telematics.etaConfidence);
        }
        if (data.metrics) {
          setImpactMetrics(data.metrics);
        }
      }
    } catch (error) {
      console.error('Failed to fetch live landing metrics:', error);
    }
  };


  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderComplianceModal = () => {
    if (!activeComplianceModal) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-[#18191c] backdrop-blur-sm flex items-center justify-center p-4">
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
    <div className="min-h-screen w-full overflow-y-auto bg-[#0C0C0C] font-inter text-[#EDEDED] smooth-scroll relative">
      {renderComplianceModal()}
      {showRegistration && <RegistrationFlow onClose={() => setShowRegistration(false)} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {/* =================================================================================
          SECTION 1: HERO SECTION
          ================================================================================= */}
      <section className="relative w-full h-screen flex flex-col justify-between overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            src="/video.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C]/85 via-[#0C0C0C]/60 to-[#0C0C0C]" />
        </div>

        {/* TOP NAVIGATION HEADER */}
        <header className={`fixed top-0 left-0 w-full h-16 border-b px-8 flex items-center justify-between z-[60] backdrop-blur-md transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#0C0C0C]/95 border-[#262626] shadow-2xl' 
            : 'bg-[#0C0C0C]/80 border-[#262626]'
        }`}>
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-baseline select-none cursor-pointer hover:opacity-80 hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <span className="text-4xl font-serif text-white tracking-tighter pr-0.5">T</span>
            <span className="text-2xl font-black tracking-tight text-white">rade<span className="text-[#3ECF8E]">Flow</span></span>
          </div>

          <div className="flex items-center gap-6 md:gap-10">
            <nav className="hidden md:flex items-center space-x-1">
              <a href="#platform-overview" onClick={(e) => handleSmoothScroll(e, 'platform-overview')} className="text-sm font-bold text-slate-300 hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 border border-transparent hover:border-[#3ECF8E]/50 rounded-full px-4 py-2 transition-all duration-300 transform hover:scale-105">Platform Overview</a>
              <a href="#load-board" onClick={(e) => handleSmoothScroll(e, 'load-board')} className="text-sm font-bold text-slate-300 hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 border border-transparent hover:border-[#3ECF8E]/50 rounded-full px-4 py-2 transition-all duration-300 transform hover:scale-105">Load Board</a>
              <a href="#dynamic-rates" onClick={(e) => handleSmoothScroll(e, 'dynamic-rates')} className="text-sm font-bold text-slate-300 hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 border border-transparent hover:border-[#3ECF8E]/50 rounded-full px-4 py-2 transition-all duration-300 transform hover:scale-105">Dynamic Rates</a>
              <a href="#customs-sync" onClick={(e) => handleSmoothScroll(e, 'customs-sync')} className="text-sm font-bold text-slate-300 hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 border border-transparent hover:border-[#3ECF8E]/50 rounded-full px-4 py-2 transition-all duration-300 transform hover:scale-105">Customs Sync</a>
            </nav>

            <div className="hidden md:block w-px h-6 bg-[#262626]"></div>

            <div className="flex items-center gap-4">
              <button className="px-2.5 py-1 text-xs font-mono border border-[#262626] text-zinc-300 rounded-lg hover:border-[#3ECF8E]/50 transition">EN | አማ</button>
              {!isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm font-bold text-slate-200 hover:text-white px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-300"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowRegistration(true)}
                  className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={logout}
                  className="text-sm font-bold text-slate-200 hover:text-white px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-300"
                >
                  Logout
                </button>
                <button
                  onClick={() => onSelectPortal('shipper')}
                  className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Launch Platform
                </button>
              </>
            )}
          </div>
          </div>
        </header>

        {/* FOREGROUND HERO METRIC CARD */}
        <div className="relative z-30 pt-64 md:pt-72 px-12 md:px-24 max-w-4xl mx-auto flex flex-col items-center text-center w-full">


          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 max-w-4xl mx-auto text-[#EDEDED] whitespace-nowrap">
            Intelligent <span className="text-[#3ECF8E]">Freight</span>.
          </h1>
          <p className="text-base md:text-lg leading-relaxed text-[#EDEDED] font-bold mb-10 max-w-3xl mx-auto">
          AI matching, live tracking, and digital customs.<span className="inline-block animate-pulse ml-1 text-[#3ECF8E]">|</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full max-w-2xl mx-auto">
            <button
              onClick={() => isAuthenticated ? onSelectPortal('shipper') : setShowRegistration(true)}
              className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold text-xs md:text-sm px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(62,207,142,0.3)] transition duration-200 transform hover:-translate-y-0.5 w-full sm:w-auto text-center"
            >
              GET STARTED
            </button>
            <button
              onClick={() => onSelectPortal('finance')}
              className="bg-black/50 hover:bg-black/75 border border-white/20 hover:border-[#3ECF8E]/50 text-white font-semibold text-xs md:text-sm px-6 py-3.5 rounded-xl backdrop-blur-md transition duration-200 w-full sm:w-auto text-center"
            >
              CALCULATE RATE
            </button>
          </div>


        </div>

        {/* Explore Down Arrow */}
        <div className="relative z-30 pb-8 w-full flex justify-center">
          <div className="flex flex-col items-center animate-bounce opacity-50 cursor-pointer" onClick={(e) => handleSmoothScroll(e as any, 'system-pillars')}>
            <span className="text-[10px] text-white font-mono uppercase tracking-widest mb-1">Explore</span>
            <ChevronDown size={16} className="text-white" />
          </div>
        </div>
      </section>

      {/* =================================================================================
          TRUSTED BY
          ================================================================================= */}
      <section id="platform-overview" className="w-full bg-[#0C0C0C] border-y border-[#262626] py-10 relative z-40">
        <div className="max-w-[90rem] mx-auto px-6 text-center">
          <p className="text-[11px] font-mono tracking-widest text-[#8F8F8F] uppercase text-center mb-6">TRUSTED BY EAST Africa'S PRINCIPAL LOGISTICS ACTORS</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            {[
              { src: '/ECC.jfif', alt: 'ECC', title: 'Ethiopian Customs Commission', height: 'h-8' },
              { src: '/telebirr.png', alt: 'telebirr', title: 'Telebirr', height: 'h-6' },
              { src: '/ethiopian shiping and logestic.png', alt: 'ESLSE', title: 'Ethiopian Shipping and Logistics', height: 'h-10' },
              { src: '/CBE.jfif', alt: 'CBE', title: 'Commercial Bank of Ethiopia', height: 'h-8' },
              { src: '/EAC.png', alt: 'EAC', title: 'Ethiopian Airlines Cargo', height: 'h-6' },
              { src: '/DPCA.jpg', alt: 'DPCA', title: 'Djibouti Ports and Corridor Authority', height: 'h-10' }
            ].map((logo, idx) => (
              <div key={idx} className="h-12 px-5 rounded-xl bg-[#141414]/90 border border-[#262626] flex items-center justify-center transition-all duration-300 hover:border-[#3ECF8E]/40 hover:bg-[#1A1A1A] group">
                <img src={logo.src} alt={logo.alt} className="h-7 w-auto max-w-[90px] object-contain mix-blend-screen opacity-80 hover:opacity-100 transition" title={logo.title} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 1: CORRIDOR TELEMATICS
          ================================================================================= */}
      <section id="corridor-telematics" className="w-full bg-[#0C0C0C] py-20 relative z-40 border-b border-[#262626] overflow-hidden">
        {/* Subtle background effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#3ECF8E]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          <div className="lg:col-span-5 flex flex-col justify-center animate-in fade-in slide-in-from-left-8 duration-1000">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-medium tracking-wide uppercase bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] mb-4 w-fit">
              <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
              • LIVE CORRIDOR TELEMATICS (810KM ARTERY)
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-white tracking-tight whitespace-nowrap mb-4">
              Corridor Telematics <span className="text-[#3ECF8E]">& Deep ETA</span>
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mb-6">
              GPS position updates ingested at least every 5 minutes while in transit. ETA model recalculates predicted arrival using live position, historical corridor transit-time data, weather, and known congestion/conflict alerts.
            </p>
            <ul className="space-y-3 mb-10">
              <li className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 flex items-center gap-3.5 hover:border-[#3ECF8E]/30 transition duration-200">
                <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center shrink-0"><Navigation size={14} /></div> 
                <span className="text-xs font-semibold text-zinc-200 tracking-wide">Gradient-Boosted ETA Models</span>
              </li>
              <li className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 flex items-center gap-3.5 hover:border-[#3ECF8E]/30 transition duration-200">
                <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center shrink-0"><Shield size={14} /></div> 
                <span className="text-xs font-semibold text-zinc-200 tracking-wide">Security-Aware Rerouting (FR-08)</span>
              </li>
              <li className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 flex items-center gap-3.5 hover:border-[#3ECF8E]/30 transition duration-200">
                <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center shrink-0"><MapPin size={14} /></div> 
                <span className="text-xs font-semibold text-zinc-200 tracking-wide">810km Djibouti–Modjo Route Tracking</span>
              </li>
            </ul>
            
            <button className="group flex w-fit items-center gap-2 bg-[#EDEDED] hover:bg-white text-black px-6 py-3 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              See Live Demo
              <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="lg:col-span-7 w-full h-[400px] lg:h-[480px] rounded-2xl bg-[#141414] border border-[#262626] p-2 relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 group">
            <LiveTelematicsMap />
            
            {/* Floating Live Status Card */}
            <div className="absolute top-8 right-8 bg-[#0C0C0C]/90 border border-[#262626] backdrop-blur-md rounded-2xl p-4 shadow-xl transition-transform duration-500 hover:scale-105 z-20 hidden md:block">
              <div className="flex items-center justify-between mb-3 border-b border-[#262626] pb-3 gap-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#3ECF8E]/10 rounded-lg border border-[#3ECF8E]/20">
                    <Truck size={14} className="text-[#3ECF8E]" />
                  </div>
                  <span className="text-xs font-bold text-[#EDEDED] tracking-wide">Truck DX-982</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30 font-mono text-[10px] px-2.5 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
                  <span>EN ROUTE</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-widest mb-1">Speed</div>
                  <div className="text-sm font-extrabold text-[#EDEDED]">62 <span className="text-[10px] text-[#8F8F8F]">km/h</span></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-widest mb-1">ETA</div>
                  <div className="text-sm font-extrabold text-[#3ECF8E]">{etaMins} <span className="text-[10px]">mins</span></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-widest mb-1" title="AI Confidence Score">Conf</div>
                  <div className="text-sm font-extrabold text-[#EDEDED]">{etaConfidence.toFixed(1)}<span className="text-[10px] text-[#8F8F8F]">%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 2: AI LOAD BOARD
          ================================================================================= */}
      <section id="load-board" className="w-full bg-[#0C0C0C] py-32 relative z-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C] to-[#0C0C0C] pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[#3ECF8E]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-[90rem] mx-auto px-8 md:px-12 flex flex-col md:flex-row-reverse items-center gap-16 relative z-10">
          <div className="flex-1">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-mono uppercase tracking-widest mb-6">
              <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
              Matching Engine
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#EDEDED] tracking-tight whitespace-nowrap mb-6">
              AI-Powered Freight Matching
            </h2>
            <p className="text-sm text-[#8F8F8F] leading-relaxed mb-8 max-w-lg">
              Two-sided marketplace onboarding with verified transporter identity. Matching engine ranks eligible transporters by a weighted score of cost, historical reliability, fuel efficiency, and proximity.
            </p>
            <ul className="space-y-4 font-bold text-sm text-[#EDEDED]">
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> &lt; 1 Second Response Time</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> Multi-Objective Scoring Function</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> Strict Fleet Verification (FR-01)</li>
            </ul>
          </div>
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-0 bg-[#3ECF8E]/5 rounded-3xl blur-2xl transform scale-105 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-full bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl relative z-10">
              <div className="flex justify-between items-center mb-8 border-b border-[#262626] pb-4">
                <div className="font-bold text-lg text-[#EDEDED]">Load Board</div>
                <div className="flex items-center gap-2 text-[10px] font-mono border border-[#3ECF8E]/50 text-[#3ECF8E] bg-[#3ECF8E]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
                  Live Bids
                </div>
              </div>
              <div className="space-y-4">
                {liveBids.map((bid, i) => (
                  <div key={bid.id} className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${i === 0 ? 'bg-[#1A1A1A] border border-[#3ECF8E]/40 shadow-[0_0_20px_rgba(62,207,142,0.06)]' : 'bg-[#0C0C0C] border border-[#262626] hover:border-[#262626]/80'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg ${i === 0 ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30' : 'bg-[#141414] text-[#EDEDED] border border-[#262626]'}`}>
                        T{i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#EDEDED]">Transporter #{bid.id}</div>
                        <div className="text-xs text-[#8F8F8F] font-medium">Score: <span className={i === 0 ? 'text-[#3ECF8E] font-bold' : 'text-[#8F8F8F]'}>{bid.score.toFixed(1)}%</span> Match</div>
                      </div>
                    </div>
                    <button className={`px-4 py-2 text-xs font-bold transition-colors ${i === 0 ? 'bg-[#3ECF8E] hover:bg-[#34b27b] text-black rounded-lg' : 'border border-[#262626] text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#141414] rounded-lg'}`}>
                      {i === 0 ? 'Accept Match' : 'View'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          IMPACT METRICS
          ================================================================================= */}
      <section className="w-full bg-[#0C0C0C] py-24 relative z-40 border-y border-[#262626]">
        <div className="max-w-[90rem] mx-auto px-8 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-5xl lg:text-6xl font-black tracking-tighter mb-2 text-white">{impactMetrics.activeTransporters}<span className="text-[#3ECF8E]">+</span></div>
            <div className="text-[11px] font-bold text-[#8F8F8F] uppercase tracking-widest">Active Transporters</div>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-5xl lg:text-6xl font-black tracking-tighter mb-2 text-white">{impactMetrics.tonsDelivered}<span className="text-[#3ECF8E]">+</span></div>
            <div className="text-[11px] font-bold text-[#8F8F8F] uppercase tracking-widest">Tons Delivered</div>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-5xl lg:text-6xl font-black tracking-tighter mb-2 text-white">{impactMetrics.uptime}<span className="text-[#3ECF8E]">%</span></div>
            <div className="text-[11px] font-bold text-[#8F8F8F] uppercase tracking-widest">Platform Uptime</div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 3: DYNAMIC RATES
          ================================================================================= */}
      <section id="dynamic-rates" className="w-full bg-[#0C0C0C] py-32 relative z-40 border-b border-[#262626]">
        <div className="max-w-[90rem] mx-auto px-8 md:px-12 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">

            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#EDEDED] tracking-tight whitespace-nowrap mb-6">
              Dynamic Pricing & Settlement
            </h2>
            <p className="text-sm text-[#8F8F8F] leading-relaxed mb-8 max-w-lg">
              Spot rates computed from current demand/capacity balance, fuel-cost index, and corridor congestion. Integrated with Mobile-Money platforms (TeleBirr) for automated payout scheduling and reconciliation.
            </p>
            <ul className="space-y-4 font-bold text-sm text-[#EDEDED]">
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> Real-time Spot & Contract Rates</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> Fuel Consumption Analytics (FR-07)</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> Mobile-Money Escrow Engine</li>
            </ul>
          </div>
          <div className="flex-1 w-full bg-[#141414] rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-end h-80 border border-[#262626]">
            <div className="absolute top-8 left-8 text-[#EDEDED] z-10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
                 <div className="text-[10px] font-mono uppercase tracking-widest text-[#3ECF8E]">Live Spot Index</div>
              </div>
              <div className="text-3xl font-extrabold">ETB {(liveSpotIndex / 1000).toFixed(1)}K</div>
            </div>
            <div className="flex items-end gap-2 h-40 relative z-10 opacity-80 mt-auto">
              {[40, 55, 45, 70, 60, 85, 90, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-[#3ECF8E] hover:bg-[#34b27b] transition-colors cursor-pointer rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 4: CUSTOMS SYNC
          ================================================================================= */}
      <section id="customs-sync" className="w-full bg-[#0C0C0C] py-32 relative z-40 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#3ECF8E]/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-[90rem] mx-auto px-8 md:px-12 flex flex-col md:flex-row-reverse items-center gap-16 relative z-10">
          <div className="flex-1">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-mono uppercase tracking-widest mb-6">
              <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
              Customs Sync
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight whitespace-nowrap mb-6 text-[#EDEDED]">
              Digital Customs <span className="text-[#3ECF8E]">Documentation</span>
            </h2>
            <p className="text-sm text-[#8F8F8F] leading-relaxed mb-8 max-w-lg">
              Support upload and structured capture of key clearance documents (commercial invoice, packing list, bill of lading). Automated validation checks for completeness and consistency before submission.
            </p>
            <ul className="space-y-4 font-bold text-sm text-[#EDEDED]">
              <li className="flex items-center gap-4 bg-[#141414] p-3 rounded-xl border border-[#262626] hover:border-[#3ECF8E]/30 transition-colors"><Check size={20} className="text-[#3ECF8E]" /> Immutable Document Vault</li>
              <li className="flex items-center gap-4 bg-[#141414] p-3 rounded-xl border border-[#262626] hover:border-[#3ECF8E]/30 transition-colors"><Check size={20} className="text-[#3ECF8E]" /> Status Tracking & Validation</li>
              <li className="flex items-center gap-4 bg-[#141414] p-3 rounded-xl border border-[#262626] hover:border-[#3ECF8E]/30 transition-colors"><Check size={20} className="text-[#3ECF8E]" /> 7-Year Audit Ledger Compliance</li>
            </ul>
          </div>
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-0 bg-[#3ECF8E]/10 rounded-3xl blur-2xl transform scale-105 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-full bg-[#141414] border border-[#262626] rounded-3xl p-6 shadow-2xl relative z-10">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#262626]">
                <div className="w-12 h-12 bg-[#0C0C0C] text-[#3ECF8E] rounded-2xl flex items-center justify-center shadow-lg border border-[#262626]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="font-bold text-lg text-[#EDEDED]">Clearance Vault</div>
                  <div className="text-[10px] font-mono text-[#3ECF8E] uppercase tracking-wider">Status: Cleared</div>
                </div>
              </div>
              <div className="space-y-3">
                {['Commercial Invoice', 'Packing List', 'Certificate of Origin', 'Bill of Lading'].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-[#262626] rounded-xl bg-[#0C0C0C] hover:border-[#3ECF8E]/30 transition-colors">
                    <span className="text-sm font-bold text-[#EDEDED]">{doc}</span>
                    <div className="w-6 h-6 rounded-full bg-[#3ECF8E]/10 flex items-center justify-center border border-[#3ECF8E]/20">
                      <Check size={14} className="text-[#3ECF8E]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          INTERACTIVE FREIGHT CALCULATOR (CTA)
          ================================================================================= */}
      <section className="w-full bg-[#0C0C0C] py-32 relative z-40 border-t border-[#262626]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight mb-4 text-[#EDEDED]">Instant AI Spot Rate</h2>
            <p className="text-sm text-[#8F8F8F] leading-relaxed max-w-2xl mx-auto">Get a predictive, data-driven freight quote instantly.</p>
          </div>
          
          <div className="max-w-7xl mx-auto p-8 rounded-2xl bg-[#141414] border border-[#262626] shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-2">Origin (Port)</label>
                <select 
                  value={calcFrom} 
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className="w-full bg-[#0C0C0C] border border-[#262626] rounded-xl px-4 py-3 text-sm text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] outline-none transition"
                >
                  <option value="" disabled>Select Origin</option>
                  <option value="djibouti">Djibouti Port (SGTD)</option>
                  <option value="berbera">Berbera Port</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-2">Destination (Dry Port)</label>
                <select 
                  value={calcTo} 
                  onChange={(e) => setCalcTo(e.target.value)}
                  className="w-full bg-[#0C0C0C] border border-[#262626] rounded-xl px-4 py-3 text-sm text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] outline-none transition"
                >
                  <option value="" disabled>Select Destination</option>
                  <option value="modjo">Modjo Dry Port</option>
                  <option value="semera">Semera Dry Port</option>
                  <option value="kality">Addis Ababa (Kality)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-2">Cargo Weight (Tons)</label>
                <input 
                  type="number" 
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full bg-[#0C0C0C] border border-[#262626] rounded-xl px-4 py-3 text-sm text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] outline-none transition"
                />
              </div>
              <button 
                onClick={handleCalculate}
                disabled={!calcFrom || !calcTo || !calcWeight || calcState === 'loading'}
                className="w-full py-3 rounded-xl bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold text-sm tracking-wide transition disabled:opacity-50 mt-2"
              >
                {calcState === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#141414]/30 border-t-black rounded-full animate-spin"></div>
                    Calculating AI Rate...
                  </span>
                ) : 'Calculate AI Spot Rate'}
              </button>
            </div>
            
            <div className="bg-[#0C0C0C] border border-[#262626] rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/telematics_map.jpg')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C]/90 to-[#0C0C0C]/40"></div>
              
              {calcState === 'result' && calcRate ? (
                <div className="relative z-10 w-full animate-in fade-in zoom-in duration-500">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#3ECF8E] mb-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
                    Live Quote Generated
                  </div>
                  <div className="text-3xl font-mono font-black text-[#3ECF8E] mb-6 tracking-tight">
                    ETB {calcRate.toLocaleString()}
                  </div>
                  
                  <div className="w-full space-y-2 text-left">
                    <div className="bg-[#141414] border border-[#262626] rounded-lg p-3 text-sm text-[#8F8F8F] flex justify-between">
                      <span>Fuel Index:</span>
                      <span className="font-bold text-[#EDEDED]">1.08x</span>
                    </div>
                    <div className="bg-[#141414] border border-[#262626] rounded-lg p-3 text-sm text-[#8F8F8F] flex justify-between">
                      <span>Congestion Surcharge:</span>
                      <span className="font-bold text-[#EDEDED]">Low</span>
                    </div>
                    <div className="bg-[#141414] border border-[#262626] rounded-lg p-3 text-sm text-[#8F8F8F] flex justify-between">
                      <span>Corridor Transit:</span>
                      <span className="font-bold text-[#EDEDED]">28 hrs</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 px-4 py-2 rounded-lg border border-[#3ECF8E]/20">
                    <Check size={14} /> TeleBirr Instant Escrow Settlement Supported
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full border border-[#3ECF8E]/30 animate-ping"></div>
                    <Zap size={24} className="text-[#3ECF8E]" />
                  </div>
                  <p className="font-mono text-[11px] text-[#8F8F8F] max-w-[220px] uppercase tracking-widest leading-relaxed">
                    Awaiting freight parameters...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 5: ENTERPRISE STATS & COMPLIANCE FOOTER
          ================================================================================= */}
      <footer className="w-full bg-[#0C0C0C] border-t border-[#262626] py-12 px-6 relative z-40">
        <div className="max-w-[90rem] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-bold text-[#EDEDED] mb-4">TradeFlow Logistics Engine</h3>
              <p className="text-sm text-[#8F8F8F] leading-relaxed mb-6">
                Aligned with Ethiopian Customs Commission &amp; Ethiopian Shipping and Logistics Services Enterprise specifications.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 px-3 py-1.5 rounded border border-[#3ECF8E]/30">
                  <div className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-ping"></div>
                  System Status: OPERATIONAL (LIVE)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-[#EDEDED] mb-4">Platform</h4>
                <ul className="space-y-3 text-sm text-[#8F8F8F]">
                  <li><button className="hover:text-[#EDEDED] transition-colors">Platform Specs</button></li>
                  <li><button onClick={(e) => handleSmoothScroll(e as any, 'corridor-telematics')} className="hover:text-[#EDEDED] transition-colors">Corridor Telematics</button></li>
                  <li><button onClick={() => setActiveComplianceModal({ title: 'Pricing Formulas', content: 'SRS FR-04: Dynamic Pricing Equation\n\nSpotRate = BaseLine + (DieselIndex_Delta × 0.4) + Equipment_Surcharge\n\nAll pricing bounds are algorithmically enforced strictly between -15% and +45% of the 30-day historical moving average for the respective corridor segment.' })} className="hover:text-[#EDEDED] transition-colors">Pricing Formulas</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#EDEDED] mb-4">Compliance</h4>
                <ul className="space-y-3 text-sm text-[#8F8F8F]">
                  <li><button onClick={() => setActiveComplianceModal({ title: 'Escrow Mediation Rules', content: 'SRS FR-10: TeleBirr Escrow Rules\n\n1. Funds are locked into a smart-contract multi-sig wallet upon load assignment.\n2. Payment is automatically released only when e-PoD (Proof of Delivery) is validated by the receiving terminal.\n3. Dispute mediation relies on GPS timestamps and immutable scale weighbridge logs.' })} className="hover:text-[#EDEDED] transition-colors">Escrow Mediation Rules</button></li>
                  <li><button onClick={() => setActiveComplianceModal({ title: '7-Year Audit Ledger', content: 'SRS Section 6: Audit & Data Retention\n\nTo comply with Ethiopian federal regulatory standards, all manifest data, inspection logs, and financial transactions are cryptographically signed and stored in immutable ledger storage for 7 years.' })} className="hover:text-[#EDEDED] transition-colors">7-Year Audit Ledger</button></li>
                  <li><button className="hover:text-[#EDEDED] transition-colors">Risk Assessment Profiles</button></li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 bg-[#141414] border border-[#262626] rounded-xl p-6">
              <h4 className="text-sm font-bold text-[#EDEDED] mb-2">Regulatory Alignment</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-[#8F8F8F]">
                  <Shield size={18} className="text-[#3ECF8E]" />
                  <span>ECC Phase-2 Single Window Ready</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#8F8F8F]">
                  <MapPin size={18} className="text-[#3ECF8E]" />
                  <span>Regional East Africa Data Residency</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#8F8F8F]">
                  <FileText size={18} className="text-[#3ECF8E]" />
                  <span>TeleBirr API Integrated Escrow</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#262626] pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] font-mono text-[#8F8F8F]">
            <p>© 2026 TradeFlow Logistics Platform. Developed for East Africa's Principal Corridor.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-[#EDEDED] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#EDEDED] transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
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
