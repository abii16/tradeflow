import React, { useState } from 'react';
import { en, am } from '../../i18n/landing';
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
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const t = lang === 'en' ? en : am;
  
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
        <div className="bg-[#232323] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#2E2E2E]">
          <div className="p-6 border-b border-[#2E2E2E] flex justify-between items-center bg-[#181818]">
            <h3 className="font-bold text-lg text-[#EDEDED] flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#3ECF8E]" />
              {activeComplianceModal.title}
            </h3>
            <button onClick={() => setActiveComplianceModal(null)} className="text-[#8F8F8F] hover:text-[#EDEDED]">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#EDEDED] leading-relaxed font-mono whitespace-pre-wrap bg-[#181818] p-4 rounded-lg border border-[#2E2E2E]">
              {activeComplianceModal.content}
            </p>
          </div>
          <div className="p-4 bg-[#181818] border-t border-[#2E2E2E] flex justify-end">
            <button onClick={() => setActiveComplianceModal(null)} className="bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] px-6 py-2 rounded-lg text-sm font-bold shadow-md">
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
    <div className="min-h-screen w-full overflow-y-auto bg-[#1C1C1C] font-inter text-[#EDEDED] smooth-scroll relative">
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1C]/95 via-[#1C1C1C]/85 to-[#1C1C1C]" />
        </div>

        {/* TOP NAVIGATION HEADER */}
        <header className={`fixed top-0 left-0 w-full h-16 border-b px-8 flex items-center justify-between z-[60] backdrop-blur-md transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#1C1C1C]/95 border-[#2E2E2E] shadow-2xl' 
            : 'bg-[#1C1C1C]/80 border-[#2E2E2E]'
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
              <a href="#platform-overview" onClick={(e) => handleSmoothScroll(e, 'platform-overview')} className="text-sm font-bold text-[#EDEDED] hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 border border-transparent hover:border-[#3ECF8E]/50 rounded-full px-4 py-2 transition-all duration-300 transform hover:scale-105">{t.nav.platformOverview}</a>
              <a href="#load-board" onClick={(e) => handleSmoothScroll(e, 'load-board')} className="text-sm font-bold text-[#EDEDED] hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 border border-transparent hover:border-[#3ECF8E]/50 rounded-full px-4 py-2 transition-all duration-300 transform hover:scale-105">{t.nav.loadBoard}</a>
              <a href="#dynamic-rates" onClick={(e) => handleSmoothScroll(e, 'dynamic-rates')} className="text-sm font-bold text-[#EDEDED] hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 border border-transparent hover:border-[#3ECF8E]/50 rounded-full px-4 py-2 transition-all duration-300 transform hover:scale-105">{t.nav.dynamicRates}</a>
              <a href="#customs-sync" onClick={(e) => handleSmoothScroll(e, 'customs-sync')} className="text-sm font-bold text-[#EDEDED] hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 border border-transparent hover:border-[#3ECF8E]/50 rounded-full px-4 py-2 transition-all duration-300 transform hover:scale-105">{t.nav.customsSync}</a>
            </nav>

            <div className="hidden md:block w-px h-6 bg-[#262626]"></div>

            <div className="flex items-center gap-4">
              <button className="px-2.5 py-1 text-xs font-mono border border-[#2E2E2E] text-zinc-300 rounded-lg hover:border-[#3ECF8E]/50 transition" onClick={() => setLang(l => l === 'en' ? 'am' : 'en')}>{lang === 'en' ? 'EN | አማ' : 'አማ | EN'}</button>
              {!isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm font-bold text-[#EDEDED] hover:text-white px-4 py-2 rounded-full hover:bg-[#2A2A2A] transition-all duration-300"
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
                  className="text-sm font-bold text-[#EDEDED] hover:text-white px-4 py-2 rounded-full hover:bg-[#2A2A2A] transition-all duration-300"
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
            Intelligent <span className="text-[#3ECF8E]">{t.hero.titleHighlight}</span>.
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
            <span className="text-[10px] text-white font-mono uppercase tracking-widest mb-1">{t.nav.explore}</span>
            <ChevronDown size={16} className="text-white" />
          </div>
        </div>
      </section>

      {/* =================================================================================
          TRUSTED BY
          ================================================================================= */}
      <section id="platform-overview" className="w-full bg-[#1C1C1C] border-y border-[#2E2E2E] py-10 relative z-40">
        <div className="max-w-[90rem] mx-auto px-6 text-center">
          <p className="text-[11px] font-mono tracking-widest text-[#8F8F8F] uppercase text-center mb-6">{t.trustedBy}</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            {[
              { src: '/ECC.jfif', alt: 'ECC', title: 'Ethiopian Customs Commission', height: 'h-8' },
              { src: '/telebirr.png', alt: 'telebirr', title: 'Telebirr', height: 'h-6' },
              { src: '/ethiopian shiping and logestic.png', alt: 'ESLSE', title: 'Ethiopian Shipping and Logistics', height: 'h-10' },
              { src: '/CBE.jfif', alt: 'CBE', title: 'Commercial Bank of Ethiopia', height: 'h-8' },
              { src: '/EAC.png', alt: 'EAC', title: 'Ethiopian Airlines Cargo', height: 'h-6' },
              { src: '/DPCA.jpg', alt: 'DPCA', title: 'Djibouti Ports and Corridor Authority', height: 'h-10' }
            ].map((logo, idx) => (
              <div key={idx} className="h-12 px-5 rounded-xl bg-[#232323]/90 border border-[#2E2E2E] flex items-center justify-center transition-all duration-300 hover:border-[#3ECF8E]/40 hover:bg-[#2E2E2E] group">
                <img src={logo.src} alt={logo.alt} className="h-7 w-auto max-w-[90px] object-contain mix-blend-screen grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition duration-500" title={logo.title} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 1: CORRIDOR TELEMATICS
          ================================================================================= */}
      <section id="corridor-telematics" className="w-full bg-[#1C1C1C] py-20 relative z-40 border-b border-[#2E2E2E] overflow-hidden">
        {/* Subtle background effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#3ECF8E]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          <div className="lg:col-span-5 flex flex-col justify-center animate-in fade-in slide-in-from-left-8 duration-1000">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-medium tracking-wide uppercase bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] mb-4 w-fit">
              <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
              {t.telematics.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-white tracking-tight whitespace-nowrap mb-4">
              {t.telematics.titlePrefix} <span className="text-[#3ECF8E]">{t.telematics.titleHighlight}</span>
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mb-6">
              {t.telematics.desc}
            </p>
            <ul className="space-y-3 mb-10">
              <li className="bg-[#232323] border border-[#2E2E2E] rounded-xl px-4 py-3 flex items-center gap-3.5 hover:border-[#3ECF8E]/30 transition duration-200">
                <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center shrink-0"><Navigation size={14} /></div> 
                <span className="text-xs font-semibold text-zinc-200 tracking-wide">{t.telematics.features[0]}</span>
              </li>
              <li className="bg-[#232323] border border-[#2E2E2E] rounded-xl px-4 py-3 flex items-center gap-3.5 hover:border-[#3ECF8E]/30 transition duration-200">
                <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center shrink-0"><Shield size={14} /></div> 
                <span className="text-xs font-semibold text-zinc-200 tracking-wide">{t.telematics.features[1]}</span>
              </li>
              <li className="bg-[#232323] border border-[#2E2E2E] rounded-xl px-4 py-3 flex items-center gap-3.5 hover:border-[#3ECF8E]/30 transition duration-200">
                <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center shrink-0"><MapPin size={14} /></div> 
                <span className="text-xs font-semibold text-zinc-200 tracking-wide">{t.telematics.features[2]}</span>
              </li>
            </ul>
            
            <button className="group flex w-fit items-center gap-2 bg-[#232323] border border-[#2E2E2E] hover:border-[#8F8F8F] text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:bg-[#2A2A2A]">
              See Live Demo
              <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="lg:col-span-7 w-full h-[400px] lg:h-[480px] rounded-2xl bg-[#232323] border border-[#2E2E2E] p-2 relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 group">
            <LiveTelematicsMap />
            
            {/* Floating Live Status Card */}
            <div className="absolute top-8 right-8 bg-[#1C1C1C]/90 border border-[#2E2E2E] backdrop-blur-md rounded-2xl p-4 shadow-xl transition-transform duration-500 hover:scale-105 z-20 hidden md:block">
              <div className="flex items-center justify-between mb-3 border-b border-[#2E2E2E] pb-3 gap-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#3ECF8E]/10 rounded-lg border border-[#3ECF8E]/20">
                    <Truck size={14} className="text-[#3ECF8E]" />
                  </div>
                  <span className="text-xs font-bold text-[#EDEDED] tracking-wide">Truck DX-982</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30 font-mono text-[10px] px-2.5 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
                  <span>{t.telematics.truckStatus}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-widest mb-1">{t.telematics.speed}</div>
                  <div className="text-sm font-extrabold text-[#EDEDED]">62 <span className="text-[10px] text-[#8F8F8F]">km/h</span></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-widest mb-1">{t.telematics.eta}</div>
                  <div className="text-sm font-extrabold text-[#3ECF8E]">{etaMins} <span className="text-[10px]">{t.telematics.etaMins}</span></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8F8F8F] uppercase tracking-widest mb-1" title="AI Confidence Score">{t.telematics.conf}</div>
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
      <section id="load-board" className="w-full bg-[#1C1C1C] py-32 relative z-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1C] to-[#1C1C1C] pointer-events-none"></div>
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
              {t.matching.desc}
            </p>
            <ul className="space-y-4 font-bold text-sm text-[#EDEDED]">
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> &lt; 1 Second Response Time</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> {t.matching.features[1]}</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> {t.matching.features[2]}</li>
            </ul>
          </div>
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-0 bg-[#3ECF8E]/5 rounded-3xl blur-2xl transform scale-105 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-full bg-[#232323] border border-[#2E2E2E] rounded-2xl p-6 shadow-2xl relative z-10">
              <div className="flex justify-between items-center mb-8 border-b border-[#2E2E2E] pb-4">
                <div className="font-bold text-lg text-[#EDEDED]">{t.matching.loadBoardTitle}</div>
                <div className="flex items-center gap-2 text-[10px] font-mono border border-[#3ECF8E]/50 text-[#3ECF8E] bg-[#3ECF8E]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
                  Live Bids
                </div>
              </div>
              <div className="space-y-4">
                {liveBids.map((bid, i) => (
                  <div key={bid.id} className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${i === 0 ? 'bg-[#2E2E2E] border border-[#3ECF8E]/40 shadow-[0_0_20px_rgba(62,207,142,0.06)]' : 'bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#2E2E2E]/80'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg ${i === 0 ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30' : 'bg-[#232323] text-[#EDEDED] border border-[#2E2E2E]'}`}>
                        T{i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#EDEDED]">Transporter #{bid.id}</div>
                        <div className="text-xs text-[#8F8F8F] font-medium">{t.matching.score}: <span className={i === 0 ? 'text-[#3ECF8E] font-bold' : 'text-[#8F8F8F]'}>{bid.score.toFixed(1)}%</span> {t.matching.match}</div>
                      </div>
                    </div>
                    <button className={`px-4 py-2 text-xs font-bold transition-colors ${i === 0 ? 'bg-[#3ECF8E] hover:bg-[#34b27b] text-black rounded-lg' : 'border border-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#232323] rounded-lg'}`}>
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
      <section className="w-full bg-[#1C1C1C] py-24 relative z-40 border-y border-[#2E2E2E]">
        <div className="max-w-[90rem] mx-auto px-8 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-4xl lg:text-5xl font-black tracking-tighter mb-2 text-white">{impactMetrics.activeTransporters}<span className="text-[#3ECF8E]">+</span></div>
            <div className="text-[11px] font-bold text-[#8F8F8F] uppercase tracking-widest">{t.metrics.activeTransporters}</div>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-4xl lg:text-5xl font-black tracking-tighter mb-2 text-white">{impactMetrics.tonsDelivered}<span className="text-[#3ECF8E]">+</span></div>
            <div className="text-[11px] font-bold text-[#8F8F8F] uppercase tracking-widest">{t.metrics.tonsDelivered}</div>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-4xl lg:text-5xl font-black tracking-tighter mb-2 text-white">{impactMetrics.uptime}<span className="text-[#3ECF8E]">%</span></div>
            <div className="text-[11px] font-bold text-[#8F8F8F] uppercase tracking-widest">{t.metrics.uptime}</div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 3: DYNAMIC RATES
          ================================================================================= */}
      <section id="dynamic-rates" className="w-full bg-[#1C1C1C] py-32 relative z-40 border-b border-[#2E2E2E]">
        <div className="max-w-[90rem] mx-auto px-8 md:px-12 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">

            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#EDEDED] tracking-tight whitespace-nowrap mb-6">
              Dynamic Pricing & Settlement
            </h2>
            <p className="text-sm text-[#8F8F8F] leading-relaxed mb-8 max-w-lg">
              {t.pricing.desc}
            </p>
            <ul className="space-y-4 font-bold text-sm text-[#EDEDED]">
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> Real-time Spot & Contract Rates</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> Fuel Consumption Analytics (FR-07)</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-[#3ECF8E]" /> Mobile-Money Escrow Engine</li>
            </ul>
          </div>
          <div className="flex-1 w-full bg-[#232323] rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-end h-80 border border-[#2E2E2E]">
            <div className="absolute top-8 left-8 text-[#EDEDED] z-10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
                 <div className="text-[10px] font-mono uppercase tracking-widest text-[#3ECF8E]">{t.pricing.liveSpotIndex}</div>
              </div>
              <div className="text-3xl font-extrabold">ETB {(liveSpotIndex / 1000).toFixed(1)}K</div>
            </div>
            <div className="flex items-end gap-2 h-40 relative z-10 opacity-80 mt-auto">
              {[40, 55, 45, 70, 60, 85, 90, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-[#3ECF8E]/10 to-[#3ECF8E]/90 border-t border-[#3ECF8E] hover:to-[#3ECF8E] transition-all duration-300 cursor-pointer rounded-t-sm hover:shadow-[0_0_20px_rgba(62,207,142,0.3)]" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 4: CUSTOMS SYNC
          ================================================================================= */}
      <section id="customs-sync" className="w-full bg-[#1C1C1C] py-32 relative z-40 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#3ECF8E]/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-[90rem] mx-auto px-8 md:px-12 flex flex-col md:flex-row-reverse items-center gap-16 relative z-10">
          <div className="flex-1">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-mono uppercase tracking-widest mb-6">
              <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.8)]"></div>
              Customs Sync
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight whitespace-nowrap mb-6 text-[#EDEDED]">
              {t.customs.titlePrefix} <span className="text-[#3ECF8E]">{t.customs.titleHighlight}</span>
            </h2>
            <p className="text-sm text-[#8F8F8F] leading-relaxed mb-8 max-w-lg">
              {t.customs.desc}
            </p>
            <ul className="space-y-4 font-bold text-sm text-[#EDEDED]">
              <li className="flex items-center gap-4 bg-[#232323] p-3 rounded-xl border border-[#2E2E2E] hover:border-[#3ECF8E]/30 transition-colors"><Check size={20} className="text-[#3ECF8E]" /> Immutable Document Vault</li>
              <li className="flex items-center gap-4 bg-[#232323] p-3 rounded-xl border border-[#2E2E2E] hover:border-[#3ECF8E]/30 transition-colors"><Check size={20} className="text-[#3ECF8E]" /> Status Tracking & Validation</li>
              <li className="flex items-center gap-4 bg-[#232323] p-3 rounded-xl border border-[#2E2E2E] hover:border-[#3ECF8E]/30 transition-colors"><Check size={20} className="text-[#3ECF8E]" /> 7-Year Audit Ledger Compliance</li>
            </ul>
          </div>
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-0 bg-[#3ECF8E]/10 rounded-3xl blur-2xl transform scale-105 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-full bg-[#232323] border border-[#2E2E2E] rounded-3xl p-6 shadow-2xl relative z-10">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#2E2E2E]">
                <div className="w-12 h-12 bg-[#1C1C1C] text-[#3ECF8E] rounded-2xl flex items-center justify-center shadow-lg border border-[#2E2E2E]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="font-bold text-lg text-[#EDEDED]">{t.customs.vault}</div>
                  <div className="text-[10px] font-mono text-[#3ECF8E] uppercase tracking-wider">{t.customs.status}</div>
                </div>
              </div>
              <div className="space-y-3">
                {t.customs.docs.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-[#2E2E2E] rounded-xl bg-[#1C1C1C] hover:border-[#3ECF8E]/30 transition-colors">
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
      <section className="w-full bg-[#1C1C1C] py-32 relative z-40 border-t border-[#2E2E2E]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight mb-4 text-[#EDEDED]">{t.calculator.title}</h2>
            <p className="text-sm text-[#8F8F8F] leading-relaxed max-w-2xl mx-auto">{t.calculator.desc}</p>
          </div>
          
          <div className="max-w-7xl mx-auto p-8 rounded-2xl bg-[#232323] border border-[#2E2E2E] shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-2">{t.calculator.origin}</label>
                <select 
                  value={calcFrom} 
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-4 py-3 text-sm text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] outline-none transition"
                >
                  <option value="" disabled>Select Origin</option>
                  <option value="djibouti">Djibouti Port (SGTD)</option>
                  <option value="berbera">Berbera Port</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-2">{t.calculator.destination}</label>
                <select 
                  value={calcTo} 
                  onChange={(e) => setCalcTo(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-4 py-3 text-sm text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] outline-none transition"
                >
                  <option value="" disabled>Select Destination</option>
                  <option value="modjo">Modjo Dry Port</option>
                  <option value="semera">Semera Dry Port</option>
                  <option value="kality">Addis Ababa (Kality)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-2">{t.calculator.weight}</label>
                <input 
                  type="number" 
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-4 py-3 text-sm text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] outline-none transition"
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
            
            <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/telematics_map.jpg')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/90 to-[#1C1C1C]/40"></div>
              
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
                    <div className="bg-[#232323] border border-[#2E2E2E] rounded-lg p-3 text-sm text-[#8F8F8F] flex justify-between">
                      <span>{t.calculator.fuelIndex}</span>
                      <span className="font-bold text-[#EDEDED]">1.08x</span>
                    </div>
                    <div className="bg-[#232323] border border-[#2E2E2E] rounded-lg p-3 text-sm text-[#8F8F8F] flex justify-between">
                      <span>{t.calculator.congestion}</span>
                      <span className="font-bold text-[#EDEDED]">Low</span>
                    </div>
                    <div className="bg-[#232323] border border-[#2E2E2E] rounded-lg p-3 text-sm text-[#8F8F8F] flex justify-between">
                      <span>{t.calculator.transit}</span>
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
                    <div className="flex flex-col items-center justify-center h-full opacity-50"><MapPin size={32} className="text-[#3ECF8E] mb-4 animate-bounce" /><div className="text-[#8F8F8F] font-mono text-xs tracking-widest uppercase">{t.calculator.awaiting}</div></div>
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
      <footer className="w-full bg-[#1C1C1C] border-t border-[#2E2E2E] py-12 px-6 relative z-40">
        <div className="max-w-[90rem] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-bold text-[#EDEDED] mb-4">{t.footer.title}</h3>
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
                <h4 className="text-sm font-bold text-[#EDEDED] mb-4">{t.footer.platform}</h4>
                <ul className="space-y-3 text-sm text-[#8F8F8F]">
                  <li><button className="hover:text-[#EDEDED] transition-colors">Platform Specs</button></li>
                  <li><button onClick={(e) => handleSmoothScroll(e as any, 'corridor-telematics')} className="hover:text-[#EDEDED] transition-colors">Corridor Telematics</button></li>
                  <li><button onClick={() => setActiveComplianceModal({ title: 'Pricing Formulas', content: 'SRS FR-04: Dynamic Pricing Equation\n\nSpotRate = BaseLine + (DieselIndex_Delta × 0.4) + Equipment_Surcharge\n\nAll pricing bounds are algorithmically enforced strictly between -15% and +45% of the 30-day historical moving average for the respective corridor segment.' })} className="hover:text-[#EDEDED] transition-colors">Pricing Formulas</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#EDEDED] mb-4">{t.footer.compliance}</h4>
                <ul className="space-y-3 text-sm text-[#8F8F8F]">
                  <li><button onClick={() => setActiveComplianceModal({ title: 'Escrow Mediation Rules', content: 'SRS FR-10: TeleBirr Escrow Rules\n\n1. Funds are locked into a smart-contract multi-sig wallet upon load assignment.\n2. Payment is automatically released only when e-PoD (Proof of Delivery) is validated by the receiving terminal.\n3. Dispute mediation relies on GPS timestamps and immutable scale weighbridge logs.' })} className="hover:text-[#EDEDED] transition-colors">Escrow Mediation Rules</button></li>
                  <li><button onClick={() => setActiveComplianceModal({ title: '7-Year Audit Ledger', content: 'SRS Section 6: Audit & Data Retention\n\nTo comply with Ethiopian federal regulatory standards, all manifest data, inspection logs, and financial transactions are cryptographically signed and stored in immutable ledger storage for 7 years.' })} className="hover:text-[#EDEDED] transition-colors">7-Year Audit Ledger</button></li>
                  <li><button className="hover:text-[#EDEDED] transition-colors">Risk Assessment Profiles</button></li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 bg-[#232323] border border-[#2E2E2E] rounded-xl p-6">
              <h4 className="text-sm font-bold text-[#EDEDED] mb-2">{t.footer.regulatory}</h4>
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

          <div className="border-t border-[#2E2E2E] pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] font-mono text-[#8F8F8F]">
            <p>{t.footer.copyright}</p>
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
