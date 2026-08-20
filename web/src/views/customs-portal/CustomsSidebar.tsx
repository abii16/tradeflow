import React from 'react';
import { Shield, FileCheck, Layers, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CustomsSidebarProps {
  activeSubTab: string;
  setActiveSubTab: (tab: any) => void;
}

export default function CustomsSidebar({ activeSubTab, setActiveSubTab }: CustomsSidebarProps) {
  const { logout } = useAuth();
  
  const menuItems = [
    { id: 'queue', label: 'Customs Terminal', icon: Shield },
    { id: 'inspections', label: 'Physical Inspections', icon: FileCheck },
    { id: 'reports', label: 'Regulatory Reports', icon: Layers },
  ];

  return (
    <aside className="w-64 bg-[#0B0F17] text-slate-400 flex flex-col border-r border-slate-800 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Shield className="text-blue-500 mr-3" size={24} />
        <span className="text-white font-bold text-lg tracking-tight">TradeFlow</span>
      </div>
      
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          Customs Authority
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-white border-l-2 border-blue-500' 
                    : 'hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-800 space-y-1">
        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 hover:text-slate-200 transition-colors border-l-2 border-transparent">
          <Settings size={18} className="text-slate-500" />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors border-l-2 border-transparent"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
