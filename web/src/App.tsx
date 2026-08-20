import React, { useState, useEffect } from 'react';
import LandingPage from './views/landing/LandingPage';
import ShipperPortal from './views/shipper-portal/ShipperPortal';
import FinancePortal from './views/financial-dashboard/FinancePortal';
import AdminPortal from './views/admin-console/AdminPortal';
import ForwarderPortal from './views/forwarder-portal/ForwarderPortal';
import CustomsPortal from './views/customs-portal/CustomsPortal';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { ProtectedRoute } from './components/common/ProtectedRoute';



type PortalView = 'selector' | 'shipper' | 'finance' | 'admin' | 'forwarder' | 'customs';

function getPortalFromPath(): PortalView {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (path.startsWith('/shipper')) return 'shipper';
  if (path.startsWith('/finance')) return 'finance';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/forwarder')) return 'forwarder';
  if (path.startsWith('/customs')) return 'customs';
  return 'selector';
}

export default function App() {
  const [portal, setPortalState] = useState<PortalView>(getPortalFromPath);
  const { isLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user && portal === 'selector') {
      const targetMap: Record<string, PortalView> = {
        'SHIPPER': 'shipper',
        'TRANSPORTER': 'finance',
        'FORWARDER': 'forwarder',
        'CUSTOMS_OFFICER': 'customs',
        'ADMIN': 'admin'
      };
      const target = targetMap[user.role];
      if (target) {
        setPortalState(target);
        const paths: Record<PortalView, string> = {
          selector: '/',
          shipper: '/shipper',
          finance: '/finance',
          admin: '/admin',
          forwarder: '/forwarder',
          customs: '/customs',
        };
        window.history.pushState({ portal: target }, '', paths[target]);
      }
    }
  }, [isAuthenticated, user, portal]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  switch (portal) {
    case 'shipper':
      return (
        <ProtectedRoute allowedRoles={['SHIPPER', 'ADMIN']}>
          <ShipperPortal onSwitchPortal={switchToFinance} />
        </ProtectedRoute>
      );
    case 'finance':
      return (
        <ProtectedRoute allowedRoles={['TRANSPORTER', 'ADMIN']}>
          <FinancePortal onSwitchPortal={switchToShipper} />
        </ProtectedRoute>
      );
    case 'admin':
      return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminPortal onSwitchPortal={() => navigateToPortal('selector')} />
        </ProtectedRoute>
      );
    case 'forwarder':
      return (
        <ProtectedRoute allowedRoles={['FORWARDER', 'ADMIN']}>
          <ForwarderPortal onSwitchPortal={() => navigateToPortal('selector')} />
        </ProtectedRoute>
      );
    case 'customs':
      return (
        <ProtectedRoute allowedRoles={['CUSTOMS_OFFICER', 'ADMIN']}>
          <CustomsPortal onSwitchPortal={() => navigateToPortal('selector')} />
        </ProtectedRoute>
      );
    default:
      return (
        // Only show LandingPage if not authenticated on root path
        <LandingPage onSelectPortal={handleSelectPortal} />
      );
  }
}
