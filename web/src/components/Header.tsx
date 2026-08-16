import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onNavigate?: (tab: string) => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
      {/* Left side: Org Info */}
      <div 
        onClick={() => onNavigate && onNavigate('operations')}
        className="flex items-center space-x-2.5 cursor-pointer"
      >
        <div className="flex items-center justify-center w-6 h-6 bg-slate-900 text-white rounded font-bold text-xs">
          ET
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-xs leading-none">{t('org_name')}</span>
          <span className="text-[10px] text-slate-500 mt-0.5">Enterprise Shipper</span>
        </div>
      </div>

      {/* Right side: Search, Wallet, Actions */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 text-slate-400" size={13} />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-slate-900 focus:outline-none w-56 placeholder:text-slate-400"
          />
        </div>

        <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>

        {/* Escrow Wallet Quick View */}
        <div 
          onClick={() => onNavigate && onNavigate('escrow_settlements')}
          className="hidden sm:flex items-center space-x-2 cursor-pointer text-xs"
        >
          <span className="text-slate-500 font-medium">{t('escrow_wallet_balance')}:</span>
          <span className="font-mono font-semibold text-slate-900">ETB 2,450,000.00</span>
        </div>

        <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>
        
        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 uppercase"
        >
          {i18n.language === 'en' ? 'AM' : 'EN'}
        </button>

        {/* Notifications */}
        <button className="text-slate-500 hover:text-slate-700">
          <Bell size={15} />
        </button>

        {/* User Account */}
        <div className="flex items-center space-x-1 text-xs font-medium text-slate-700">
          <span>Dani</span>
          <ChevronDown size={13} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
