import { AuthService } from '../src/auth/auth.service';
import { db } from '../src/db';
import { users } from '../src/db/schema/users';

// Mock the Database
jest.mock('../src/db', () => ({
  db: {
    insert: jest.fn().mockImplementation(() => ({
      values: jest.fn().mockImplementation((vals: any) => ({
        onConflictDoNothing: jest.fn().mockResolvedValue(true),
        returning: jest.fn().mockResolvedValue([
          {
            id: vals?.id || 'mock-uuid',
            email: vals?.email || 'google_user@example.com',
            fullName: vals?.fullName || 'Google User',
            role: vals?.role || 'SHIPPER',
            isVerified: false,
            verificationStatus: vals?.verificationStatus || 'PENDING'
          }
        ])
      }))
    })),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(true)
      })
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          {
            id: 'mock-uuid',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'FORWARDER',
            isVerified: true
          }
        ])
      })
    })
  }
}));

// Mock the global fetch API to bypass real Supabase
global.fetch = jest.fn() as jest.Mock;

describe('Authentication Flow Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    // Inject mock env variables
    process.env.SUPABASE_URL = 'http://mock-supabase.local';
    process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
    jest.clearAllMocks();
  });

  it('Should successfully register a new user', async () => {
    const mockUserResponse = {
      id: 'mock-uuid',
      email: 'test_forwarder@example.com',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUserResponse })
    });

    const payload = {
      email: 'test_forwarder@example.com',
      password: 'Password123!',
      fullName: 'Test Forwarder',
      phone: '+251911223344',
      role: 'FORWARDER' as const,
      companyName: 'DMT',
      tinNumber: '1234567890',
      tradeLicense: 'MTI/12345'
    };

    const result = await authService.register(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://mock-supabase.local/auth/v1/signup',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'apikey': 'mock-anon-key',
        })
      })
    );

    expect(result.message).toBe('Registration successful');
    expect(result.user.email).toBe('test_forwarder@example.com');
    expect(result.user.role).toBe('FORWARDER');
  });

  it('Should fail registration when Supabase returns an error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ msg: 'User already registered' })
    });

    const payload = {
      email: 'test_forwarder@example.com',
      password: 'Password123!',
      fullName: 'Test Forwarder',
      phone: '+251911223344',
      role: 'FORWARDER' as const,
    };

    await expect(authService.register(payload)).rejects.toThrow('Registration failed');
  });

  it('Should successfully login an existing user', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-uuid',
          email: 'test@example.com'
        }
      })
    });

    const payload = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    const result = await authService.login(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://mock-supabase.local/auth/v1/token?grant_type=password',
      expect.objectContaining({
        method: 'POST'
      })
    );

    expect(result.access_token).toBe('mock-jwt-token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.role).toBe('FORWARDER'); // Matches our db mock
  });

  it('Should fail login with invalid credentials', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'invalid_grant',
        error_description: 'Invalid login credentials'
      })
    });

    const payload = {
      email: 'test@example.com',
      password: 'WrongPassword'
    };

    await expect(authService.login(payload)).rejects.toThrow('Invalid email or password');
  });

  it('Should reject login when Supabase is offline and password is incorrect', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));

    const payload = {
      email: 'test@example.com',
      password: 'IncorrectPassword999'
    };

    await expect(authService.login(payload)).rejects.toThrow('Invalid email or password');
  });

  it('Should allow login when Supabase is offline and password is valid', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));

    const payload = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    const result = await authService.login(payload);
    expect(result.access_token).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });

  it('Should successfully authenticate and link existing user via Google OAuth', async () => {
    const payload = {
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'SHIPPER' as const,
    };

    const result = await authService.authWithGoogle(payload);
    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });

  it('Should successfully auto-provision new user via Google OAuth', async () => {
    // Mock db returning empty for existing user
    (db.select as jest.Mock).mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([])
      })
    });

    const payload = {
      email: 'new_google_user@tradeflow.et',
      fullName: 'Abebe Bikila',
      role: 'TRANSPORTER' as const,
      phone: '+251911223344',
    };

    const result = await authService.authWithGoogle(payload);
    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).toBeDefined();
    expect(result.user.email).toBe('new_google_user@tradeflow.et');
    expect(result.user.role).toBe('TRANSPORTER');
  });

  it('Should successfully rotate refresh tokens via refresh endpoint', async () => {
    const jwt = require('jsonwebtoken');
    const validRefreshToken = jwt.sign(
      { sub: 'mock-uuid', type: 'refresh' },
      process.env.SUPABASE_JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    const result = await authService.refresh({ refreshToken: validRefreshToken });
    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).toBeDefined();
    expect(result.user.id).toBe('mock-uuid');
  });

  it('Should reject token refresh with invalid refresh token', async () => {
    await expect(authService.refresh({ refreshToken: 'invalid-garbage-token' })).rejects.toThrow('Invalid refresh token');
  });

  it('INSA: Should reject weak or easily guessable passwords during registration', async () => {
    const { RegisterDto } = require('../src/auth/dto/auth.dto');
    
    // Test trivial weak password
    const weakPayload = {
      email: 'test_user@tradeflow.et',
      password: 'password123', // missing special char, uppercase, and on weak list
      fullName: 'Test User',
      phone: '+251911223344',
      role: 'SHIPPER',
      companyName: 'Test Corp',
      tinNumber: '1234567890',
      tradeLicense: 'MTI/12345'
    };

    const parseResult = RegisterDto.safeParse(weakPayload);
    expect(parseResult.success).toBe(false);
  });

  it('INSA: Should prevent brute-force attacks by locking account after 5 consecutive failed attempts', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network offline'));
    const targetEmail = 'bruteforce_target@tradeflow.et';

    // Mock DB returns user with password
    for (let i = 0; i < 4; i++) {
      await expect(
        authService.login({ email: targetEmail, password: 'WrongPassword' + i })
      ).rejects.toThrow('Invalid email or password');
    }

    // 5th attempt should trigger account lockout
    await expect(
      authService.login({ email: targetEmail, password: 'WrongPassword5' })
    ).rejects.toThrow(/temporarily locked/i);
  });
});


