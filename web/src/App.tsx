import React, { useState, useEffect } from 'react';
import PortalSelector from './views/PortalSelector';
import ShipperPortal from './views/shipper-portal/ShipperPortal';
import FinancePortal from './views/financial-dashboard/FinancePortal';
import AdminPortal from './views/admin-console/AdminPortal';
import ForwarderPortal from './views/forwarder-portal/ForwarderPortal';
import CustomsPortal from './views/customs-portal/CustomsPortal';

type PortalView = 'selector' | 'shipper' | 'finance' | 'admin' | 'forwarder' | 'customs';

function getPortalFromPath(): PortalView {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (path.startsWith('/shipper')) return 'shipper';
  if (path.startsWith('/finance')) return 'finance';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/forwarder')) return 'forwarder';
  if (path.startsWith('/customs')) return 'customs';
  // Legacy route redirects
  if (path.startsWith('/bids') || path.startsWith('/telematics') || path.startsWith('/customs') || path === '/operations') return 'shipper';
  if (path.startsWith('/escrow') || path.startsWith('/settlements') || path.startsWith('/ledger') || path.startsWith('/disputes') || path.startsWith('/pricing')) return 'finance';
  return 'selector';
}

export default function App() {
  const [portal, setPortalState] = useState<PortalView>(getPortalFromPath);

  useEffect(() => {
    const handlePopState = () => {
      setPortalState(getPortalFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToPortal = (target: PortalView) => {
    setPortalState(target);
    const paths: Record<PortalView, string> = {
      selector: '/',
      shipper: '/shipper',
      finance: '/finance',
      admin: '/admin',
      forwarder: '/forwarder',
      customs: '/customs',
    };
    if (window.location.pathname !== paths[target]) {
      window.history.pushState({ portal: target }, '', paths[target]);
    }
  };

  const handleSelectPortal = (p: 'shipper' | 'finance' | 'admin' | 'forwarder' | 'customs') => {
    navigateToPortal(p);
  };

  const switchToFinance = () => navigateToPortal('finance');
  const switchToShipper = () => navigateToPortal('shipper');

  switch (portal) {
    case 'shipper':
      return <ShipperPortal onSwitchPortal={switchToFinance} />;
    case 'finance':
      return <FinancePortal onSwitchPortal={switchToShipper} />;
    case 'admin':
      return <AdminPortal onSwitchPortal={() => navigateToPortal('selector')} />;
    case 'forwarder':
      return <ForwarderPortal onSwitchPortal={() => navigateToPortal('selector')} />;
    case 'customs':
      return <CustomsPortal onSwitchPortal={() => navigateToPortal('selector')} />;
    default:
      return <PortalSelector onSelectPortal={handleSelectPortal} />;
  }
}
