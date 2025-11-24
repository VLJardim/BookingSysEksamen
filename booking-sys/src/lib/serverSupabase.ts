import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the SERVICE_ROLE key.
// WARNING: The service role key has elevated permissions and MUST NOT be exposed to the browser.
// Store it in environment variables (e.g. SUPABASE_SERVICE_ROLE_KEY) and never commit it.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl) {
  console.warn('SUPABASE URL is not set (NEXT_PUBLIC_SUPABASE_URL)');
}

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE service role key is not set (SUPABASE_SERVICE_ROLE_KEY)');
}

export const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  // server-side: do not persist sessions
  auth: { persistSession: false },
});

export default adminSupabase;
