/**
 * GET /api/me
 *
 * Reads the user's Supabase JWT from the Authorization header.
 * Returns the authenticated user's profile and subscription status.
 *
 * Response: { user: { id, email }, subscription: { plan, status, current_period_end } }
 */
import { supabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
    const { data: sub, error: subError } = await admin
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .single()

    // PGRST116 = "no rows returned" — not an error in our case, just means no subscription yet
    if (subError && subError.code !== 'PGRST116') {
      console.error('/api/me subscription lookup error:', subError.message)
    }

    return res.status(200).json({
      user: { id: user.id, email: user.email },
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            current_period_end: sub.current_period_end,
          }
        : { plan: 'basic', status: 'none', current_period_end: null },
    })
  } catch (err) {
    console.error('/api/me error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch subscription' })
  }
}
