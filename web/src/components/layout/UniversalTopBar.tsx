import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Globe, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import HeaderSearch from '@/components/common/HeaderSearch';
import { useAuth } from '@/hooks/useAuth';

export default function UniversalTopBar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SHIPPER': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TRANSPORTER': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FORWARDER': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CUSTOMS_OFFICER': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ADMIN': return 'bg-[#3ECF8E] text-black hover:bg-[#34b27b] transition-colors font-bold border-[#2E2E2E]';
      default: return 'bg-[#181818] text-[#EDEDED] border-[#2E2E2E]';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SHIPPER': return t('role_shipper');
      case 'TRANSPORTER': return t('role_transporter');
      case 'FORWARDER': return t('role_forwarder');
      case 'CUSTOMS_OFFICER': return t('role_customs');
      case 'ADMIN': return t('role_admin');
      default: return role;
    }
  };

  return (
    <header className="h-14 bg-[#232323] border-b border-[#2E2E2E] flex items-center justify-between px-5 shrink-0 w-full z-10 sticky top-0">
      {/* Left side: Functional Search */}
      <HeaderSearch />

      {/* Right side: Language, Notifications, User */}
      <div className="flex items-center space-x-3">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#8F8F8F] hover:text-[#EDEDED] transition-colors"
        >
          <Globe size={13} />
          {i18n.language === 'en' ? 'AM' : 'EN'}
        </button>

        <div className="w-px h-4 bg-[#2E2E2E]"></div>

        {/* Notifications */}
        <button className="text-[#8F8F8F] hover:text-[#EDEDED]">
          <Bell size={15} />
        </button>

        <div className="w-px h-4 bg-[#2E2E2E]"></div>

        {/* User Account with Dropdown */}
        {user && (
          <div className="relative flex items-center space-x-3 ml-2" ref={dropdownRef}>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-[#EDEDED] leading-none mb-1">{user.fullName || user.email}</span>
              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border leading-none ${getRoleBadgeColor(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>
            
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#2E2E2E] border-2 border-[#1C1C1C] shadow-sm overflow-hidden ring-1 ring-[#2E2E2E]">
                <img 
                  src={`https://i.pravatar.cc/150?u=${user.email}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown size={14} className="text-[#8F8F8F]" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-10 right-0 w-48 bg-[#232323] border border-[#2E2E2E] rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-[#2E2E2E] sm:hidden">
                  <p className="text-xs font-bold text-[#EDEDED] truncate">{user.fullName || user.email}</p>
                  <p className="text-[10px] text-[#8F8F8F] truncate">{getRoleDisplayName(user.role)}</p>
                </div>
                
                <button className="w-full text-left px-4 py-2 text-xs text-[#EDEDED] hover:bg-[#1C1C1C] hover:text-[#3ECF8E] flex items-center gap-2 transition-colors">
                  <User size={14} /> {t('my_profile')}
                </button>
                <button className="w-full text-left px-4 py-2 text-xs text-[#EDEDED] hover:bg-[#1C1C1C] hover:text-[#3ECF8E] flex items-center gap-2 transition-colors">
                  <Settings size={14} /> {t('account_settings')}
                </button>
                
                <div className="h-px bg-[#181818] my-1"></div>
                
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} /> {t('sign_out')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
