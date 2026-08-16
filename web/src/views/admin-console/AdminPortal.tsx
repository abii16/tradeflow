import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ControlTowerDashboard from './ControlTowerDashboard';

type AdminSubTab = 'radar' | 'verification' | 'pricing' | 'security' | 'disputes' | 'audit';

interface AdminPortalProps {
  onSwitchPortal: () => void;
}

export default function AdminPortal({ onSwitchPortal }: AdminPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('radar');

  useEffect(() => {
    // Optionally handle browser history state here
  }, []);

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'radar':
        return <ControlTowerDashboard />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-500 font-medium text-sm">Under Construction</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <AdminSidebar activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onSwitchPortal={onSwitchPortal} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {renderSubTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
