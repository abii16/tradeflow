import React from 'react';
import { Bell, User, Menu } from 'lucide-react';

interface ForwarderHeaderProps {
  onSwitchPortal: () => void;
}

export default function ForwarderHeader({ onSwitchPortal }: ForwarderHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center">
        <button className="md:hidden text-slate-500 hover:text-slate-900 mr-4">
          <Menu size={24} />
        </button>
        <span className="font-semibold text-slate-800 text-lg">Freight Forwarder Console</span>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={onSwitchPortal}
          className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
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
          <span className="text-sm font-medium hidden md:block">Operations Team</span>
        </button>
      </div>
    </header>
  );
}
