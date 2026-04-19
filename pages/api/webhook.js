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
      // Payment is confirmed. The client will call /api/verify-session after
      // being redirected back from Stripe, which reads directly from Stripe API.
      console.log(
        `[webhook] checkout.session.completed — customer=${session.customer}` +
        ` subscription=${session.subscription}` +
        ` client_reference_id=${session.client_reference_id}`
      )
      break
    }

    case 'invoice.paid': {
      // Covers both the initial payment and all future renewals.
      const invoice = event.data.object
      const sub = invoice.subscription
      console.log(
        `[webhook] invoice.paid — customer=${invoice.customer}` +
        ` subscription=${sub}` +
        ` period_end=${invoice.period_end}`
      )
      // TODO: If you add a database, update the user record here:
      // await db.user.updateByStripeCustomerId(invoice.customer, {
      //   subscriptionActive: true,
      //   // current_period_end lives on the subscription, not the invoice root
      //   subscriptionExpiresAt: new Date(invoice.lines.data[0].period.end * 1000),
      // })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const isActive = ['active', 'trialing'].includes(subscription.status)
      console.log(
        `[webhook] customer.subscription.updated — id=${subscription.id}` +
        ` status=${subscription.status}` +
        ` current_period_end=${subscription.current_period_end}`
      )
      // TODO: update DB — subscription.customer, isActive, subscription.current_period_end
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      console.log(
        `[webhook] customer.subscription.deleted — id=${subscription.id}` +
        ` customer=${subscription.customer}`
      )
      // TODO: update DB — mark subscriptionActive=false for subscription.customer
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      console.warn(
        `[webhook] invoice.payment_failed — customer=${invoice.customer}` +
        ` subscription=${invoice.subscription}`
      )
      // TODO: notify user, update DB — subscription may still be within grace period
      break
    }

    default:
      // Ignore unhandled event types
      break
  }

  return res.status(200).json({ received: true })
}

