import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  BrainCircuit, 
  Settings, 
  ShieldCheck, 
  Truck, 
  FileCheck 
} from 'lucide-react';

export default function Sidebar() {
  const { t } = useTranslation();

  const menuItems = [
    { name: t('operations'), icon: BarChart3, active: true },
    { name: t('intelligence'), icon: BrainCircuit, active: false },
    { name: t('system'), icon: Settings, active: false },
    { name: t('admin'), icon: ShieldCheck, active: false },
    { name: t('forwarder'), icon: Truck, active: false },
    { name: t('customs'), icon: FileCheck, active: false },
  ];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">TradeFlow</h2>
        <p className="text-sm text-slate-500 mt-1">{t('shipper_portal')}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button className="w-full bg-slate-900 text-white rounded-md py-2 px-4 mb-6 font-medium">
          + {t('new_shipment')}
        </button>

        {menuItems.map((item, idx) => (
          <a
            key={idx}
            href="#"
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              item.active 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </a>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-4">
          <span className="w-5 text-center">?</span>
          <span>{t('support')}</span>
        </button>
        <button className="flex items-center space-x-2 text-slate-600 hover:text-slate-900">
          <span className="w-5 text-center">→</span>
          <span>{t('log_out')}</span>
        </button>
      </div>
    </aside>
  );
}
