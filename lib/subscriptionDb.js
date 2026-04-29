/**
 * Server-side subscription store.
 *
 * Persists subscription state keyed by Stripe customerId, and a mapping
 * from app userId → customerId.
 *
 * Storage tiers (tried in order, with graceful fallthrough on error):
 *   1. Supabase (`SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL`) —
 *      authoritative durable store. Tables defined in
 *      `supabase/migrations/0002_subscriptions.sql`.
 *   2. Vercel KV (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) — optional
 *      low-latency cache that also acts as a fallback if Supabase is down.
 *   3. In-memory Map — last-resort dev fallback (per-container, lossy).
 *
 * Reads try the cheapest fast tier first (memory → KV → Supabase) and
 * back-fill warmer tiers when colder ones win. Writes fan out to every
 * configured tier so every layer stays consistent.
 *
 * Every Supabase call also queries Stripe directly when the cache misses
 * (in `pages/api/me/subscription.js`), so a transient outage in any tier
 * never strands a user with stale entitlements.
 */

import { getServiceSupabase } from './supabaseClient.js'

// In-memory fallback store (per serverless container)
const memoryStore = new Map()

// TTL constants
const GRACE_PERIOD_DAYS = 7
const MIN_TTL_SECONDS = 60
const DEFAULT_TTL_DAYS = 90
const SECONDS_PER_DAY = 86400
const USER_MAPPING_TTL_SECONDS = 365 * SECONDS_PER_DAY

// ─── Supabase ──────────────────────────────────────────────────────────────

function supabaseAvailable() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function supabaseGetSubscription(customerId) {
  const client = getServiceSupabase()
  if (!client) return null
  const { data, error } = await client
    .from('stripe_subscriptions')
    .select('subscription_id, status, current_period_end')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    subscriptionId: data.subscription_id,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
  }
}

async function supabaseSetSubscription(customerId, record) {
  const client = getServiceSupabase()
  if (!client) return
  const { error } = await client
    .from('stripe_subscriptions')
    .upsert({
      customer_id: customerId,
      subscription_id: record.subscriptionId || null,
      status: record.status || null,
      current_period_end: record.currentPeriodEnd || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'customer_id' })
  if (error) throw new Error(error.message)
}

