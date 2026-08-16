import React, { useState } from 'react';
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
  Power
} from 'lucide-react';

interface AdminSidebarProps {
  activeSubTab: string;
  setActiveSubTab: (tab: any) => void;
}

export default function AdminSidebar({ activeSubTab, setActiveSubTab }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'radar', name: 'Live Telematics & Radar', icon: Radar },
    { id: 'verification', name: 'Verification Queue', icon: ClipboardCheck, badge: '12' },
    { id: 'pricing', name: 'Dynamic Pricing & Yield', icon: TrendingUp },
    { id: 'security', name: 'Security & Detours', icon: ShieldAlert },
    { id: 'disputes', name: 'Dispute Mediation', icon: Scale },
    { id: 'audit', name: 'Audit Logs & Compliance', icon: FileSearch },
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
          {!collapsed && <span>Help & Support</span>}
        </button>
        <button className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5' : 'space-x-2.5 py-2 px-3'} text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 transition-colors`}>
          <Power size={18} />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
