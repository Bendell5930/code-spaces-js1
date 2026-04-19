/**
 * POST /api/stripe-webhook
 *
 * Stripe Webhook handler for subscription lifecycle events.
 * Verifies the Stripe signature, then writes subscription state
 * into Supabase so /api/me always reflects the authoritative status.
 *
 * Stripe events handled:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_failed
 */
import stripe from '../../lib/stripeServer'
import { supabaseAdmin } from '../../lib/supabaseClient'

// Disable body parsing so we can verify the Stripe signature on the raw body.
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

/** Map Stripe subscription status → our status */
function mapStatus(stripeStatus) {
  const mapping = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'inactive',
    incomplete_expired: 'canceled',
    paused: 'inactive',
  }
  return mapping[stripeStatus] || 'inactive'
}

/** Determine plan from Stripe subscription status */
function planFromStatus(stripeStatus) {
  return stripeStatus === 'active' || stripeStatus === 'trialing' ? 'premium' : 'basic'
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
    if (!webhookSecret || !sig) {
      console.error('Webhook secret or signature missing')
      return res.status(400).json({ error: 'Webhook secret not configured' })
    }
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const admin = supabaseAdmin()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id || session.metadata?.supabase_user_id
        if (!userId) {
          console.error('checkout.session.completed: missing supabase user_id')
          break
        }

        // Fetch the subscription to get period end
        let periodEnd = null
        let stripeSubId = session.subscription
        if (stripeSubId) {
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
          periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString()
        }

        // Look up user email from Supabase auth
        const { data: userData } = await admin.auth.admin.getUserById(userId)
        const email = userData?.user?.email || ''

        await admin.from('subscriptions').upsert({
          user_id: userId,
          email,
          stripe_customer_id: session.customer,
          stripe_subscription_id: stripeSubId,
          status: 'active',
          plan: 'premium',
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        console.log(`checkout.session.completed: activated premium for user ${userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object
        const status = mapStatus(stripeSub.status)
        const plan = planFromStatus(stripeSub.status)
        const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString()

        // Update by stripe_subscription_id. If no row exists yet (before checkout.session.completed
        // fires), this is a safe no-op — checkout.session.completed will create the row shortly.
        await admin
          .from('subscriptions')
          .update({
            status,
            plan,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', stripeSub.id)

        console.log(`customer.subscription.updated: sub=${stripeSub.id} status=${status} plan=${plan}`)
        break
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object

        await admin
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan: 'basic',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', stripeSub.id)

        console.log(`customer.subscription.deleted: sub=${stripeSub.id} → canceled`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (invoice.subscription) {
          await admin
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription)

          console.log(`invoice.payment_failed: sub=${invoice.subscription} → past_due`)
        }
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err.message)
    // Still return 200 so Stripe doesn't retry — log the error for inspection
  }

  return res.status(200).json({ received: true })
}
