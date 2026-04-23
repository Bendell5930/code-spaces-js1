/**
 * RTP-Accurate Spin Simulator
 *
 * Generates synthetic spin streams that match the statistical properties of
 * real Class III electronic gaming machines. Used for:
 *   • Demoing graphs with realistic-looking data BEFORE real venue testing
 *   • Regression testing heat analysis / bonus-cluster logic
 *   • Producing reproducible datasets for regulator / lawyer briefings
 *
 * The simulator follows the same approach manufacturers use for certification
 * harness output: a fixed Return-To-Player (RTP), a fixed hit frequency, and
 * a weighted prize table whose expected value reconciles to RTP × bet.
 *
 * Output shape matches the spin record produced by `components/DataEntryForm`
 * (machineName, denomination, betAmount, lines, totalBalance, winAmount,
 *  bonusHit, spinsSinceBonus, timestamp) so simulated spins can flow straight
 * into `SpinHistory`, `heatAnalysis`, and `MachineHeatMap` unchanged.
 *
 * NOTHING in this file reads from a real machine. It is purely a
 * mathematical model — no scraping, no OCR, no hardware access.
 */

// ─── Seedable PRNG (mulberry32) — deterministic so demos are reproducible ───

export function makeRng(seed = Date.now() >>> 0) {
  let s = seed >>> 0
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Default machine model ────────────────────────────────────────────────
//
// QLD law (Gaming Machine Act 1991 + supporting standards) requires hotel
// EGMs to return at minimum 85% RTP and clubs at minimum 90%. Most modern
// link games sit between 87.5% and 92%. Hit frequency on link/feature games
// is typically 25%–35%. Bonus / hold-and-spin features fire on a per-spin
// probability calibrated so the bonus contribution sits inside the RTP
// envelope. The defaults below are illustrative, not specific to any real
// game — they are the kind of numbers a manufacturer would publish in a
// PAR sheet.

export const DEFAULT_MODEL = {
  rtp: 0.90,             // 90% return to player
  hitFrequency: 0.30,    // 30% of spins return ≥ bet
  bonusChance: 1 / 180,  // average 1 bonus every ~180 spins
  // Prize table: each tier has a `weight` (relative likelihood given a hit)
  // and a `multiplier` of the bet. Weighted expected value of `multiplier`
  // is normalised at runtime to satisfy RTP exactly given hitFrequency and
  // bonus contribution.
  prizeTable: [
    { weight: 600, multiplier: 0.5 },   // tiny win (loss-disguised-as-win)
    { weight: 250, multiplier: 1.0 },   // break-even
    { weight: 100, multiplier: 2.0 },
    { weight: 35,  multiplier: 5.0 },
    { weight: 12,  multiplier: 10.0 },
    { weight: 2.5, multiplier: 25.0 },
    { weight: 0.4, multiplier: 100.0 },
    { weight: 0.1, multiplier: 500.0 }, // top line-pay
  ],
  // Bonus / hold-and-spin contribution. Average payout when the bonus
  // triggers, expressed as a multiple of the bet. A real PAR sheet would
  // break this down by jackpot tier; we approximate it with a probability
  // mix.
  bonus: {
    avgMultiplier: 25,        // mean payout when bonus hits, in × bet
    jackpotTiers: [
      { name: 'Mini',  chance: 0.85,  multiplier: 5 },
      { name: 'Minor', chance: 0.12,  multiplier: 25 },
      { name: 'Major', chance: 0.027, multiplier: 250 },
      { name: 'Grand', chance: 0.003, multiplier: 2500 },
    ],
  },
}

// ─── RTP calibration ──────────────────────────────────────────────────────

/**
 * Returns a copy of `model` whose `prizeTable` weights are scaled so the
 * total expected value (line wins + bonus contribution) equals `rtp`.
 *
 * This is what a certification lab does when it audits a PAR sheet:
 *   E[win | spin] = hitFrequency × E[mult | hit] + bonusChance × E[bonusMult]
 *                 = rtp
 *
 * If the supplied prize table can't satisfy RTP at the given hit frequency
 * and bonus chance, the line-pay multipliers are uniformly scaled — the
 * shape (variance) is preserved, only the magnitude shifts.
 */
export function calibrateModel(model = DEFAULT_MODEL) {
  const { rtp, hitFrequency, bonusChance, prizeTable, bonus } = model

  const totalWeight = prizeTable.reduce((s, p) => s + p.weight, 0)
  if (totalWeight <= 0) throw new Error('prizeTable must have positive weights')
  if (hitFrequency <= 0 || hitFrequency > 1) {
    throw new Error('hitFrequency must be in (0, 1]')
  }

  // Bonus contribution to RTP
  const bonusEV =
    bonus && bonus.jackpotTiers
      ? bonus.jackpotTiers.reduce((s, t) => s + t.chance * t.multiplier, 0)
      : (bonus?.avgMultiplier ?? 0)
  const bonusContribution = (bonusChance || 0) * bonusEV

  if (bonusContribution >= rtp) {
    throw new Error(
      `bonus contribution (${bonusContribution.toFixed(3)}) exceeds target RTP (${rtp})`
    )
  }

  // Required line-pay EV per spin = rtp - bonus contribution
  const requiredLineEvPerSpin = rtp - bonusContribution
  // E[mult | hit] needed
  const requiredEvGivenHit = requiredLineEvPerSpin / hitFrequency

  // Current E[mult | hit] from supplied weights
  const currentEvGivenHit =
    prizeTable.reduce((s, p) => s + (p.weight / totalWeight) * p.multiplier, 0)

  const scale = requiredEvGivenHit / currentEvGivenHit

  return {
    ...model,
    prizeTable: prizeTable.map((p) => ({
      weight: p.weight,
      multiplier: p.multiplier * scale,
    })),
    _calibration: {
      bonusContribution,
      requiredLineEvPerSpin,
      scale,
    },
  }
}

// ─── Single-spin sampler ──────────────────────────────────────────────────

function pickWeighted(rng, items) {
  const total = items.reduce((s, it) => s + it.weight, 0)
  let r = rng() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

function sampleBonus(rng, bonus, bet) {
  // Pick a jackpot tier proportional to its `chance` field.
  const pool = bonus.jackpotTiers.map((t) => ({ ...t, weight: t.chance }))
  const tier = pickWeighted(rng, pool)
  return {
    bonusHit: true,
    jackpotTier: tier.name,
    winAmount: round2(tier.multiplier * bet),
  }
}

function sampleSpin(rng, model, bet) {
  const r = rng()
  if (r < (model.bonusChance || 0)) {
    return sampleBonus(rng, model.bonus, bet)
  }
  const r2 = rng()
  if (r2 < model.hitFrequency) {
    const prize = pickWeighted(rng, model.prizeTable)
    return {
      bonusHit: false,
      jackpotTier: null,
      winAmount: round2(prize.multiplier * bet),
    }
  }
  return { bonusHit: false, jackpotTier: null, winAmount: 0 }
}

function round2(n) {
  return Math.round(n * 100) / 100
}

// ─── Public API: generate a spin stream ───────────────────────────────────

/**
 * Generate `count` spins for a session.
 *
 * @param {object} opts
 * @param {number} opts.count            – number of spins to generate
 * @param {number} [opts.bet=1]          – credits bet per spin
 * @param {number} [opts.denomination=1] – $ per credit
 * @param {number} [opts.lines=25]       – lines played (informational)
 * @param {number} [opts.startingBalance=200] – starting $ balance
 * @param {string} [opts.machineName='Simulated Machine']
 * @param {number} [opts.seed]           – PRNG seed for reproducibility
 * @param {object} [opts.model]          – machine model (uncalibrated OK)
 * @param {number} [opts.startTime=Date.now()]
 * @param {number} [opts.spinIntervalMs=4500] – avg gap between spins (~4.5s)
 *
 * @returns {Array<object>} spin records compatible with SpinHistory /
 *   heatAnalysis. Each record includes:
 *     machineName, denomination, betAmount, lines, totalBalance,
 *     winAmount, bonusHit, jackpotTier, spinsSinceBonus, timestamp,
 *     simulated:true (flag so the UI can clearly label demo data)
 */
export function generateSpinStream({
  count,
  bet = 1,
  denomination = 1,
  lines = 25,
  startingBalance = 200,
  machineName = 'Simulated Machine',
  seed,
  model,
  startTime = Date.now(),
  spinIntervalMs = 4500,
} = {}) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('count must be a positive integer')
  }

  const rng = makeRng(seed)
  const calibrated = calibrateModel(model || DEFAULT_MODEL)
  const stakePerSpin = bet * denomination
  const spins = []

  let balance = startingBalance
  let spinsSinceBonus = 0
  let t = startTime

  for (let i = 0; i < count; i++) {
    const result = sampleSpin(rng, calibrated, stakePerSpin)
    balance = round2(balance - stakePerSpin + result.winAmount)
    spinsSinceBonus = result.bonusHit ? 0 : spinsSinceBonus + 1

    // Slight jitter on inter-spin time so timestamps look natural.
    t += Math.round(spinIntervalMs * (0.6 + rng() * 0.8))

    spins.push({
      machineName,
      denomination,
      betAmount: bet,
      lines,
      totalBalance: balance,
      winAmount: result.winAmount,
      bonusHit: result.bonusHit,
      jackpotTier: result.jackpotTier,
      spinsSinceBonus,
      timestamp: t,
      simulated: true,
    })
  }

  return spins
}

