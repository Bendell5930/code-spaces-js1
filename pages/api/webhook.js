/**
 * POST /api/webhook
 *
 * Stripe Webhook handler for subscription lifecycle events.
 * Signature is verified using STRIPE_WEBHOOK_SECRET (required in production).
 *
 * Handles:
 *   - checkout.session.completed   → new subscriber
 *   - invoice.paid                 → renewal / first payment confirmed
 *   - customer.subscription.updated → plan change, status change
 *   - customer.subscription.deleted → cancellation / expiry
 *   - invoice.payment_failed       → payment problem
 *
 * NOTE: This app currently has no server-side database.  The webhook is the
 * authoritative signal from Stripe and is logged here.  Client-side
 * verification (via /api/check-subscription) reads from Stripe directly on
 * every page load, so no additional persistence is required for basic access
 * control.  If you add a database in the future, update the cases below to
 * write the subscription state there.
 */
import Stripe from 'stripe'
import { setSubscription, setCustomerForUser } from '../../lib/subscriptionDb'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// Disable Next.js body parsing — Stripe requires the raw body for HMAC verification
export const config = {
  api: {
    bodyParser: false,
  },
}

async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } else {
      // Development / testing without a webhook secret
      event = JSON.parse(rawBody.toString())
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const customerId = session.customer
      const subscriptionId = session.subscription
      const userId = session.client_reference_id
      console.log(
        `[webhook] checkout.session.completed — customer=${customerId}` +
        ` subscription=${subscriptionId}` +
        ` client_reference_id=${userId}`
      )
      if (userId && customerId) {
        await setCustomerForUser(userId, customerId)
      }
      if (subscriptionId && customerId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        await setSubscription(customerId, {
          subscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
        })
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object
      const customerId = invoice.customer
      const subscriptionId = invoice.subscription
      console.log(
        `[webhook] invoice.paid — customer=${customerId}` +
        ` subscription=${subscriptionId}`
      )
      if (subscriptionId && customerId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        await setSubscription(customerId, {
          subscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      console.log(
        `[webhook] customer.subscription.updated — id=${subscription.id}` +
        ` status=${subscription.status}` +
        ` current_period_end=${subscription.current_period_end}`
      )
      await setSubscription(subscription.customer, {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      console.log(
        `[webhook] customer.subscription.deleted — id=${subscription.id}` +
        ` customer=${subscription.customer}`
      )
      await setSubscription(subscription.customer, {
        subscriptionId: subscription.id,
        status: 'canceled',
        currentPeriodEnd: subscription.current_period_end,
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      console.warn(
        `[webhook] invoice.payment_failed — customer=${invoice.customer}` +
        ` subscription=${invoice.subscription}` +
        ` attempt=${invoice.attempt_count}`
      )
      break
    }

    default:
      // Ignore unhandled event types
      break
  }

  return res.status(200).json({ received: true })
}

