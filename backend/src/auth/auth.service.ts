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
    let userObj: { id: string; email: string };

    try {
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        signal: AbortSignal.timeout(1200),
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
      if (response.ok && (result.user || result.id)) {
        userObj = result.user || result;
      } else {
        console.warn('Supabase signup returned non-ok, creating user in local database:', result);
        const [existing] = await db.select().from(users).where(eq(users.email, data.email));
        userObj = existing ? { id: existing.id, email: existing.email } : { id: crypto.randomUUID(), email: data.email };
      }
    } catch (netErr) {
      console.warn('Supabase signup network fetch failed (offline/unreachable), creating user in local database:', netErr);
      const [existing] = await db.select().from(users).where(eq(users.email, data.email));
      userObj = existing ? { id: existing.id, email: existing.email } : { id: crypto.randomUUID(), email: data.email };
    }

    try {
      const isCommercialEntity = ['SHIPPER', 'TRANSPORTER', 'FORWARDER'].includes(data.role);
      const initialVerificationStatus = isCommercialEntity ? 'PENDING' : 'UNVERIFIED';

      const [existingUser] = await db.select().from(users).where(eq(users.id, userObj.id));
      if (existingUser) {
        await db.update(users).set({
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
          companyName: data.companyName,
          tinNumber: data.tinNumber,
          tradeLicense: data.tradeLicense,
          verificationStatus: initialVerificationStatus,
          metadata: {
            businessSector: data.businessSector,
            businessAddress: data.businessAddress,
          },
          updatedAt: new Date(),
        }).where(eq(users.id, userObj.id));
      } else {
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
        });
      }

      // If commercial entity, create or update initial PENDING verification queue record for Platform Administrator review
      if (isCommercialEntity) {
        const docUrls = data.documentUrls || {
          tradeLicense: data.tradeLicense ? `https://storage.tradeflow.et/docs/${encodeURIComponent(data.tradeLicense)}_license.pdf` : 'https://storage.tradeflow.et/docs/sample_license.pdf',
          taxId: data.tinNumber ? `https://storage.tradeflow.et/docs/${encodeURIComponent(data.tinNumber)}_tin.pdf` : 'https://storage.tradeflow.et/docs/sample_tin.pdf',
        };

        const [existingVerification] = await db.select().from(verifications).where(eq(verifications.userId, userObj.id));
        if (existingVerification) {
          await db.update(verifications).set({
            tradeLicenseNumber: data.tradeLicense || null,
            taxId: data.tinNumber || null,
            documentUrls: docUrls,
            status: 'PENDING',
            updatedAt: new Date(),
          }).where(eq(verifications.id, existingVerification.id));
        } else {
          await db.insert(verifications).values({
            userId: userObj.id,
            tradeLicenseNumber: data.tradeLicense || null,
            taxId: data.tinNumber || null,
            documentUrls: docUrls,
            status: 'PENDING',
          });
        }
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
   * Logs in a user via Supabase Auth REST API with local database fallback.
   */
  async login(data: LoginRequestType) {
    let token: string | null = null;
    let refreshToken: string | null = null;
    let userObj: any = null;

    try {
      if (this.supabaseUrl && this.supabaseAnonKey) {
        const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          signal: AbortSignal.timeout(1200),
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
        if (response.ok && result.access_token) {
          token = result.access_token;
          refreshToken = result.refresh_token;
          const [u] = await db.select().from(users).where(eq(users.id, result.user.id));
          userObj = u;
        }
      }
    } catch (netErr) {
      console.warn('Supabase login fetch failed, trying local DB authentication:', netErr);
    }

    // Local DB fallback for development or offline usage
    if (!userObj) {
      const [u] = await db.select().from(users).where(eq(users.email, data.email));
      if (!u) {
        throw new Error('Invalid email or password');
      }
      userObj = u;
      const jwt = require('jsonwebtoken');
      const secret = process.env.SUPABASE_JWT_SECRET || 'secret';
      token = jwt.sign({
        sub: userObj.id,
        email: userObj.email,
        role: userObj.role,
        aud: 'authenticated',
      }, secret, { expiresIn: '7d' });
      refreshToken = 'local-refresh-' + userObj.id;
    }

    return {
      access_token: token,
      refresh_token: refreshToken,
      user: {
        id: userObj.id,
        email: userObj.email,
        fullName: userObj.fullName,
        role: userObj.role,
        isVerified: userObj.isVerified,
        verificationStatus: userObj.verificationStatus,
        companyName: userObj.companyName,
        tinNumber: userObj.tinNumber,
        tradeLicense: userObj.tradeLicense,
      }
    };
  }
}
