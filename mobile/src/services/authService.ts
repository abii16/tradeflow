// TradeFlow Mobile — Supabase & Google Authentication Integration Service
import { AuthUser, UserRole } from '../types/auth';

export const ENV = {
  SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://vkcxehsktunbotfjdtqi.supabase.co',
  SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrY3hlaHNrdHVuYm90ZmpkdHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzQ2MTgsImV4cCI6MjEwMTk1MDYxOH0.zseFOpsI_xToolhXUeg9S7P3DFFtX3f-xPrZHuG5ZD8',
  GOOGLE_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    '1035914529845-2era30kqp85erenh6v96lj81t52fncrv.apps.googleusercontent.com',
  BACKEND_PORT: process.env.EXPO_PUBLIC_PORT || process.env.PORT || '4001',
};

interface SupabaseAuthResponse {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
  isOffline?: boolean;
}

/**
 * Sign In with Supabase Auth REST API (Phone-as-Email or Real Email)
 */
export async function signInWithSupabase(
  identityEmail: string,
  passwordAttempt: string
): Promise<SupabaseAuthResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${ENV.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: ENV.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: identityEmail,
        password: passwordAttempt,
      }),
    });

    clearTimeout(timeoutId);
    const result = await response.json();

    if (response.ok && result.access_token) {
      return {
        success: true,
        user: result.user,
        token: result.access_token,
      };
    } else {
      return {
        success: false,
        error: result.error_description || result.msg || result.message || 'Invalid credentials',
      };
    }
  } catch (err: any) {
    // Network error or timeout: enable offline SQLite fallback
    return {
      success: false,
      isOffline: true,
      error: 'Network unreachable or offline. Falling back to local offline session.',
    };
  }
}

/**
 * Register with Supabase Auth REST API
 */
export async function signUpWithSupabase(
  identityEmail: string,
  passwordAttempt: string,
  userMetadata: Record<string, any>
): Promise<SupabaseAuthResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${ENV.SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: ENV.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: identityEmail,
        password: passwordAttempt,
        data: userMetadata,
      }),
    });

    clearTimeout(timeoutId);
    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        user: result.user || result,
        token: result.access_token,
      };
    } else {
      return {
        success: false,
        error: result.msg || result.message || 'Registration failed',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      isOffline: true,
      error: 'Network unreachable or offline. Proceeding with local offline registration.',
    };
  }
}
