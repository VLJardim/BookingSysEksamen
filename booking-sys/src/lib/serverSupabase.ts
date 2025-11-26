import { createClient } from '@supabase/supabase-js';

// Factory to create a server-side Supabase client using the SERVICE_ROLE key.
// We avoid creating the client at module-import time so the build step doesn't fail
// when the service role key is not present. Call `getAdminSupabase()` inside
// request handlers (server runtime) where the env var should be set.
export function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl) {
    console.warn('SUPABASE URL is not set (NEXT_PUBLIC_SUPABASE_URL)');
  }

  if (!supabaseServiceRoleKey) {
    // Throw here to make failures explicit at runtime when a server route actually
    // requires the service role key. During build we won't call this function.
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

export default getAdminSupabase;
