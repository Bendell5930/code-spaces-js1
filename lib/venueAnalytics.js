/**
 * Venue Analytics Engine v2 — Real Session Data + Privacy Codes
 *
 * Data is submitted at end of each user session (Calculator Collect / AI Scan Stop).
 * Machine names are stored as codes (A1, B2) — real names in private legend only.
 *
 * 5 Win Categories:
 *   1. Wins $50+    — any single win >= $50
 *   2. Big Wins     — any single win >= 15x total bet
 *   3. Bonus Wins   — wins from bonus/feature rounds
 *   4. Major Jackpot — any single win >= $500
 *   5. Grand Jackpot — any single win >= $2000
 *
 * Wet/Dry Scoring (0-100):
 *   Score combines all 5 categories weighted by significance.
 *   High score = WET (machine paying well)
 *   Low score = DRY (machine holding)
 */

const VENUE_DATA_KEY = 'pokie-venue-v2'
const SESSION_LOG_KEY = 'pokie-venue-sessions-v2'

// ─── Thresholds ───
export const WIN_THRESHOLDS = {
  WINS_50_PLUS: 50,
  BIG_WIN_MULTIPLIER: 15,
  MAJOR_JACKPOT: 500,
  GRAND_JACKPOT: 2000,
}

// ─── Time windows ───
const DAY_MS = 86400000
const WEEK_MS = DAY_MS * 7

// ─── Storage ───

