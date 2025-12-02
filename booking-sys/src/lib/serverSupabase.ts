// src/lib/serverSupabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export default function getAdminSupabase(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[serverSupabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      {
        supabaseUrlPresent: !!supabaseUrl,
        serviceRoleKeyPresent: !!serviceRoleKey,
      }
    );
    throw new Error(
      "Supabase service role environment variables are not set on the server"
    );
  }

  console.log(
    "[serverSupabase] Initializing admin client",
    supabaseUrl,
    "(service key length:",
    serviceRoleKey.length,
    ")"
  );

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false, // no cookies/sessions on the server
    },
  });

  return adminClient;
}
