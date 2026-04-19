/**
 * Subscription state management.
 *
 * Server is the source of truth. Plan is fetched from /api/me (which reads
 * from Supabase). The last known result is cached in localStorage as an
 * offline display fallback only.
 */

import { PLANS } from './featureGates'

const CACHE_KEY = 'pokie-subscription-v2'

/**
 * Load cached subscription state from localStorage (display fallback only).
 */
export function loadSubscription() {
  if (typeof window === 'undefined') {
    return { plan: PLANS.BASIC, status: 'none', email: null, currentPeriodEnd: null }
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { plan: PLANS.BASIC, status: 'none', email: null, currentPeriodEnd: null }
}

/**
 * Persist subscription state to localStorage for offline display.
 */
function saveSubscription(sub) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(sub))
  } catch { /* ignore */ }
}

/**
 * Fetch authoritative subscription state from /api/me.
 * Returns a subscription object. Caches the result for offline display.
 * If the user is not signed in, returns { plan: 'basic', status: 'none' }.
 */
export async function loadSubscription_remote() {
  try {
    const res = await fetch('/api/me')
    if (res.status === 401) {
      // Not signed in — basic plan
      const sub = { plan: PLANS.BASIC, status: 'none', email: null, currentPeriodEnd: null }
      saveSubscription(sub)
      return sub
    }
    if (!res.ok) {
      return loadSubscription()
    }
    const data = await res.json()
    const sub = {
      plan: data.plan || PLANS.BASIC,
      status: data.status || 'none',
      email: data.email || null,
      currentPeriodEnd: data.currentPeriodEnd || null,
    }
    saveSubscription(sub)
    return sub
  } catch {
    // Offline — return cache
    return loadSubscription()
  }
}

/**
 * Alias for loadSubscription_remote. Used by index.js on mount.
 */
export async function verifySubscription() {
  return loadSubscription_remote()
}

/**
 * Start Stripe Checkout for the Premium subscription.
 * POSTs to /api/create-checkout, then redirects to the Stripe-hosted page.
 */
export async function startCheckout() {
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (res.status === 401) {
    throw new Error('NOT_AUTHENTICATED')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to create checkout session')
  }

  const { url } = await res.json()
  window.location.href = url
}

/**
 * Open the Stripe Customer Portal for managing/cancelling a subscription.
 * POSTs to /api/customer-portal, then redirects.
 */
export async function openCustomerPortal() {
  const res = await fetch('/api/customer-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (res.status === 401) {
    throw new Error('NOT_AUTHENTICATED')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to open customer portal')
  }

  const { url } = await res.json()
  window.location.href = url
}

/**
 * No-op kept for back-compat. The webhook + /api/me handle real updates.
 */
export async function handleCheckoutReturn() {
  return null
}
