import { Request, Response, NextFunction } from 'express';

/**
 * RolesGuard ensures the authenticated user has one of the specified roles.
 * Must be used after JwtAuthGuard.
 */
export const RolesGuard = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
      return;
    }

    next();
  };
};
