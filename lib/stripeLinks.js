// Stripe Payment Links — single source of truth for all upgrade URLs.
// Add new tiers here as they are created in the Stripe Dashboard.

export const STRIPE_PREMIUM_LINK = 'https://buy.stripe.com/28E6oB02T5tlbBg7RG4Vy00'

// Future tiers can be added as additional exports, e.g.:
// export const STRIPE_ANNUAL_LINK = 'https://buy.stripe.com/...'

/**
 * Open the Stripe Premium checkout in a new tab.
 * Uses noopener,noreferrer for security.
 */
export function openPremiumCheckout() {
  if (typeof window === 'undefined') return
  window.open(STRIPE_PREMIUM_LINK, '_blank', 'noopener,noreferrer')
}
