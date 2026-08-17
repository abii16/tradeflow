import React from 'react';
import { Bell, Settings } from 'lucide-react';
import landingVideo from './landingpage.mp4';

interface LandingPageProps {
  onLaunch?: () => void;
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] relative font-sans text-slate-900">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-60"
        >
          <source src={landingVideo} type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-white/20"></div>
      </div>

      {/* TOP NAVIGATION HEADER */}
      <header className="fixed top-0 left-0 w-full h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-50">
        <div className="flex items-center">
          <span className="font-bold text-[20px] text-blue-600 tracking-tight">TradeFlow</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-2">
          <a href="#" className="text-xs font-medium text-slate-600 hover:text-slate-900 tracking-normal transition-colors px-4">Corridor Telematics</a>
          <a href="#" className="text-xs font-medium text-slate-600 hover:text-slate-900 tracking-normal transition-colors px-4">Load Board</a>
          <a href="#" className="text-xs font-medium text-slate-600 hover:text-slate-900 tracking-normal transition-colors px-4">Dynamic Rates</a>
          <a href="#" className="text-xs font-medium text-slate-600 hover:text-slate-900 tracking-normal transition-colors px-4">Customs Sync</a>
        </nav>

        <div className="flex items-center">
          <button 
            onClick={onLaunch}
            className="bg-[#0F172A] text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Launch Platform
          </button>
          <div className="flex items-center space-x-3 ml-4">
            <button className="text-slate-700 hover:text-slate-900 relative">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="text-slate-700 hover:text-slate-900">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* LIVE CORRIDOR TICKER MARQUEE */}
      <div className="fixed top-16 left-0 w-full h-8 bg-slate-100 border-b border-slate-200 flex items-center overflow-hidden z-40">
        <div className="animate-marquee whitespace-nowrap flex items-center space-x-6 text-[11px] font-mono text-slate-700 font-medium tracking-wide">
          <span>DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 • GALAFI BORDER DWELL: 45 MINS • DIESEL INDEX: ETB 95.50/L • 12 CUSTOMS PASSES CLEARED</span>
          <span className="px-6">•</span>
          <span>DJIBOUTI PORT -&gt; MODJO: ETB 356,229.54 • GALAFI BORDER DWELL: 45 MINS • DIESEL INDEX: ETB 95.50/L</span>
        </div>
      </div>

      {/* FOREGROUND HERO METRIC CARD */}
      <div className="absolute top-36 left-20 max-w-xl bg-white border border-slate-200 rounded-lg p-8 shadow-sm z-30">
        {/* Engine Status Pill */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-full px-3 py-1 inline-flex items-center space-x-2 mb-6">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-emerald-700 font-mono text-[10px] uppercase font-semibold tracking-widest">
            NEURAL LOGISTICS ENGINE ACTIVE (v4.0.2)
          </span>
        </div>

        {/* Headline & Subtitle */}
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-snug mb-3">
          AI-Powered Freight Matching for East Africa's Principal Corridor.
        </h1>
        <p className="text-sm text-slate-500 font-normal mb-8">
          Optimizing the 810km Djibouti-Modjo artery.
        </p>

        {/* Metric 3-Column Strip */}
        <div className="border-t border-b border-slate-200 py-6 mb-8 grid grid-cols-3 gap-6">
          <div>
            <div className="text-xl font-mono font-bold text-slate-900">142</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Active Heavy Assets</div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-slate-900">ETB 356K</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Avg Spot Rate</div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-slate-900">98.28%</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Model Precision</div>
          </div>
        </div>

        {/* Call-to-Action Buttons */}
        <div className="flex items-center">
          <button 
            onClick={onLaunch}
            className="bg-[#0F172A] text-white text-xs font-semibold px-6 py-3.5 rounded-sm hover:bg-slate-800 transition-all"
          >
            Launch Freight Marketplace
          </button>
          <button className="bg-white border border-[#0F172A] text-slate-900 text-xs font-semibold px-6 py-3.5 rounded-sm hover:bg-slate-50 transition-all ml-4">
            Calculate Spot Quote
          </button>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <footer className="fixed bottom-0 left-0 w-full px-8 py-3 bg-white/80 backdrop-blur-sm border-t border-slate-200 flex items-center justify-between z-50">
        <div className="text-[11px] text-slate-500 font-mono">
          © 2026 TradeFlow Logistics. All rights reserved.
        </div>
        <div className="flex items-center space-x-6 text-[11px] text-slate-500 font-mono">
          <a href="#" className="hover:text-slate-800 transition-colors">Security Policy</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Terms of Transit</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Escrow Rules</a>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}} />
    </div>
  );
}
