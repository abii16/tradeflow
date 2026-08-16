import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, UserCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center space-x-2 text-sm">
        <span className="font-bold text-slate-800">{t('org_name')}</span>
        <span className="text-slate-300">•</span>
        <span className="text-emerald-600 font-medium flex items-center">
          <span className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></span>
          {t('shipper_portal')}
        </span>
      </div>

      <div className="flex items-center space-x-4 lg:space-x-6">
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
          <Wallet size={16} className="text-slate-400" />
          <span className="text-xs text-slate-500">{t('escrow_wallet_balance')}:</span>
          <span className="text-sm font-bold text-slate-800">ETB 2,450,000.00</span>
          <div className="flex items-center bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ml-1">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mr-1"></span> Multi-Sig
          </div>
          <Button size="sm" className="h-7 text-xs ml-3 px-3 bg-slate-50 border border-slate-300 border-l-[3px] border-l-transparent text-slate-800 font-semibold rounded-r-md rounded-l-sm hover:bg-emerald-50 hover:border-slate-300 hover:border-l-emerald-500 hover:text-emerald-900 transition-all duration-200">
            {t('top_up')}
          </Button>
        </div>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>
        
        <button 
          onClick={toggleLanguage}
          className="text-xs font-medium text-slate-600 bg-white border border-slate-200 border-l-[3px] border-l-transparent px-3 py-1.5 rounded-r-md rounded-l-sm hover:bg-emerald-50 hover:border-slate-200 hover:border-l-emerald-500 hover:text-emerald-900 transition-all"
        >
          {i18n.language === 'en' ? 'አማርኛ' : 'English'}
        </button>

        <button className="text-slate-400 hover:text-slate-600 relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-2">
          <UserCircle size={32} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
