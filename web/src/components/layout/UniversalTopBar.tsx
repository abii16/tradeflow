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
      case 'ADMIN': return 'bg-slate-900 text-white border-slate-700';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
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
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 w-full z-10 sticky top-0">
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

        <div className="w-px h-4 bg-slate-200"></div>

        {/* User Account with Dropdown */}
        {user && (
          <div className="relative flex items-center space-x-3 ml-2" ref={dropdownRef}>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900 leading-none mb-1">{user.fullName || user.email}</span>
              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border leading-none ${getRoleBadgeColor(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>
            
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden ring-1 ring-slate-200">
                <img 
                  src={`https://i.pravatar.cc/150?u=${user.email}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-10 right-0 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.fullName || user.email}</p>
                  <p className="text-[10px] text-slate-500 truncate">{getRoleDisplayName(user.role)}</p>
                </div>
                
                <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors">
                  <User size={14} /> {t('my_profile')}
                </button>
                <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors">
                  <Settings size={14} /> {t('account_settings')}
                </button>
                
                <div className="h-px bg-slate-100 my-1"></div>
                
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
