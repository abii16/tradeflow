import React from 'react';
import { Bell, User, Menu, FileText, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

interface CustomsHeaderProps {
  onSwitchPortal: () => void;
}

export default function CustomsHeader({ onSwitchPortal }: CustomsHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 shrink-0 relative z-20">
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-slate-500 hover:text-slate-900">
            <Menu size={24} />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-inter">Galafi Border Checkpoint — Customs Terminal</h2>
            <p className="text-[11px] text-slate-500 font-medium">Document Verification Queue (FR-06.3) & Automated Weight / Document Consistency Checking.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={onSwitchPortal}
            className="hidden sm:block text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
          >
            Switch Portal
          </button>
          
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          
          <button className="text-slate-500 hover:text-slate-700 relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
          
          <button className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 pl-2">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
              <User size={16} className="text-slate-500" />
            </div>
            <span className="text-sm font-bold hidden md:block">Officer ID: GA-772</span>
          </button>
        </div>
      </div>
      
      {/* Status Strip */}
      <div className="h-12 bg-slate-50/50 flex items-center px-6 gap-6 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Submitted</span>
          <span className="text-xs font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-sm">24</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Search size={14} className="text-blue-500" />
          <span className="text-xs font-bold text-blue-700">Pending Review</span>
          <span className="text-xs font-mono font-bold bg-blue-100 border border-blue-200 px-2 py-0.5 rounded text-blue-800 shadow-sm">12</span>
        </div>
        
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">Cleared Today</span>
          <span className="text-xs font-mono font-bold bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 shadow-sm">142</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-rose-500" />
          <span className="text-xs font-bold text-rose-700">Flagged for Physical Inspection</span>
          <span className="text-xs font-mono font-bold bg-rose-100 border border-rose-200 px-2 py-0.5 rounded text-rose-800 shadow-sm">3</span>
        </div>
      </div>
    </header>
  );
}
