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
  Fuel
} from 'lucide-react';

interface CarrierSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPortal?: () => void;
}

export default function CarrierSidebar({ activeTab, setActiveTab, onSwitchPortal }: CarrierSidebarProps) {
  const { t, i18n } = useTranslation();
  const isAm = i18n.language === 'am';

  const menuItems = [
    {
      id: 'operations',
      label: isAm ? 'ንቁ ጉዞዎች እና ክትትል' : 'Active Hauls & Tracking',
      sub: isAm ? 'የኮሪደር ጉዞ ደረጃዎች' : 'In-transit telematics',
      icon: Truck,
      badge: 'LIVE',
    },
    {
      id: 'load_board',
      label: isAm ? 'የጭነት ገበያ እና AI ጨረታ' : 'Load Board & Bidding',
      sub: isAm ? 'ክፍት ጭነቶች እና ውድድር' : 'Marketplace & AI Match',
      icon: Package,
    },
    {
      id: 'fleet',
      label: isAm ? 'የተሽከርካሪዎች አስተዳደር' : 'Fleet & Drivers',
      sub: isAm ? 'የጭነት መኪኖች እና አሽከርካሪዎች' : 'Trucks & Verification',
      icon: Layers,
    },
    {
      id: 'corridor_safety',
      label: isAm ? 'የኮሪደር ደህንነት እና ነዳጅ' : 'Corridor Safety & Fuel',
      sub: isAm ? 'አደጋ ቀጠናዎች እና ማደያዎች' : 'Hazards, Stations & Detours',
      icon: ShieldAlert,
    },
    {
      id: 'performance',
      label: isAm ? 'የአፈጻጸም ዳሽቦርድ' : 'Corridor Benchmarks',
      sub: isAm ? 'FR-09 የኮሪደር ንጽጽር' : 'OTD, Fuel & Ratings',
      icon: Award,
      badge: 'FR-09',
    },
    {
      id: 'earnings',
      label: isAm ? 'የቴሌብር ክፍያ እና ገቢ' : 'TeleBirr Settlements',
      sub: isAm ? 'ኢስክሮው እና የተጣራ ሂሳብ' : 'Escrow & Net Payouts',
      icon: Wallet,
    },
    {
      id: 'driver_console',
      label: isAm ? 'የአሽከርካሪ ሞድ (ኦፍላይን)' : 'Driver Console (Offline)',
      sub: isAm ? 'በበረሃ ጉዞ ወቅት የሚሰራ' : 'Cab simulation & sync queue',
      icon: Smartphone,
      badge: 'OFFLINE',
    },
  ];

  return (
    <aside className="w-64 bg-[#1C1C1C] border-r border-[#2E2E2E] flex flex-col justify-between shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="h-14 border-b border-[#2E2E2E] flex items-center px-4 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E]">
            <Truck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[#EDEDED] tracking-tight">TradeFlow</span>
              <span className="text-[10px] font-mono font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-1.5 py-0.2 rounded border border-[#3ECF8E]/20">
                CARRIER
              </span>
            </div>
            <p className="text-[10px] text-[#8F8F8F] font-mono">Djibouti Artery Logistics</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 flex items-center justify-between group ${
                  isActive
                    ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30 shadow-[0_0_15px_rgba(62,207,142,0.08)]'
                    : 'text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#232323] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={17}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-[#3ECF8E]' : 'text-[#8F8F8F] group-hover:text-[#EDEDED]'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-snug truncate">{item.label}</div>
                    <div className="text-[10px] text-[#8F8F8F] opacity-75 truncate">{item.sub}</div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ml-1.5 ${
                      isActive
                        ? 'bg-[#3ECF8E] text-black'
                        : item.badge === 'LIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : item.badge === 'OFFLINE'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-[#2E2E2E] text-[#8F8F8F]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status & Switch */}
      <div className="p-3 border-t border-[#2E2E2E] space-y-2 bg-[#181818]">
        {/* Corridor Telematics Status */}
        <div className="p-2.5 rounded-lg bg-[#232323] border border-[#2E2E2E] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8F8F8F] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse"></span>
              Corridor Link (A1)
            </span>
            <span className="text-[9px] font-mono font-bold text-[#3ECF8E]">99.9% UPTIME</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#8F8F8F] font-mono pt-1 border-t border-[#2E2E2E]">
            <span>Galafi Border:</span>
            <span className="text-[#EDEDED] font-bold">45m dwell</span>
          </div>
        </div>

        {/* Quick Portal Switch */}
        {onSwitchPortal && (
          <button
            onClick={onSwitchPortal}
            className="w-full py-2 px-3 rounded-lg bg-[#232323] hover:bg-[#2E2E2E] text-xs font-semibold text-[#8F8F8F] hover:text-[#EDEDED] border border-[#2E2E2E] flex items-center justify-between transition-colors"
          >
            <span>Finance & Disputes</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
