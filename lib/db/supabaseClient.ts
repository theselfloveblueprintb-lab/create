import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side client only — uses the service role key, which must NEVER
// reach the browser bundle (same key-safety rule as the Anthropic client
// in app/api/*/route.ts). This file should only ever be imported from
// server-side code: API routes, not client components.
//
// Requires two env vars that don't exist yet in .env.example:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// A separate anon-key client for browser-side auth (sign-up/login) is a
// distinct concern, not built here — see MIGRATION_PLAN.md.

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "once a Supabase project exists (see MIGRATION_PLAN.md)."
    );
  }

  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
