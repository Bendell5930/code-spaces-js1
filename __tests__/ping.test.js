/**
 * Unit tests for GET /api/ping
 *
 * Tests:
 * 1. Non-GET request → 405 Method Not Allowed
 * 2. Limiter unconfigured (null) → 200 without X-RateLimit-* headers
 * 3. Limiter configured, request allowed → 200 with X-RateLimit-* headers
 * 4. Limiter configured, rate limit exceeded → 429
 */

import { jest } from '@jest/globals'

// ── helpers ───────────────────────────────────────────────────────────────────

function mockReqRes({ method = 'GET', headers = {} } = {}) {
  const req = { method, headers, socket: { remoteAddress: '127.0.0.1' } }
  const res = {
    _status: null,
    _headers: {},
    _body: null,
    setHeader(key, value) { this._headers[key] = value },
    status(code) { this._status = code; return this },
    json(body) { this._body = body; return this },
  }
  return { req, res }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/ping — no limiter configured', () => {
  let handler

  beforeEach(async () => {
    jest.resetModules()
    jest.unstable_mockModule('../lib/ratelimit.js', () => ({ ratelimit: null }))
    ;({ default: handler } = await import('../pages/api/ping.js'))
  })

  test('returns 405 for non-GET requests', async () => {
    const { req, res } = mockReqRes({ method: 'POST' })
    await handler(req, res)
    expect(res._status).toBe(405)
    expect(res._body).toMatchObject({ error: 'Method not allowed' })
  })

  test('returns 200 without rate-limit headers when limiter is null', async () => {
    const { req, res } = mockReqRes()
    await handler(req, res)
    expect(res._status).toBe(200)
    expect(res._body).toMatchObject({ ok: true })
    expect(res._headers['X-RateLimit-Limit']).toBeUndefined()
    expect(res._headers['X-RateLimit-Remaining']).toBeUndefined()
    expect(res._headers['X-RateLimit-Reset']).toBeUndefined()
  })
})

describe('GET /api/ping — limiter configured', () => {
  const mockLimit = jest.fn()
  let handler

  beforeEach(async () => {
    jest.resetModules()
    jest.unstable_mockModule('../lib/ratelimit.js', () => ({
      ratelimit: { limit: mockLimit },
    }))
    ;({ default: handler } = await import('../pages/api/ping.js'))
  })

  test('returns 200 with X-RateLimit-* headers when request is allowed', async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 1000 })
    const { req, res } = mockReqRes({
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    await handler(req, res)
    expect(res._status).toBe(200)
    expect(res._body).toMatchObject({ ok: true })
    expect(res._headers['X-RateLimit-Limit']).toBe(10)
    expect(res._headers['X-RateLimit-Remaining']).toBe(9)
    expect(res._headers['X-RateLimit-Reset']).toBe(1000)
    expect(mockLimit).toHaveBeenCalledWith('1.2.3.4')
  })

  test('returns 429 when rate limit is exceeded', async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: 2000 })
    const { req, res } = mockReqRes()
    await handler(req, res)
    expect(res._status).toBe(429)
    expect(res._body).toMatchObject({ error: 'Too many requests' })
  })

  test('falls back to socket address when x-forwarded-for is absent', async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 8, reset: 1000 })
    const { req, res } = mockReqRes()
    await handler(req, res)
    expect(mockLimit).toHaveBeenCalledWith('127.0.0.1')
  })
})
