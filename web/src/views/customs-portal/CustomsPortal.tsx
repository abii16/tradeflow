import React, { useState } from 'react';
import CustomsSidebar from './CustomsSidebar';
import UniversalTopBar from '@/components/layout/UniversalTopBar';
import CustomsWorkspace from './CustomsWorkspace';
import CustomsInspections from './CustomsInspections';
import CustomsReports from './CustomsReports';

interface CustomsPortalProps {
  onSwitchPortal: () => void;
}

export default function CustomsPortal({ onSwitchPortal }: CustomsPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState('queue');

  const renderActiveTab = () => {
    switch (activeSubTab) {
      case 'queue':
        return <CustomsWorkspace />;
      case 'inspections':
        return <CustomsInspections />;
      case 'reports':
        return <CustomsReports />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-[#232323] border border-[#2E2E2E] rounded-xl">
            <div className="w-14 h-14 rounded-full bg-[#1C1C1C] flex items-center justify-center mb-4 border border-[#2E2E2E]">
              <span className="text-2xl">🚧</span>
            </div>
            <h2 className="text-base font-bold text-[#EDEDED]">Module Under Construction</h2>
            <p className="text-[#8F8F8F] text-sm mt-1">The {activeSubTab} module is currently being built.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#1C1C1C] font-inter">
      <CustomsSidebar activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-20">
          <UniversalTopBar />
        </div>
        <main className="flex-1 p-5 md:p-6">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
