import { describe, it, expect, beforeEach } from '@jest/globals'

// ─── localStorage / window stub ─────────────────────────────────────────────
// spendTracker guards with `typeof window === 'undefined'`, then accesses
// `localStorage` directly.  We install both globalThis.window and
// globalThis.localStorage so both checks pass in the Node test environment.

function makeStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)) },
    removeItem: (k) => { map.delete(k) },
    clear: () => map.clear(),
  }
}

let storage
let startOfDay, startOfWeek, startOfMonth, totalSince, getSpendTotals,
  checkSpendLimits, recordSpend, clearSpendLog, saveSpendLimits,
  loadSpendLimits, DEFAULT_LIMITS

beforeEach(async () => {
  storage = makeStorage()
  globalThis.localStorage = storage
  globalThis.window = { localStorage: storage }
  // Dynamic import to pick up the fresh globalThis on each test
  ;({
    startOfDay, startOfWeek, startOfMonth, totalSince, getSpendTotals,
    checkSpendLimits, recordSpend, clearSpendLog, saveSpendLimits,
    loadSpendLimits, DEFAULT_LIMITS,
  } = await import('../lib/spendTracker.js'))
})

// ─── Date boundary helpers ───

describe('startOfDay', () => {
  it('returns midnight (00:00:00.000) of the given date', () => {
    const d = new Date('2026-04-15T14:30:00')
    const sod = new Date(startOfDay(d))
    expect(sod.getHours()).toBe(0)
    expect(sod.getMinutes()).toBe(0)
    expect(sod.getSeconds()).toBe(0)
    expect(sod.getMilliseconds()).toBe(0)
    expect(sod.getDate()).toBe(d.getDate())
  })
})

describe('startOfWeek', () => {
  it('returns Monday of the same week', () => {
    // Wednesday 2026-04-15
    const d = new Date('2026-04-15T10:00:00')
    const sow = new Date(startOfWeek(d))
    expect(sow.getDay()).toBe(1) // Monday
  })

  it('handles Sunday (end of week) correctly — returns the previous Monday', () => {
    // Sunday 2026-04-19
    const d = new Date('2026-04-19T10:00:00')
    const sow = new Date(startOfWeek(d))
    expect(sow.getDay()).toBe(1) // Monday
    // The Monday should be 6 days before the Sunday
    expect(d.getTime() - sow.getTime()).toBeGreaterThanOrEqual(6 * 24 * 60 * 60 * 1000 - 1000)
  })

  it('returns Monday itself when the date is Monday', () => {
    const d = new Date('2026-04-13T08:00:00') // Monday
    const sow = new Date(startOfWeek(d))
    expect(sow.getDay()).toBe(1)
    expect(sow.getDate()).toBe(d.getDate())
  })
})

describe('startOfMonth', () => {
  it('returns the 1st of the month at midnight', () => {
    const d = new Date('2026-04-20T18:45:00')
    const som = new Date(startOfMonth(d))
    expect(som.getDate()).toBe(1)
    expect(som.getMonth()).toBe(d.getMonth())
    expect(som.getFullYear()).toBe(d.getFullYear())
  })
})

// ─── Spend recording & totals ───

describe('recordSpend + totalSince', () => {
  it('adds an entry and totalSince reflects it', () => {
    const before = Date.now()
    recordSpend(50)
    const total = totalSince(before - 1)
    expect(total).toBe(50)
  })

  it('stores the absolute value of a negative amount', () => {
    const before = Date.now()
    recordSpend(-30)
    expect(totalSince(before - 1)).toBe(30)
  })

  it('excludes entries before the since threshold', () => {
    recordSpend(100)
    const future = Date.now() + 10000
    expect(totalSince(future)).toBe(0)
  })

  it('sums multiple entries', () => {
    const before = Date.now()
    recordSpend(20)
    recordSpend(30)
    recordSpend(10)
    expect(totalSince(before - 1)).toBeCloseTo(60)
  })
})

describe('getSpendTotals', () => {
  it('returns today, thisWeek, thisMonth all ≥ 0 when no entries', () => {
    const totals = getSpendTotals()
    expect(totals.today).toBe(0)
    expect(totals.thisWeek).toBe(0)
    expect(totals.thisMonth).toBe(0)
  })

  it('includes a fresh entry in today, thisWeek, and thisMonth', () => {
    recordSpend(75)
    const totals = getSpendTotals()
    expect(totals.today).toBe(75)
    expect(totals.thisWeek).toBe(75)
    expect(totals.thisMonth).toBe(75)
  })
})

// ─── Limits ───

describe('saveSpendLimits / loadSpendLimits', () => {
  it('round-trips limits correctly', () => {
    saveSpendLimits({ dailyLimit: 100, weeklyLimit: 500, sessionTimeLimit: 45 })
    const loaded = loadSpendLimits()
    expect(loaded.dailyLimit).toBe(100)
    expect(loaded.weeklyLimit).toBe(500)
    expect(loaded.sessionTimeLimit).toBe(45)
  })

  it('returns DEFAULT_LIMITS when nothing is stored', () => {
    const loaded = loadSpendLimits()
    expect(loaded).toEqual(DEFAULT_LIMITS)
  })
})

describe('checkSpendLimits', () => {
  it('status is "none" when no limits are set', () => {
    recordSpend(200)
    const result = checkSpendLimits()
    expect(result.daily.status).toBe('none')
    expect(result.weekly.status).toBe('none')
  })

  it('status is "ok" when spend is below 80% of limit', () => {
    saveSpendLimits({ dailyLimit: 100 })
    recordSpend(50)
    expect(checkSpendLimits().daily.status).toBe('ok')
  })

  it('status is "warning" when spend is 80–99% of limit', () => {
    saveSpendLimits({ dailyLimit: 100 })
    recordSpend(85)
    expect(checkSpendLimits().daily.status).toBe('warning')
  })

  it('status is "exceeded" when spend meets or exceeds limit', () => {
    saveSpendLimits({ dailyLimit: 50 })
    recordSpend(60)
    expect(checkSpendLimits().daily.status).toBe('exceeded')
  })
})

// ─── clearSpendLog ───

describe('clearSpendLog', () => {
  it('removes all entries', () => {
    recordSpend(100)
    clearSpendLog()
    expect(getSpendTotals().today).toBe(0)
  })
})
