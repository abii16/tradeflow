import React, { useState } from 'react';
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
    <aside className={`${collapsed ? 'w-[64px]' : 'w-64'} bg-slate-900 h-screen flex flex-col shrink-0 border-r border-slate-800 transition-all duration-150`}>
      {/* Header */}
      <div className={`p-4 border-b border-slate-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="pl-1 flex flex-col">
            <div className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              TradeFlow <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1"></span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Operations Control Tower</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
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
                ? (collapsed ? 'bg-white/10 text-white font-medium' : 'bg-white/10 text-white font-medium border-l-2 border-blue-500 rounded-l-none')
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium'
            }`}
          >
            <item.icon size={18} className={activeSubTab === item.id ? "text-white" : "text-slate-400"} />
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between">
                <span>{item.name}</span>
                {item.badge && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
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

      <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-slate-800 text-sm space-y-1`}>
        <button className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5' : 'space-x-2.5 py-2 px-3'} text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors`}>
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
