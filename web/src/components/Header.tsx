import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50">
      
      {/* Left side: Org Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-slate-900 text-white rounded-md font-bold text-sm shadow-sm">
          ET
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm leading-tight">{t('org_name')}</span>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center tracking-wider uppercase mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
            Verified Enterprise
          </span>
        </div>
      </div>

      {/* Right side: Search, Wallet, Actions */}
      <div className="flex items-center space-x-4 lg:space-x-5">
        
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="pl-9 pr-12 py-1.5 bg-slate-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100/50 w-64 transition-all placeholder:text-slate-400 font-medium"
          />
          <kbd className="absolute right-2 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>

        <div className="w-px h-6 bg-slate-200 hidden lg:block"></div>

        {/* Escrow Wallet */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('escrow_wallet_balance')}</span>
            <span className="text-sm font-bold text-slate-900 font-mono leading-none">ETB 2,450,000.00</span>
          </div>
          <Button size="sm" className="h-8 text-xs px-4 bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-white hover:border-slate-400 hover:shadow-sm transition-all duration-200">
            {t('top_up')}
          </Button>
        </div>

        <div className="w-px h-6 bg-slate-200 hidden lg:block"></div>
        
        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider w-8 text-center"
        >
          {i18n.language === 'en' ? 'AM' : 'EN'}
        </button>

        {/* Notifications */}
        <button className="text-slate-400 hover:text-slate-600 relative transition-colors">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <button className="flex items-center space-x-2 pl-2 rounded-full hover:bg-slate-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-sm">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=f1f5f9" alt="User Avatar" className="w-full h-full object-cover" />
          </div>
          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </div>
    </header>
  );
}
