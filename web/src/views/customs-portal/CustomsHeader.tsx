import React from 'react';
import { Bell, Menu, FileText, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

interface CustomsHeaderProps {
  onSwitchPortal: () => void;
}

export default function CustomsHeader({ onSwitchPortal }: CustomsHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 shrink-0 relative z-20">
      {/* Top Row: Global Identity & Profile */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-slate-500 hover:text-slate-900">
            <Menu size={24} />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-inter">Galafi Border Checkpoint</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Ethiopian Customs Commission • Terminal 02</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={onSwitchPortal}
            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-200 font-semibold hover:bg-blue-100 transition-colors"
          >
            Switch Portal
          </button>
          
          <button className="text-slate-500 hover:text-slate-700 relative mx-1">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
          
          <div className="hidden md:flex bg-slate-100 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 shadow-sm items-center">
            <span className="font-bold mr-1.5 text-slate-500">[GA-772]</span>
            Kassahun Bekele • Senior Inspector
          </div>
        </div>
      </div>
      
      {/* Second Row: Live Status Metrics Strip */}
      <div className="h-12 bg-slate-50/50 flex items-center px-6 gap-6 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Submitted</span>
          <span className="text-xs font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-sm">24</span>
        </div>
        
        {/* Active Selection */}
        <div className="flex items-center gap-2 border-b-2 border-amber-500 pb-[13px] pt-[15px] -mb-[1px]">
          <Search size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-700">Under Review</span>
          <span className="text-xs font-mono font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-amber-800 shadow-sm">12</span>
        </div>
        
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">Cleared</span>
          <span className="text-xs font-mono font-bold bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 shadow-sm">142</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-rose-500" />
          <span className="text-xs font-bold text-rose-700">Rejected / Flagged</span>
          <span className="text-xs font-mono font-bold bg-rose-100 border border-rose-200 px-2 py-0.5 rounded text-rose-800 shadow-sm">3</span>
        </div>
      </div>
    </header>
  );
}
