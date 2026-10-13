import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, GoogleAuthDto, RefreshTokenDto } from './dto/auth.dto';
import rateLimit from 'express-rate-limit';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { VerificationGuard } from './guards/verification.guard';
import { z } from 'zod';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();
const authService = new AuthService();

// Strict Rate Limiting for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, auditMiddleware('SECURITY_AUTH_REGISTER'), async (req: Request, res: Response) => {
  try {
    const validatedData = RegisterDto.parse(req.body);
    const result = await authService.register(validatedData);
    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  }
});

router.post('/login', authLimiter, auditMiddleware('SECURITY_AUTH_LOGIN'), async (req: Request, res: Response) => {
  try {
    const validatedData = LoginDto.parse(req.body);
    const result = await authService.login(validatedData);
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(401).json({ error: error.message || 'Login failed' });
    }
  }
});

/**
 * Google OAuth 2.0 social login & auto-provisioning per Issue #48
 */
router.post('/google', authLimiter, auditMiddleware('SECURITY_AUTH_GOOGLE'), async (req: Request, res: Response) => {
  try {
    const validatedData = GoogleAuthDto.parse(req.body);
    const result = await authService.authWithGoogle(validatedData);
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(401).json({ error: error.message || 'Google authentication failed' });
    }
  }
});

router.post('/google/callback', authLimiter, auditMiddleware('SECURITY_AUTH_GOOGLE_CALLBACK'), async (req: Request, res: Response) => {
  try {
    const validatedData = GoogleAuthDto.parse(req.body);
    const result = await authService.authWithGoogle(validatedData);
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(401).json({ error: error.message || 'Google callback failed' });
    }
  }
});

/**
 * Refresh Token rotation per SRS 5.4 / Issue #47
 */
router.post('/refresh', authLimiter, async (req: Request, res: Response) => {
  try {
    const validatedData = RefreshTokenDto.parse(req.body);
    const result = await authService.refresh(validatedData);
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(401).json({ error: error.message || 'Invalid refresh token' });
    }
  }
});

/**
 * Session invalidation / logout per Issue #47
 */
router.post('/logout', JwtAuthGuard, async (req: Request, res: Response) => {
  try {
    const result = await authService.logout(req.user?.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', JwtAuthGuard, (req: Request, res: Response) => {
  // @CurrentUser() decorator equivalent in Express: using req.user
  res.status(200).json({ user: req.user });
});

router.get('/admin-only', JwtAuthGuard, RolesGuard(['SYSTEM_ADMIN', 'FINANCE_ADMIN']), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the admin area!', user: req.user });
});

export const AuthController = router;

