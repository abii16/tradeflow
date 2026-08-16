import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Map, 
  Settings, 
  Wallet, 
  PackageSearch, 
  FileCheck,
  ChevronDown,
  TrendingUp,
  PhoneCall,
  FileText,
  Scale
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { t } = useTranslation();

  const financeSubItems = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'spot-pricing', label: 'Spot Pricing', icon: TrendingUp },
    { id: 'settlements', label: 'Settlements', icon: PhoneCall },
    { id: 'ledger', label: 'Ledger', icon: FileText },
    { id: 'disputes', label: 'Disputes', icon: Scale },
  ];

  const isFinanceActive = activeTab === 'escrow_settlements';
  const [financeOpen, setFinanceOpen] = useState(isFinanceActive);

  useEffect(() => {
    if (isFinanceActive) setFinanceOpen(true);
  }, [isFinanceActive]);

  const getActiveFinanceSub = () => {
    const parts = window.location.pathname.toLowerCase().split('/').filter(Boolean);
    return parts[1] || 'overview';
  };

  const [activeFinanceSub, setActiveFinanceSub] = useState(getActiveFinanceSub());

  useEffect(() => {
    const handlePop = () => setActiveFinanceSub(getActiveFinanceSub());
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleFinanceSubClick = (subId: string) => {
    setActiveTab('escrow_settlements');
    setActiveFinanceSub(subId);
    const newPath = `/finance/${subId}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ subTab: subId }, '', newPath);
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const menuItems = [
    { id: 'operations', name: t('operations'), icon: BarChart3 },
    { id: 'bids', name: t('bids'), icon: PackageSearch },
    { id: 'telematics', name: t('telematics'), icon: Map },
    { id: 'customs_vault', name: t('customs_vault'), icon: FileCheck },
  ];

  return (
    <aside className="w-60 bg-gray-900 h-screen flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-800">
        <div className="font-bold text-base text-white tracking-tight">TradeFlow</div>
        <div className="text-[11px] text-gray-500">{t('shipper_portal')}</div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <button 
          onClick={() => setActiveTab('operations')}
          className="w-full bg-white text-gray-900 hover:bg-gray-100 rounded-md py-2 px-3 mb-3 font-semibold text-xs transition-colors"
        >
          + {t('new_shipment')}
        </button>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
              activeTab === item.id 
                ? 'bg-gray-800 text-white font-semibold border-l-2 border-white' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border-l-2 border-transparent hover:border-gray-600'
            }`}
          >
            <item.icon size={15} className={activeTab === item.id ? "text-white" : "text-gray-500"} />
            <span className="text-left">{item.name}</span>
          </button>
        ))}

        {/* Finance with sub-dropdown */}
        <div>
          <button
            onClick={() => {
              if (!isFinanceActive) {
                handleFinanceSubClick('overview');
              }
              setFinanceOpen(!financeOpen);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
              isFinanceActive
                ? 'bg-gray-800 text-white font-semibold border-l-2 border-white'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border-l-2 border-transparent hover:border-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Wallet size={15} className={isFinanceActive ? "text-white" : "text-gray-500"} />
              <span className="text-left">{t('escrow_settlements')}</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-500 transition-transform duration-150 ${financeOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {financeOpen && (
            <div className="ml-6 mt-0.5 space-y-0.5 border-l border-gray-700 pl-2">
              {financeSubItems.map((sub) => {
                const isSubActive = isFinanceActive && activeFinanceSub === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleFinanceSubClick(sub.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-all duration-150 active:scale-[0.97] ${
                      isSubActive
                        ? 'text-white font-semibold bg-gray-800'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <sub.icon size={12} className={isSubActive ? 'text-gray-300' : 'text-gray-600'} />
                    {sub.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
            activeTab === 'settings'
              ? 'bg-gray-800 text-white font-semibold border-l-2 border-white'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border-l-2 border-transparent hover:border-gray-600'
          }`}
        >
          <Settings size={15} className={activeTab === 'settings' ? "text-white" : "text-gray-500"} />
          <span className="text-left">{t('settings')}</span>
        </button>
      </nav>

      <div className="p-3 border-t border-gray-800 text-xs space-y-1">
        <button className="w-full flex items-center space-x-2 text-gray-500 hover:text-gray-300 py-1 px-2 rounded-md hover:bg-gray-800/50 transition-all duration-150 active:scale-[0.97]">
          <span>{t('support')}</span>
        </button>
        <button className="w-full flex items-center space-x-2 text-gray-500 hover:text-gray-300 py-1 px-2 rounded-md hover:bg-gray-800/50 transition-all duration-150 active:scale-[0.97]">
          <span>{t('log_out')}</span>
        </button>
      </div>
    </aside>
  );
}
