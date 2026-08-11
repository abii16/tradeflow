import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/tradeflow';

export const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
