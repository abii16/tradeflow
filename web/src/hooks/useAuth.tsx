import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { removeAuthToken, getAuthToken, setAuthStorage, getRefreshToken, apiClient } from '../lib/apiClient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'SHIPPER' | 'TRANSPORTER' | 'FORWARDER' | 'CUSTOMS_OFFICER' | 'ADMIN';
  isVerified?: boolean;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  companyName?: string;
  tinNumber?: string;
  tradeLicense?: string;
  fleetName?: string;
  vehicleCapacity?: string;
  metadata?: any;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  loginWithGoogle: (role?: string, intent?: 'login' | 'signup') => Promise<void>;
  register: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<any>;
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

let syncPromise: Promise<void> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const isRegistrationBlocked = sessionStorage.getItem('tradeflow_registration_blocked') === 'true' ||
                                    localStorage.getItem('tradeflow_registration_blocked') === 'true';
      const isOauthReturn = window.location.hash.includes('access_token') || 
                            window.location.search.includes('oauth_intent') ||
                            sessionStorage.getItem('tradeflow_auth_banner_error') !== null;
      if (isOauthReturn || isRegistrationBlocked) {
        return null;
      }
      const stored = localStorage.getItem('tradeflow_user_profile') || sessionStorage.getItem('tradeflow_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncGoogleUserWithBackend = async (currentSession: Session) => {
    const isRegistrationBlocked = sessionStorage.getItem('tradeflow_registration_blocked') === 'true' ||
                                  localStorage.getItem('tradeflow_registration_blocked') === 'true';
    if (isRegistrationBlocked) {
      setUser(null);
      persistUser(null);
      setSession(null);
      return;
    }

    if (syncPromise) {
      return syncPromise;
    }

    syncPromise = (async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlIntent = urlParams.get('oauth_intent') as 'login' | 'signup' | null;
      const urlRole = urlParams.get('oauth_role');

      const pendingRole = urlRole || localStorage.getItem('pending_oauth_role') || undefined;
      const pendingIntent = urlIntent || (localStorage.getItem('pending_oauth_intent') as 'login' | 'signup') || 'login';

      try {
        const syncRes = await apiClient('/auth/google', {
          method: 'POST',
          data: {
            email: currentSession.user.email,
            fullName: currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0],
            role: currentSession.user.user_metadata?.role || pendingRole || 'SHIPPER',
            intent: pendingIntent,
          }
        });

        if (pendingRole) {
          localStorage.removeItem('pending_oauth_role');
        }
        localStorage.removeItem('pending_oauth_intent');

        // Clean up URL parameters after successful processing
        if (window.location.search.includes('oauth_intent')) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        if (syncRes?.access_token && syncRes?.refresh_token) {
          setAuthStorage(syncRes.access_token, syncRes.refresh_token, true);
        } else if (currentSession.access_token) {
          setAuthStorage(currentSession.access_token, currentSession.refresh_token || '', true);
        }
        if (syncRes?.user) {
          setUser(syncRes.user);
          persistUser(syncRes.user);
        }
      } catch (err: any) {
        if (pendingRole) {
          localStorage.removeItem('pending_oauth_role');
        }
        localStorage.removeItem('pending_oauth_intent');

        const rawMsg = err?.message || err?.error || '';
        const isAlreadyRegistered = rawMsg.toLowerCase().includes('already registered');

        if (isAlreadyRegistered || pendingIntent === 'signup') {
          // Immediately set blocking flags FIRST before any async actions
          const alertMsg = rawMsg || `Registration failed: An account with this Google email (${currentSession.user.email}) is already registered. Please sign in instead.`;
          sessionStorage.setItem('tradeflow_auth_banner_error', alertMsg);
          sessionStorage.setItem('tradeflow_registration_blocked', 'true');
          localStorage.setItem('tradeflow_registration_blocked', 'true');

          // Strip URL hash and search params
          window.history.replaceState(null, '', window.location.pathname);

          // Purge session, tokens, and storage
          removeAuthToken();
          setUser(null);
          persistUser(null);
          setSession(null);

          try {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith('sb-') || key.includes('supabase')) {
                localStorage.removeItem(key);
              }
            });
            Object.keys(sessionStorage).forEach((key) => {
              if (key.startsWith('sb-') || key.includes('supabase')) {
                sessionStorage.removeItem(key);
              }
            });
          } catch {}

          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          await supabase.auth.signOut().catch(() => {});

          window.dispatchEvent(new CustomEvent('tradeflow_auth_error', { detail: alertMsg }));
          return;
        }

        // For regular login failures: DO NOT invent a fake fallback user!
        console.warn('Backend sync failed:', err);
        removeAuthToken();
        setUser(null);
        persistUser(null);
        setSession(null);
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      } finally {
        syncPromise = null;
      }
    })();

    return syncPromise;
  };

  const refreshUser = async () => {
    const isRegistrationBlocked = sessionStorage.getItem('tradeflow_registration_blocked') === 'true' ||
                                  localStorage.getItem('tradeflow_registration_blocked') === 'true';
    if (isRegistrationBlocked) {
      setUser(null);
      persistUser(null);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setUser(null);
      persistUser(null);
      return;
    }
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
      const isRegistrationBlocked = sessionStorage.getItem('tradeflow_registration_blocked') === 'true' ||
                                    localStorage.getItem('tradeflow_registration_blocked') === 'true';
      if (isRegistrationBlocked) {
        setUser(null);
        persistUser(null);
        setSession(null);
        setIsLoading(false);
        return;
      }

      setSession(initialSession);
      if (initialSession) {
        try {
          await syncGoogleUserWithBackend(initialSession);
        } catch {
          if (getAuthToken()) {
            await refreshUser();
          }
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
      const isRegistrationBlocked = sessionStorage.getItem('tradeflow_registration_blocked') === 'true' ||
                                    localStorage.getItem('tradeflow_registration_blocked') === 'true';
      if (isRegistrationBlocked) {
        setUser(null);
        persistUser(null);
        setSession(null);
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      if (currentSession) {
        // Crucial: NEVER overwrite full database profile with raw Supabase session.user_metadata!
        // Supabase user_metadata lacks server roles (e.g. ADMIN), TIN, and trade licenses.
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          await syncGoogleUserWithBackend(currentSession);
        } else if (getAuthToken()) {
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
    sessionStorage.removeItem('tradeflow_registration_blocked');
    localStorage.removeItem('tradeflow_registration_blocked');
    sessionStorage.removeItem('tradeflow_auth_banner_error');

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

  const loginWithGoogle = async (selectedRole?: string, intent: 'login' | 'signup' = 'login') => {
    const roleToStore = selectedRole || 'SHIPPER';
    localStorage.setItem('pending_oauth_role', roleToStore);
    localStorage.setItem('pending_oauth_intent', intent);

    sessionStorage.removeItem('tradeflow_registration_blocked');
    localStorage.removeItem('tradeflow_registration_blocked');
    sessionStorage.removeItem('tradeflow_auth_banner_error');

    if (intent === 'signup') {
      removeAuthToken();
      persistUser(null);
      setUser(null);
      setSession(null);
      await supabase.auth.signOut().catch(() => {});
    }

    const redirectUrl = `${window.location.origin}/?oauth_intent=${intent}&oauth_role=${roleToStore}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          role: roleToStore,
        },
      },
    });
    if (error) {
      localStorage.removeItem('pending_oauth_role');
      localStorage.removeItem('pending_oauth_intent');
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

  const updateProfile = async (data: any) => {
    const res = await apiClient('/auth/profile', {
      method: 'PATCH',
      data,
    });
    if (res && res.user) {
      setUser((prev) => {
        const merged = { ...(prev || {}), ...res.user };
        persistUser(merged);
        return merged;
      });
      return res.user;
    }
    await refreshUser();
    return res;
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithGoogle, register, updateProfile, refreshUser, logout }}>
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
