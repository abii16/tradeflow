import React, { useState, useEffect } from 'react';
import ShipperSidebar from './ShipperSidebar';
import UniversalTopBar from '@/components/layout/UniversalTopBar';
import ShipperDashboard from './ShipperDashboard';
import BidsTab from './BidsTab';
import ContractRates from './ContractRates';
import TelematicsTab from './TelematicsTab';
import CustomsTab from './CustomsTab';
import SettingsTab from './SettingsTab';

const SHIPPER_TAB_PATHS: Record<string, string> = {
  '/shipper': 'operations',
  '/shipper/operations': 'operations',
  '/shipper/bids': 'bids',
  '/shipper/contract_rates': 'contract_rates',
  '/shipper/telematics': 'telematics',
  '/shipper/customs': 'customs_vault',
  '/shipper/settings': 'settings',
};

const TAB_TO_SLUG: Record<string, string> = {
  operations: 'operations',
  bids: 'bids',
  contract_rates: 'contract_rates',
  telematics: 'telematics',
  customs_vault: 'customs',
  settings: 'settings',
};

interface ShipperPortalProps {
  onSwitchPortal: () => void;
}

export default function ShipperPortal({ onSwitchPortal }: ShipperPortalProps) {
  const getTabFromPath = (): string => {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/shipper';
    return SHIPPER_TAB_PATHS[path] || 'operations';
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
    const targetPath = `/shipper/${slug}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'operations': return <ShipperDashboard />;
      case 'bids': return <BidsTab />;
      case 'contract_rates': return <ContractRates />;
      case 'telematics': return <TelematicsTab />;
      case 'customs_vault': return <CustomsTab />;
      case 'settings': return <SettingsTab />;
      default: return <ShipperDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden font-inter text-slate-900">
      <ShipperSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <UniversalTopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
