/**
 * Supabase client helpers.
 *
 * Two flavours:
 * - `supabase` (default export below) — browser-safe singleton built from the
 *   public `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
 *   Subject to Row Level Security. Safe to import from React components.
 * - `getServiceSupabase()` — server-only factory that uses
 *   `SUPABASE_SERVICE_ROLE_KEY` and BYPASSES Row Level Security. MUST only be
 *   imported from server code (`pages/api/*`, server-only libs). Never import
 *   this from a client component or a file that runs in the browser bundle.
 *
 * Both helpers return `null` when their env vars are missing so the build and
 * tests stay safe in environments where Supabase is not configured.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      })
    : null;

let cachedServiceClient = null;

/**
 * Server-only Supabase client built with the service-role key.
 * Bypasses RLS — never expose to the browser.
 * Returns `null` when `NEXT_PUBLIC_SUPABASE_URL` or
 * `SUPABASE_SERVICE_ROLE_KEY` are not set.
 */
export function getServiceSupabase() {
  if (cachedServiceClient) return cachedServiceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  cachedServiceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedServiceClient;
}

