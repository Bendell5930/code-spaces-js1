/**
 * Spend Tracker — daily, weekly, and monthly spend persistence.
 *
 * Records spend entries in localStorage so users can see running totals
 * across the current day, week (Mon–Sun), and calendar month.
 * All amounts are in AUD dollars.
 */

const SPEND_KEY = 'pokie-spend-log'
const LIMITS_KEY = 'pokie-spend-limits'

// ─── Default spend limits (0 = not set) ───

export const DEFAULT_LIMITS = {
  dailyLimit: 0,
  weeklyLimit: 0,
  sessionTimeLimit: 60, // minutes; 0 = not set
}

// ─── Limits persistence ───

export function loadSpendLimits() {
  if (typeof window === 'undefined') return { ...DEFAULT_LIMITS }
  try {
    const raw = localStorage.getItem(LIMITS_KEY)
    if (raw) return { ...DEFAULT_LIMITS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_LIMITS }
}

export function saveSpendLimits(limits) {
  const merged = { ...DEFAULT_LIMITS, ...limits }
  if (typeof window !== 'undefined') {
    localStorage.setItem(LIMITS_KEY, JSON.stringify(merged))
  }
  return merged
}

// ─── Spend log helpers ───

function loadLog() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SPEND_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveLog(log) {
  localStorage.setItem(SPEND_KEY, JSON.stringify(log))
}

/**
 * Record a spend entry.
 * @param {number} amount - Amount spent in dollars (positive number)
 * @param {string} [note] - Optional note (e.g. machine name)
 * @returns {object} The new entry
 */
export function recordSpend(amount, note = '') {
  const entry = {
    amount: Math.abs(amount),
    note,
    timestamp: Date.now(),
  }
  const log = loadLog()
  log.push(entry)
  saveLog(log)
  return entry
}

// ─── Date boundary helpers ───

/**
 * Returns midnight (start) of the given date in local time as a timestamp.
 */
export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Returns the start of the ISO week (Monday) for a given date.
 */
export function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1) - day // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Returns the start of the calendar month for a given date.
 */
export function startOfMonth(date = new Date()) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// ─── Totals ───

/**
 * Calculate spend totals for a given period.
 * @param {number} since - Epoch ms; entries at or after this time are included
 * @returns {number} Total dollars spent
 */
export function totalSince(since) {
  const log = loadLog()
  return log
    .filter((e) => e.timestamp >= since)
    .reduce((sum, e) => sum + e.amount, 0)
}

/**
 * Get daily, weekly, and monthly spend totals.
 */
export function getSpendTotals() {
  const now = new Date()
  return {
    today: totalSince(startOfDay(now)),
    thisWeek: totalSince(startOfWeek(now)),
    thisMonth: totalSince(startOfMonth(now)),
  }
}

/**
 * Check whether current spend exceeds any user-set limit.
 * Returns an object with status for each period.
 */
export function checkSpendLimits() {
  const limits = loadSpendLimits()
  const totals = getSpendTotals()

  function status(spent, limit) {
    if (!limit || limit <= 0) return 'none'
    const ratio = spent / limit
    if (ratio >= 1.0) return 'exceeded'
    if (ratio >= 0.8) return 'warning'
    return 'ok'
  }

  return {
    daily: {
      status: status(totals.today, limits.dailyLimit),
      spent: totals.today,
      limit: limits.dailyLimit,
    },
    weekly: {
      status: status(totals.thisWeek, limits.weeklyLimit),
      spent: totals.thisWeek,
      limit: limits.weeklyLimit,
    },
  }
}

/**
 * Return the full spend log, most-recent-first.
 */
export function getSpendLog() {
  return loadLog().slice().reverse()
}

/**
 * Clear all spend entries (e.g. after user resets data).
 */
export function clearSpendLog() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SPEND_KEY)
  }
}