function loadData() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(VENUE_DATA_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveData(data) {
  localStorage.setItem(VENUE_DATA_KEY, JSON.stringify(data))
}

function loadSessionLog() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SESSION_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSessionLog(log) {
  localStorage.setItem(SESSION_LOG_KEY, JSON.stringify(log))
}

// ─── Win Classification ───

/**
 * Classify a single win amount into categories.
 * A win can belong to multiple categories simultaneously.
 */
export function classifyWin(amount, totalBetPerSpin) {
  const cats = []
  if (amount >= WIN_THRESHOLDS.GRAND_JACKPOT) cats.push('grandJackpot')
  if (amount >= WIN_THRESHOLDS.MAJOR_JACKPOT) cats.push('majorJackpot')
  if (amount >= WIN_THRESHOLDS.WINS_50_PLUS) cats.push('wins50plus')
  if (totalBetPerSpin > 0 && amount >= totalBetPerSpin * WIN_THRESHOLDS.BIG_WIN_MULTIPLIER) {
    cats.push('bigWin')
  }
  return cats
}

// ─── Submit Session Data ───

/**
 * Submit a completed session to venue analytics.
 *
 * @param {Object} session
 * @param {string} session.venueId
 * @param {string} session.venueName
 * @param {string} session.suburb
 * @param {string} session.region
 * @param {string} session.machineCode — e.g. "A1" (from machineLegend)
 * @param {string} session.profileName — user display name
 * @param {number} session.spins
 * @param {number} session.totalWagered
 * @param {number} session.totalWon
 * @param {Object} session.wins50plus — { count, total }
 * @param {Object} session.bigWins — { count, total }
 * @param {Object} session.bonusWins — { count, total }
 * @param {Object} session.majorJackpots — { count, total }
 * @param {Object} session.grandJackpots — { count, total }
 * @param {Array}  session.winLog — [{ amount, ts, categories, isBonus }]
 * @param {number} session.duration — ms
 */
export function submitSession(session) {
  const data = loadData()
  const key = `${session.venueId}::${session.machineCode}`

  if (!data[key]) {
    data[key] = {
      venueId: session.venueId,
      venueName: session.venueName,
      suburb: session.suburb || '',
      region: session.region || '',
      machineCode: session.machineCode,
      sessions: [],
    }
  }

  const entry = {
    ts: Date.now(),
    profileName: session.profileName || 'Anonymous',
    spins: session.spins || 0,
    wagered: session.totalWagered || 0,
    won: session.totalWon || 0,
    rtp: session.totalWagered > 0 ? (session.totalWon / session.totalWagered) * 100 : 0,
    wins50plus: session.wins50plus || { count: 0, total: 0 },
    bigWins: session.bigWins || { count: 0, total: 0 },
    bonusWins: session.bonusWins || { count: 0, total: 0 },
    majorJackpots: session.majorJackpots || { count: 0, total: 0 },
    grandJackpots: session.grandJackpots || { count: 0, total: 0 },
    winLog: (session.winLog || []).slice(-30),
    duration: session.duration || 0,
  }

  data[key].sessions.push(entry)
  if (data[key].sessions.length > 50) {
    data[key].sessions = data[key].sessions.slice(-50)
  }
  saveData(data)

  // Session log
  const log = loadSessionLog()
  log.push({
    ts: entry.ts,
    venueId: session.venueId,
    venueName: session.venueName,
    machineCode: session.machineCode,
    profileName: entry.profileName,
    spins: entry.spins,
    wagered: entry.wagered,
    won: entry.won,
    net: entry.won - entry.wagered,
    wins50plus: entry.wins50plus.count,
    bigWins: entry.bigWins.count,
    bonusWins: entry.bonusWins.count,
    majorJackpots: entry.majorJackpots.count,
    grandJackpots: entry.grandJackpots.count,
  })
  if (log.length > 200) log.splice(0, log.length - 200)
  saveSessionLog(log)

  return entry
}

// ─── Wet/Dry Score Calculation ───

function calcWetDry(sessions) {
  if (sessions.length === 0) return 50

  const t = sessions.reduce((acc, s) => {
    acc.spins += s.spins
    acc.wagered += s.wagered
    acc.won += s.won
    acc.wins50plus += s.wins50plus.count
    acc.bigWins += s.bigWins.count
    acc.bonusWins += s.bonusWins.count
    acc.majorJackpots += s.majorJackpots.count
    acc.grandJackpots += s.grandJackpots.count
    return acc
  }, { spins: 0, wagered: 0, won: 0, wins50plus: 0, bigWins: 0, bonusWins: 0, majorJackpots: 0, grandJackpots: 0 })

  if (t.spins === 0) return 50

  const rtpFactor = t.wagered > 0 ? Math.min(100, (t.won / t.wagered) * 100) : 50
  const winFreq = Math.min(100, (t.wins50plus / Math.max(1, t.spins)) * 500)
  const bigFactor = Math.min(100, t.bigWins * 15)
  const bonusFactor = Math.min(100, (t.bonusWins / Math.max(1, t.spins)) * 800)
  const jackpotFactor = Math.min(100, (t.majorJackpots * 25) + (t.grandJackpots * 50))

  const score = Math.round(
    rtpFactor * 0.25 +
    winFreq * 0.20 +
    bigFactor * 0.20 +
    bonusFactor * 0.20 +
    jackpotFactor * 0.15
  )

  return Math.max(0, Math.min(100, score))
}

// ─── Analytics Queries ───

/**
 * Get full analytics for a venue — all machines with wet/dry scores.
 */
export function getVenueAnalytics(venueId) {
  const data = loadData()
  const machineEntries = Object.values(data).filter(d => d.venueId === venueId)

  if (machineEntries.length === 0) {
    return { machines: [], summary: null, recentSessions: [] }
  }

  const machineAnalytics = machineEntries.map(entry => {
    const all = entry.sessions
    const recent = all.filter(s => s.ts > Date.now() - WEEK_MS)

    const totalSpins = all.reduce((s, e) => s + e.spins, 0)
    const totalWagered = all.reduce((s, e) => s + e.wagered, 0)
    const totalWon = all.reduce((s, e) => s + e.won, 0)

    const score = calcWetDry(all)
    const recentScore = calcWetDry(recent)
    const avgRtp = totalWagered > 0 ? Math.round((totalWon / totalWagered) * 1000) / 10 : 0

    return {
      machineCode: entry.machineCode,
      sessionCount: all.length,
      recentSessionCount: recent.length,
      score,
      recentScore,
      status: score >= 65 ? 'WET' : score >= 40 ? 'NEUTRAL' : 'DRY',
      trend: recent.length >= 2 ? (recentScore > score ? 'UP' : recentScore < score ? 'DOWN' : 'FLAT') : 'FLAT',
      avgRtp,
      totalSpins,
      totalWagered: Math.round(totalWagered * 100) / 100,
      totalWon: Math.round(totalWon * 100) / 100,
      wins50plus: { count: all.reduce((s, e) => s + e.wins50plus.count, 0), total: Math.round(all.reduce((s, e) => s + e.wins50plus.total, 0) * 100) / 100 },
      bigWins: { count: all.reduce((s, e) => s + e.bigWins.count, 0), total: Math.round(all.reduce((s, e) => s + e.bigWins.total, 0) * 100) / 100 },
      bonusWins: { count: all.reduce((s, e) => s + e.bonusWins.count, 0), total: Math.round(all.reduce((s, e) => s + e.bonusWins.total, 0) * 100) / 100 },
      majorJackpots: { count: all.reduce((s, e) => s + e.majorJackpots.count, 0), total: Math.round(all.reduce((s, e) => s + e.majorJackpots.total, 0) * 100) / 100 },
      grandJackpots: { count: all.reduce((s, e) => s + e.grandJackpots.count, 0), total: Math.round(all.reduce((s, e) => s + e.grandJackpots.total, 0) * 100) / 100 },
      lastSession: all.length > 0 ? Math.max(...all.map(s => s.ts)) : null,
      lastProfileName: all.length > 0 ? all[all.length - 1].profileName : 'Unknown',
    }
  })

  machineAnalytics.sort((a, b) => b.score - a.score)

  const allScores = machineAnalytics.map(m => m.score)
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 50

  const recentSessions = machineEntries.flatMap(e =>
    e.sessions.map(s => ({ ...s, machineCode: e.machineCode }))
  ).sort((a, b) => b.ts - a.ts).slice(0, 20)

  return {
    machines: machineAnalytics,
    summary: {
      totalMachines: machineAnalytics.length,
      avgScore,
      status: avgScore >= 65 ? 'WET' : avgScore >= 40 ? 'NEUTRAL' : 'DRY',
      wetCount: machineAnalytics.filter(m => m.status === 'WET').length,
      neutralCount: machineAnalytics.filter(m => m.status === 'NEUTRAL').length,
      dryCount: machineAnalytics.filter(m => m.status === 'DRY').length,
      totalSessions: machineAnalytics.reduce((s, m) => s + m.sessionCount, 0),
    },
    recentSessions,
  }
}

/**
 * Get graph data for a specific machine at a venue.
 */
export function getMachineGraphData(venueId, machineCode) {
  const data = loadData()
  const key = `${venueId}::${machineCode}`
  const entry = data[key]

  if (!entry || entry.sessions.length === 0) {
    return { wetDryTrend: [], winBreakdown: [], sessionHistory: [] }
  }

  const sessions = entry.sessions.slice(-15)

  const wetDryTrend = sessions.map(s => {
    const score = calcWetDry([s])
    return {
      date: fmtDate(s.ts),
      score,
      fill: score >= 65 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444',
      profile: s.profileName,
      spins: s.spins,
      won: Math.round(s.won * 100) / 100,
      wagered: Math.round(s.wagered * 100) / 100,
    }
  })

  const winBreakdown = sessions.map(s => ({
    date: fmtDate(s.ts),
    'Wins $50+': s.wins50plus.total,
    'Big Wins': s.bigWins.total,
    'Bonus Wins': s.bonusWins.total,
    'Major JP': s.majorJackpots.total,
    'Grand JP': s.grandJackpots.total,
    profile: s.profileName,
  }))

  const sessionHistory = sessions.map(s => ({
    date: fmtDate(s.ts),
    fullDate: new Date(s.ts).toLocaleString(),
    profile: s.profileName,
    spins: s.spins,
    wagered: Math.round(s.wagered * 100) / 100,
    won: Math.round(s.won * 100) / 100,
    net: Math.round((s.won - s.wagered) * 100) / 100,
    rtp: Math.round(s.rtp * 10) / 10,
    wins50plus: s.wins50plus.count,
    bigWins: s.bigWins.count,
    bonusWins: s.bonusWins.count,
    majorJackpots: s.majorJackpots.count,
    grandJackpots: s.grandJackpots.count,
    score: calcWetDry([s]),
  }))

  return { wetDryTrend, winBreakdown, sessionHistory }
}

/**
 * Get list of all venues with session data.
 */
export function getTrackedVenues() {
  const data = loadData()
  const venueMap = {}

  Object.values(data).forEach(entry => {
    if (!venueMap[entry.venueId]) {
      venueMap[entry.venueId] = {
        venueId: entry.venueId,
        venueName: entry.venueName,
        suburb: entry.suburb,
        region: entry.region,
        machineCount: 0,
        sessionCount: 0,
        lastActivity: 0,
      }
    }
    venueMap[entry.venueId].machineCount++
    venueMap[entry.venueId].sessionCount += entry.sessions.length
    const lastTs = entry.sessions.length > 0 ? Math.max(...entry.sessions.map(s => s.ts)) : 0
    if (lastTs > venueMap[entry.venueId].lastActivity) {
      venueMap[entry.venueId].lastActivity = lastTs
    }
  })

  return Object.values(venueMap).sort((a, b) => b.lastActivity - a.lastActivity)
}

/**
 * Get session log (activity feed).
 */
export function getSessionLog() {
  return loadSessionLog().sort((a, b) => b.ts - a.ts).slice(0, 50)
}

// ─── Demo Data Seeder ───

export function seedDemoData(venues) {
  const data = loadData()
  if (Object.keys(data).length > 0) return

  const now = Date.now()
  const profiles = ['Slotmaster', 'LuckyPunter', 'DragonChaser', 'BonusHunter', 'SpinKing', 'PokieQueen']
  const sample = venues.slice(0, 12)

  sample.forEach((venue, vi) => {
    const letter = String.fromCharCode(65 + (vi % 26))
    const mc = 3 + Math.floor(Math.random() * 5)

    for (let mi = 0; mi < mc; mi++) {
      const code = `${letter}${mi + 1}`
      const key = `${venue.id}::${code}`
      const sc = 2 + Math.floor(Math.random() * 6)
      const sessions = []

      for (let si = 0; si < sc; si++) {
        const age = Math.random() * WEEK_MS * 2
        const spins = 30 + Math.floor(Math.random() * 200)
        const avgBet = 0.50 + Math.random() * 3
        const wagered = spins * avgBet
        const rtp = 0.82 + Math.random() * 0.20
        const won = wagered * rtp * (0.5 + Math.random())
        const profile = profiles[Math.floor(Math.random() * profiles.length)]

        const w50c = Math.random() > 0.4 ? Math.floor(Math.random() * 4) : 0
        const w50t = w50c * (50 + Math.random() * 150)
        const bigC = Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0
        const bigT = bigC * (avgBet * (15 + Math.random() * 40))
        const bonC = Math.floor(spins / (40 + Math.random() * 60))
        const bonT = bonC * (avgBet * (10 + Math.random() * 30))
        const majC = Math.random() > 0.85 ? 1 : 0
        const majT = majC * (500 + Math.random() * 500)
        const grdC = Math.random() > 0.95 ? 1 : 0
        const grdT = grdC * (2000 + Math.random() * 3000)

        const totalWon = won + w50t + bigT + bonT + majT + grdT

        sessions.push({
          ts: now - age,
          profileName: profile,
          spins,
          wagered: Math.round(wagered * 100) / 100,
          won: Math.round(totalWon * 100) / 100,
          rtp: wagered > 0 ? (totalWon / wagered) * 100 : 0,
          wins50plus: { count: w50c, total: Math.round(w50t * 100) / 100 },
          bigWins: { count: bigC, total: Math.round(bigT * 100) / 100 },
          bonusWins: { count: bonC, total: Math.round(bonT * 100) / 100 },
          majorJackpots: { count: majC, total: Math.round(majT * 100) / 100 },
          grandJackpots: { count: grdC, total: Math.round(grdT * 100) / 100 },
          winLog: [],
          duration: spins * (4000 + Math.random() * 3000),
        })
      }

      data[key] = {
        venueId: venue.id,
        venueName: venue.name,
        suburb: venue.suburb || '',
        region: venue.region || '',
        machineCode: code,
        sessions,
      }
    }
  })

  saveData(data)
}

// ─── Tracked Venue List (user-curated, up to 200) ───

const TRACKED_LIST_KEY = 'pokie-tracked-venues'
const MAX_TRACKED = 200

function loadTrackedList() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(TRACKED_LIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTrackedList(list) {
  localStorage.setItem(TRACKED_LIST_KEY, JSON.stringify(list))
}

/** Get the user's curated tracked venue list */
export function getUserTrackedVenues() {
  return loadTrackedList()
}

/** Check if a venue is in the tracked list */
export function isVenueTracked(venueId) {
  return loadTrackedList().some(v => v.id === venueId)
}

/** Add a venue to tracked list. Returns false if already tracked or at limit. */
export function trackVenue(venue) {
  const list = loadTrackedList()
  if (list.some(v => v.id === venue.id)) return false
  if (list.length >= MAX_TRACKED) return false
  list.push({
    id: venue.id,
    name: venue.name,
    suburb: venue.suburb || '',
    region: venue.region || '',
    type: venue.type || '',
    addedAt: Date.now(),
  })
  saveTrackedList(list)
  return true
}

/** Remove a venue from tracked list */
export function untrackVenue(venueId) {
  const list = loadTrackedList().filter(v => v.id !== venueId)
  saveTrackedList(list)
}

/** Get tracked count */
export function getTrackedCount() {
  return loadTrackedList().length
}

// ─── Helpers ───

function fmtDate(ts) {
  const d = new Date(ts)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
