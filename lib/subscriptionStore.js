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
    customerEmail: serverData.customerEmail || null,
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
 *
 * Two outcomes are persisted:
 *   - active=true  → full premium unlock (plan, customerId, expiry, etc.)
 *   - active=false → if the server reports a customerId for the session, the
 *                    customerId is still saved to the local cache so future
 *                    verifySubscription() calls can poll the server and
 *                    recover (this is critical when Stripe finalises the
 *                    subscription a few seconds *after* the redirect).
 *
 * Returns the resulting cached subscription state.
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
      // Not yet active, but we DO know the Stripe customerId for this
      // session — persist it so subsequent verifySubscription() calls (and
      // the post-checkout poll in index.js) can complete the unlock once
      // Stripe finalises the subscription / the webhook fires.
      if (data.customerId) {
        const cached = loadSubscription()
        const updated = {
          ...cached,
          customerId: data.customerId,
          customerEmail: data.customerEmail || cached.customerEmail || null,
          subscriptionId: data.subscriptionId || cached.subscriptionId || null,
        }
        saveSubscription(updated)
        return updated
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
 * Verify subscription status with the server-authoritative endpoint.
 * Falls back to localStorage cache if there is no stored customerId or the server is unreachable.
 *
 * IMPORTANT: When the server says the subscription is inactive but the local
 * cache still has a future `subscriptionExpiresAt`, we KEEP premium access for
 * the remainder of the paid period. This protects paying users from being
 * downgraded by transient server-side issues (KV cache miss + Stripe error,
 * webhook delay, env-var misconfiguration, etc.). Stripe's authoritative state
 * will be re-checked on the next load and access will revoke naturally once
 * the period actually ends.
 */
export async function verifySubscription() {
  const cached = loadSubscription()

  // No Stripe customer linked — trust the local cache
  if (!cached.customerId) return cached

  try {
    const res = await fetch(`/api/me/subscription?customerId=${encodeURIComponent(cached.customerId)}`)

    if (!res.ok) return cached

    const data = await res.json()

    if (data.active) {
      // Refresh the expiry date from server
      return applyPremiumUnlock({
        customerId: data.customerId || cached.customerId,
        customerEmail: data.customerEmail || cached.customerEmail || null,
        subscriptionId: data.subscriptionId,
        currentPeriodEnd: data.currentPeriodEnd,
        status: data.status,
      })
    }

    // Server says inactive — but if we previously recorded a paid period that
    // hasn't ended yet, honour it. The user paid for this time and should
    // not be locked out by a transient server discrepancy.
    if (
      cached.plan === PLANS.PREMIUM &&
      cached.subscriptionExpiresAt &&
      Date.now() < cached.subscriptionExpiresAt * 1000
    ) {
      return cached
    }

    // Subscription is no longer active and the paid period has elapsed —
    // revert to Basic but keep customerId so the user can re-subscribe and
    // be recognised again.
    const revoked = { ...cached, plan: PLANS.BASIC, status: data.status || 'inactive' }
    saveSubscription(revoked)
    return revoked
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
    const res = await fetch('/api/billing-portal', {
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
 *
 * @param {Object} [options]
 * @param {string} [options.customerEmail] - Pre-fills Stripe Checkout and
 *   keys the resulting Stripe Customer to the same email the user signed
 *   up with, so subsequent visits can re-link the customer automatically.
 */
export async function startCheckout(options = {}) {
  const { openPremiumCheckout } = await import('./stripeLinks')
  await openPremiumCheckout(options)
}
