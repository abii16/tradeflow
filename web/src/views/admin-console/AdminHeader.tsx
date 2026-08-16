import React from 'react';
import { Search, Globe, ChevronDown, Bell } from 'lucide-react';

interface AdminHeaderProps {
  onSwitchPortal: () => void;
}

export default function AdminHeader({ onSwitchPortal }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
      
      {/* Left: Global Search */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search shipments, assets, or IDs..." 
          className="w-full pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">Ctrl+K</span>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center space-x-6">
        
        <div className="flex items-center space-x-4">
          {/* Escrow Widget */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Escrow Wallet Balance:</span>
            <span className="text-sm text-slate-900 font-mono font-bold">ETB 2,450,000.00</span>
          </div>

          <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <Globe size={15} />
            EN <ChevronDown size={12} className="opacity-50" />
          </button>
          
          <button className="relative p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        <div className="w-px h-6 bg-slate-200"></div>

        {/* Profile */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Habtamu Zewde</div>
            <div className="text-[11px] text-slate-500 font-medium">Operations Director</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-100 relative">
            HZ
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        </div>

      </div>
    </header>
  );
}
