/**
 * POST /api/create-checkout
 *
 * Creates a Stripe Checkout Session for the Premium subscription.
 * Requires an authenticated Supabase session (via cookie).
 * Returns { url } for redirect to Stripe-hosted checkout.
 */
import Stripe from 'stripe'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { getSupabaseAdmin } from '../../lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth check
  const supabase = createPagesServerClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = session.user
  const origin = req.headers.origin || `https://${req.headers.host}`

  try {
    // Look up existing Stripe customer ID from Supabase
    const admin = getSupabaseAdmin()
    const { data: subRow } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let stripeCustomerId = subRow?.stripe_customer_id

    // Create a Stripe customer if we don't have one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      // Persist the new customer ID to Supabase
      await admin.from('subscriptions').upsert(
        {
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          status: 'none',
          plan: 'basic',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer: stripeCustomerId,
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)

    return res.status(200).json({ url: checkoutSession.url })
  } catch (err) {
    console.error('create-checkout error:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
