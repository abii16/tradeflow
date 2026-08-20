import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/views/landing/LandingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'SHIPPER' | 'TRANSPORTER' | 'FORWARDER' | 'CUSTOMS_OFFICER' | 'ADMIN'>;
}

export const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  SHIPPER: '/shipper',
  TRANSPORTER: '/finance',
  FORWARDER: '/forwarder',
  CUSTOMS_OFFICER: '/customs',
  ADMIN: '/admin'
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
    return <LandingPage onSelectPortal={(portal) => {
        const paths: Record<string, string> = {
            shipper: '/shipper',
            finance: '/finance',
            admin: '/admin',
            forwarder: '/forwarder',
            customs: '/customs',
        };
        window.history.pushState({ portal }, '', paths[portal]);
        window.dispatchEvent(new Event('popstate'));
    }} />;
  }

  if (!allowedRoles.includes(user.role as any)) {
    const defaultRoute = ROLE_DEFAULT_ROUTES[user.role] || '/';
    if (window.location.pathname !== defaultRoute) {
      window.history.replaceState(null, '', defaultRoute);
      window.dispatchEvent(new Event('popstate'));
    }
    return null;
  }

  return <>{children}</>;
};
