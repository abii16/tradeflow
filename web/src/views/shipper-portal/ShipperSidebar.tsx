import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Truck,
  Package,
  FileSignature,
  Radio,
  ShieldCheck,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ShipperSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPortal?: () => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
}

interface MenuSection {
  title: string;
  items: SidebarItem[];
}

export default function ShipperSidebar({ activeTab, setActiveTab, onSwitchPortal }: ShipperSidebarProps) {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const isAm = i18n.language === 'am';

  const menuSections: MenuSection[] = [
    {
      title: isAm ? 'የስምሪት እና የገበያ ክፍል' : 'DISPATCH & CORRIDOR',
      items: [
        {
          id: 'operations',
          label: isAm ? 'ንቁ ስምሪቶች' : 'Operations & Dispatch',
          icon: Truck,
        },
        {
          id: 'bids',
          label: isAm ? 'የጭነት ገበያ እና ጨረታ' : 'Load Board & Bids',
          icon: Package,
        },
        {
          id: 'contract_rates',
          label: isAm ? 'የኮንትራት ታሪፎች' : 'Contract Rates',
          icon: FileSignature,
        },
      ],
    },
    {
      title: isAm ? 'ኮሪደር እና ደህንነት' : 'CORRIDOR & SAFETY',
      items: [
        {
          id: 'telematics',
          label: isAm ? 'የቀጥታ ቴሌማቲክስ' : 'Live Telematics & ETA',
          icon: Radio,
        },
        {
          id: 'customs_vault',
          label: isAm ? 'ዲጂታል ጉምሩክ ቮልት' : 'Digital Customs Vault',
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: isAm ? 'ድርጅት እና ቅንብሮች' : 'ORGANIZATION & SETTINGS',
      items: [
        {
          id: 'settings',
          label: isAm ? 'የድርጅት መረጃ' : 'Organization Settings',
          icon: Settings,
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
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group relative overflow-hidden cursor-pointer ${
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
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#3ECF8E]/20 text-[#3ECF8E]'
                            : 'bg-[#1C1C1C] text-[#8F8F8F] group-hover:text-[#EDEDED] group-hover:bg-[#242424]'
                        }`}
                      >
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
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Operations */}
      <div className="p-3 border-t border-[#242424] bg-[#141414] shrink-0">
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
