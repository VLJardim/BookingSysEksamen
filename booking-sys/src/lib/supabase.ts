"use client";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

// Vi lader TypeScript selv finde ud af typen baseret på createBrowserSupabaseClient
type BrowserSupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;

// Én global browser-klient, som vi genbruger i browseren
let browserClient: BrowserSupabaseClient | null = null;

export default function getBrowserSupabase() {
  // Hvis klienten ikke findes endnu, laver vi den
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }

  // Og returnerer altid den samme instans
  return browserClient;
}
