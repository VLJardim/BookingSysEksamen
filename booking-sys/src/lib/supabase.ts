// app/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Provide a factory to create the browser Supabase client at runtime.
// Creating the client lazily avoids failures during server build where
// NEXT_PUBLIC_* env vars may not be populated.
let browserClient: any = null;
export function getBrowserSupabase() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Public Supabase env vars are not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });

  return browserClient;
}

export default getBrowserSupabase;