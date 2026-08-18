import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ControlTowerDashboard from './ControlTowerDashboard';
import VerificationQueue from './VerificationQueue';
import DynamicPricing from './DynamicPricing';
import SecurityDetours from './SecurityDetours';
import DisputeMediation from './DisputeMediation';
import AuditLogs from './AuditLogs';
import FuelAnalytics from './FuelAnalytics';

type AdminSubTab = 'radar' | 'verification' | 'pricing' | 'fuel' | 'security' | 'disputes' | 'audit';

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
      case 'verification':
        return <VerificationQueue />;
      case 'pricing':
        return <DynamicPricing />;
      case 'fuel':
        return <FuelAnalytics />;
      case 'security':
        return <SecurityDetours />;
      case 'disputes':
        return <DisputeMediation />;
      case 'audit':
        return <AuditLogs />;
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
