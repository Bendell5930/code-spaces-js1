/**
 * Heat Analysis Engine
 *
 * Classifies each machine as HOT / NORMAL / COLD based on:
 *   1. Win clusters  — frequency and size of recent wins
 *   2. Bonus clusters — how often bonuses trigger, gaps between them
 *   3. Spins since last bonus — recency of bonus activity
 *   4. Win rate trend — is the machine paying more/less over recent spins?
 *
 * Returns a heat score (0–100) per machine:
 *   0–33  = COLD   (blue)
 *   34–66 = NORMAL (amber)
 *   67–100 = HOT   (red/orange)
 *
 * Also returns per-spin heat timeline data for graphing.
 */

export const HEAT_LEVEL = {
  HOT: 'HOT',
  NORMAL: 'NORMAL',
  COLD: 'COLD',
}

/**
 * Calculate heat score for a single machine based on its spins.
 *
 * @param {Array} machineSpins – all spins for this machine, time-ordered
 * @returns {{ score: number, level: string, factors: object }}
 */
export function calcHeatScore(machineSpins) {
  if (!machineSpins || machineSpins.length === 0) {
    return { score: 50, level: HEAT_LEVEL.NORMAL, factors: {} }
  }

  const total = machineSpins.length
  const recent = machineSpins.slice(-30) // last 30 spins weigh more

  // ── Factor 1: Win rate (0–25 points) ──
  const recentWins = recent.filter((s) => (s.winAmount || 0) > 0).length
  const recentWinRate = recentWins / recent.length
  const winRateScore = Math.min(25, Math.round(recentWinRate * 50))

  // ── Factor 2: Win cluster density (0–25 points) ──
  // Count consecutive wins in recent spins
  let maxStreak = 0, currentStreak = 0
  for (const s of recent) {
    if ((s.winAmount || 0) > 0) {
      currentStreak++
      if (currentStreak > maxStreak) maxStreak = currentStreak
    } else {
      currentStreak = 0
    }
  }
  const winClusterScore = Math.min(25, maxStreak * 5)

  // ── Factor 3: Bonus frequency (0–25 points) ──
  const recentBonuses = recent.filter((s) => s.bonusHit).length
  const bonusRate = recentBonuses / recent.length
  const bonusFreqScore = Math.min(25, Math.round(bonusRate * 100))

  // ── Factor 4: Spins since last bonus — recency (0–25 points) ──
  let spinsSinceLastBonus = total // default: never hit bonus
  for (let i = machineSpins.length - 1; i >= 0; i--) {
    if (machineSpins[i].bonusHit) {
      spinsSinceLastBonus = machineSpins.length - 1 - i
      break
    }
  }
  // Fewer spins since bonus = hotter (bonus was recent)
  const bonusRecencyScore =
    spinsSinceLastBonus <= 5  ? 25 :
    spinsSinceLastBonus <= 15 ? 18 :
    spinsSinceLastBonus <= 30 ? 12 :
    spinsSinceLastBonus <= 60 ? 6  : 0

  const score = Math.min(100, winRateScore + winClusterScore + bonusFreqScore + bonusRecencyScore)

  const level =
    score >= 67 ? HEAT_LEVEL.HOT :
    score >= 34 ? HEAT_LEVEL.NORMAL :
    HEAT_LEVEL.COLD

  return {
    score,
    level,
    factors: {
      winRate: winRateScore,
      winCluster: winClusterScore,
      bonusFreq: bonusFreqScore,
      bonusRecency: bonusRecencyScore,
      spinsSinceLastBonus,
      totalSpins: total,
      recentWinRate: +(recentWinRate * 100).toFixed(1),
    },
  }
}

/**
 * Build heat summaries for all machines from the full spin list.
 *
 * @param {Array} allSpins
 * @returns {Array<{ name, score, level, factors }>}
 */
export function buildMachineHeatMap(allSpins) {
  const byMachine = {}
  for (const s of allSpins) {
    if (!s.machineName) continue
    if (!byMachine[s.machineName]) byMachine[s.machineName] = []
    byMachine[s.machineName].push(s)
  }

  return Object.entries(byMachine)
    .map(([name, spins]) => {
      const { score, level, factors } = calcHeatScore(spins)
      return { name, score, level, factors }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * Build per-spin rolling heat timeline for a single machine.
 * Returns an array of { spinNum, heat, winAmount, bonusHit }
 * for graphing the heat trend over time.
 *
 * Uses a rolling window of the last N spins to calculate heat at each point.
 *
 * @param {Array} machineSpins – time-ordered spins for one machine
 * @param {number} window – rolling window size (default 10)
 * @returns {Array}
 */
export function buildHeatTimeline(machineSpins, window = 10) {
  if (!machineSpins || machineSpins.length === 0) return []

  const timeline = []

  for (let i = 0; i < machineSpins.length; i++) {
    const start = Math.max(0, i - window + 1)
    const windowSpins = machineSpins.slice(start, i + 1)
    const { score } = calcHeatScore(windowSpins)
    const s = machineSpins[i]

    timeline.push({
      spinNum: i + 1,
      heat: score,
      winAmount: s.winAmount || 0,
      bonusHit: s.bonusHit ? 1 : 0,
      spinsSinceBonus: s.spinsSinceBonus ?? null,
    })
  }

  return timeline
}

/**
 * Get heat colour for a score value.
 * @param {number} score 0-100
 * @returns {string} CSS colour
 */
export function heatColor(score) {
  if (score >= 67) return '#ef4444' // red — HOT
  if (score >= 50) return '#f59e0b' // amber — warm
  if (score >= 34) return '#94a3b8' // slate — NORMAL
  return '#3b82f6'                  // blue — COLD
}

/**
 * Get status label + emoji for a heat level.
 */
export function heatLabel(level) {
  if (level === HEAT_LEVEL.HOT) return { text: 'HOT', emoji: '🔥' }
  if (level === HEAT_LEVEL.COLD) return { text: 'COLD', emoji: '🧊' }
  return { text: 'NORMAL', emoji: '➖' }
}
