import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { removeAuthToken, getAuthToken, apiClient } from '../lib/apiClient';

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
      if (syncRes?.user) {
        setUser(syncRes.user);
      }
      if (pendingRole) {
        localStorage.removeItem('pending_oauth_role');
      }
    } catch (err) {
      // If sync fails, fall back to /auth/me or session metadata
      await refreshUser();
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient('/auth/me', { method: 'GET' });
      if (res && res.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
      }
    } catch (err) {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        try {
          await syncGoogleUserWithBackend(session);
        } catch {
          await refreshUser();
        }
      } else {
        const directToken = getAuthToken();
        if (directToken) {
          await refreshUser();
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    }).catch(err => {
      console.error('Failed to get session:', err);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh, OAuth redirect return)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        // Preserve current full user profile if already loaded so window focus does NOT flash partial metadata
        setUser((prev) => {
          if (prev && prev.email === session.user?.email && prev.role) {
            return prev;
          }
          return (session.user?.user_metadata as User) || prev || null;
        });

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          await syncGoogleUserWithBackend(session);
        } else {
          await refreshUser();
        }
      } else if (!getAuthToken()) {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
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
      localStorage.setItem('tradeflow_token', result.access_token);
      localStorage.setItem('tradeflow_refresh_token', result.refresh_token);
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (result.user) {
        setUser((prev) => ({ ...prev, ...result.user }));
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

  const logout = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('tradeflow_refresh_token');
      await apiClient('/auth/logout', { 
        method: 'POST',
        headers: storedRefreshToken ? { 'x-refresh-token': storedRefreshToken } : undefined
      });
    } catch (e) {
      // quiet cleanup
    }
    await supabase.auth.signOut();
    removeAuthToken(); // Cleanup any legacy token usage in apiClient
    localStorage.removeItem('tradeflow_refresh_token');
    setUser(null);
    setSession(null);
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
