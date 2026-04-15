/**
 * POST /api/check-subscription
 *
 * Checks if a customer's subscription is active.
 * Returns { active, status, subscriptionId, currentPeriodEnd }
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
      return res.status(200).json({ active: false, status: 'none' })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // Check for trialing
      const trialing = await stripe.subscriptions.list({
        customer: customerId,
        status: 'trialing',
        limit: 1,
      })

      if (trialing.data.length > 0) {
        const sub = trialing.data[0]
        return res.status(200).json({
          active: true,
          status: 'trialing',
          subscriptionId: sub.id,
          currentPeriodEnd: sub.current_period_end,
        })
      }

      return res.status(200).json({ active: false, status: 'inactive' })
    }

    const sub = subscriptions.data[0]
    return res.status(200).json({
      active: true,
      status: sub.status,
      subscriptionId: sub.id,
      currentPeriodEnd: sub.current_period_end,
    })
  } catch (err) {
    console.error('Subscription check error:', err.message)
    return res.status(500).json({ error: 'Failed to check subscription' })
  }
}
