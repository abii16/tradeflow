import React, { useState, useEffect } from 'react';
import CarrierSidebar from './CarrierSidebar';
import UniversalTopBar from '@/components/layout/UniversalTopBar';
import ActiveHaulsTab from './tabs/ActiveHaulsTab';
import LoadBoardTab from './tabs/LoadBoardTab';
import FleetManagementTab from './tabs/FleetManagementTab';
import CorridorSafetyTab from './tabs/CorridorSafetyTab';
import PerformanceTab from './tabs/PerformanceTab';
import EarningsLedgerTab from './tabs/EarningsLedgerTab';
import DriverConsoleTab from './tabs/DriverConsoleTab';

const CARRIER_TAB_PATHS: Record<string, string> = {
  '/carrier': 'operations',
  '/carrier/operations': 'operations',
  '/carrier/load-board': 'load_board',
  '/carrier/fleet': 'fleet',
  '/carrier/safety': 'corridor_safety',
  '/carrier/performance': 'performance',
  '/carrier/earnings': 'earnings',
  '/carrier/driver': 'driver_console',
};

const TAB_TO_SLUG: Record<string, string> = {
  operations: 'operations',
  load_board: 'load-board',
  fleet: 'fleet',
  corridor_safety: 'safety',
  performance: 'performance',
  earnings: 'earnings',
  driver_console: 'driver',
};

interface CarrierPortalProps {
  onSwitchPortal?: () => void;
}

export default function CarrierPortal({ onSwitchPortal }: CarrierPortalProps) {
  const getTabFromPath = (): string => {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/carrier';
    return CARRIER_TAB_PATHS[path] || 'operations';
  };

  const [activeTab, setActiveTabState] = useState<string>(getTabFromPath);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    const slug = TAB_TO_SLUG[tab] || tab;
    const targetPath = `/carrier/${slug}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'operations':
        return <ActiveHaulsTab onGoToLoadBoard={() => setActiveTab('load_board')} />;
      case 'load_board':
        return <LoadBoardTab />;
      case 'fleet':
        return <FleetManagementTab />;
      case 'corridor_safety':
        return <CorridorSafetyTab />;
      case 'performance':
        return <PerformanceTab />;
      case 'earnings':
        return <EarningsLedgerTab />;
      case 'driver_console':
        return <DriverConsoleTab />;
      default:
        return <ActiveHaulsTab onGoToLoadBoard={() => setActiveTab('load_board')} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#1C1C1C] w-full overflow-hidden font-inter text-[#EDEDED]">
      <CarrierSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchPortal={onSwitchPortal}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <UniversalTopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#181818] p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
