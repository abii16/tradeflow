import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { 
  Radar, 
  ClipboardCheck, 
  TrendingUp, 
  ShieldAlert, 
  Scale, 
  FileSearch,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  Power,
  Droplet
} from 'lucide-react';

import { getAllVerifications } from '../../lib/apiClient';

interface AdminSidebarProps {
  activeSubTab: string;
  setActiveSubTab: (tab: any) => void;
}

export default function AdminSidebar({ activeSubTab, setActiveSubTab }: AdminSidebarProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await getAllVerifications();
        const pending = (response.data || []).filter((r: any) => r.status === 'PENDING');
        setPendingCount(pending.length);
      } catch (err) {
        console.error('Failed to fetch pending count', err);
      }
    };
    fetchPendingCount();
    
    // Set up polling to keep the badge up-to-date
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'radar', name: t('admin_nav_radar'), icon: Radar },
    { id: 'verification', name: t('admin_nav_verification'), icon: ClipboardCheck, badge: pendingCount > 0 ? pendingCount.toString() : null },
    { id: 'pricing', name: t('admin_nav_pricing'), icon: TrendingUp },
    { id: 'fuel', name: 'Fuel Analytics', icon: Droplet },
    { id: 'security', name: t('admin_nav_security'), icon: ShieldAlert },
    { id: 'disputes', name: t('admin_nav_disputes'), icon: Scale },
    { id: 'audit', name: t('admin_nav_audit'), icon: FileSearch },
  ];

  return (
    <aside className={`${collapsed ? 'w-[64px]' : 'w-64'} bg-[#1C1C1C] h-screen flex flex-col shrink-0 border-r border-[#2E2E2E] transition-all duration-150`}>
      {/* Header */}
      <div className={`p-4 border-b border-[#2E2E2E] flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="pl-1 flex flex-col">
            <div className="font-bold text-lg text-[#EDEDED] tracking-tight flex items-center gap-1.5">
              TradeFlow <span className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full mt-1"></span>
            </div>
            <div className="text-[11px] text-[#8F8F8F] font-medium">Operations Control Tower</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#8F8F8F] hover:text-[#EDEDED] p-1 rounded hover:bg-[#232323] transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className={`flex-1 ${collapsed ? 'p-2' : 'p-4'} space-y-1.5 overflow-y-auto overflow-x-hidden`}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubTab(item.id)}
            title={collapsed ? item.name : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-2.5 rounded-lg' : 'space-x-3 px-3 py-2.5 rounded-r-lg'} text-sm transition-all duration-150 relative ${
              activeSubTab === item.id
                ? (collapsed ? 'bg-[#232323]/10 text-[#EDEDED] font-medium' : 'bg-[#232323]/10 text-[#EDEDED] font-medium border-l-2 border-[#3ECF8E] rounded-l-none')
                : 'text-[#8F8F8F] hover:bg-[#232323]/60 hover:text-[#EDEDED] font-medium'
            }`}
          >
            <item.icon size={18} className={activeSubTab === item.id ? "text-[#EDEDED]" : "text-[#8F8F8F]"} />
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between">
                <span>{item.name}</span>
                {item.badge && (
                  <span className="bg-red-600 text-[#EDEDED] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
            {collapsed && item.badge && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border border-slate-900"></span>
            )}
          </button>
        ))}
      </nav>

      <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-[#2E2E2E] text-sm space-y-1`}>
        <button className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5' : 'space-x-2.5 py-2 px-3'} text-[#8F8F8F] hover:text-[#EDEDED] rounded-lg hover:bg-[#232323]/60 transition-colors`}>
          <HelpCircle size={18} />
          {!collapsed && <span>{t('admin_nav_help')}</span>}
        </button>
        <button 
          onClick={logout}
          className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5' : 'space-x-2.5 py-2 px-3'} text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 transition-colors`}
        >
          <Power size={18} />
          {!collapsed && <span>{t('admin_nav_logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
