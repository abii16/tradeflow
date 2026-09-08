import React from 'react';
import { Ship, PackageSearch, FileText, Gavel, BarChart3, Settings, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface ForwarderSidebarProps {
  activeSubTab: string;
  setActiveSubTab: (tab: any) => void;
}

export default function ForwarderSidebar({ activeSubTab, setActiveSubTab }: ForwarderSidebarProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();

  const menuItems = [
    { id: 'workspace', label: t('fwd_workspace', 'Workspace'), icon: PackageSearch },
    { id: 'manifests', label: t('fwd_manifests', 'Manifests'), icon: FileText },
    { id: 'bidding', label: t('fwd_bidding', 'Bidding & Freight'), icon: Gavel },
    { id: 'analytics', label: t('fwd_analytics', 'Analytics'), icon: BarChart3 },
  ];

  return (
    <aside className="w-60 bg-[#181818] text-[#8F8F8F] flex flex-col border-r border-[#2E2E2E] shrink-0 sticky top-0 h-screen">
      <div className="h-16 flex items-center px-5 border-b border-[#2E2E2E] gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center shrink-0">
          <Ship className="text-[#3ECF8E]" size={16} />
        </div>
        <div>
          <span className="text-[#EDEDED] font-bold text-sm tracking-tight">TradeFlow</span>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-[10px] font-semibold text-[#8F8F8F] uppercase tracking-widest mb-3 px-2">
          {t('fwd_portal_subtitle', 'Forwarder Portal')}
        </div>
        
        <nav className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 font-semibold shadow-sm' 
                    : 'text-[#8F8F8F] hover:bg-[#232323] hover:text-[#EDEDED] border border-transparent'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-[#3ECF8E]' : 'text-[#8F8F8F]'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-3 border-t border-[#2E2E2E] space-y-0.5">
        <button className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-xs text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#232323] transition-colors">
          <Settings size={15} className="text-[#8F8F8F]" />
          <span className="font-medium">{t('fwd_settings', 'Settings')}</span>
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={15} />
          <span className="font-medium">{t('fwd_logout', 'Logout')}</span>
        </button>
      </div>
    </aside>
  );
}
