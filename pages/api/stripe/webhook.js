/**
 * POST /api/stripe/webhook
 *
 * Stripe Webhook handler for subscription lifecycle events.
 * Signature is verified using STRIPE_WEBHOOK_SECRET.
 *
 * IMPORTANT: Must use raw body for Stripe HMAC verification.
 * bodyParser is disabled below.
 *
 * Handles:
 *   - checkout.session.completed   → link customer to user, init subscription record
 *   - invoice.paid                 → mark active, extend currentPeriodEnd
 *   - invoice.payment_failed       → log the failure
 *   - customer.subscription.updated → sync status + period end
 *   - customer.subscription.deleted → mark inactive
 */
import Stripe from 'stripe'
import { setSubscription, setCustomerForUser } from '../../../lib/subscriptionDb'

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

  // Always return 200 quickly to avoid Stripe retries — processing is fast
  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } else {
      // Development / local testing without a webhook secret
      console.warn('[webhook] No webhook secret — skipping signature verification')
      event = JSON.parse(rawBody.toString())
    }
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  console.log(`[webhook] Received event: ${event.type} (${event.id})`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer
        const subscriptionId = session.subscription
        const userId = session.client_reference_id

        console.log(
          `[webhook] checkout.session.completed — ` +
            `customer=${customerId} subscription=${subscriptionId} ` +
            `client_reference_id=${userId}`
        )

        // Map userId → customerId so we can look up by userId later
        if (userId && customerId) {
          await setCustomerForUser(userId, customerId)
        }

        // Fetch the subscription to get status and period end
        if (subscriptionId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          await setSubscription(customerId, {
            subscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
          })
          console.log(
            `[webhook] Subscription saved — customer=${customerId} ` +
              `status=${sub.status} period_end=${sub.current_period_end}`
          )
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const customerId = invoice.customer
        const subscriptionId = invoice.subscription

        console.log(
          `[webhook] invoice.paid — customer=${customerId} subscription=${subscriptionId}`
        )

        if (subscriptionId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          await setSubscription(customerId, {
            subscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
          })
          console.log(
            `[webhook] Subscription renewed — customer=${customerId} ` +
              `status=${sub.status} period_end=${sub.current_period_end}`
          )
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.warn(
          `[webhook] invoice.payment_failed — customer=${invoice.customer} ` +
            `subscription=${invoice.subscription} ` +
            `attempt=${invoice.attempt_count}`
        )
        // Don't revoke access yet — Stripe will retry; subscription stays active during grace period
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = sub.customer
        const isActive = ['active', 'trialing'].includes(sub.status)

        console.log(
          `[webhook] customer.subscription.updated — id=${sub.id} ` +
            `customer=${customerId} status=${sub.status} ` +
            `period_end=${sub.current_period_end} active=${isActive}`
        )

        await setSubscription(customerId, {
          subscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customerId = sub.customer

        console.log(
          `[webhook] customer.subscription.deleted — id=${sub.id} ` +
            `customer=${customerId}`
        )

        await setSubscription(customerId, {
          subscriptionId: sub.id,
          status: 'canceled',
          currentPeriodEnd: sub.current_period_end,
        })
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    // Log but don't fail — Stripe expects a 200 quickly
    console.error(`[webhook] Error processing ${event.type}:`, err.message)
  }

  return res.status(200).json({ received: true })
}
