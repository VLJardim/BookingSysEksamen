// src/lib/serverSupabase.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// If you have generated Database types, you can import them and do:
// import { Database } from "./database.types";

export function createServerSupabaseClient() {
  // If you have Database type: createRouteHandlerClient<Database>({ cookies });
  return createRouteHandlerClient({ cookies });
}
