/**
 * Integration-style tests for the Stripe webhook handler and subscription endpoint.
 *
 * Tests:
 * 1. Valid webhook payload updates the subscription store and /api/me/subscription returns active.
 * 2. Webhook with invalid signature is rejected with 400.
 */

import { jest } from '@jest/globals'

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock subscriptionDb so we can inspect what gets written
const mockSetSubscription = jest.fn()
const mockSetCustomerForUser = jest.fn()
const mockGetSubscription = jest.fn()

jest.unstable_mockModule('../lib/subscriptionDb.js', () => ({
  setSubscription: mockSetSubscription,
  setCustomerForUser: mockSetCustomerForUser,
  getSubscription: mockGetSubscription,
}))

// Mock the Stripe module
const mockRetrieveSubscription = jest.fn()
const mockConstructEvent = jest.fn()
const mockListSubscriptions = jest.fn()

jest.unstable_mockModule('stripe', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent,
      },
      subscriptions: {
        retrieve: mockRetrieveSubscription,
        list: mockListSubscriptions,
      },
    })),
  }
})

// Helper: create a mock Next.js req/res pair
function mockReqRes({ method = 'POST', body = null, headers = {} } = {}) {
  const chunks = body ? [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))] : []

  const req = {
    method,
    headers,
    // Make req iterable so getRawBody works
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) yield chunk
    },
  }

  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this },
    json(body) { this._body = body; return this },
    setHeader() {},
  }

  return { req, res }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/stripe/webhook', () => {
  let handler

  beforeEach(async () => {
    jest.clearAllMocks()
    // Re-import handler fresh each test to pick up mocks
    const mod = await import('../pages/api/stripe/webhook.js')
    handler = mod.default
  })

  test('checkout.session.completed updates subscription store', async () => {
    const fakeSubscription = {
      id: 'sub_test123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
    }

    const fakeEvent = {
      type: 'checkout.session.completed',
      id: 'evt_test123',
      data: {
        object: {
          customer: 'cus_test123',
          subscription: 'sub_test123',
          client_reference_id: 'user_42',
        },
      },
    }

    // No webhook secret set → raw JSON path
    delete process.env.STRIPE_WEBHOOK_SECRET

    mockConstructEvent.mockReturnValue(fakeEvent)
    mockRetrieveSubscription.mockResolvedValue(fakeSubscription)

    const payload = JSON.stringify(fakeEvent)
    const { req, res } = mockReqRes({
      body: payload,
      headers: {},
    })

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(mockSetCustomerForUser).toHaveBeenCalledWith('user_42', 'cus_test123')
    expect(mockSetSubscription).toHaveBeenCalledWith('cus_test123', {
      subscriptionId: 'sub_test123',
      status: 'active',
      currentPeriodEnd: fakeSubscription.current_period_end,
    })
  })

  test('rejects webhook with invalid signature', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'

    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload')
    })

    const { req, res } = mockReqRes({
      body: '{"type":"checkout.session.completed"}',
      headers: { 'stripe-signature': 'invalid_sig' },
    })

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._body).toMatchObject({ error: 'Invalid signature' })
    expect(mockSetSubscription).not.toHaveBeenCalled()
  })

  test('customer.subscription.deleted marks subscription canceled', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    const fakeEvent = {
      type: 'customer.subscription.deleted',
      id: 'evt_del123',
      data: {
        object: {
          id: 'sub_del123',
          customer: 'cus_del123',
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
        },
      },
    }

    const payload = JSON.stringify(fakeEvent)
    const { req, res } = mockReqRes({ body: payload, headers: {} })

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(mockSetSubscription).toHaveBeenCalledWith('cus_del123', {
      subscriptionId: 'sub_del123',
      status: 'canceled',
      currentPeriodEnd: fakeEvent.data.object.current_period_end,
    })
  })

  test('invoice.payment_failed logs but does not revoke access', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    const fakeEvent = {
      type: 'invoice.payment_failed',
      id: 'evt_fail123',
      data: {
        object: {
          customer: 'cus_fail123',
          subscription: 'sub_fail123',
          attempt_count: 1,
        },
      },
    }

    const payload = JSON.stringify(fakeEvent)
    const { req, res } = mockReqRes({ body: payload, headers: {} })

    await handler(req, res)

    // Should return 200 and NOT update the subscription store
    expect(res._status).toBe(200)
    expect(mockSetSubscription).not.toHaveBeenCalled()
  })
})

describe('GET /api/me/subscription', () => {
  let handler

  beforeEach(async () => {
    jest.clearAllMocks()
    const mod = await import('../pages/api/me/subscription.js')
    handler = mod.default
  })

  test('returns active=true when subscription is active in cache', async () => {
    const futureEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 3600

    mockGetSubscription.mockResolvedValue({
      subscriptionId: 'sub_cached123',
      status: 'active',
      currentPeriodEnd: futureEnd,
    })

    const { req, res } = mockReqRes({
      method: 'GET',
      headers: {},
    })
    req.query = { customerId: 'cus_test123' }
    req.body = {}

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(res._body).toMatchObject({ active: true, status: 'active' })
  })

  test('returns active=false when no customerId', async () => {
    const { req, res } = mockReqRes({ method: 'GET', headers: {} })
    req.query = {}
    req.body = {}

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(res._body).toMatchObject({ active: false, status: 'none' })
  })

  test('falls back to Stripe when cache misses and returns active', async () => {
    mockGetSubscription.mockResolvedValue(null) // cache miss

    const futureEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 3600
    mockListSubscriptions.mockResolvedValueOnce({
      data: [{
        id: 'sub_stripe123',
        status: 'active',
        current_period_end: futureEnd,
      }],
    })
    // second call (trialing) — shouldn't be reached but mock it anyway
    mockListSubscriptions.mockResolvedValueOnce({ data: [] })

    const { req, res } = mockReqRes({ method: 'GET', headers: {} })
    req.query = { customerId: 'cus_fallback' }
    req.body = {}

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(res._body).toMatchObject({ active: true, subscriptionId: 'sub_stripe123' })
  })
})
