import React, { useState } from 'react';
import ForwarderSidebar from './ForwarderSidebar';
import UniversalTopBar from '@/components/layout/UniversalTopBar';
import MultiShipperWorkspace from './MultiShipperWorkspace';
import ManifestsVault from './ManifestsVault';
import BiddingExchange from './BiddingExchange';
import ForwarderAnalytics from './ForwarderAnalytics';

interface ForwarderPortalProps {
  onSwitchPortal: () => void;
}

export default function ForwarderPortal({ onSwitchPortal }: ForwarderPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState('workspace');

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'workspace':
        return <MultiShipperWorkspace />;
      case 'manifests':
        return <ManifestsVault />;
      case 'bidding':
        return <BiddingExchange />;
      case 'analytics':
        return <ForwarderAnalytics />;
      default:
        return (
          <div className="flex items-center justify-center h-64 bg-[#232323] border border-[#2E2E2E] rounded-xl">
            <p className="text-[#8F8F8F] font-medium text-sm">Module under construction</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#1C1C1C] overflow-hidden font-sans">
      <ForwarderSidebar activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <UniversalTopBar />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {renderSubTab()}
        </main>
      </div>
    </div>
  );
}
