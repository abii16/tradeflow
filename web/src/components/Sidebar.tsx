import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Map, 
  Settings, 
  Wallet, 
  PackageSearch, 
  FileCheck 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'operations', name: t('operations'), icon: BarChart3 },
    { id: 'bids', name: t('bids'), icon: PackageSearch },
    { id: 'telematics', name: t('telematics'), icon: Map },
    { id: 'customs_vault', name: t('customs_vault'), icon: FileCheck },
    { id: 'escrow_settlements', name: t('escrow_settlements'), icon: Wallet },
    { id: 'settings', name: t('settings'), icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">TradeFlow</h2>
        <p className="text-sm text-slate-500 mt-1">{t('shipper_portal')}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button className="w-full bg-slate-50 border border-slate-300 border-l-[3px] border-l-transparent text-slate-800 rounded-r-lg rounded-l-sm py-2.5 px-4 mb-6 font-semibold text-xs tracking-wide hover:bg-emerald-50 hover:border-slate-300 hover:border-l-emerald-500 hover:text-emerald-900 transition-all duration-200">
          + {t('new_shipment')}
        </button>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 transition-all ${
              activeTab === item.id 
                ? 'bg-emerald-50 text-emerald-900 border-l-[3px] border-emerald-500 rounded-r-md rounded-l-sm font-semibold' 
                : 'text-slate-500 border-l-[3px] border-transparent rounded-r-md rounded-l-sm hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-900 font-medium'
            }`}
          >
            <item.icon size={18} className={activeTab === item.id ? "text-emerald-900" : "text-slate-400"} />
            <span className="text-left text-sm">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button className="w-full flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-4">
          <span className="w-5 text-center">?</span>
          <span>{t('support')}</span>
        </button>
        <button className="w-full flex items-center space-x-2 text-slate-600 hover:text-slate-900">
          <span className="w-5 text-center">→</span>
          <span>{t('log_out')}</span>
        </button>
      </div>
    </aside>
  );
}
