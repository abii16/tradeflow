import React from 'react';
import { Bell, User, Menu, Globe, Ship } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForwarderHeaderProps {
  onSwitchPortal: () => void;
}

export default function ForwarderHeader({ onSwitchPortal }: ForwarderHeaderProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-500 hover:text-slate-900">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 border-r border-slate-200 pr-4 md:hidden">
          <Ship className="text-blue-600" size={24} />
          <span className="font-bold text-lg tracking-tight text-slate-900">TradeFlow</span>
        </div>
        <div className="hidden md:block">
          <h2 className="text-sm font-bold text-slate-800">{t('fwd_entity_name', 'Horn of Africa Forwarding Ltd.')}</h2>
          <p className="text-xs text-slate-500 font-medium">{t('fwd_entity_desc', 'Verified Broker (HBL Lic: ET-8841)')}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleLanguage}
          className="hidden sm:flex items-center space-x-1 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
        >
          <Globe size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-800">
            {i18n.language === 'en' ? 'AM' : 'EN'}
          </span>
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <button 
          onClick={onSwitchPortal}
          className="hidden sm:block text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
        >
          {t('fwd_switch_portal', 'Switch Portal')}
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        
        <button className="text-slate-500 hover:text-slate-700 relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        </button>
        
        <button className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 pl-2">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <User size={16} className="text-slate-500" />
          </div>
          <span className="text-sm font-bold hidden md:block">{t('fwd_ops_team', 'Operations Team')}</span>
        </button>
      </div>
    </header>
  );
}
