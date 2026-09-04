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
          <div className="h-full flex flex-col items-center justify-center bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-200">
              <span className="text-2xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Module Under Construction</h2>
            <p className="text-slate-500 mt-2">The {activeSubTab} module is currently being built.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-inter">
      {/* Sidebar Navigation */}
      <CustomsSidebar activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col relative min-w-0">

        {/* Global Identity & Notification Bar */}
        <UniversalTopBar />

        {/* Dynamic Workspace Canvas */}
        <main className="flex-1 bg-[#F8FAFC] relative overflow-hidden">
          <div className="absolute inset-0 p-5 flex flex-col">
            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
