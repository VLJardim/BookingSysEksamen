import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client that only *requires* the public anon key + URL.
// If a SERVICE_ROLE key is present, we'll use it, but it's completely optional
// so the app can run with just NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
export function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.warn('SUPABASE URL is not set (NEXT_PUBLIC_SUPABASE_URL)');
  }

  // Prefer service role if it exists, otherwise fall back to anon key.
  const keyToUse = supabaseServiceRoleKey || supabaseAnonKey;

  if (!keyToUse) {
    throw new Error(
      'No Supabase key found. Set NEXT_PUBLIC_SUPABASE_ANON_KEY (and optionally SUPABASE_SERVICE_ROLE_KEY).'
    );
  }

  return createClient(supabaseUrl, keyToUse, {
    auth: { persistSession: false },
  });
}

export default getAdminSupabase;
