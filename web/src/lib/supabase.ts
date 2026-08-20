import { createClient } from '@supabase/supabase-js';

// VITE_ prefix is required for Vite to expose env variables to the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing from environment variables');
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321', // Fallback for dev if not set
  supabaseAnonKey || 'dummy_key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);
