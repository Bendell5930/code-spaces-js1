// Stripe checkout integration.

// Keep the Payment Link as a final fallback (in case the API is unavailable).
export const STRIPE_PREMIUM_LINK = 'https://buy.stripe.com/28E6oB02T5tlbBg7RG4Vy00'

/**
 * Start Premium checkout via a server-created Stripe Checkout Session.
 * Navigates the *current* window to Stripe Checkout so that after payment
 * Stripe redirects back to this same window with ?checkout=success&session_id=...
 * which index.js can verify server-side.
 *
 * @param {Object} [options]
 * @param {string} [options.customerEmail] - Pre-fills Stripe Checkout and
 *   ensures the resulting Stripe Customer is keyed to the same email the
 *   user signed up with.
 *
 * Falls back to the Payment Link if the API call fails.
 */
export async function openPremiumCheckout(options = {}) {
  if (typeof window === 'undefined') return

  const body = {}
  if (options.customerEmail) body.customerEmail = options.customerEmail

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error('API error')

    const data = await res.json()
    const url = data.url || data.sessionUrl

    if (url) {
      window.location.href = url
      return
    }
    throw new Error('No checkout URL returned')
  } catch (err) {
    console.warn('Checkout Session API unavailable, falling back to Payment Link:', err.message)
    // Redirect in the same window so the ?upgrade=success return is handled by index.js
    window.location.href = STRIPE_PREMIUM_LINK
  }
}

