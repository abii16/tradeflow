import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Globe, LogOut } from 'lucide-react';
import HeaderSearch from './HeaderSearch';
import { useAuth } from '../hooks/useAuth';

export default function UniversalTopBar() {
  const { i18n } = useTranslation();
  const { user, logout } = useAuth();

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
      case 'SHIPPER': return 'Shipper';
      case 'TRANSPORTER': return 'Transporter';
      case 'FORWARDER': return 'Forwarder';
      case 'CUSTOMS_OFFICER': return 'Customs';
      case 'ADMIN': return 'Admin';
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

        {/* User Account */}
        {user && (
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900 leading-none mb-1">{user.fullName || user.email}</span>
              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border leading-none ${getRoleBadgeColor(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>
            
            <button 
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
