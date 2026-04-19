/**
 * POST /api/create-checkout
 *
 * Requires a valid Supabase JWT in the Authorization header.
 * Creates a Stripe Checkout Session for the Premium subscription.
 * Returns { url } for client-side full-page redirect.
 */
import stripe from '../../lib/stripeServer'
import { supabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify Supabase JWT
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  let user
  try {
    const admin = supabaseAdmin()
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    user = data.user
  } catch (err) {
    console.error('Supabase auth error:', err.message)
    return res.status(500).json({ error: 'Authentication service unavailable' })
  }

  if (!process.env.STRIPE_PRICE_ID) {
    console.error('STRIPE_PRICE_ID is not set')
    return res.status(500).json({ error: 'Payment configuration error' })
  }

  try {
    const origin = req.headers.origin || `https://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?upgrade=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}

