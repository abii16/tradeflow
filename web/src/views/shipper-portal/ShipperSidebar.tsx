import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Map,
  Settings,
  PackageSearch,
  FileCheck,
  PanelLeftClose,
  PanelLeftOpen,
  FileSignature
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

interface ShipperSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function ShipperSidebar({ activeTab, setActiveTab }: ShipperSidebarProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'operations', name: t('operations'), icon: BarChart3 },
    { id: 'bids', name: t('bids'), icon: PackageSearch },
    { id: 'contract_rates', name: t('contract_rates'), icon: FileSignature },
    { id: 'telematics', name: t('telematics'), icon: Map },
    { id: 'customs_vault', name: t('customs_vault'), icon: FileCheck },
    { id: 'settings', name: t('settings'), icon: Settings },
  ];

  return (
    <aside className={`${collapsed ? 'w-[52px]' : 'w-60'} bg-slate-900 h-screen flex flex-col shrink-0 border-r border-slate-800 transition-all duration-150`}>
      {/* Header */}
      <div className={`p-3 border-b border-slate-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="pl-1">
            <div className="font-semibold text-sm text-white tracking-tight">TradeFlow</div>
            <div className="text-[11px] text-slate-400">{t('shipper_portal_brand')}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      <nav className={`flex-1 ${collapsed ? 'p-1.5' : 'p-3'} space-y-1 overflow-y-auto`}>
        {!collapsed && (
          <button
            onClick={() => setActiveTab('operations')}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded py-2 px-3 mb-3 font-semibold text-xs transition-colors"
          >
            + {t('new_shipment')}
          </button>
        )}

        {collapsed && (
          <button
            onClick={() => setActiveTab('operations')}
            className="w-full flex items-center justify-center bg-white text-slate-900 hover:bg-slate-100 rounded p-2 mb-3 transition-colors text-xs font-bold"
            title={t('new_shipment')}
          >
            +
          </button>
        )}

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={collapsed ? item.name : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-2' : 'space-x-2.5 px-2.5 py-1.5'} rounded text-xs font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <item.icon size={15} className={activeTab === item.id ? "text-white" : "text-slate-400"} />
            {!collapsed && <span className="text-left">{item.name}</span>}
          </button>
        ))}
      </nav>

      <div className={`${collapsed ? 'p-1.5' : 'p-3'} border-t border-slate-800 text-xs space-y-1`}>
        <button
          title={collapsed ? t('support') : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center py-2' : 'space-x-2 py-1 px-2'} text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/60 transition-colors`}
        >
          {collapsed ? <span className="text-[11px]">?</span> : <span>{t('support')}</span>}
        </button>
        <button
          onClick={logout}
          title={collapsed ? t('log_out') : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center py-2' : 'space-x-2 py-1 px-2'} text-red-400 hover:text-red-300 rounded hover:bg-red-950/40 transition-colors`}
        >
          {collapsed ? <span className="text-[11px]">⏻</span> : <span>{t('log_out')}</span>}
        </button>
      </div>
    </aside>
  );
}
