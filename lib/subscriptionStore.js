/**
 * Subscription state management — localStorage-only implementation.
 *
 * Premium unlock is triggered by returning from Stripe with ?upgrade=success.
 * No server-side verification required; state is stored in localStorage.
 */

import { PLANS } from './featureGates'

const SUB_KEY = 'pokie-subscription'

/**
 * Load cached subscription state.
 */
export function loadSubscription() {
  if (typeof window === 'undefined') {
    return { plan: PLANS.BASIC, status: 'none', upgradedAt: null }
  }
  try {
    const raw = localStorage.getItem(SUB_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { plan: PLANS.BASIC, status: 'none', upgradedAt: null }
}

/**
 * Save subscription state.
 */
export function saveSubscription(sub) {
  try { localStorage.setItem(SUB_KEY, JSON.stringify(sub)) } catch { /* ignore */ }
}

/**
 * Flip the user to Premium. Called when they return from Stripe.
 */
export function applyPremiumUnlock() {
  const sub = {
    plan: PLANS.PREMIUM,
    status: 'active',
    upgradedAt: new Date().toISOString(),
  }
  saveSubscription(sub)
  return sub
}

/**
 * Verify (offline-only). No remote check anymore — we trust localStorage.
 * Kept for backward compatibility with existing callers.
 */
export async function verifySubscription() {
  return loadSubscription()
}

/**
 * Open the customer portal. Stripe Payment Links do not support a
 * customer portal directly, so we open a mailto: link to support.
 */
export async function openCustomerPortal() {
  if (typeof window === 'undefined') return
  window.location.href = 'mailto:Benjamin@pokieanalyzer.com.au?subject=Manage%20my%20Pokie%20Analyzer%20subscription'
}

/**
 * Stub kept so other files don't break. Real upgrade flow uses the
 * Stripe Payment Link directly — see lib/stripeLinks.js.
 */
export async function startCheckout() {
  const { openPremiumCheckout } = await import('./stripeLinks')
  openPremiumCheckout()
}

/**
 * Handle return from Stripe Checkout.
 * Called by pages/index.js when ?upgrade=success is detected.
 */
export async function handleCheckoutReturn() {
  return applyPremiumUnlock()
}
