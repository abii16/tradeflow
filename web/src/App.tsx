import React, { useState, useEffect } from 'react';
import LandingPage from './views/LandingPage';
import ShipperPortal from './views/shipper-portal/ShipperPortal';
import FinancePortal from './views/financial-dashboard/FinancePortal';
import AdminPortal from './views/admin-console/AdminPortal';
import ForwarderPortal from './views/forwarder-portal/ForwarderPortal';
import CustomsPortal from './views/customs-portal/CustomsPortal';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';

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
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setPortalState(getPortalFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protect routes and enforce Role-Based Access Control (RBAC)
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (portal !== 'selector') {
        navigateToPortal('selector');
      }
      return;
    }

    if (user) {
      const role = user.role;
      let allowedPortals: PortalView[] = [];
      let defaultPortal: PortalView = 'selector';

      switch (role) {
        case 'SHIPPER':
        case 'TRANSPORTER':
        case 'DRIVER':
          allowedPortals = ['shipper'];
          defaultPortal = 'shipper';
          break;
        case 'CUSTOMS_BROKER':
          allowedPortals = ['forwarder', 'customs'];
          defaultPortal = 'forwarder';
          break;
        case 'FINANCE_ADMIN':
          allowedPortals = ['finance'];
          defaultPortal = 'finance';
          break;
        case 'SYSTEM_ADMIN':
          allowedPortals = ['admin', 'shipper', 'finance', 'forwarder', 'customs'];
          defaultPortal = 'admin';
          break;
        default:
          allowedPortals = [];
          defaultPortal = 'selector';
      }

      if (portal === 'selector') {
        navigateToPortal(defaultPortal);
      } else if (!allowedPortals.includes(portal)) {
        navigateToPortal(defaultPortal);
        console.warn(`Unauthorized access attempt. Role ${role} cannot access ${portal} portal.`);
      }
    }
  }, [isAuthenticated, isLoading, portal, user]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // If not authenticated and trying to access a portal, force selector (handled by useEffect, but double check here)
  if (!isAuthenticated && portal !== 'selector') {
    return <LandingPage onSelectPortal={handleSelectPortal} />;
  }

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
      return <LandingPage onSelectPortal={handleSelectPortal} />;
  }
}
