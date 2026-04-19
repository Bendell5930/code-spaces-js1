/**
 * POST /api/stripe-webhook
 *
 * Stripe webhook handler. Verifies the signature, then upserts subscription
 * state into Supabase using the service-role key.
 *
 * Handles:
 *   - checkout.session.completed
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 */
import Stripe from 'stripe'
import { buffer } from 'micro'
import { getSupabaseAdmin } from '../../lib/supabaseClient'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

/**
 * Resolve the supabase_user_id from a session or subscription object.
 * Checks the object's metadata first; falls back to the Stripe customer's metadata.
 */
async function resolveUserId(obj) {
  if (obj.metadata?.supabase_user_id) {
    return obj.metadata.supabase_user_id
  }
  // Look up the customer
  const customerId = obj.customer
  if (!customerId) return null
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return customer.metadata?.supabase_user_id || null
  } catch {
    return null
  }
}

/**
 * Upsert a subscription row into Supabase.
 */
async function upsertSubscription({ userId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd }) {
  const admin = getSupabaseAdmin()
  const plan = ['active', 'trialing'].includes(status) ? 'premium' : 'basic'

  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      status,
      plan,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('stripe-webhook: upsert error', error.message)
    throw error
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await buffer(req)
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    if (!webhookSecret || !sig) {
      return res.status(400).json({ error: 'Missing webhook secret or signature' })
    }
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('stripe-webhook: signature verification failed', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        // subscription may not be populated on the session object — re-fetch it
        const subscriptionId = session.subscription
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = await resolveUserId(session) || await resolveUserId(subscription)
        if (!userId) {
          console.error('stripe-webhook: could not resolve user_id for checkout.session.completed')
          break
        }

        await upsertSubscription({
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
        })
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = await resolveUserId(subscription)
        if (!userId) {
          console.error(`stripe-webhook: could not resolve user_id for ${event.type}`)
          break
        }

        await upsertSubscription({
          userId,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = await resolveUserId(subscription)
        if (!userId) {
          console.error('stripe-webhook: could not resolve user_id for customer.subscription.deleted')
          break
        }

        await upsertSubscription({
          userId,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          status: 'canceled',
          currentPeriodEnd: subscription.current_period_end,
        })
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('stripe-webhook: handler error', err.message)
    // Still return 200 to prevent Stripe retrying immediately
    return res.status(200).json({ received: true, error: err.message })
  }

  return res.status(200).json({ received: true })
}
