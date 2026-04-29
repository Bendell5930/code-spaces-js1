/**
 * Storage Quota — estimate localStorage usage and prune oldest entries
 * from large arrays before the browser's ~5–10 MB quota is hit.
 *
 * The browser does not expose a hard quota number, but the Storage API
 * (`navigator.storage.estimate()`) gives an approximate available figure
 * for the whole origin. As a fallback, we sum the byte length of every
 * key in `localStorage` and compare it against a conservative ceiling.
 *
 * Pure functions where possible so they can be unit-tested.
 */

// Conservative limit — most browsers offer 5 MB per origin for
// localStorage, but quota errors can fire earlier under memory pressure.
export const SOFT_QUOTA_BYTES = 4 * 1024 * 1024 // 4 MB
export const WARN_THRESHOLD = 0.8                // 80% → warn the user
export const PRUNE_THRESHOLD = 0.9               // 90% → prune oldest entries

// ─── Byte-size helpers ───

/**
 * Estimate the byte length of a string in UTF-16 code units (which is how
 * browsers store localStorage entries internally).
 */
export function byteLengthOf(str) {
  if (typeof str !== 'string') return 0
  // localStorage stores UTF-16 — 2 bytes per code unit
  return str.length * 2
}

/**
 * Sum the byte size of all keys + values in localStorage.
 * Returns 0 in non-browser environments.
 */
export function getLocalStorageBytes(storage) {
  const ls = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
  if (!ls) return 0
  let total = 0
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i)
    if (key === null) continue
    const val = ls.getItem(key) || ''
    total += byteLengthOf(key) + byteLengthOf(val)
  }
  return total
}

/**
 * Get the current usage ratio (0–1+) against SOFT_QUOTA_BYTES.
 */
export function getUsageRatio(storage) {
  return getLocalStorageBytes(storage) / SOFT_QUOTA_BYTES
}

/**
 * Quota status — "ok" | "warn" | "prune".
 */
export function getQuotaStatus(storage) {
  const ratio = getUsageRatio(storage)
  if (ratio >= PRUNE_THRESHOLD) return 'prune'
  if (ratio >= WARN_THRESHOLD) return 'warn'
  return 'ok'
}

// ─── Array pruning ───

/**
 * Prune an array of records down to a maximum length, dropping the
 * oldest entries (assumed to be at the start). Returns the pruned array.
 *
 * @param {Array} records
 * @param {number} maxLength
 */
export function pruneByCount(records, maxLength) {
  if (!Array.isArray(records)) return records
  if (records.length <= maxLength) return records
  return records.slice(records.length - maxLength)
}

/**
 * Prune an array of records by timestamp — drop entries older than
 * the given age in milliseconds. Records must have a `timestamp`
 * (epoch ms) field; entries without one are kept (treated as new).
 *
 * @param {Array<{timestamp?: number}>} records
 * @param {number} maxAgeMs
 * @param {number} [now=Date.now()]
 */
export function pruneByAge(records, maxAgeMs, now = Date.now()) {
  if (!Array.isArray(records)) return records
  return records.filter((r) => {
    if (!r || typeof r.timestamp !== 'number') return true
    return (now - r.timestamp) <= maxAgeMs
  })
}

/**
 * Prune an array down to fit a maximum byte budget, keeping the most
 * recent entries (end of array). Returns the trimmed array.
 *
 * @param {Array} records
 * @param {number} maxBytes
 */
export function pruneToBytes(records, maxBytes) {
  if (!Array.isArray(records) || records.length === 0) return records
  // Walk from end to start, keeping items until budget is consumed
  let total = 2 // for the JSON array brackets
  const kept = []
  for (let i = records.length - 1; i >= 0; i--) {
    const piece = JSON.stringify(records[i])
    const size = byteLengthOf(piece) + 2 // + comma/separator
    if (total + size > maxBytes) break
    kept.unshift(records[i])
    total += size
  }
  return kept
}

// ─── High-level helper for pages/index.js ───

/**
 * Default safe-prune for spin arrays. Keeps at most `softMax` entries
 * and removes anything older than `maxAgeDays`. Returns the pruned
 * array unchanged when no pruning is needed.
 *
 * @param {Array} spins
 * @param {object} [opts]
 * @param {number} [opts.softMax=5000]   absolute cap on stored spins
 * @param {number} [opts.maxAgeDays=365] drop entries older than this
 */
export function pruneSpinLog(spins, opts = {}) {
  const softMax = opts.softMax ?? 5000
  const maxAgeDays = opts.maxAgeDays ?? 365
  const ageMs = maxAgeDays * 24 * 60 * 60 * 1000
  let pruned = pruneByAge(spins, ageMs)
  pruned = pruneByCount(pruned, softMax)
  return pruned
}

/**
 * Safe wrapper around localStorage.setItem that:
 *  1. Tries to write the value.
 *  2. If a QuotaExceededError fires, runs the supplied prune callback,
 *     then retries once.
 *
 * @param {string} key
 * @param {string} value
 * @param {() => void} [onQuotaExceeded] called only on quota error
 * @returns {boolean} true if the write succeeded
 */
export function safeSetItem(key, value, onQuotaExceeded) {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    // Different browsers throw different names; check both.
    const isQuota =
      err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014)
    if (!isQuota) throw err
    if (typeof onQuotaExceeded === 'function') {
      try { onQuotaExceeded() } catch { /* swallow */ }
      // Retry once after the caller has freed space
      try {
        localStorage.setItem(key, value)
        return true
      } catch { /* still over quota */ }
    }
    return false
  }
}
