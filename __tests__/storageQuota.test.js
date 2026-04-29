import { describe, it, expect, beforeEach } from '@jest/globals'

import {
  byteLengthOf,
  getLocalStorageBytes,
  getUsageRatio,
  getQuotaStatus,
  pruneByCount,
  pruneByAge,
  pruneToBytes,
  pruneSpinLog,
  safeSetItem,
  SOFT_QUOTA_BYTES,
} from '../lib/storageQuota.js'

// Minimal in-memory localStorage-shaped stub
function makeStorage() {
  const map = new Map()
  return {
    get length() { return map.size },
    key(i) { return Array.from(map.keys())[i] ?? null },
    getItem(k) { return map.has(k) ? map.get(k) : null },
    setItem(k, v) { map.set(k, String(v)) },
    removeItem(k) { map.delete(k) },
    clear() { map.clear() },
  }
}

let storage
beforeEach(() => {
  storage = makeStorage()
  globalThis.localStorage = storage
})

// ─── byte-size helpers ───

describe('byteLengthOf', () => {
  it('returns 2 bytes per UTF-16 code unit', () => {
    expect(byteLengthOf('')).toBe(0)
    expect(byteLengthOf('a')).toBe(2)
    expect(byteLengthOf('hello')).toBe(10)
  })

  it('returns 0 for non-strings', () => {
    expect(byteLengthOf(null)).toBe(0)
    expect(byteLengthOf(undefined)).toBe(0)
    expect(byteLengthOf(42)).toBe(0)
  })
})

describe('getLocalStorageBytes', () => {
  it('returns 0 when storage is empty', () => {
    expect(getLocalStorageBytes(storage)).toBe(0)
  })

  it('sums key + value bytes for every entry', () => {
    storage.setItem('a', 'hi')      // 2 + 4 = 6
    storage.setItem('bb', 'world')  // 4 + 10 = 14
    expect(getLocalStorageBytes(storage)).toBe(20)
  })
})

describe('getUsageRatio + getQuotaStatus', () => {
  it('reports ok at 0% usage', () => {
    expect(getUsageRatio(storage)).toBe(0)
    expect(getQuotaStatus(storage)).toBe('ok')
  })

  it('reports warn at >=80% usage', () => {
    // Create a value of exactly 80% of soft quota
    const need = SOFT_QUOTA_BYTES * 0.8
    const charsNeeded = Math.ceil(need / 2) - 2 // minus key bytes
    storage.setItem('big', 'x'.repeat(charsNeeded))
    expect(getQuotaStatus(storage)).toBe('warn')
  })

  it('reports prune at >=90% usage', () => {
    const charsNeeded = Math.ceil((SOFT_QUOTA_BYTES * 0.95) / 2)
    storage.setItem('big', 'x'.repeat(charsNeeded))
    expect(getQuotaStatus(storage)).toBe('prune')
  })
})

// ─── pruning helpers ───

describe('pruneByCount', () => {
  it('returns the array unchanged when below the limit', () => {
    const a = [1, 2, 3]
    expect(pruneByCount(a, 5)).toBe(a)
  })

  it('keeps the most recent N entries (drops the oldest)', () => {
    expect(pruneByCount([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5])
  })

  it('handles non-arrays safely', () => {
    expect(pruneByCount(null, 3)).toBe(null)
  })
})

describe('pruneByAge', () => {
  it('drops entries older than maxAgeMs', () => {
    const now = 1_000_000
    const records = [
      { timestamp: now - 100 },           // keep
      { timestamp: now - 9999 },          // drop
      { timestamp: now },                 // keep
    ]
    const result = pruneByAge(records, 500, now)
    expect(result).toHaveLength(2)
    expect(result[0].timestamp).toBe(now - 100)
  })

  it('keeps records without a timestamp', () => {
    const result = pruneByAge([{ a: 1 }, { timestamp: 0 }], 1000, 100000)
    expect(result).toEqual([{ a: 1 }])
  })

  it('handles non-arrays safely', () => {
    expect(pruneByAge(undefined, 1000)).toBe(undefined)
  })
})

describe('pruneToBytes', () => {
  it('keeps the newest entries until budget is consumed', () => {
    const items = [
      { id: 1, data: 'aaaa' },
      { id: 2, data: 'bbbb' },
      { id: 3, data: 'cccc' },
    ]
    // Force a tiny budget so only the last item fits
    const result = pruneToBytes(items, 50)
    expect(result.length).toBeGreaterThan(0)
    expect(result[result.length - 1].id).toBe(3)
  })

  it('returns the array unchanged when it already fits', () => {
    const items = [{ a: 1 }]
    expect(pruneToBytes(items, 1_000_000)).toEqual(items)
  })

  it('handles empty arrays', () => {
    expect(pruneToBytes([], 100)).toEqual([])
  })
})

describe('pruneSpinLog', () => {
  it('caps at softMax entries', () => {
    const spins = Array.from({ length: 6000 }, (_, i) => ({
      timestamp: Date.now() - i,
      bet: 1,
    }))
    const result = pruneSpinLog(spins, { softMax: 100, maxAgeDays: 365 })
    expect(result).toHaveLength(100)
  })

  it('drops entries older than maxAgeDays', () => {
    const oldTs = Date.now() - 400 * 24 * 60 * 60 * 1000
    const spins = [
      { timestamp: oldTs, bet: 1 },
      { timestamp: Date.now(), bet: 2 },
    ]
    const result = pruneSpinLog(spins, { maxAgeDays: 365 })
    expect(result).toHaveLength(1)
    expect(result[0].bet).toBe(2)
  })
})

// ─── safeSetItem ───

describe('safeSetItem', () => {
  it('returns true on a normal successful write', () => {
    const ok = safeSetItem('hello', 'world')
    expect(ok).toBe(true)
    expect(storage.getItem('hello')).toBe('world')
  })

  it('runs the prune callback and retries on QuotaExceededError', () => {
    let calls = 0
    storage.setItem = function (k, v) {
      calls++
      if (calls === 1) {
        const err = new Error('quota')
        err.name = 'QuotaExceededError'
        throw err
      }
      // Second call succeeds — store on the underlying map
      storage._map = storage._map || new Map()
      storage._map.set(k, v)
    }
    let pruned = false
    const ok = safeSetItem('k', 'v', () => { pruned = true })
    expect(pruned).toBe(true)
    expect(ok).toBe(true)
    expect(calls).toBe(2)
  })

  it('returns false when the prune callback fails to free space', () => {
    storage.setItem = function () {
      const err = new Error('quota')
      err.name = 'QuotaExceededError'
      throw err
    }
    const ok = safeSetItem('k', 'v', () => { /* no-op */ })
    expect(ok).toBe(false)
  })

  it('rethrows non-quota errors', () => {
    storage.setItem = function () { throw new TypeError('nope') }
    expect(() => safeSetItem('k', 'v')).toThrow('nope')
  })
})
