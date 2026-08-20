import { Request, Response, NextFunction } from 'express';
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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('SUPABASE_URL or SUPABASE_ANON_KEY is missing');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Verify JWT with Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData || !authData.user) {
      console.error('Supabase getUser error:', authError);
      res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
      return;
    }

    // Retrieve user from public.users table using the ID from Supabase
    const [user] = await db.select().from(users).where(eq(users.id, authData.user.id));

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
    console.error('JwtAuthGuard error:', error);
    // Return generic error as requested
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
