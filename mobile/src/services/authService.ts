// TradeFlow Mobile — Supabase & Google Authentication Integration Service
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthUser, UserRole } from '../types/auth';

// Ensure browser session cleans up properly on redirect
WebBrowser.maybeCompleteAuthSession();

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

/**
 * Extracts OAuth access token, code, or error from redirect callback URL
 */
export function parseAuthCallbackUrl(url: string): {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  error?: string;
} {
  try {
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');
    const paramStr =
      hashIndex !== -1
        ? url.substring(hashIndex + 1)
        : queryIndex !== -1
        ? url.substring(queryIndex + 1)
        : '';
    const params = new URLSearchParams(paramStr);
    return {
      accessToken: params.get('access_token') || undefined,
      refreshToken: params.get('refresh_token') || undefined,
      code: params.get('code') || undefined,
      error: params.get('error_description') || params.get('error') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Processes any incoming authentication callback URL and resolves the authenticated user
 */
export async function processAuthRedirectUrl(
  url: string,
  role: UserRole
): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: string;
}> {
  const parsed = parseAuthCallbackUrl(url);

  if (parsed.error) {
    return { success: false, error: parsed.error };
  }

  let token = parsed.accessToken;

  // Handle PKCE code exchange if applicable
  if (!token && parsed.code) {
    try {
      const tokenRes = await fetch(`${ENV.SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ENV.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          auth_code: parsed.code,
        }),
      });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        token = tokenData.access_token;
      }
    } catch {
      // Continue to check if token exists
    }
  }

  if (token) {
    try {
      // Fetch verified user details from Supabase using the access token
      const userRes = await fetch(`${ENV.SUPABASE_URL}/auth/v1/user`, {
        headers: {
          apikey: ENV.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const authUser: AuthUser = {
          id: userData.id,
          email: userData.email,
          fullName:
            userData.user_metadata?.full_name ||
            userData.user_metadata?.name ||
            userData.email?.split('@')[0] ||
            'Google User',
          role,
          phone:
            userData.phone ||
            (role === 'DRIVER' ? userData.email?.replace(/@.*$/, '') : undefined),
          token,
        };
        return { success: true, user: authUser };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch user profile' };
    }
  }

  return {
    success: false,
    error: 'Could not extract authentication session from response.',
  };
}

/**
 * Initiates real Google OAuth sign-in flow via Supabase + Google OAuth 2.0
 */
export async function signInWithGoogle(role: UserRole): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: string;
  cancelled?: boolean;
}> {
  try {
    // Explicit custom scheme redirect for mobile app deep-linking
    const redirectUrl = 'tradeflow://auth/callback';
    const authUrl = `${ENV.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false, cancelled: true };
    }

    if (result.type === 'success' && result.url) {
      const processed = await processAuthRedirectUrl(result.url, role);
      if (processed.success && processed.user) {
        return { success: true, user: processed.user };
      }
      return { success: false, error: processed.error };
    }

    return {
      success: false,
      error: 'Google authentication was not completed. Please try again.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to authenticate with Google.',
    };
  }
}

