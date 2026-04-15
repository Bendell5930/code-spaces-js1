/**
 * Subscription state management.
 *
 * Persists subscription status in localStorage.
 * On app load, checks with Stripe via API if the subscription is still active.
 * Falls back to cached status for offline use.
 */

import { PLANS } from './featureGates'

const SUB_KEY = 'pokie-subscription'

/**
 * Load cached subscription state.
 */
export function loadSubscription() {
  if (typeof window === 'undefined') {
    return { plan: PLANS.BASIC, status: 'none', customerId: null, checkedAt: null }
  }
  try {
    const raw = localStorage.getItem(SUB_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { plan: PLANS.BASIC, status: 'none', customerId: null, checkedAt: null }
}

/**
 * Save subscription state.
 */
export function saveSubscription(sub) {
  localStorage.setItem(SUB_KEY, JSON.stringify(sub))
}

/**
 * Verify subscription status with the server.
 * Returns updated subscription object.
 */
export async function verifySubscription() {
  const cached = loadSubscription()
  if (!cached.customerId) return cached

  try {
    const res = await fetch('/api/check-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: cached.customerId }),
    })

    if (!res.ok) return cached

    const data = await res.json()
    const updated = {
      plan: data.active ? PLANS.PREMIUM : PLANS.BASIC,
      status: data.status || 'none',
      customerId: cached.customerId,
      subscriptionId: data.subscriptionId || null,
      currentPeriodEnd: data.currentPeriodEnd || null,
      checkedAt: Date.now(),
    }
    saveSubscription(updated)
    return updated
  } catch {
    // Offline — trust cache
    return cached
  }
}

/**
 * Initiate Stripe Checkout for premium subscription.
 * Redirects to Stripe-hosted checkout page.
 */
export async function startCheckout() {
  const { loadStripe } = await import('@stripe/stripe-js')
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_KEY
  if (!pubKey) {
    console.error('Stripe publishable key not configured')
    return
  }

  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: loadSubscription().customerId,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to create checkout session')
  }

  const { sessionId } = await res.json()
  const stripe = await loadStripe(pubKey)
  await stripe.redirectToCheckout({ sessionId })
}

/**
 * Open Stripe Customer Portal for managing subscription.
 */
export async function openCustomerPortal() {
  const sub = loadSubscription()
  if (!sub.customerId) return

  const res = await fetch('/api/customer-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId: sub.customerId }),
  })

  if (!res.ok) {
    throw new Error('Failed to open customer portal')
  }

  const { url } = await res.json()
  window.location.href = url
}

/**
 * Handle return from Stripe Checkout.
 * Called when user lands on success URL with session_id param.
 */
export async function handleCheckoutReturn(sessionId) {
  if (!sessionId) return null

  const res = await fetch('/api/verify-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })

  if (!res.ok) return null

  const data = await res.json()
  const sub = {
    plan: PLANS.PREMIUM,
    status: data.status || 'active',
    customerId: data.customerId,
    subscriptionId: data.subscriptionId,
    currentPeriodEnd: data.currentPeriodEnd,
    checkedAt: Date.now(),
  }
  saveSubscription(sub)
  return sub
}
