import { AuthService } from '../src/auth/auth.service';
import { db } from '../src/db';
import { users } from '../src/db/schema/users';

// Mock the Database
jest.mock('../src/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoNothing: jest.fn().mockResolvedValue(true)
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
});
