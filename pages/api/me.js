/**
 * GET /api/me
 *
 * Returns the authenticated user's subscription state from Supabase.
 * Anonymous users are not supported — returns 401 if no session.
 */
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { getSupabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createPagesServerClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = session.user

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found — that's fine
      console.error('me: supabase error', error.message)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!data) {
      return res.status(200).json({ email: user.email, plan: 'basic', status: 'none', currentPeriodEnd: null })
    }

    return res.status(200).json({
      email: user.email,
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.current_period_end,
    })
  } catch (err) {
    console.error('me: unexpected error', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
