/**
 * Subscription state management.
 *
 * Flow:
 *  1. User clicks "Upgrade" → openPremiumCheckout() in stripeLinks.js
 *  2. Server creates a Checkout Session → browser navigates to Stripe (same window)
 *  3. After payment, Stripe redirects to /?checkout=success&session_id=SESSION_ID
 *  4. index.js calls handleCheckoutReturn(sessionId) which verifies with /api/verify-session
 *  5. Result (customerId, subscriptionId, currentPeriodEnd) is stored in localStorage
 *  6. On every app load, verifySubscription() re-checks /api/check-subscription using the
 *     stored customerId so the UI always reflects the real Stripe subscription state.
 *  7. When the subscription lapses, Stripe returns active=false and the user reverts to Basic.
 */

import { PLANS } from './featureGates'

export const SUB_KEY = 'pokie-subscription'

/**
 * Load cached subscription state.
 * Checks subscriptionExpiresAt — if it is in the past the user is reverted to Basic
 * (server re-verification on load will also catch this).
 */
export function loadSubscription() {
  if (typeof window === 'undefined') {
    return { plan: PLANS.BASIC, status: 'none', upgradedAt: null }
  }
  try {
    const raw = localStorage.getItem(SUB_KEY)
    if (raw) {
      const sub = JSON.parse(raw)
      // Stripe stores current_period_end as a Unix timestamp (seconds)
      if (sub.subscriptionExpiresAt) {
        const expiresMs = sub.subscriptionExpiresAt * 1000
        if (Date.now() > expiresMs) {
          const revoked = { ...sub, plan: PLANS.BASIC, status: 'expired' }
          saveSubscription(revoked)
          return revoked
        }
      }
      return sub
    }
  } catch { /* ignore */ }
  return { plan: PLANS.BASIC, status: 'none', upgradedAt: null }
}

/**
 * Save subscription state to localStorage.
 */
export function saveSubscription(sub) {
  try { localStorage.setItem(SUB_KEY, JSON.stringify(sub)) } catch { /* ignore */ }
}

/**
 * Persist a premium-unlocked state.
 * serverData can contain: { customerId, subscriptionId, currentPeriodEnd, status }
 * Calling with no arguments falls back to a trust-only unlock (used by "Already paid?" button).
 */
export function applyPremiumUnlock(serverData = {}) {
  const sub = {
    plan: PLANS.PREMIUM,
    status: serverData.status || 'active',
    upgradedAt: new Date().toISOString(),
    customerId: serverData.customerId || null,
    subscriptionId: serverData.subscriptionId || null,
    // Unix timestamp from Stripe (current_period_end) — null for trust-only unlock
    subscriptionExpiresAt: serverData.currentPeriodEnd || null,
  }
  saveSubscription(sub)
  return sub
}

/**
 * Handle return from Stripe Checkout.
 * Verifies the session with /api/verify-session and persists the result.
 * Returns the cached subscription (Basic) if the server cannot confirm payment.
 */
export async function handleCheckoutReturn(sessionId) {
  if (!sessionId) {
    // No session ID means we cannot verify — return cached state
    return loadSubscription()
  }

  try {
    const res = await fetch('/api/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.active) {
        return applyPremiumUnlock(data)
      }
    }
    // Server confirmed payment is not complete, or returned an error — do not unlock
    return loadSubscription()
  } catch {
    // Network error — do not grant access without server confirmation
    return loadSubscription()
  }
}

/**
 * Verify subscription status with Stripe via the server.
 * Falls back to localStorage cache if there is no stored customerId or the server is unreachable.
 */
export async function verifySubscription() {
  const cached = loadSubscription()

  // No Stripe customer linked — trust the local cache
  if (!cached.customerId) return cached

  try {
    const res = await fetch('/api/check-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: cached.customerId }),
    })

    if (!res.ok) return cached

    const data = await res.json()

    if (data.active) {
      // Refresh the expiry date from Stripe
      return applyPremiumUnlock({
        customerId: cached.customerId,
        subscriptionId: data.subscriptionId,
        currentPeriodEnd: data.currentPeriodEnd,
        status: data.status,
      })
    } else {
      // Subscription is no longer active — revert to Basic but keep customerId
      const revoked = { ...cached, plan: PLANS.BASIC, status: data.status || 'inactive' }
      saveSubscription(revoked)
      return revoked
    }
  } catch {
    // Network error — trust cache
    return cached
  }
}

/**
 * Open the Stripe Customer Portal for subscription management.
 * Uses the stored Stripe customerId; falls back to a mailto link if unavailable.
 */
export async function openCustomerPortal() {
  if (typeof window === 'undefined') return

  const cached = loadSubscription()

  if (!cached.customerId) {
    window.location.href =
      'mailto:Benjamin@pokieanalyzer.com.au?subject=Manage%20my%20Pokie%20Analyzer%20subscription'
    return
  }

  try {
    const res = await fetch('/api/customer-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: cached.customerId }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      throw new Error('No portal URL')
    }
  } catch {
    window.location.href =
      'mailto:Benjamin@pokieanalyzer.com.au?subject=Manage%20my%20Pokie%20Analyzer%20subscription'
  }
}

/**
 * Initiate Premium checkout.
 * Delegates to openPremiumCheckout() in stripeLinks.js.
 */
export async function startCheckout() {
  const { openPremiumCheckout } = await import('./stripeLinks')
  await openPremiumCheckout()
}
