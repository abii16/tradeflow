import React from 'react';
import { Ship, PackageSearch, FileText, Gavel, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForwarderSidebarProps {
  activeSubTab: string;
  setActiveSubTab: (tab: any) => void;
}

export default function ForwarderSidebar({ activeSubTab, setActiveSubTab }: ForwarderSidebarProps) {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'workspace', label: t('fwd_workspace', 'Workspace'), icon: PackageSearch },
    { id: 'manifests', label: t('fwd_manifests', 'Manifests'), icon: FileText },
    { id: 'bidding', label: t('fwd_bidding', 'Bidding & Freight'), icon: Gavel },
    { id: 'analytics', label: t('fwd_analytics', 'Analytics'), icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-[#0B0F17] text-slate-400 flex flex-col border-r border-slate-800 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Ship className="text-blue-500 mr-3" size={24} />
        <span className="text-white font-bold text-lg tracking-tight">TradeFlow</span>
      </div>
      
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          {t('fwd_portal_subtitle', 'Forwarder Portal')}
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

      <div className="mt-auto p-4 border-t border-slate-800">
        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 hover:text-slate-200 transition-colors border-l-2 border-transparent">
          <Settings size={18} className="text-slate-500" />
          <span className="font-medium text-sm">{t('fwd_settings', 'Settings')}</span>
        </button>
      </div>
    </aside>
  );
}
