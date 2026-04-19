/**
 * POST /api/billing-portal
 *
 * Creates a Stripe Billing Portal session so users can manage/cancel their subscription.
 * Returns { url } — client should redirect window.location to this URL.
 *
 * Body: { customerId }
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
    const { customerId } = req.body || {}

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' })
    }

    const appUrl =
      process.env.APP_URL ||
      (req.headers.origin ? req.headers.origin : `https://${req.headers.host}`)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/`,
    })

    console.log(`[billing-portal] Created portal session for customer=${customerId}`)

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[billing-portal] Error:', err.message)
    return res.status(500).json({ error: 'Failed to create billing portal session' })
  }
}
