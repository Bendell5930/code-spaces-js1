/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session for the Premium monthly subscription.
 * Looks up or creates a Stripe Customer for the requesting user.
 * Returns { url } — the client should redirect window.location to this URL.
 *
 * Expected request body (all optional):
 *   { customerId, userId, customerEmail }
 */
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { customerId, userId, customerEmail } = req.body || {}

    // Resolve the price ID: support both env var names
    const priceId = process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_ID
    if (!priceId) {
      console.error('[checkout] No price ID configured. Set STRIPE_PRICE_MONTHLY env var.')
      return res.status(500).json({ error: 'Subscription price not configured' })
    }

    const appUrl =
      process.env.APP_URL ||
      (req.headers.origin ? req.headers.origin : `https://${req.headers.host}`)

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?checkout=cancel`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          app: 'pokie-analyzer',
          plan: 'premium',
        },
      },
    }

    // Attach to an existing Stripe Customer if we have one
    if (customerId) {
      sessionParams.customer = customerId
    } else {
      // Always create a customer so the webhook can link back to a user
      sessionParams.customer_creation = 'always'
      if (customerEmail) {
        sessionParams.customer_email = customerEmail
      }
    }

    // Set client_reference_id so the webhook can always find the app user
    if (userId) {
      sessionParams.client_reference_id = String(userId)
      sessionParams.subscription_data.metadata.userId = String(userId)
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    console.log(
      `[checkout] Session created — id=${session.id} customer=${session.customer} ` +
        `client_reference_id=${session.client_reference_id}`
    )

    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('[checkout] Error creating checkout session:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