async function supabaseGetCustomerForUser(userId) {
  const client = getServiceSupabase()
  if (!client) return null
  const { data, error } = await client
    .from('user_customers')
    .select('customer_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { customerId: data.customer_id } : null
}

async function supabaseSetCustomerForUser(userId, customerId) {
  const client = getServiceSupabase()
  if (!client) return
  const { error } = await client
    .from('user_customers')
    .upsert({
      user_id: userId,
      customer_id: customerId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
}

// ─── Vercel KV (cache layer) ───────────────────────────────────────────────

function kvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

function getKvBaseUrl() {
  // Validate the KV URL is a proper https URL to prevent SSRF
  const raw = process.env.KV_REST_API_URL
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}

async function kvGet(key) {
  const base = getKvBaseUrl()
  if (!base) return null
  const encodedKey = encodeURIComponent(key)
  const res = await fetch(`${base}/get/${encodedKey}`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.result ? JSON.parse(data.result) : null
}

async function kvSet(key, value, ttlSeconds) {
  const base = getKvBaseUrl()
  if (!base) return
  const encodedKey = encodeURIComponent(key)
  const body = JSON.stringify(value)
  const ttl = ttlSeconds ? `?ex=${ttlSeconds}` : ''
  await fetch(`${base}/set/${encodedKey}${ttl}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  })
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Get subscription record for a Stripe customer.
 * @param {string} customerId
 * @returns {Promise<object|null>} { subscriptionId, status, currentPeriodEnd } or null
 */
export async function getSubscription(customerId) {
  if (!customerId) return null
  const key = `sub:${customerId}`

  // Tier 1: in-memory cache
  if (memoryStore.has(key)) return memoryStore.get(key)

  // Tier 2: Vercel KV cache
  if (kvAvailable()) {
    try {
      const cached = await kvGet(key)
      if (cached) {
        memoryStore.set(key, cached)
        return cached
      }
    } catch (err) {
      console.error('[subscriptionDb] KV getSubscription error:', err.message)
    }
  }

  // Tier 3: Supabase (authoritative)
  if (supabaseAvailable()) {
    try {
      const record = await supabaseGetSubscription(customerId)
      if (record) {
        memoryStore.set(key, record)
        // Backfill KV so subsequent reads are fast
        if (kvAvailable()) {
          const ttl = computeTtlSeconds(record)
          kvSet(key, record, ttl).catch((err) =>
            console.error('[subscriptionDb] KV backfill error:', err.message),
          )
        }
        return record
      }
    } catch (err) {
      console.error('[subscriptionDb] Supabase getSubscription error:', err.message)
    }
  }

  return null
}

function computeTtlSeconds(record) {
  // TTL: period end + 7 days, or 90 days if no period end
  return record.currentPeriodEnd
    ? Math.max(
        record.currentPeriodEnd - Math.floor(Date.now() / 1000) + GRACE_PERIOD_DAYS * SECONDS_PER_DAY,
        MIN_TTL_SECONDS,
      )
    : DEFAULT_TTL_DAYS * SECONDS_PER_DAY
}

/**
 * Save subscription record for a Stripe customer.
 * Fans out to every configured tier (Supabase + KV + memory).
 * @param {string} customerId
 * @param {object} record { subscriptionId, status, currentPeriodEnd }
 */
export async function setSubscription(customerId, record) {
  if (!customerId) return
  const key = `sub:${customerId}`
  const ttl = computeTtlSeconds(record)

  // Always update in-memory immediately so reads in the same container are warm
  memoryStore.set(key, record)

  // Fan out to durable tiers; log errors but never throw — webhook callers
  // should still 200 even if a tier is briefly unavailable.
  if (supabaseAvailable()) {
    try {
      await supabaseSetSubscription(customerId, record)
    } catch (err) {
      console.error('[subscriptionDb] Supabase setSubscription error:', err.message)
    }
  }
  if (kvAvailable()) {
    try {
      await kvSet(key, record, ttl)
    } catch (err) {
      console.error('[subscriptionDb] KV setSubscription error:', err.message)
    }
  }
}

/**
 * Map a clientReferenceId (app user id) → Stripe customerId.
 * Used by the webhook to resolve the customer from checkout.session.completed.
 */
export async function setCustomerForUser(userId, customerId) {
  if (!userId || !customerId) return
  const key = `user:${userId}`
  const value = { customerId }

  memoryStore.set(key, value)

  if (supabaseAvailable()) {
    try {
      await supabaseSetCustomerForUser(userId, customerId)
    } catch (err) {
      console.error('[subscriptionDb] Supabase setCustomerForUser error:', err.message)
    }
  }
  if (kvAvailable()) {
    try {
      await kvSet(key, value, USER_MAPPING_TTL_SECONDS)
    } catch (err) {
      console.error('[subscriptionDb] KV setCustomerForUser error:', err.message)
    }
  }
}

/**
 * Resolve a Stripe customerId for an app userId.
 * Reads memory → KV → Supabase, mirroring `getSubscription`.
 * @param {string} userId
 * @returns {Promise<{customerId: string}|null>}
 */
export async function getCustomerForUser(userId) {
  if (!userId) return null
  const key = `user:${userId}`

  if (memoryStore.has(key)) return memoryStore.get(key)

  if (kvAvailable()) {
    try {
      const cached = await kvGet(key)
      if (cached) {
        memoryStore.set(key, cached)
        return cached
      }
    } catch (err) {
      console.error('[subscriptionDb] KV getCustomerForUser error:', err.message)
    }
  }

  if (supabaseAvailable()) {
    try {
      const record = await supabaseGetCustomerForUser(userId)
      if (record) {
        memoryStore.set(key, record)
        if (kvAvailable()) {
          kvSet(key, record, USER_MAPPING_TTL_SECONDS).catch((err) =>
            console.error('[subscriptionDb] KV backfill error:', err.message),
          )
        }
        return record
      }
    } catch (err) {
      console.error('[subscriptionDb] Supabase getCustomerForUser error:', err.message)
    }
  }

  return null
}

// Test-only: clear the in-memory cache so unit tests start clean.
export function _resetForTests() {
  memoryStore.clear()
}
