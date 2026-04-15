/**
 * POST /api/verify-session
 *
 * Verifies a completed Stripe Checkout Session and returns subscription details.
 * Called when user returns from Stripe Checkout with session_id.
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
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.status(200).json({ active: false, status: 'incomplete' })
    }

    const sub = session.subscription
    return res.status(200).json({
      active: true,
      status: sub?.status || 'active',
      customerId: session.customer,
      subscriptionId: sub?.id || null,
      currentPeriodEnd: sub?.current_period_end || null,
    })
  } catch (err) {
    console.error('Session verify error:', err.message)
    return res.status(500).json({ error: 'Failed to verify session' })
  }
}
