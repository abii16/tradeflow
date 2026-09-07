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
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>
        </div>

        {/* TOP NAVIGATION HEADER */}
        <header className={`fixed top-0 left-0 w-full h-16 border-b px-8 flex items-center justify-between z-[60] backdrop-blur-md transition-all duration-300 ${
          isScrolled 
            ? 'bg-black/95 border-white/10 shadow-2xl' 
            : 'bg-transparent border-white/30'
        }`}>
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-baseline select-none cursor-pointer hover:opacity-80 hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <span className="text-white font-serif italic font-extrabold text-4xl md:text-5xl tracking-tighter mr-0.5">T</span>
            <span className="font-bold text-2xl text-white tracking-tight">radeFlow<span className="text-white">.</span></span>
          </div>

          <div className="flex items-center gap-6 md:gap-10">
            <nav className="hidden md:flex items-center space-x-1">
              <a href="#platform-overview" onClick={(e) => handleSmoothScroll(e, 'platform-overview')} className="text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 transition-all">Platform Overview</a>
              <a href="#load-board" onClick={(e) => handleSmoothScroll(e, 'load-board')} className="text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 transition-all">Load Board</a>
              <a href="#dynamic-rates" onClick={(e) => handleSmoothScroll(e, 'dynamic-rates')} className="text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 transition-all">Dynamic Rates</a>
              <a href="#customs-sync" onClick={(e) => handleSmoothScroll(e, 'customs-sync')} className="text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 transition-all">Customs Sync</a>
            </nav>

            <div className="hidden md:block w-px h-6 bg-white/20"></div>

            <div className="flex items-center gap-4">
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
                  className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-slate-200 hover:-translate-y-0.5 transition-all duration-300"
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
                  className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-slate-200 hover:-translate-y-0.5 transition-all duration-300"
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


          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 max-w-4xl mx-auto text-white whitespace-nowrap">
            Intelligent Freight.
          </h1>
          <p className="text-lg md:text-xl text-slate-200 font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
          AI matching, live tracking, and digital customs.<span className="inline-block animate-pulse ml-1 text-white">|</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full max-w-2xl mx-auto">
            <button
              onClick={() => isAuthenticated ? onSelectPortal('shipper') : setShowRegistration(true)}
              className="bg-white text-slate-950 font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full hover:bg-slate-200 transition-all w-full sm:w-auto text-center"
            >
              Get Started
            </button>
            <button
              onClick={() => onSelectPortal('finance')}
              className="bg-black/20 backdrop-blur-md border border-white/30 text-white font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full hover:border-black hover:bg-black/40 transition-all w-full sm:w-auto text-center"
            >
              Calculate Rate
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
      <section id="platform-overview" className="w-full bg-slate-50 border-t border-slate-200 py-16 relative z-40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Trusted by East Africa's Leading Institutions</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            {/* Logos in clean white B2B cards to hide dirty backgrounds */}
            {[
              { src: '/ECC.jfif', alt: 'ECC', title: 'Ethiopian Customs Commission', height: 'h-10' },
              { src: '/telebirr.png', alt: 'telebirr', title: 'Telebirr', height: 'h-8' },
              { src: '/ethiopian shiping and logestic.png', alt: 'ESLSE', title: 'Ethiopian Shipping and Logistics', height: 'h-14' },
              { src: '/CBE.jfif', alt: 'CBE', title: 'Commercial Bank of Ethiopia', height: 'h-10' },
              { src: '/EAC.png', alt: 'EAC', title: 'Ethiopian Airlines Cargo', height: 'h-8' },
              { src: '/DPCA.jpg', alt: 'DPCA', title: 'Djibouti Ports and Corridor Authority', height: 'h-12' }
            ].map((logo, idx) => (
              <div key={idx} className="bg-white px-6 py-4 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-center min-w-[140px] h-[80px] group hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] hover:border-slate-200 transition-all duration-300 hover:-translate-y-1">
                <img src={logo.src} alt={logo.alt} className={`${logo.height} w-auto object-contain opacity-80 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500`} title={logo.title} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 1: CORRIDOR TELEMATICS
          ================================================================================= */}
      <section id="corridor-telematics" className="w-full bg-slate-100 text-slate-900 pt-24 pb-32 relative z-40 border-t border-slate-200 overflow-hidden">
        {/* Subtle background effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col xl:flex-row items-center gap-16 xl:gap-24 relative z-10">
          <div className="flex-1 animate-in fade-in slide-in-from-left-8 duration-1000">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-6">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              Live Telematics
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 pr-4 lg:whitespace-nowrap text-slate-900">
              Corridor Telematics <br/> <span>& Deep ETA</span>
            </h2>
            <p className="text-lg font-medium text-slate-600 mb-8 leading-relaxed max-w-lg">
              GPS position updates ingested at least every 5 minutes while in transit. ETA model recalculates predicted arrival using live position, historical corridor transit-time data, weather, and known congestion/conflict alerts.
            </p>
            <ul className="space-y-4 font-bold text-sm mb-10 text-slate-700">
              <li className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><Navigation size={20} className="text-emerald-500" /> Gradient-Boosted ETA Models</li>
              <li className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><Shield size={20} className="text-emerald-500" /> Security-Aware Rerouting (FR-08)</li>
              <li className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><MapPin size={20} className="text-emerald-500" /> 810km Djibouti–Modjo Route Tracking</li>
            </ul>
            
            <button className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl">
              See Live Demo
              <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="flex-1 w-full h-[400px] lg:h-[480px] rounded-3xl relative shadow-2xl p-1 bg-white border border-slate-200 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 group">
            <LiveTelematicsMap />
            
            {/* Floating Live Status Card */}
            <div className="absolute -top-4 -right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl transition-transform duration-500 hover:scale-105 z-20 hidden md:block">
              <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-3 gap-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                    <Truck size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-wide">Truck DX-982</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">En Route</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Speed</div>
                  <div className="text-sm font-extrabold text-white">62 <span className="text-[10px] text-slate-500">km/h</span></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ETA</div>
                  <div className="text-sm font-extrabold text-emerald-400">{etaMins} <span className="text-[10px]">mins</span></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1" title="AI Confidence Score">Conf</div>
                  <div className="text-sm font-extrabold text-white">{etaConfidence.toFixed(1)}<span className="text-[10px] text-slate-500">%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 2: AI LOAD BOARD
          ================================================================================= */}
      <section id="load-board" className="w-full bg-slate-900 text-white py-32 relative z-40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900 pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-slate-700/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-8 md:px-12 flex flex-col md:flex-row-reverse items-center gap-16 relative z-10">
          <div className="flex-1">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-widest mb-6">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              Matching Engine
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-white">
              AI-Powered <br/> Freight Matching
            </h2>
            <p className="text-lg font-medium text-slate-300 mb-8 leading-relaxed max-w-lg">
              Two-sided marketplace onboarding with verified transporter identity. Matching engine ranks eligible transporters by a weighted score of cost, historical reliability, fuel efficiency, and proximity.
            </p>
            <ul className="space-y-4 font-bold text-sm text-slate-200">
              <li className="flex items-center gap-3"><Check size={20} className="text-emerald-500" /> &lt; 1 Second Response Time</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-emerald-500" /> Multi-Objective Scoring Function</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-emerald-500" /> Strict Fleet Verification (FR-01)</li>
            </ul>
          </div>
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-0 bg-white/5 rounded-3xl blur-2xl transform scale-105 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-full bg-slate-900/80 backdrop-blur-xl text-white rounded-3xl p-8 shadow-2xl relative z-10 border border-white/10">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div className="font-bold text-lg text-white">Load Board</div>
                <div className="flex items-center gap-2 text-xs font-bold border border-emerald-500/50 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  Live Bids
                </div>
              </div>
              <div className="space-y-4">
                {liveBids.map((bid, i) => (
                  <div key={bid.id} className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-300 ${i === 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg ${i === 0 ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-300'}`}>
                        T{i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-200">Transporter #{bid.id}</div>
                        <div className="text-xs text-slate-400 font-medium">Score: <span className={i === 0 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>{bid.score.toFixed(1)}%</span> Match</div>
                      </div>
                    </div>
                    <button className={`px-4 py-2 text-xs font-bold rounded-full transition-colors ${i === 0 ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border border-white/20 text-slate-300 hover:bg-white/10'}`}>
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
      <section className="w-full bg-slate-900 text-white py-24 relative z-40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-8 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 text-white">{impactMetrics.activeTransporters}<span className="text-emerald-500">+</span></div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Transporters</div>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 text-white">{impactMetrics.tonsDelivered}<span className="text-emerald-500">+</span></div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tons Delivered</div>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <div className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 text-white">{impactMetrics.uptime}<span className="text-emerald-500">%</span></div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Platform Uptime</div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 3: DYNAMIC RATES
          ================================================================================= */}
      <section id="dynamic-rates" className="w-full bg-slate-50 text-black py-32 relative z-40 border-t border-black/10">
        <div className="max-w-7xl mx-auto px-8 md:px-12 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">

            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Dynamic Pricing <br/> & Settlement
            </h2>
            <p className="text-lg font-medium text-black/70 mb-8 leading-relaxed max-w-lg">
              Spot rates computed from current demand/capacity balance, fuel-cost index, and corridor congestion. Integrated with Mobile-Money platforms (TeleBirr) for automated payout scheduling and reconciliation.
            </p>
            <ul className="space-y-4 font-bold text-sm">
              <li className="flex items-center gap-3"><Check size={20} className="text-black" /> Real-time Spot & Contract Rates</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-black" /> Fuel Consumption Analytics (FR-07)</li>
              <li className="flex items-center gap-3"><Check size={20} className="text-black" /> Mobile-Money Escrow Engine</li>
            </ul>
          </div>
          <div className="flex-1 w-full bg-black rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-end h-80 border border-black">
            <div className="absolute top-8 left-8 text-white z-10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                 <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live Spot Index</div>
              </div>
              <div className="text-3xl font-extrabold text-white">ETB {(liveSpotIndex / 1000).toFixed(1)}K</div>
            </div>
            <div className="flex items-end gap-2 h-40 relative z-10 opacity-80 mt-auto">
              {[40, 55, 45, 70, 60, 85, 90, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-white hover:bg-white/80 transition-colors cursor-pointer rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 4: CUSTOMS SYNC
          ================================================================================= */}
      <section id="customs-sync" className="w-full bg-slate-950 text-white py-32 relative z-40 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-8 md:px-12 flex flex-col md:flex-row-reverse items-center gap-16 relative z-10">
          <div className="flex-1">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
              Customs Sync
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Digital Customs <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Documentation</span>
            </h2>
            <p className="text-lg font-medium text-slate-400 mb-8 leading-relaxed max-w-lg">
              Support upload and structured capture of key clearance documents (commercial invoice, packing list, bill of lading). Automated validation checks for completeness and consistency before submission.
            </p>
            <ul className="space-y-4 font-bold text-sm text-slate-300">
              <li className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"><Check size={20} className="text-cyan-400" /> Immutable Document Vault</li>
              <li className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"><Check size={20} className="text-cyan-400" /> Status Tracking & Validation</li>
              <li className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"><Check size={20} className="text-cyan-400" /> 7-Year Audit Ledger Compliance</li>
            </ul>
          </div>
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-3xl blur-2xl transform scale-105 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-full bg-slate-900/80 backdrop-blur-xl text-white rounded-3xl p-8 shadow-2xl relative z-10 border border-white/10">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                <div className="w-12 h-12 bg-slate-800 text-cyan-400 rounded-2xl flex items-center justify-center shadow-lg border border-white/5">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="font-bold text-lg text-white">Clearance Vault</div>
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Status: Cleared</div>
                </div>
              </div>
              <div className="space-y-3">
                {['Commercial Invoice', 'Packing List', 'Certificate of Origin', 'Bill of Lading'].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-sm font-bold text-slate-300">{doc}</span>
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                      <Check size={14} className="text-cyan-400" />
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
      <section className="w-full bg-slate-50 text-slate-900 py-32 relative z-40 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">Instant AI Spot Rate</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">Get a predictive, data-driven freight quote instantly.</p>
          </div>
          
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col md:flex-row gap-12 relative overflow-hidden">
            <div className="flex-1 space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Origin (Port)</label>
                <select 
                  value={calcFrom} 
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                >
                  <option value="" disabled>Select Origin</option>
                  <option value="djibouti">Djibouti Port (SGTD)</option>
                  <option value="berbera">Berbera Port</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Destination (Dry Port)</label>
                <select 
                  value={calcTo} 
                  onChange={(e) => setCalcTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                >
                  <option value="" disabled>Select Destination</option>
                  <option value="modjo">Modjo Dry Port</option>
                  <option value="semera">Semera Dry Port</option>
                  <option value="kality">Addis Ababa (Kality)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Cargo Weight (Tons)</label>
                <input 
                  type="number" 
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                />
              </div>
              <button 
                onClick={handleCalculate}
                disabled={!calcFrom || !calcTo || !calcWeight || calcState === 'loading'}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl mt-2"
              >
                {calcState === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Calculating AI Rate...
                  </span>
                ) : 'Calculate AI Spot Rate'}
              </button>
            </div>
            
            <div className="flex-1 bg-slate-900 text-white rounded-[1.5rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-inner border border-slate-800">
              <div className="absolute inset-0 bg-[url('/telematics_map.jpg')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
              {calcState === 'result' && calcRate ? (
                <div className="relative z-10 w-full animate-in fade-in zoom-in duration-500">
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    Live Quote Generated
                  </div>
                  <div className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white">
                    ETB {calcRate.toLocaleString()}
                  </div>
                  <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-5 text-left border border-white/10 shadow-xl">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-slate-400">Base Route</span>
                      <span className="font-bold text-slate-100">ETB 45,000</span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-slate-400">Weight Surcharge</span>
                      <span className="font-bold text-slate-100">+ ETB {(calcRate - 45000 - 2500).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-white/10">
                      <span className="text-slate-400">Risk Premium</span>
                      <span className="font-bold text-slate-100">ETB 2,500</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                    <Zap size={32} className="text-emerald-400 opacity-80" />
                  </div>
                  <p className="font-medium text-slate-400 max-w-[200px] leading-relaxed">Fill in your freight details to see dynamic AI pricing.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================================
          SECTION 5: ENTERPRISE STATS & COMPLIANCE FOOTER
          ================================================================================= */}
      <footer className="w-full bg-slate-950 border-t border-white/10 pt-16 pb-8 relative z-40">
        <div className="max-w-7xl mx-auto px-8 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">TradeFlow Logistics Engine</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Aligned with Ethiopian Customs Commission &amp; Ethiopian Shipping and Logistics Services Enterprise specifications.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-900/30 px-3 py-1.5 rounded border border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  System Status: OPERATIONAL (LIVE)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Platform</h4>
                <ul className="space-y-3 text-sm text-white/50">
                  <li><button className="hover:text-white transition-colors">Platform Specs</button></li>
                  <li><button onClick={(e) => handleSmoothScroll(e as any, 'corridor-telematics')} className="hover:text-white transition-colors">Corridor Telematics</button></li>
                  <li><button onClick={() => setActiveComplianceModal({ title: 'Pricing Formulas', content: 'SRS FR-04: Dynamic Pricing Equation\n\nSpotRate = BaseLine + (DieselIndex_Delta × 0.4) + Equipment_Surcharge\n\nAll pricing bounds are algorithmically enforced strictly between -15% and +45% of the 30-day historical moving average for the respective corridor segment.' })} className="hover:text-white transition-colors">Pricing Formulas</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Compliance</h4>
                <ul className="space-y-3 text-sm text-white/50">
                  <li><button onClick={() => setActiveComplianceModal({ title: 'Escrow Mediation Rules', content: 'SRS FR-10: TeleBirr Escrow Rules\n\n1. Funds are locked into a smart-contract multi-sig wallet upon load assignment.\n2. Payment is automatically released only when e-PoD (Proof of Delivery) is validated by the receiving terminal.\n3. Dispute mediation relies on GPS timestamps and immutable scale weighbridge logs.' })} className="hover:text-white transition-colors">Escrow Mediation Rules</button></li>
                  <li><button onClick={() => setActiveComplianceModal({ title: '7-Year Audit Ledger', content: 'SRS Section 6: Audit & Data Retention\n\nTo comply with Ethiopian federal regulatory standards, all manifest data, inspection logs, and financial transactions are cryptographically hashed and retained in immutable storage for a minimum of 7 calendar years.' })} className="hover:text-white transition-colors">7-Year Audit Ledger</button></li>
                  <li><button className="hover:text-white transition-colors">Data Retention Policy</button></li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-4">Verified Security</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <ShieldCheck size={18} className="text-white" />
                  <span>AES-256 Encrypted Ledger</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <MapPin size={18} className="text-white" />
                  <span>Regional East Africa Data Residency</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <FileText size={18} className="text-white" />
                  <span>TeleBirr API Integrated Escrow</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] font-mono text-white/40">
            <p>© 2026 TradeFlow Logistics Platform. Developed for East Africa's Principal Corridor.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
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
