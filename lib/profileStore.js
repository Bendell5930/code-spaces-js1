/**
 * User profile store.
 *
 * Captures the minimum information needed to gate access to the app and link
 * the user to their Stripe subscription:
 *   - name  : display name (string)
 *   - email : Stripe customer_email (string)
 *   - remember : if true, the profile persists across visits (localStorage);
 *                if false, it lives only for the current tab (sessionStorage).
 *   - createdAt : ISO timestamp the profile was first saved.
 *
 * The profile is intentionally separate from `lib/subscriptionStore.js` —
 * Stripe customerId / period end remain the source of truth for billing.
 * This module only records who the user said they are so we can pre-fill
 * Stripe Checkout and avoid asking on every visit.
 */

export const PROFILE_KEY = 'pokie-user-profile'

/**
 * Basic email syntax check (intentionally permissive — Stripe will do
 * the authoritative validation). Returns true for trimmed, non-empty
 * strings shaped roughly like `local@domain.tld`.
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false
  const trimmed = email.trim()
  if (!trimmed) return false
  // Single @, at least one dot in domain, no whitespace.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

/**
 * Load the saved profile.
 * Checks sessionStorage first (so a session-only profile takes precedence
 * for the current tab) then localStorage. Returns null when nothing is
 * stored or storage is unavailable.
 */
export function loadProfile() {
  if (typeof window === 'undefined') return null
  try {
    const raw =
      window.sessionStorage?.getItem(PROFILE_KEY) ||
      window.localStorage?.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Persist the profile.
 * Writes to localStorage when `remember` is true so the profile returns on
 * subsequent visits, otherwise writes only to sessionStorage so it disappears
 * when the tab/window is closed. Either way the *other* storage is cleared
 * to avoid stale duplicates.
 */
export function saveProfile(profile) {
  if (typeof window === 'undefined') return null
  if (!profile || typeof profile !== 'object') return null

  const normalized = {
    name: typeof profile.name === 'string' ? profile.name.trim() : '',
    email: typeof profile.email === 'string' ? profile.email.trim() : '',
    remember: profile.remember !== false, // default true
    createdAt: profile.createdAt || new Date().toISOString(),
  }

  try {
    const json = JSON.stringify(normalized)
    if (normalized.remember) {
      window.localStorage?.setItem(PROFILE_KEY, json)
      window.sessionStorage?.removeItem(PROFILE_KEY)
    } else {
      window.sessionStorage?.setItem(PROFILE_KEY, json)
      window.localStorage?.removeItem(PROFILE_KEY)
    }
  } catch {
    /* ignore storage errors (quota, private mode, etc.) */
  }

  return normalized
}

/**
 * Clear the saved profile from both storages.
 * Used by the "Sign out / forget me" control.
 */
export function clearProfile() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.removeItem(PROFILE_KEY)
    window.sessionStorage?.removeItem(PROFILE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * True when a profile with at least a valid-looking email is stored.
 */
export function hasProfile() {
  const p = loadProfile()
  return !!(p && isValidEmail(p.email))
}
