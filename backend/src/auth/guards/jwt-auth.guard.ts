import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { users } from '../../db/schema/users';
import { eq } from 'drizzle-orm';

export const JwtAuthGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.SUPABASE_JWT_SECRET;
    
    if (!secret) {
      console.error('SUPABASE_JWT_SECRET is missing in environment variables');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Verify JWT with Supabase secret
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    
    if (!decoded || !decoded.sub) {
      res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
      return;
    }

    // Retrieve user from public.users table using the 'sub' (User ID) from Supabase JWT
    const [user] = await db.select().from(users).where(eq(users.id, decoded.sub));

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      isVerified: user.isVerified
    };

    next();
  } catch (error) {
    // Return generic error as requested
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
