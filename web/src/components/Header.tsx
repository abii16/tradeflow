import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, UserCircle } from 'lucide-react';

export default function Header() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-6 text-sm font-medium text-slate-500">
        <a href="#" className="text-blue-600 border-b-2 border-blue-600 pb-5 pt-5">Operations</a>
        <a href="#" className="hover:text-slate-800">Telematics</a>
        <a href="#" className="hover:text-slate-800">Marketplace</a>
        <a href="#" className="hover:text-slate-800">Rates</a>
        <a href="#" className="hover:text-slate-800">Customs</a>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button 
          onClick={toggleLanguage}
          className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md hover:bg-slate-200"
        >
          {i18n.language === 'en' ? 'አማርኛ' : 'English'}
        </button>

        <button className="text-slate-400 hover:text-slate-600">
          <Bell size={20} />
        </button>

        <div className="flex items-center space-x-2">
          <UserCircle size={32} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
