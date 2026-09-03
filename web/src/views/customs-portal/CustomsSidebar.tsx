import React from 'react';
import { Shield, FileCheck, Layers, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface CustomsSidebarProps {
  activeSubTab: string;
  setActiveSubTab: (tab: any) => void;
}

export default function CustomsSidebar({ activeSubTab, setActiveSubTab }: CustomsSidebarProps) {
  const { logout } = useAuth();
  const { t } = useTranslation();
  
  const menuItems = [
    { id: 'queue', label: t('customs_terminal'), icon: Shield },
    { id: 'inspections', label: t('physical_inspections'), icon: FileCheck },
    { id: 'reports', label: t('regulatory_reports'), icon: Layers },
  ];

  return (
    <aside className="w-64 bg-[#0B0F17] text-slate-400 flex flex-col border-r border-slate-800 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Shield className="text-blue-500 mr-3" size={24} />
        <span className="text-white font-bold text-lg tracking-tight">TradeFlow</span>
      </div>
      
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          {t('customs_authority')}
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
          <span className="font-medium text-sm">{t('settings')}</span>
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors border-l-2 border-transparent"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
