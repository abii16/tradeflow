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
      // Clean Security Logging & Enumeration Protection
      // We don't expose if it was email or password that was wrong
      console.error(`Login failed for email: ${data.email}`);
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
