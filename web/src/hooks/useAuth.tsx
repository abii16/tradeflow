import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, setAuthToken, removeAuthToken, getAuthToken } from '../lib/apiClient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'SHIPPER' | 'TRANSPORTER' | 'DRIVER' | 'CUSTOMS_BROKER' | 'FINANCE_ADMIN' | 'SYSTEM_ADMIN';
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await apiClient<{ user: User }>('/auth/me');
          setUser(res.user);
        } catch (error) {
          console.error('Failed to restore session:', error);
          removeAuthToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for unauthorized events from apiClient
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (data: any) => {
    const res = await apiClient<{ token: string; user: User }>('/auth/login', { data });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    // Optionally automatically login after register, depending on backend behavior.
    // If backend returns a token on register:
    const res = await apiClient<{ token: string; user: User }>('/auth/register', { data });
    if (res.token) {
      setAuthToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
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
