
import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Truck, 
  Package, 
  Layers, 
  ShieldAlert, 
  Award, 
  Wallet, 
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Activity,
  LogOut,
  Sparkles,
  Radio,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CarrierSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPortal?: () => void;
}

interface SidebarItem {
  id: string;
  label: string;
  sub?: string;
  icon: any;
  badge?: string;
  badgeType?: 'live' | 'ai' | 'offline' | 'neutral' | string;
}

interface MenuSection {
  title: string;
  items: SidebarItem[];
}

export default function CarrierSidebar({ activeTab, setActiveTab, onSwitchPortal }: CarrierSidebarProps) {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const isAm = i18n.language === 'am';

  const menuSections: MenuSection[] = [
    {
      title: isAm ? 'የስምሪት እና የገበያ ክፍል' : 'DISPATCH & CORRIDOR',
      items: [
        {
          id: 'operations',
          label: isAm ? 'ንቁ ጉዞዎች' : 'Active Hauls',
          icon: Truck,
        },
        {
          id: 'load_board',
          label: isAm ? 'የጭነት ገበያ' : 'Load Board',
          icon: Package,
        },
        {
          id: 'fleet',
          label: isAm ? 'የተሽከርካሪዎች አስተዳደር' : 'Fleet Management',
          icon: Layers,
        },
      ],
    },
    {
      title: isAm ? 'ደህንነት እና አፈጻጸም' : 'SAFETY & INTELLIGENCE',
      items: [
        {
          id: 'corridor_safety',
          label: isAm ? 'የኮሪደር ደህንነት' : 'Corridor Safety',
          icon: ShieldAlert,
        },
        {
          id: 'performance',
          label: isAm ? 'የኮሪደር አፈጻጸም' : 'Corridor Performance',
          icon: Award,
        },
        {
          id: 'driver_console',
          label: isAm ? 'የሹፌር ኮንሶል' : 'Driver Console',
          icon: Smartphone,
        },
      ],
    },
    {
      title: isAm ? 'ፋይናንስ እና ክፍያ' : 'FINANCE & SETTLEMENTS',
      items: [
        {
          id: 'earnings',
          label: isAm ? 'ቴሌብር ክፍያዎች' : 'TeleBirr Settlements',
          icon: Wallet,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#121212] border-r border-[#242424] flex flex-col justify-between shrink-0 h-screen select-none relative z-20">
      {/* Brand Header */}
      <div className="h-16 border-b border-[#242424] flex items-center px-5 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-30">
        <span className="font-extrabold text-lg text-[#EDEDED] tracking-tight">TradeFlow</span>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#242424] [&::-webkit-scrollbar-thumb]:rounded-full">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {sIdx > 0 && <div className="h-px bg-[#242424]/50 my-2 mx-1" />}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-[#3ECF8E]/15 via-[#3ECF8E]/8 to-[#3ECF8E]/0 text-white border border-[#3ECF8E]/30 shadow-[0_0_20px_rgba(62,207,142,0.08)]'
                        : 'text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#1C1C1C] border border-transparent hover:border-white/[0.04]'
                    }`}
                  >
                    {/* Active left indicator accent bar */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#3ECF8E] shadow-[0_0_10px_#3ECF8E]" />
                    )}

                    <div className="flex items-center gap-3 min-w-0 pl-0.5">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-[#3ECF8E]/20 text-[#3ECF8E]' 
                          : 'bg-[#1C1C1C] text-[#8F8F8F] group-hover:text-[#EDEDED] group-hover:bg-[#242424]'
                      }`}>
                        <Icon
                          size={16}
                          className={`transition-all duration-200 ${
                            isActive 
                              ? 'text-[#3ECF8E] drop-shadow-[0_0_8px_rgba(62,207,142,0.5)]' 
                              : 'group-hover:scale-105'
                          }`}
                        />
                      </div>
                      
                      <div className="truncate min-w-0">
                        <div className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-white' : 'text-[#EDEDED]'}`}>
                          {item.label}
                        </div>
                        {item.sub && (
                          <div className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-[#3ECF8E]/80 font-medium' : 'text-[#737373] group-hover:text-[#8F8F8F]'}`}>
                            {item.sub}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badge Pill */}
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-1.5 transition-all ${
                          item.badgeType === 'live'
                            ? isActive 
                              ? 'bg-[#3ECF8E] text-black shadow-[0_0_10px_rgba(62,207,142,0.5)]' 
                              : 'bg-emerald-500/15 text-[#3ECF8E] border border-[#3ECF8E]/30 flex items-center gap-1'
                            : item.badgeType === 'ai'
                            ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/25'
                            : item.badgeType === 'offline'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-[#242424] text-[#A1A1A1] border border-white/[0.05]'
                        }`}
                      >
                        {item.badgeType === 'live' && !isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-ping inline-block" />
                        )}
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Operations */}
      <div className="p-3 border-t border-[#242424] bg-[#141414] shrink-0">
        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full py-2 px-3 rounded-lg bg-rose-500/[0.06] hover:bg-rose-500/[0.12] text-xs font-medium text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/30 flex items-center justify-between transition-all cursor-pointer group"
          title={isAm ? 'ውጣ (Logout)' : 'Log Out'}
        >
          <div className="flex items-center gap-2">
            <LogOut size={13} className="text-rose-400 group-hover:text-rose-300 transition-colors" />
            <span>{isAm ? 'ውጣ (Logout)' : 'Log Out'}</span>
          </div>
          <span className="text-[10px] font-mono text-rose-400/60 group-hover:text-rose-300">Exit</span>
        </button>
      </div>
    </aside>
  );
}

