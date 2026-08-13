import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import rateLimit from 'express-rate-limit';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { VerificationGuard } from './guards/verification.guard';
import { z } from 'zod';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();
const authService = new AuthService();

// Rate Limiting: 5 requests per minute
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
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

router.get('/me', JwtAuthGuard, VerificationGuard, (req: Request, res: Response) => {
  // @CurrentUser() decorator equivalent in Express: using req.user
  res.status(200).json({ user: req.user });
});

router.get('/admin-only', JwtAuthGuard, RolesGuard(['SYSTEM_ADMIN', 'FINANCE_ADMIN']), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the admin area!', user: req.user });
});

export const AuthController = router;
