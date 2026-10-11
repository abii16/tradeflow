import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { removeAuthToken, apiClient } from '../lib/apiClient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'SHIPPER' | 'TRANSPORTER' | 'FORWARDER' | 'CUSTOMS_OFFICER' | 'ADMIN';
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user?.user_metadata as User || null);
      setIsLoading(false);
    }).catch(err => {
      console.error('Failed to get session:', err);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user?.user_metadata as User || null);
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
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
    } else {
      throw new Error('Authentication failed: missing tokens');
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const register = async (data: any) => {
    await apiClient('/auth/register', {
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
        badgeId: data.badgeId,
        fleetName: data.fleetName,
        operatorLicense: data.operatorLicense,
        vehicleCapacity: data.vehicleCapacity,
      }
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    removeAuthToken(); // Cleanup any legacy token usage in apiClient
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithGoogle, register, logout }}>
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
