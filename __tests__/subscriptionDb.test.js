/**
 * Unit tests for lib/subscriptionDb.js — tiered storage (memory / KV / Supabase).
 *
 * We mock:
 *   - lib/supabaseClient.js → getServiceSupabase returns a chainable mock
 *   - global fetch → tracks Vercel KV calls
 *   - process.env to enable / disable each tier per test
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'

let db
let supabaseMock
let fetchMock

function makeSupabaseMock(initial = {}) {
  const tables = {
    stripe_subscriptions: new Map(),
    user_customers: new Map(),
    ...initial,
  }
  function from(table) {
    let filterCol = null
    let filterVal = null
    return {
      select() {
        return {
          eq(col, val) { filterCol = col; filterVal = val; return this },
          maybeSingle() {
            const row = tables[table].get(filterVal) || null
            return Promise.resolve({ data: row, error: null })
          },
        }
      },
      upsert(payload) {
        const key =
          table === 'stripe_subscriptions' ? payload.customer_id :
          table === 'user_customers' ? payload.user_id :
          null
        if (key) tables[table].set(key, payload)
        return Promise.resolve({ data: payload, error: null })
      },
      eq(col, val) { filterCol = col; filterVal = val; return this },
    }
  }
  return { client: { from }, tables }
}

beforeEach(async () => {
  jest.resetModules()
  process.env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  }
  delete process.env.KV_REST_API_URL
  delete process.env.KV_REST_API_TOKEN

  supabaseMock = makeSupabaseMock()
  jest.unstable_mockModule('../lib/supabaseClient.js', () => ({
    supabase: null,
    getServiceSupabase: () => supabaseMock.client,
  }))

  fetchMock = jest.fn()
  globalThis.fetch = fetchMock

  db = await import('../lib/subscriptionDb.js')
  if (db._resetForTests) db._resetForTests()
})

afterEach(() => {
  delete globalThis.fetch
})

describe('setSubscription / getSubscription (Supabase tier)', () => {
  test('writes to Supabase and reads back', async () => {
    await db.setSubscription('cus_123', {
      subscriptionId: 'sub_1',
      status: 'active',
      currentPeriodEnd: 1234567890,
    })
    const row = supabaseMock.tables.stripe_subscriptions.get('cus_123')
    expect(row).toBeDefined()
    expect(row.subscription_id).toBe('sub_1')
    expect(row.status).toBe('active')

    db._resetForTests() // clear in-memory so we hit Supabase
    const got = await db.getSubscription('cus_123')
    expect(got.subscriptionId).toBe('sub_1')
    expect(got.status).toBe('active')
    expect(got.currentPeriodEnd).toBe(1234567890)
  })

  test('returns null for unknown customer', async () => {
    const got = await db.getSubscription('cus_unknown')
    expect(got).toBeNull()
  })

  test('returns null for empty customerId without throwing', async () => {
    expect(await db.getSubscription('')).toBeNull()
    expect(await db.getSubscription(null)).toBeNull()
  })

  test('memory cache wins over Supabase on hot reads', async () => {
    await db.setSubscription('cus_hot', { subscriptionId: 's', status: 'active', currentPeriodEnd: 1 })
    // Mutate Supabase row directly — memory should still serve the original
    supabaseMock.tables.stripe_subscriptions.set('cus_hot', {
      customer_id: 'cus_hot', subscription_id: 's', status: 'canceled', current_period_end: 1,
    })
    const got = await db.getSubscription('cus_hot')
    expect(got.status).toBe('active')
  })
})

describe('setCustomerForUser / getCustomerForUser', () => {
  test('writes and reads the user → customer mapping via Supabase', async () => {
    await db.setCustomerForUser('user_1', 'cus_abc')
    db._resetForTests()
    const got = await db.getCustomerForUser('user_1')
    expect(got).toEqual({ customerId: 'cus_abc' })
  })

  test('ignores empty inputs', async () => {
    await db.setCustomerForUser('', 'cus_x')
    await db.setCustomerForUser('user_x', '')
    expect(supabaseMock.tables.user_customers.size).toBe(0)
  })
})

describe('Vercel KV tier (when configured)', () => {
  beforeEach(async () => {
    process.env.KV_REST_API_URL = 'https://example.kv.upstash.io'
    process.env.KV_REST_API_TOKEN = 'kv-token'
    jest.resetModules()
    supabaseMock = makeSupabaseMock()
    jest.unstable_mockModule('../lib/supabaseClient.js', () => ({
      supabase: null,
      getServiceSupabase: () => supabaseMock.client,
    }))
    fetchMock = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ result: null }) }))
    globalThis.fetch = fetchMock
    db = await import('../lib/subscriptionDb.js')
    if (db._resetForTests) db._resetForTests()
  })

  test('setSubscription fans out to KV', async () => {
    await db.setSubscription('cus_kv', { subscriptionId: 's', status: 'active', currentPeriodEnd: 1 })
    const kvCall = fetchMock.mock.calls.find(([url]) =>
      url.startsWith('https://example.kv.upstash.io/set/'),
    )
    expect(kvCall).toBeDefined()
    expect(kvCall[1].method).toBe('POST')
    expect(kvCall[1].headers.Authorization).toBe('Bearer kv-token')
  })

  test('rejects non-https KV URL (SSRF guard)', async () => {
    process.env.KV_REST_API_URL = 'http://attacker.example.com'
    jest.resetModules()
    jest.unstable_mockModule('../lib/supabaseClient.js', () => ({
      supabase: null,
      getServiceSupabase: () => supabaseMock.client,
    }))
    fetchMock = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ result: null }) }))
    globalThis.fetch = fetchMock
    db = await import('../lib/subscriptionDb.js')
    db._resetForTests()
    await db.setSubscription('cus_x', { subscriptionId: 's', status: 'active', currentPeriodEnd: 1 })
    const kvCall = fetchMock.mock.calls.find(([url]) =>
      typeof url === 'string' && url.startsWith('http://attacker.example.com/'),
    )
    expect(kvCall).toBeUndefined()
  })
})

describe('All tiers disabled (in-memory only)', () => {
  beforeEach(async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.KV_REST_API_URL
    delete process.env.KV_REST_API_TOKEN
    jest.resetModules()
    jest.unstable_mockModule('../lib/supabaseClient.js', () => ({
      supabase: null,
      getServiceSupabase: () => null,
    }))
    db = await import('../lib/subscriptionDb.js')
    if (db._resetForTests) db._resetForTests()
  })

  test('falls back to in-memory store', async () => {
    await db.setSubscription('cus_mem', { subscriptionId: 's', status: 'active', currentPeriodEnd: 1 })
    const got = await db.getSubscription('cus_mem')
    expect(got.subscriptionId).toBe('s')
  })

  test('returns null after reset', async () => {
    await db.setSubscription('cus_mem', { subscriptionId: 's', status: 'active', currentPeriodEnd: 1 })
    db._resetForTests()
    expect(await db.getSubscription('cus_mem')).toBeNull()
  })
})
