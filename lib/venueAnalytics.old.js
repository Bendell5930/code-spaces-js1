/**
 * Venue Analytics Engine — Wet/Dry Machine Analysis
 *
 * Collects session data from ALL users (localStorage-simulated crowd data).
 * Analyses win clusters, big wins, and bonus wins per machine per venue.
 * Produces Wet (paying) / Dry (not paying) scores for each machine.
 *
 * Data flow:
 *   User ends session → submitSessionData() → stored per venue+machine
 *   User views insights → getVenueAnalytics() → Wet/Dry scores + graph data
 *
 * Wet = Machine paying out frequently / above average
 * Dry = Machine holding / below average payouts
 *
 * Score: 0 (bone dry) → 50 (neutral) → 100 (soaking wet)
 */

const VENUE_DATA_KEY = 'pokie-venue-analytics'
const SESSION_LOG_KEY = 'pokie-session-log'

// ─── Time windows for analysis ───
const HOUR_MS = 3600000
const DAY_MS = 86400000
const WEEK_MS = DAY_MS * 7

// ─── Thresholds ───
const BIG_WIN_MULTIPLIER = 15 // Win >= 15x total bet = big win
const MIN_SESSIONS_FOR_SCORE = 2

// ─── Storage helpers ───

function loadVenueData() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(VENUE_DATA_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveVenueData(data) {
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

// ─── Submit session data at end of pokie session ───

/**
 * Called when user ends a session. Records all session metrics
 * per venue + machine for crowd analytics.
 *
 * @param {Object} session
 * @param {string} session.venueId — Venue ID from qldVenues
 * @param {string} session.venueName — Venue display name
 * @param {string} session.machine — Machine game name
 * @param {number} session.totalSpins — Number of spins in session
 * @param {number} session.totalWagered — Total $ wagered
 * @param {number} session.totalWon — Total $ won (all wins)
 * @param {number} session.bigWins — Count of big wins (15x+)
 * @param {number} session.bigWinTotal — Total $ from big wins
 * @param {number} session.bonusCount — Number of bonus/feature triggers
 * @param {number} session.bonusWinTotal — Total $ from bonus rounds
 * @param {Array} session.winTimestamps — Array of { time, amount } for cluster analysis
 * @param {number} session.sessionDuration — Session length in ms
 * @param {string} session.location — Optional suburb/location label
 */
export function submitSessionData(session) {
  const data = loadVenueData()
  const key = `${session.venueId}::${session.machine}`

  if (!data[key]) {
    data[key] = {
      venueId: session.venueId,
      venueName: session.venueName,
      machine: session.machine,
      sessions: [],
      totalSessions: 0,
    }
  }

  const entry = {
    ts: Date.now(),
    spins: session.totalSpins || 0,
    wagered: session.totalWagered || 0,
    won: session.totalWon || 0,
    bigWins: session.bigWins || 0,
    bigWinTotal: session.bigWinTotal || 0,
    bonusCount: session.bonusCount || 0,
    bonusWinTotal: session.bonusWinTotal || 0,
    winTimestamps: (session.winTimestamps || []).slice(-50), // Keep last 50 for cluster analysis
    duration: session.sessionDuration || 0,
    rtp: session.totalWagered > 0 ? (session.totalWon / session.totalWagered) * 100 : 0,
  }

  data[key].sessions.push(entry)
  data[key].totalSessions++

  // Trim old sessions (keep last 90 days)
  const cutoff = Date.now() - (DAY_MS * 90)
  data[key].sessions = data[key].sessions.filter(s => s.ts > cutoff)

  saveVenueData(data)

  // Also log to session history
  const log = loadSessionLog()
  log.push({
    ts: Date.now(),
    venueId: session.venueId,
    venueName: session.venueName,
    machine: session.machine,
    spins: session.totalSpins || 0,
    wagered: session.totalWagered || 0,
    won: session.totalWon || 0,
    net: (session.totalWon || 0) - (session.totalWagered || 0),
    bonuses: session.bonusCount || 0,
    bigWins: session.bigWins || 0,
  })
  // Keep last 500 session logs
  if (log.length > 500) log.splice(0, log.length - 500)
  saveSessionLog(log)

  return entry
}

// ─── Generate simulated crowd data for demo/initial state ───

/**
 * Seeds realistic demo data so graphs aren't empty for new users.
 * Called once on first load. Simulates crowd sessions over past 7 days.
 */
export function seedDemoDataIfEmpty(venues, getMachines) {
  const data = loadVenueData()
  if (Object.keys(data).length > 0) return // Already has data

  const now = Date.now()
  const venueSample = venues.slice(0, 20) // Seed first 20 venues

  venueSample.forEach(venue => {
    const machines = getMachines(venue).slice(0, 8) // Top 8 machines per venue
    machines.forEach(machine => {
      const key = `${venue.id}::${machine}`
      const sessionCount = 3 + Math.floor(Math.random() * 8) // 3-10 sessions
      const sessions = []

      for (let i = 0; i < sessionCount; i++) {
        const age = Math.random() * WEEK_MS
        const spins = 30 + Math.floor(Math.random() * 200)
        const avgBet = 0.5 + Math.random() * 2
        const wagered = spins * avgBet
        // RTP between 85-95% with variance
        const rtp = 0.82 + Math.random() * 0.18
        const won = wagered * rtp * (0.5 + Math.random())
        const bigWins = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0
        const bigWinTotal = bigWins * (avgBet * (15 + Math.random() * 50))
        const bonusCount = Math.floor(spins / (40 + Math.random() * 60))
        const bonusWinTotal = bonusCount * (avgBet * (10 + Math.random() * 30))

        // Generate win timestamps for clustering
        const winTimestamps = []
        const winCount = Math.floor(spins * (0.2 + Math.random() * 0.2))
        for (let w = 0; w < winCount; w++) {
          winTimestamps.push({
            time: now - age + (Math.random() * 3600000),
            amount: avgBet * (1 + Math.random() * 8),
          })
        }

        sessions.push({
          ts: now - age,
          spins,
          wagered: Math.round(wagered * 100) / 100,
          won: Math.round((won + bigWinTotal + bonusWinTotal) * 100) / 100,
          bigWins,
          bigWinTotal: Math.round(bigWinTotal * 100) / 100,
          bonusCount,
          bonusWinTotal: Math.round(bonusWinTotal * 100) / 100,
          winTimestamps: winTimestamps.slice(0, 30),
          duration: spins * (4000 + Math.random() * 3000),
          rtp: 0,
        })
      }

      // Calculate RTP for each
      sessions.forEach(s => {
        s.rtp = s.wagered > 0 ? (s.won / s.wagered) * 100 : 0
      })

      data[key] = {
        venueId: venue.id,
        venueName: venue.name,
        machine,
        sessions,
        totalSessions: sessions.length,
      }
    })
  })

  saveVenueData(data)
}

// ─── Wet/Dry Score Calculation ───

/**
 * Calculate Wet/Dry score (0-100) for a specific metric.
 * Uses percentile ranking across all machines at the venue.
 */
function calcWetDryScore(value, allValues) {
  if (allValues.length === 0) return 50
  const sorted = [...allValues].sort((a, b) => a - b)
  const rank = sorted.findIndex(v => v >= value)
  if (rank === -1) return 100
  return Math.round((rank / sorted.length) * 100)
}

/**
 * Analyse win clustering — measures burst density of wins.
 * High cluster score = wins happen in tight groups (WET pattern).
 * Low cluster score = wins spread thin (DRY pattern).
 */
function analyseWinClusters(sessions) {
  const allWins = []
  sessions.forEach(s => {
    (s.winTimestamps || []).forEach(wt => {
      allWins.push(wt)
    })
  })
  if (allWins.length < 3) return { score: 50, clusters: 0, avgGap: 0, density: 0 }

  allWins.sort((a, b) => a.time - b.time)

  // Find clusters: wins within 60 seconds of each other
  const CLUSTER_GAP = 60000 // 60 seconds
  let clusters = 0
  let currentCluster = 1
  let totalGap = 0

  for (let i = 1; i < allWins.length; i++) {
    const gap = allWins[i].time - allWins[i - 1].time
    totalGap += gap
    if (gap <= CLUSTER_GAP) {
      currentCluster++
    } else {
      if (currentCluster >= 3) clusters++
      currentCluster = 1
    }
  }
  if (currentCluster >= 3) clusters++

  const avgGap = totalGap / (allWins.length - 1)
  const density = allWins.length / Math.max(1, sessions.length)

  // Score: more clusters + higher density = wetter
  const clusterScore = Math.min(100, clusters * 20 + density * 5)
  return {
    score: Math.round(clusterScore),
    clusters,
    avgGap: Math.round(avgGap / 1000), // seconds
    density: Math.round(density * 10) / 10,
    totalWins: allWins.length,
  }
}

/**
 * Analyse big wins pattern
 */
function analyseBigWins(sessions) {
  const totalSessions = sessions.length
  if (totalSessions === 0) return { score: 50, count: 0, total: 0, frequency: 0, avgSize: 0 }

  const totalBigWins = sessions.reduce((sum, s) => sum + (s.bigWins || 0), 0)
  const totalBigWinAmount = sessions.reduce((sum, s) => sum + (s.bigWinTotal || 0), 0)
  const totalWagered = sessions.reduce((sum, s) => sum + (s.wagered || 0), 0)

  const frequency = totalBigWins / totalSessions // Big wins per session
  const avgSize = totalBigWins > 0 ? totalBigWinAmount / totalBigWins : 0
  const returnRatio = totalWagered > 0 ? (totalBigWinAmount / totalWagered) * 100 : 0

  // Score: frequency + return ratio combined
  const score = Math.min(100, Math.round(frequency * 30 + returnRatio * 2))
  return {
    score,
    count: totalBigWins,
    total: Math.round(totalBigWinAmount * 100) / 100,
    frequency: Math.round(frequency * 100) / 100,
    avgSize: Math.round(avgSize * 100) / 100,
  }
}

/**
 * Analyse bonus/feature wins
 */
function analyseBonusWins(sessions) {
  const totalSessions = sessions.length
  if (totalSessions === 0) return { score: 50, count: 0, total: 0, frequency: 0, avgPayout: 0 }

  const totalBonuses = sessions.reduce((sum, s) => sum + (s.bonusCount || 0), 0)
  const totalBonusAmount = sessions.reduce((sum, s) => sum + (s.bonusWinTotal || 0), 0)
  const totalSpins = sessions.reduce((sum, s) => sum + (s.spins || 0), 0)
  const totalWagered = sessions.reduce((sum, s) => sum + (s.wagered || 0), 0)

  const frequency = totalSpins > 0 ? totalBonuses / (totalSpins / 100) : 0 // Bonuses per 100 spins
  const avgPayout = totalBonuses > 0 ? totalBonusAmount / totalBonuses : 0
  const returnRatio = totalWagered > 0 ? (totalBonusAmount / totalWagered) * 100 : 0

  const score = Math.min(100, Math.round(frequency * 10 + returnRatio * 1.5))
  return {
    score,
    count: totalBonuses,
    total: Math.round(totalBonusAmount * 100) / 100,
    frequency: Math.round(frequency * 100) / 100,
    avgPayout: Math.round(avgPayout * 100) / 100,
  }
}

// ─── Main Analytics API ───

/**
 * Get full Wet/Dry analytics for a specific venue.
 * Returns per-machine breakdown with 3 graph datasets.
 *
 * @param {string} venueId
 * @returns {Object} { machines: [...], summary, lastUpdated }
 */
export function getVenueAnalytics(venueId) {
  const data = loadVenueData()

  // Find all machine entries for this venue
  const machineEntries = Object.values(data).filter(d => d.venueId === venueId)

  if (machineEntries.length === 0) {
    return { machines: [], summary: null, lastUpdated: null }
  }

  // Calculate per-machine metrics
  const machineAnalytics = machineEntries.map(entry => {
    const recentSessions = entry.sessions.filter(s => s.ts > Date.now() - WEEK_MS)
    const allSessions = entry.sessions

    const winClusters = analyseWinClusters(allSessions)
    const bigWins = analyseBigWins(allSessions)
    const bonusWins = analyseBonusWins(allSessions)

    // Overall Wet/Dry is weighted average
    const overallScore = Math.round(
      winClusters.score * 0.35 +
      bigWins.score * 0.35 +
      bonusWins.score * 0.30
    )

    const totalWagered = allSessions.reduce((sum, s) => sum + s.wagered, 0)
    const totalWon = allSessions.reduce((sum, s) => sum + s.won, 0)
    const avgRtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0

    return {
      machine: entry.machine,
      sessionCount: entry.totalSessions,
      recentSessionCount: recentSessions.length,
      overallScore,
      status: overallScore >= 65 ? 'WET' : overallScore >= 40 ? 'NEUTRAL' : 'DRY',
      winClusters,
      bigWins,
      bonusWins,
      avgRtp: Math.round(avgRtp * 10) / 10,
      totalWagered: Math.round(totalWagered * 100) / 100,
      totalWon: Math.round(totalWon * 100) / 100,
      lastSession: allSessions.length > 0
        ? Math.max(...allSessions.map(s => s.ts))
        : null,
    }
  })

  // Sort by overall score descending (wettest first)
  machineAnalytics.sort((a, b) => b.overallScore - a.overallScore)

  // Venue summary
  const allScores = machineAnalytics.map(m => m.overallScore)
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 50

  return {
    machines: machineAnalytics,
    summary: {
      totalMachinesTracked: machineAnalytics.length,
      avgScore,
      status: avgScore >= 65 ? 'WET' : avgScore >= 40 ? 'NEUTRAL' : 'DRY',
      wetCount: machineAnalytics.filter(m => m.status === 'WET').length,
      dryCount: machineAnalytics.filter(m => m.status === 'DRY').length,
      neutralCount: machineAnalytics.filter(m => m.status === 'NEUTRAL').length,
    },
    lastUpdated: Math.max(...machineAnalytics.map(m => m.lastSession || 0)) || null,
  }
}

/**
 * Get Wet/Dry analytics for a specific machine at a specific venue.
 */
export function getMachineAnalytics(venueId, machineName) {
  const analytics = getVenueAnalytics(venueId)
  return analytics.machines.find(m => m.machine === machineName) || null
}

/**
 * Get graph data for the 3 Wet/Dry charts for a specific machine.
 * Returns formatted data ready for recharts.
 */
export function getMachineGraphData(venueId, machineName) {
  const data = loadVenueData()
  const key = `${venueId}::${machineName}`
  const entry = data[key]

  if (!entry || entry.sessions.length === 0) {
    return { winClusterGraph: [], bigWinGraph: [], bonusGraph: [] }
  }

  const sessions = [...entry.sessions].sort((a, b) => a.ts - b.ts)

  // ─── Graph 1: Win Clusters (Wet/Dry timeline) ───
  // Shows win density over recent sessions
  const winClusterGraph = sessions.map((s, i) => {
    const wins = (s.winTimestamps || []).length
    const density = s.spins > 0 ? (wins / s.spins) * 100 : 0
    const score = Math.min(100, Math.round(density * 3.5))
    return {
      session: `S${i + 1}`,
      date: new Date(s.ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      winCount: wins,
      spins: s.spins,
      density: Math.round(density * 10) / 10,
      score,
      status: score >= 65 ? 'WET' : score >= 40 ? 'NEUTRAL' : 'DRY',
      fill: score >= 65 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444',
    }
  })

  // ─── Graph 2: Big Wins (Wet/Dry) ───
  const bigWinGraph = sessions.map((s, i) => {
    const bigWinRatio = s.wagered > 0 ? (s.bigWinTotal / s.wagered) * 100 : 0
    const score = Math.min(100, Math.round(s.bigWins * 30 + bigWinRatio * 2))
    return {
      session: `S${i + 1}`,
      date: new Date(s.ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      bigWins: s.bigWins,
      bigWinTotal: s.bigWinTotal,
      wagered: s.wagered,
      score,
      status: score >= 65 ? 'WET' : score >= 40 ? 'NEUTRAL' : 'DRY',
      fill: score >= 65 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444',
    }
  })

  // ─── Graph 3: Bonus Wins (Wet/Dry) ───
  const bonusGraph = sessions.map((s, i) => {
    const bonusFreq = s.spins > 0 ? (s.bonusCount / s.spins) * 100 : 0
    const bonusRatio = s.wagered > 0 ? (s.bonusWinTotal / s.wagered) * 100 : 0
    const score = Math.min(100, Math.round(bonusFreq * 15 + bonusRatio * 1.5))
    return {
      session: `S${i + 1}`,
      date: new Date(s.ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      bonusCount: s.bonusCount,
      bonusTotal: s.bonusWinTotal,
      spins: s.spins,
      score,
      status: score >= 65 ? 'WET' : score >= 40 ? 'NEUTRAL' : 'DRY',
      fill: score >= 65 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444',
    }
  })

  return { winClusterGraph, bigWinGraph, bonusGraph }
}

/**
 * Get user's session log history
 */
export function getSessionLog() {
  return loadSessionLog()
}

/**
 * Clear all venue analytics data
 */
export function clearVenueData() {
  localStorage.removeItem(VENUE_DATA_KEY)
  localStorage.removeItem(SESSION_LOG_KEY)
}
