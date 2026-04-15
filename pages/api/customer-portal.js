/**
 * POST /api/customer-portal
 *
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Returns { url } for redirect.
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
    const { customerId } = req.body

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customer ID' })
    }

    const origin = req.headers.origin || `https://${req.headers.host}`

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Customer portal error:', err.message)
    return res.status(500).json({ error: 'Failed to create portal session' })
  }
}
