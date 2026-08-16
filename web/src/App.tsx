import React, { useState } from 'react';
import Layout from './components/Layout';
import ShipperDashboard from './views/ShipperDashboard';
import BidsTab from './views/BidsTab';
import TelematicsTab from './views/TelematicsTab';
import CustomsTab from './views/CustomsTab';
import EscrowTab from './views/EscrowTab';
import SettingsTab from './views/SettingsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('operations');

  const renderTab = () => {
    switch (activeTab) {
      case 'operations': return <ShipperDashboard />;
      case 'bids': return <BidsTab />;
      case 'telematics': return <TelematicsTab />;
      case 'customs_vault': return <CustomsTab />;
      case 'escrow_settlements': return <EscrowTab />;
      case 'settings': return <SettingsTab />;
      default: return <ShipperDashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderTab()}
    </Layout>
  );
}