// ─── Summary helpers (handy for tests + dashboards) ───────────────────────

/**
 * Reduce a spin stream to summary statistics. Used in tests to verify the
 * simulator converges on its target RTP / hit frequency, and by demo screens
 * to caption the chart with "Sample size: N spins, observed RTP: X%".
 */
export function summarise(spins) {
  if (!spins || spins.length === 0) {
    return {
      count: 0,
      totalStake: 0,
      totalWin: 0,
      observedRtp: 0,
      hitFrequency: 0,
      bonusFrequency: 0,
      biggestWin: 0,
    }
  }
  let totalStake = 0
  let totalWin = 0
  let hits = 0
  let bonuses = 0
  let biggest = 0
  for (const s of spins) {
    const stake = (s.betAmount || 0) * (s.denomination || 1)
    totalStake += stake
    totalWin += s.winAmount || 0
    if ((s.winAmount || 0) > 0) hits++
    if (s.bonusHit) bonuses++
    if ((s.winAmount || 0) > biggest) biggest = s.winAmount
  }
  return {
    count: spins.length,
    totalStake: round2(totalStake),
    totalWin: round2(totalWin),
    observedRtp: totalStake > 0 ? totalWin / totalStake : 0,
    hitFrequency: hits / spins.length,
    bonusFrequency: bonuses / spins.length,
    biggestWin: round2(biggest),
  }
}
