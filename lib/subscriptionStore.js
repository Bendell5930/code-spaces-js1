/**
 * Subscription state management — Supabase-aware.
 *
 * - loadSubscription()    → instant read from localStorage (offline-safe)
 * - verifySubscription()  → if logged in, checks /api/me and updates cache
 * - startCheckout()       → throws NEEDS_LOGIN if not authed; otherwise redirects to Stripe
 * - openCustomerPortal()  → POST /api/customer-portal → redirect
 */

import { supabase } from './supabaseClient'
import { PLANS } from './featureGates'

const SUB_KEY = 'pokie-subscription'

/** Sentinel error thrown when checkout is attempted without a session */
export const NEEDS_LOGIN = 'NEEDS_LOGIN'

/**
 * Load cached subscription state from localStorage.
 * Returns { plan, status, ... } — defaults to basic if nothing cached.
 */
export function loadSubscription() {
  if (typeof window === 'undefined') {
    return { plan: PLANS.BASIC, status: 'none' }
  }
  try {
    const raw = localStorage.getItem(SUB_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { plan: PLANS.BASIC, status: 'none' }
}

/**
 * Save subscription state to localStorage.
 */
export function saveSubscription(sub) {
  try {
    localStorage.setItem(SUB_KEY, JSON.stringify(sub))
  } catch { /* ignore */ }
}

/**
 * Verify subscription status with the server.
 * If the user is logged in, calls /api/me to get the authoritative status,
 * writes it to localStorage, and returns it.
 * If logged out, returns { plan: 'basic', status: 'none' }.
 */
export async function verifySubscription() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { plan: PLANS.BASIC, status: 'none' }
    }

    const res = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!res.ok) return loadSubscription()

    const data = await res.json()
    const updated = {
      plan: data.subscription?.plan || PLANS.BASIC,
      status: data.subscription?.status || 'none',
      currentPeriodEnd: data.subscription?.current_period_end || null,
      email: data.user?.email || null,
      checkedAt: Date.now(),
    }
    saveSubscription(updated)
    return updated
  } catch {
    // Offline — trust cache
    return loadSubscription()
  }
}

/**
 * Initiate Stripe Checkout for the Premium subscription.
 *
 * - If the user is not logged in, throws the NEEDS_LOGIN sentinel string so
 *   the caller can show the AuthModal instead.
 * - If logged in, POSTs to /api/create-checkout and does a full-page redirect
 *   to the Stripe-hosted checkout page.
 */
export async function startCheckout() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw NEEDS_LOGIN
  }

  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to create checkout session')
  }

  const { url } = await res.json()
  window.location.href = url
}

/**
 * Open the Stripe Customer Portal for managing the subscription.
 */
export async function openCustomerPortal() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw NEEDS_LOGIN
  }

  const res = await fetch('/api/customer-portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to open customer portal')
  }

  const { url } = await res.json()
  window.location.href = url
}

