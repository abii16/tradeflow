import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Globe, ChevronDown, Bell } from 'lucide-react';

interface AdminHeaderProps {
  onSwitchPortal: () => void;
}

export default function AdminHeader({ onSwitchPortal }: AdminHeaderProps) {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="h-16 bg-[#232323] border-b border-[#2E2E2E] flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
      
      {/* Left: Global Search */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-[#8F8F8F]" />
        </div>
        <input 
          type="text" 
          placeholder={t('admin_search_placeholder')} 
          className="w-full pl-9 pr-12 py-2 bg-[#181818] border border-[#2E2E2E] rounded-lg text-sm text-[#EDEDED] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-[10px] font-semibold text-[#8F8F8F] bg-[#232323] border border-[#2E2E2E] rounded px-1.5 py-0.5">Ctrl+K</span>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center space-x-6">
        
        <div className="flex items-center space-x-4">
          {/* Escrow Widget */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-[#181818] rounded-lg border border-[#2E2E2E]">
            <span className="text-xs text-[#8F8F8F] font-medium">{t('admin_escrow_wallet')}</span>
            <span className="text-sm text-[#EDEDED] font-mono font-bold">ETB 2,450,000.00</span>
          </div>

          <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs font-semibold text-[#8F8F8F] hover:text-[#EDEDED] transition-colors">
            <Globe size={15} />
            {i18n.language === 'en' ? 'AM' : 'EN'} <ChevronDown size={12} className="opacity-50" />
          </button>
          
          <button className="relative p-1.5 text-[#8F8F8F] hover:text-[#8F8F8F] transition-colors rounded-full hover:bg-[#181818]">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1C1C1C]"></span>
          </button>
        </div>

        <div className="w-px h-6 bg-[#2E2E2E]"></div>

        {/* Profile */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-[#EDEDED] group-hover:text-[#3ECF8E] transition-colors">Habtamu Zewde</div>
            <div className="text-[11px] text-[#8F8F8F] font-medium">{t('admin_role_director')}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#181818] text-[#3ECF8E] font-bold flex items-center justify-center border border-[#2E2E2E] shadow-sm relative">
            HZ
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ECF8E] border-2 border-[#1C1C1C] rounded-full"></div>
          </div>
        </div>

      </div>
    </header>
  );
}
