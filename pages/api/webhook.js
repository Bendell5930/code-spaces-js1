/**
 * POST /api/webhook
 *
 * Stripe Webhook handler for subscription lifecycle events.
 * In production, verify the webhook signature with STRIPE_WEBHOOK_SECRET.
 *
 * Handles:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_failed
 */
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// Disable body parsing — Stripe needs the raw body for signature verification
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
      // Dev/test mode without signature verification
      event = JSON.parse(rawBody.toString())
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      console.log(
        `Checkout completed: customer=${session.customer}, subscription=${session.subscription}`
      )
      // In a production app with a database, you'd update the user's subscription status here
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      console.log(
        `Subscription updated: id=${subscription.id}, status=${subscription.status}`
      )
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      console.log(
        `Subscription cancelled: id=${subscription.id}, customer=${subscription.customer}`
      )
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      console.log(
        `Payment failed: customer=${invoice.customer}, subscription=${invoice.subscription}`
      )
      break
    }

    default:
      // Unhandled event type
      break
  }

  return res.status(200).json({ received: true })
}
