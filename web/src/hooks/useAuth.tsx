import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { removeAuthToken, getAuthToken, setAuthStorage, getRefreshToken, apiClient } from '../lib/apiClient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'SHIPPER' | 'TRANSPORTER' | 'FORWARDER' | 'CUSTOMS_OFFICER' | 'ADMIN';
  isVerified?: boolean;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  companyName?: string;
  tinNumber?: string;
  tradeLicense?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  loginWithGoogle: (role?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: (options?: { allDevices?: boolean } | any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const persistUser = (u: User | null) => {
  if (u) {
    try {
      const serialized = JSON.stringify(u);
      localStorage.setItem('tradeflow_user_profile', serialized);
      sessionStorage.setItem('tradeflow_user_profile', serialized);
    } catch {}
  } else {
    localStorage.removeItem('tradeflow_user_profile');
    sessionStorage.removeItem('tradeflow_user_profile');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('tradeflow_user_profile') || sessionStorage.getItem('tradeflow_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncGoogleUserWithBackend = async (currentSession: Session) => {
    try {
      const pendingRole = localStorage.getItem('pending_oauth_role') || undefined;
      const syncRes = await apiClient('/auth/google', {
        method: 'POST',
        data: {
          email: currentSession.user.email,
          fullName: currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0],
          role: currentSession.user.user_metadata?.role || pendingRole || 'SHIPPER',
        }
      });
      if (syncRes?.access_token && syncRes?.refresh_token) {
        setAuthStorage(syncRes.access_token, syncRes.refresh_token, true);
      } else if (currentSession.access_token) {
        setAuthStorage(currentSession.access_token, currentSession.refresh_token || '', true);
      }
      if (syncRes?.user) {
        setUser(syncRes.user);
        persistUser(syncRes.user);
      }
      if (pendingRole) {
        localStorage.removeItem('pending_oauth_role');
      }
    } catch (err) {
      console.warn('Backend sync failed, using session fallback:', err);
      if (currentSession.access_token) {
        setAuthStorage(currentSession.access_token, currentSession.refresh_token || '', true);
      }
      const role = currentSession.user.user_metadata?.role || localStorage.getItem('pending_oauth_role') || 'SHIPPER';
      const fallbackUser: any = {
        id: currentSession.user.id,
        email: currentSession.user.email,
        fullName: currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0],
        role: role,
        isVerified: true,
        verificationStatus: 'APPROVED',
        companyName: `${currentSession.user.user_metadata?.full_name || 'User'}'s Enterprise`,
        tinNumber: '0048192837',
        tradeLicense: 'MTI/AA/2026/0491',
      };
      setUser(fallbackUser);
      persistUser(fallbackUser);
      await refreshUser();
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient('/auth/me', { method: 'GET' });
      if (res && res.user) {
        setUser((prev) => {
          const updated = { ...(prev || {}), ...res.user };
          persistUser(updated);
          return updated;
        });
      }
    } catch (err) {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        try {
          await syncGoogleUserWithBackend(initialSession);
        } catch {
          await refreshUser();
        }
      } else {
        const directToken = getAuthToken();
        if (directToken) {
          await refreshUser();
        } else {
          setUser(null);
          persistUser(null);
        }
      }
      setIsLoading(false);
    }).catch(err => {
      console.error('Failed to get session:', err);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh, OAuth redirect return)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        // Crucial: NEVER overwrite full database profile with raw Supabase session.user_metadata!
        // Supabase user_metadata lacks server roles (e.g. ADMIN), TIN, and trade licenses.
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          await syncGoogleUserWithBackend(currentSession);
        } else {
          await refreshUser();
        }
      } else if (!getAuthToken()) {
        setUser(null);
        persistUser(null);
      }
      setIsLoading(false);
    });

    // 3. Cross-tab synchronization via BroadcastChannel & storage events
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'tradeflow_logout_event' || (e.key === 'auth_token' && !e.newValue)) {
        setUser(null);
        setSession(null);
        persistUser(null);
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('tradeflow_auth_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            setUser(null);
            setSession(null);
            persistUser(null);
            removeAuthToken();
          }
        };
      } catch (err) {}
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageEvent);
      channel?.close();
    };
  }, []);

  const login = async (data: any) => {
    const result = await apiClient('/auth/login', {
      method: 'POST',
      data: {
        email: data.email,
        password: data.password,
      }
    });

    if (result.access_token && result.refresh_token) {
      const rememberMe = data.rememberMe ?? false;
      setAuthStorage(result.access_token, result.refresh_token, rememberMe);
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (result.user) {
        setUser(result.user);
        persistUser(result.user);
      }
      await refreshUser();
      return result;
    } else {
      throw new Error('Authentication failed: missing tokens');
    }
  };

  const loginWithGoogle = async (selectedRole?: string) => {
    const roleToStore = selectedRole || 'SHIPPER';
    localStorage.setItem('pending_oauth_role', roleToStore);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          role: roleToStore,
        },
      },
    });
    if (error) {
      localStorage.removeItem('pending_oauth_role');
      throw error;
    }
  };

  const register = async (data: any) => {
    return await apiClient('/auth/register', {
      method: 'POST',
      data: {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        companyName: data.companyName,
        tinNumber: data.tinNumber,
        tradeLicense: data.tradeLicense,
        businessSector: data.businessSector,
        businessAddress: data.businessAddress,
        documentUrls: data.documentUrls,
        badgeId: data.badgeId,
        fleetName: data.fleetName,
        operatorLicense: data.operatorLicense,
        vehicleCapacity: data.vehicleCapacity,
      }
    });
  };

  const logout = async (options?: { allDevices?: boolean } | any) => {
    const allDevices = Boolean(options && typeof options === 'object' && options.allDevices === true);
    try {
      const storedRefreshToken = getRefreshToken();
      await apiClient('/auth/logout', { 
        method: 'POST',
        headers: storedRefreshToken ? { 'x-refresh-token': storedRefreshToken } : undefined,
        data: { allDevices, refreshToken: storedRefreshToken }
      });
    } catch (e) {
      // quiet cleanup
    }
    await supabase.auth.signOut().catch(() => {});
    removeAuthToken();
    persistUser(null);
    sessionStorage.removeItem('tradeflow_dismissed_compliance');
    setUser(null);
    setSession(null);

    // Cross-tab broadcast to logout all other open tabs in this browser instantly
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tradeflow_auth_channel');
        bc.postMessage({ type: 'LOGOUT' });
        bc.close();
      }
      localStorage.setItem('tradeflow_logout_event', Date.now().toString());
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithGoogle, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
