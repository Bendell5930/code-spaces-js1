import { describe, test, expect } from '@jest/globals'
import {
  generateSpinStream,
  calibrateModel,
  summarise,
  DEFAULT_MODEL,
  makeRng,
} from '../lib/spinSimulator.js'

describe('spinSimulator – PRNG', () => {
  test('makeRng is deterministic for a given seed', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    const seqA = [a(), a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  test('different seeds produce different sequences', () => {
    const a = makeRng(1)
    const b = makeRng(2)
    expect(a()).not.toBe(b())
  })

  test('rng outputs are in [0, 1)', () => {
    const r = makeRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('spinSimulator – calibrateModel', () => {
  test('calibrated default model has expected line-pay EV per hit', () => {
    const cal = calibrateModel(DEFAULT_MODEL)
    const total = cal.prizeTable.reduce((s, p) => s + p.weight, 0)
    const evPerHit = cal.prizeTable.reduce(
      (s, p) => s + (p.weight / total) * p.multiplier,
      0
    )
    const bonusContribution = cal._calibration.bonusContribution
    const expectedEvPerHit =
      (DEFAULT_MODEL.rtp - bonusContribution) / DEFAULT_MODEL.hitFrequency
    expect(evPerHit).toBeCloseTo(expectedEvPerHit, 6)
  })

  test('throws if bonus contribution exceeds RTP', () => {
    expect(() =>
      calibrateModel({
        ...DEFAULT_MODEL,
        rtp: 0.5,
        bonusChance: 0.5, // huge bonus chance
      })
    ).toThrow(/bonus contribution/)
  })

  test('throws on invalid hit frequency', () => {
    expect(() =>
      calibrateModel({ ...DEFAULT_MODEL, hitFrequency: 0 })
    ).toThrow(/hitFrequency/)
  })
})

describe('spinSimulator – generateSpinStream', () => {
  test('produces the requested number of spins', () => {
    const spins = generateSpinStream({ count: 50, seed: 1 })
    expect(spins.length).toBe(50)
  })

  test('every spin record carries the documented fields and the simulated flag', () => {
    const spins = generateSpinStream({
      count: 5,
      seed: 9,
      machineName: 'Dragon Link — Panda Magic',
    })
    for (const s of spins) {
      expect(s).toHaveProperty('machineName', 'Dragon Link — Panda Magic')
      expect(s).toHaveProperty('denomination')
      expect(s).toHaveProperty('betAmount')
      expect(s).toHaveProperty('lines')
      expect(s).toHaveProperty('totalBalance')
      expect(s).toHaveProperty('winAmount')
      expect(s).toHaveProperty('bonusHit')
      expect(s).toHaveProperty('spinsSinceBonus')
      expect(s).toHaveProperty('timestamp')
      expect(s.simulated).toBe(true)
    }
  })

  test('timestamps are strictly increasing', () => {
    const spins = generateSpinStream({ count: 100, seed: 3 })
    for (let i = 1; i < spins.length; i++) {
      expect(spins[i].timestamp).toBeGreaterThan(spins[i - 1].timestamp)
    }
  })

  test('spinsSinceBonus resets to 0 on a bonus hit and increments otherwise', () => {
    const spins = generateSpinStream({ count: 2000, seed: 5 })
    for (let i = 0; i < spins.length; i++) {
      if (spins[i].bonusHit) {
        expect(spins[i].spinsSinceBonus).toBe(0)
      } else if (i > 0) {
        expect(spins[i].spinsSinceBonus).toBe(spins[i - 1].spinsSinceBonus + 1)
      }
    }
  })

  test('seeded runs are reproducible', () => {
    const a = generateSpinStream({ count: 200, seed: 12345, startTime: 0 })
    const b = generateSpinStream({ count: 200, seed: 12345, startTime: 0 })
    expect(a).toEqual(b)
  })

  test('rejects non-positive count', () => {
    expect(() => generateSpinStream({ count: 0 })).toThrow(/count/)
    expect(() => generateSpinStream({ count: -5 })).toThrow(/count/)
  })
})

describe('spinSimulator – statistical convergence (large N)', () => {
  // Pokie jackpot tail variance is genuinely huge — a single extra Grand
  // jackpot in a 50k-spin run can shift observed RTP by ~10%. Cert labs
  // mitigate this by simulating tens of millions of spins. We average
  // across several seeds (~250k spins total) to keep the suite fast while
  // tightening the mean.
  const SEEDS = [2026, 91, 4242, 17, 800001]
  const PER_SEED = 50_000
  const aggregated = SEEDS.flatMap((seed) =>
    generateSpinStream({ count: PER_SEED, seed, bet: 1, denomination: 1 })
  )
  const stats = summarise(aggregated)

  test('observed RTP across multiple seeds is within ±5% of target', () => {
    expect(stats.observedRtp).toBeGreaterThan(DEFAULT_MODEL.rtp - 0.05)
    expect(stats.observedRtp).toBeLessThan(DEFAULT_MODEL.rtp + 0.05)
  })

  test('observed hit frequency is within ±1% of target', () => {
    expect(stats.hitFrequency).toBeGreaterThan(
      DEFAULT_MODEL.hitFrequency - 0.01
    )
    expect(stats.hitFrequency).toBeLessThan(DEFAULT_MODEL.hitFrequency + 0.01)
  })

  test('bonus frequency is in the right order of magnitude', () => {
    // Target ~1/180 ≈ 0.0056. Allow a generous window for sampling noise.
    expect(stats.bonusFrequency).toBeGreaterThan(0.003)
    expect(stats.bonusFrequency).toBeLessThan(0.009)
  })
})

describe('spinSimulator – summarise', () => {
  test('handles empty input', () => {
    expect(summarise([])).toEqual({
      count: 0,
      totalStake: 0,
      totalWin: 0,
      observedRtp: 0,
      hitFrequency: 0,
      bonusFrequency: 0,
      biggestWin: 0,
    })
  })

  test('totals match a trivial hand-built stream', () => {
    const fake = [
      { betAmount: 1, denomination: 1, winAmount: 0, bonusHit: false },
      { betAmount: 1, denomination: 1, winAmount: 5, bonusHit: false },
      { betAmount: 1, denomination: 1, winAmount: 0, bonusHit: false },
      { betAmount: 1, denomination: 1, winAmount: 50, bonusHit: true },
    ]
    const s = summarise(fake)
    expect(s.count).toBe(4)
    expect(s.totalStake).toBe(4)
    expect(s.totalWin).toBe(55)
    expect(s.observedRtp).toBeCloseTo(55 / 4, 6)
    expect(s.hitFrequency).toBeCloseTo(0.5, 6)
    expect(s.bonusFrequency).toBeCloseTo(0.25, 6)
    expect(s.biggestWin).toBe(50)
  })
})
