import { ratelimit } from '../../lib/ratelimit'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (ratelimit) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'anonymous'

    const { success, limit, remaining, reset } = await ratelimit.limit(ip)

    res.setHeader('X-RateLimit-Limit', limit)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', reset)

    if (!success) {
      return res.status(429).json({ error: 'Too many requests' })
    }
  }

  res.status(200).json({ ok: true, ts: Date.now() })
}
