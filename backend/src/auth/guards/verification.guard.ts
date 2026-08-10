import { Request, Response, NextFunction } from 'express';

/**
 * VerificationGuard ensures the authenticated user is verified.
 * Must be used after JwtAuthGuard.
 * Based on schema, maps isVerified=false to PENDING/SUSPENDED state.
 */
export const VerificationGuard = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({ error: 'Forbidden: Account is pending verification or suspended' });
    return;
  }

  next();
};
