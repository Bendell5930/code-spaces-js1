/**
 * GET /api/me/subscription
 *
 * Server-authoritative subscription status check.
 * Returns { active, status, currentPeriodEnd, customerId, subscriptionId }
 *
 * Query params (alternative to body):
 *   ?customerId=cus_xxx
 *
 * `active` is true iff:
 *   - subscriptionStatus is "active" or "trialing"
 *   - AND currentPeriodEnd > now (or no period end stored yet)
 */
import Stripe from 'stripe'
import { getSubscription } from '../../../lib/subscriptionDb'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Accept customerId from query string or body
  const customerId =
    req.query?.customerId ||
    (req.method === 'POST' ? req.body?.customerId : null)

  if (!customerId) {
    return res.status(200).json({ active: false, status: 'none', currentPeriodEnd: null })
  }

  const nowSec = Math.floor(Date.now() / 1000)

  // 1. Try the server-side cache first
  try {
    const cached = await getSubscription(customerId)
    if (cached) {
      const isActive =
        ['active', 'trialing'].includes(cached.status) &&
        (!cached.currentPeriodEnd || cached.currentPeriodEnd > nowSec)
      console.log(
        `[me/subscription] Cache hit — customer=${customerId} ` +
          `status=${cached.status} active=${isActive}`
      )
      return res.status(200).json({
        active: isActive,
        status: cached.status,
        currentPeriodEnd: cached.currentPeriodEnd || null,
        customerId,
        subscriptionId: cached.subscriptionId || null,
      })
    }
  } catch (err) {
    console.error('[me/subscription] Cache lookup error:', err.message)
  }

  // 2. Fall back to querying Stripe directly
  try {
    const [activeSubs, trialingSubs] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 }),
    ])

    const sub = activeSubs.data[0] || trialingSubs.data[0] || null

    if (!sub) {
      console.log(`[me/subscription] No active subscription — customer=${customerId}`)
      return res.status(200).json({
        active: false,
        status: 'inactive',
        currentPeriodEnd: null,
        customerId,
        subscriptionId: null,
      })
    }

    const isActive =
      ['active', 'trialing'].includes(sub.status) &&
      sub.current_period_end > nowSec

    console.log(
      `[me/subscription] Stripe hit — customer=${customerId} ` +
        `status=${sub.status} active=${isActive}`
    )

    return res.status(200).json({
      active: isActive,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      customerId,
      subscriptionId: sub.id,
    })
  } catch (err) {
    console.error('[me/subscription] Stripe lookup error:', err.message)
    return res.status(500).json({ error: 'Failed to check subscription' })
  }
}
