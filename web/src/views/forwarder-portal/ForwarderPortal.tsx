import React, { useState } from 'react';
import ForwarderSidebar from './ForwarderSidebar';
import ForwarderHeader from './ForwarderHeader';
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
          <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-500 font-medium text-sm">Module under construction</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <ForwarderSidebar activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ForwarderHeader onSwitchPortal={onSwitchPortal} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {renderSubTab()}
        </main>
      </div>
    </div>
  );
}
