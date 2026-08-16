import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  TrendingUp,
  PhoneCall,
  FileText,
  Scale,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface FinanceSidebarProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  currency: 'ETB' | 'USD' | 'DJF';
  setCurrency: (c: 'ETB' | 'USD' | 'DJF') => void;
}

export default function FinanceSidebar({
  activeSubTab,
  setActiveSubTab,
  currency,
  setCurrency
}: FinanceSidebarProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'overview', name: t('overview'), icon: Wallet },
    { id: 'spot_pricing', name: t('spot_pricing'), icon: TrendingUp },
    { id: 'settlements', name: t('settlements'), icon: PhoneCall },
    { id: 'ledger', name: t('ledger'), icon: FileText },
    { id: 'disputes', name: t('disputes'), icon: Scale },
  ];

  return (
    <aside className={`${collapsed ? 'w-[52px]' : 'w-60'} bg-slate-900 h-screen flex flex-col shrink-0 border-r border-slate-800 transition-all duration-150`}>
      {/* Header */}
      <div className={`p-3 border-b border-slate-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="pl-1">
            <div className="font-semibold text-sm text-white tracking-tight">TradeFlow</div>
            <div className="text-[11px] text-slate-400">{t('finance_portal_brand')}</div>
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

      <nav className={`flex-1 ${collapsed ? 'p-1.5' : 'p-3'} space-y-1 overflow-y-auto overflow-x-hidden`}>
        {/* Currency Switcher */}
        {!collapsed ? (
          <div className="mb-3 p-2 bg-slate-800/80 rounded">
            <div className="text-[10px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider">Currency</div>
            <div className="flex border border-slate-700 rounded p-0.5 bg-slate-900">
              {(['ETB', 'USD', 'DJF'] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`flex-1 text-[11px] font-mono px-2 py-1 rounded transition-colors ${
                    currency === curr
                      ? 'bg-white text-slate-900 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              const order: Array<'ETB' | 'USD' | 'DJF'> = ['ETB', 'USD', 'DJF'];
              const idx = order.indexOf(currency);
              setCurrency(order[(idx + 1) % 3]);
            }}
            title={`Currency: ${currency} (click to cycle)`}
            className="w-full flex items-center justify-center p-2 mb-3 bg-slate-800 rounded text-[11px] font-mono text-white font-semibold hover:bg-slate-700 transition-colors"
          >
            {currency}
          </button>
        )}

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubTab(item.id)}
            title={collapsed ? item.name : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-2' : 'space-x-2.5 px-2.5 py-1.5'} rounded text-xs font-medium transition-colors ${
              activeSubTab === item.id
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <item.icon size={15} className={activeSubTab === item.id ? "text-white" : "text-slate-400"} />
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
          title={collapsed ? t('log_out') : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center py-2' : 'space-x-2 py-1 px-2'} text-red-400 hover:text-red-300 rounded hover:bg-red-950/40 transition-colors`}
        >
          {collapsed ? <span className="text-[11px]">⏻</span> : <span>{t('log_out')}</span>}
        </button>
      </div>
    </aside>
  );
}
