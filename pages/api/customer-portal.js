/**
 * POST /api/customer-portal
 *
 * Requires a valid Supabase JWT in the Authorization header.
 * Looks up the user's Stripe customer ID from Supabase, then creates
 * a Stripe Customer Portal session. Returns { url } for redirect.
 */
import stripe from '../../lib/stripeServer'
import { supabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify Supabase JWT
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  let user
  try {
    const admin = supabaseAdmin()
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    user = data.user
  } catch (err) {
    console.error('Supabase auth error:', err.message)
    return res.status(500).json({ error: 'Authentication service unavailable' })
  }

  try {
    const admin = supabaseAdmin()
    const { data: sub, error } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (error || !sub?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' })
    }

    const origin = req.headers.origin || `https://${req.headers.host}`

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/`,
    })

    return res.status(200).json({ url: portalSession.url })
  } catch (err) {
    console.error('Customer portal error:', err.message)
    return res.status(500).json({ error: 'Failed to create portal session' })
  }
}

