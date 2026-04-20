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

    const sub = session.subscription
    const subStatus = sub?.status || null

    // Determine "active" from the subscription itself when available, falling
    // back to the session payment_status. This matters because Stripe sometimes
    // returns the session as paid but the subscription is still in
    // "incomplete" state for a few seconds while it finalizes — we must still
    // hand the customerId back to the client so it can poll/persist the link.
    const subActive = ['active', 'trialing'].includes(subStatus)
    const sessionPaid =
      session.payment_status === 'paid' || session.status === 'complete'
    const active = subActive || (sessionPaid && !subStatus)

    // ALWAYS return the customerId (and any subscription details) when known,
    // even if `active` is still false. The client persists the customerId so
    // it can poll /api/me/subscription and recover on subsequent visits.
    return res.status(200).json({
      active,
      status: subStatus || (sessionPaid ? 'active' : 'incomplete'),
      customerId: session.customer || null,
      subscriptionId: sub?.id || null,
      currentPeriodEnd: sub?.current_period_end || null,
    })
  } catch (err) {
    console.error('Session verify error:', err.message)
    return res.status(500).json({ error: 'Failed to verify session' })
  }
}
