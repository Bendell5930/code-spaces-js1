/**
 * POST /api/customer-portal
 *
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Requires an authenticated Supabase session (via cookie).
 * Returns { url } for redirect.
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
    const admin = getSupabaseAdmin()
    const { data: subRow } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const stripeCustomerId = subRow?.stripe_customer_id
    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this account' })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/`,
    })

    return res.status(200).json({ url: portalSession.url })
  } catch (err) {
    console.error('customer-portal error:', err.message)
    return res.status(500).json({ error: 'Failed to create portal session' })
  }
}
