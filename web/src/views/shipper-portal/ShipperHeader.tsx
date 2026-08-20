import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, Globe } from 'lucide-react';
import HeaderSearch from '@/components/common/HeaderSearch';

interface ShipperHeaderProps {
  onSwitchPortal: () => void;
}

export default function ShipperHeader({ onSwitchPortal }: ShipperHeaderProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
      {/* Left side: Functional Search */}
      <HeaderSearch />

      {/* Right side: Language, Notifications, User */}
      <div className="flex items-center space-x-3">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Globe size={13} />
          {i18n.language === 'en' ? 'AM' : 'EN'}
        </button>

        <div className="w-px h-4 bg-slate-200"></div>

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
