import { createClient } from '@supabase/supabase-js'

let _browserClient = null

/**
 * Browser-safe Supabase client (anon key only).
 * Lazily initialized so it doesn't throw at build time when env vars are absent.
 * Safe to import in any component or page.
 */
export function getSupabaseBrowser() {
  if (_browserClient) return _browserClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // During static analysis / build the env vars won't be present — return null
    return null
  }
  _browserClient = createClient(url, anonKey)
  return _browserClient
}

/**
 * A stable singleton for use with SessionContextProvider in _app.js.
 * Uses placeholder values at build time when env vars are absent; at runtime
 * Vercel injects the real values. A console warning is emitted if placeholders
 * are still active at runtime so misconfiguration is immediately visible.
 */
export const supabaseBrowser = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[supabaseClient] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
        'Auth features will not work until these env vars are configured.'
      )
    }
    return createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
  }
  return createClient(url, anonKey)
})()

/**
 * Server-only Supabase admin client (service role key).
 * Must ONLY be used in API routes / server-side code.
 * Throws if accidentally imported in the browser.
 */
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() must only be called server-side')
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are not set')
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
