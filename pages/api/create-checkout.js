/**
 * POST /api/create-checkout
 *
 * Creates a Stripe Checkout Session for the Premium subscription.
 * Returns { sessionId, url } for client-side redirect.
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
    const { customerId, userId } = req.body
    const origin = req.headers.origin || `https://${req.headers.host}`

    // Support both env var names; STRIPE_PRICE_MONTHLY is canonical
    const priceId = process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_ID
    if (!priceId) {
      console.error('[create-checkout] No price ID configured. Set STRIPE_PRICE_MONTHLY env var.')
      return res.status(500).json({ error: 'Subscription price not configured' })
    }

    const sessionParams = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          app: 'pokie-analyzer',
          plan: 'premium',
        },
      },
    }

    // Attach to existing Stripe customer if we have one
    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_creation = 'always'
    }

    // Link the checkout to the app user so webhooks can resolve which user to update
    if (userId) {
      sessionParams.client_reference_id = String(userId)
      sessionParams.subscription_data.metadata.userId = String(userId)
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
