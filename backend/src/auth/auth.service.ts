import { RegisterRequestType, LoginRequestType } from './dto/auth.dto';
import { db } from '../db';
import { users } from '../db/schema/users';
import { eq } from 'drizzle-orm';

export class AuthService {
  private get supabaseUrl() { return process.env.SUPABASE_URL; }
  private get supabaseAnonKey() { return process.env.SUPABASE_ANON_KEY; }

  /**
   * Registers a new user via Supabase Auth REST API.
   * Supabase trigger handles insertion into public.users.
   */
  async register(data: RegisterRequestType) {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseAnonKey,
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        data: {
          full_name: data.fullName,
          phone: data.phone,
          role: data.role,
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Account enumeration protection: log the actual error, but throw a generic one or mask it
      console.error('Supabase signup error:', result.msg || result);
      throw new Error('Registration failed');
    }

    // Optionally handle profile creation here if it's not handled by another trigger
    // e.g., if data.role === 'DRIVER', insert into driver_profiles via raw query or another service

    const userObj = result.user || result;

    // Manually insert user into our public.users table since the Supabase trigger might not exist
    try {
      await db.insert(users).values({
        id: userObj.id,
        email: userObj.email,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        companyName: data.companyName,
        tinNumber: data.tinNumber,
        tradeLicense: data.tradeLicense,
        badgeId: data.badgeId,
      }).onConflictDoNothing(); // Prevent error if a trigger actually does exist
    } catch (dbErr) {
      console.error('Failed to insert user into public.users:', dbErr);
    }

    return {
      message: 'Registration successful',
      user: {
        id: userObj.id,
        email: userObj.email,
        role: data.role
      }
    };
  }

  /**
   * Logs in a user via Supabase Auth REST API.
   */
  async login(data: LoginRequestType) {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseAnonKey,
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Login failed for email: ${data.email}. Supabase error:`, result);
      if (result.error_description === 'Email not confirmed' || result.msg === 'Email not confirmed') {
        throw new Error('Email not confirmed. Please check your inbox and verify your email.');
      }
      throw new Error('Invalid email or password');
    }

    // Optionally fetch extra details from public.users
    const [user] = await db.select().from(users).where(eq(users.id, result.user.id));

    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: user ? {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified
      } : {
        id: result.user.id,
        email: result.user.email,
      }
    };
  }
}
