import React, { useState } from 'react';
import CustomsSidebar from './CustomsSidebar';
import CustomsHeader from './CustomsHeader';
import CustomsWorkspace from './CustomsWorkspace';

interface CustomsPortalProps {
  onSwitchPortal: () => void;
}

export default function CustomsPortal({ onSwitchPortal }: CustomsPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState('queue');

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-inter">
      {/* Sidebar Navigation */}
      <CustomsSidebar activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
      
      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Global Identity & Notification Bar */}
        <CustomsHeader onSwitchPortal={onSwitchPortal} />

        {/* Dynamic Workspace Canvas */}
        <main className="flex-1 bg-[#F8FAFC] overflow-y-auto overflow-x-hidden relative">
          <div className="absolute inset-0 p-6 md:p-8">
            {activeSubTab === 'queue' ? (
              <CustomsWorkspace />
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-200">
                  <span className="text-2xl">🚧</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Module Under Construction</h2>
                <p className="text-slate-500 mt-2">The {activeSubTab} module is currently being built.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
