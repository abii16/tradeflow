import { RegisterRequestType, LoginRequestType } from './dto/auth.dto';
import { db } from '../db';
import { users } from '../db/schema/users';
import { verifications } from '../db/schema/verifications';
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
          company_name: data.companyName,
          tin_number: data.tinNumber,
          trade_license: data.tradeLicense,
          badge_id: data.badgeId,
          fleet_name: data.fleetName,
          operator_license: data.operatorLicense,
          vehicle_capacity: data.vehicleCapacity,
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Account enumeration protection: log the actual error, but throw a generic one or mask it
      console.error('Supabase signup error:', result.msg || result);
      throw new Error('Registration failed');
    }

    const userObj = result.user || result;

    // Fallback for local development where Supabase Auth is cloud-hosted but DB is local.
    // In production, the Supabase Postgres trigger handles this automatically.
    try {
      const isCommercialEntity = ['SHIPPER', 'TRANSPORTER', 'FORWARDER'].includes(data.role);
      const initialVerificationStatus = isCommercialEntity ? 'PENDING' : 'UNVERIFIED';

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
        fleetName: data.fleetName,
        operatorLicense: data.operatorLicense,
        vehicleCapacity: data.vehicleCapacity,
        isVerified: false,
        verificationStatus: initialVerificationStatus,
        metadata: {
          businessSector: data.businessSector,
          businessAddress: data.businessAddress,
        },
      }).onConflictDoNothing();

      // If commercial entity, create initial PENDING verification queue record for Platform Administrator review
      if (isCommercialEntity) {
        const docUrls = data.documentUrls || {
          tradeLicense: data.tradeLicense ? `https://storage.tradeflow.et/docs/${encodeURIComponent(data.tradeLicense)}_license.pdf` : 'https://storage.tradeflow.et/docs/sample_license.pdf',
          taxId: data.tinNumber ? `https://storage.tradeflow.et/docs/${encodeURIComponent(data.tinNumber)}_tin.pdf` : 'https://storage.tradeflow.et/docs/sample_tin.pdf',
        };

        await db.insert(verifications).values({
          userId: userObj.id,
          tradeLicenseNumber: data.tradeLicense || null,
          taxId: data.tinNumber || null,
          documentUrls: docUrls,
          status: 'PENDING',
        });
      }
    } catch (dbErr) {
      console.error('Failed to insert user or verification record:', dbErr);
    }

    return {
      message: 'Registration successful',
      user: {
        id: userObj.id,
        email: userObj.email,
        role: data.role,
        verificationStatus: ['SHIPPER', 'TRANSPORTER', 'FORWARDER'].includes(data.role) ? 'PENDING' : 'UNVERIFIED',
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
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        companyName: user.companyName,
        tinNumber: user.tinNumber,
        tradeLicense: user.tradeLicense,
      } : {
        id: result.user.id,
        email: result.user.email,
      }
    };
  }
}
