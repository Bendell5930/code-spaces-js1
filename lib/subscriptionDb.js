/**
 * Server-side subscription store.
 *
 * Persists subscription state keyed by Stripe customerId.
 * Uses Vercel KV when configured (KV_REST_API_URL + KV_REST_API_TOKEN env vars),
 * with an in-memory Map as a fallback for development / unset environments.
 *
 * The in-memory fallback is per-container (loses data on cold starts), but that's fine
 * because every lookup also falls back to querying Stripe directly when the cache misses.
 */

// In-memory fallback store (per serverless container)
const memoryStore = new Map()

// TTL constants
const GRACE_PERIOD_DAYS = 7
const MIN_TTL_SECONDS = 60
const DEFAULT_TTL_DAYS = 90

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

/**
 * Get subscription record for a Stripe customer.
 * @param {string} customerId
 * @returns {object|null} { subscriptionId, status, currentPeriodEnd } or null
 */
export async function getSubscription(customerId) {
  if (!customerId) return null
  const key = `sub:${customerId}`
  try {
    if (kvAvailable()) {
      return await kvGet(key)
    }
    return memoryStore.get(key) || null
  } catch (err) {
    console.error('[subscriptionDb] getSubscription error:', err.message)
    return memoryStore.get(key) || null
  }
}

/**
 * Save subscription record for a Stripe customer.
 * TTL is set to slightly after current_period_end so stale data auto-expires.
 * @param {string} customerId
 * @param {object} record { subscriptionId, status, currentPeriodEnd }
 */
export async function setSubscription(customerId, record) {
  if (!customerId) return
  const key = `sub:${customerId}`
  // TTL: period end + 7 days, or 90 days if no period end
  const ttl = record.currentPeriodEnd
    ? Math.max(record.currentPeriodEnd - Math.floor(Date.now() / 1000) + GRACE_PERIOD_DAYS * 24 * 3600, MIN_TTL_SECONDS)
    : DEFAULT_TTL_DAYS * 24 * 3600
  try {
    if (kvAvailable()) {
      await kvSet(key, record, ttl)
    }
    memoryStore.set(key, record)
  } catch (err) {
    console.error('[subscriptionDb] setSubscription error:', err.message)
    memoryStore.set(key, record)
  }
}

/**
 * Map a clientReferenceId (app user id) → Stripe customerId.
 * Used by the webhook to resolve the customer from checkout.session.completed.
 */
export async function setCustomerForUser(userId, customerId) {
  if (!userId || !customerId) return
  const key = `user:${userId}`
  try {
    if (kvAvailable()) {
      await kvSet(key, { customerId }, 365 * 24 * 3600)
    }
    memoryStore.set(key, { customerId })
  } catch (err) {
    console.error('[subscriptionDb] setCustomerForUser error:', err.message)
    memoryStore.set(key, { customerId })
  }
}
