/**
 * Symbol & Bonus Recognition Engine
 *
 * Identifies reel symbols, bonus triggers, and jackpot text on the
 * machine screen by analysing colour clusters and text patterns in
 * the reel area.
 *
 * For each machine profile, we know:
 *   - The reel region on screen
 *   - A list of symbols with their dominant colours
 *   - Bonus trigger keywords
 *   - Jackpot tier names
 *
 * This engine DOES NOT store images — it analyses in memory only.
 */

import { getMachineProfile, getSymbolsForMachine } from '../data/machineProfiles'

/**
 * Analyse the reel area and detect which symbols are likely visible.
 *
 * Uses colour-cluster matching: for each known symbol with a defined
 * colour hint, count how many pixels in the reel region match that
 * colour within a tolerance.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ x,y,w,h }} screenBox
 * @param {string} machineName
 * @returns {{ symbols: Array<{ name, confidence }>, bonusDetected: boolean, jackpotTier: string|null }}
 */
export function analyseReels(canvas, screenBox, machineName) {
  const result = getMachineProfile(machineName)
  if (!result) {
    return { symbols: [], bonusDetected: false, jackpotTier: null }
  }

  const { profile, variant } = result
  const reelRegion = profile.regions.reels
  if (!reelRegion) {
    return { symbols: [], bonusDetected: false, jackpotTier: null }
  }

  // Absolute reel coordinates
  const rx = Math.round((screenBox.x + reelRegion.x * screenBox.w) * canvas.width)
  const ry = Math.round((screenBox.y + reelRegion.y * screenBox.h) * canvas.height)
  const rw = Math.max(1, Math.round(reelRegion.w * screenBox.w * canvas.width))
  const rh = Math.max(1, Math.round(reelRegion.h * screenBox.h * canvas.height))

  const ctx = canvas.getContext('2d')
  let imgData
  try {
    imgData = ctx.getImageData(rx, ry, rw, rh)
  } catch {
    return { symbols: [], bonusDetected: false, jackpotTier: null }
  }
  const data = imgData.data

  // Build colour histogram from sampled pixels
  const allSymbols = [
    ...profile.symbols,
    ...(variant?.extraSymbols || []).map((name) => ({ name, color: null })),
  ]

  const symbolScores = []
  const colorTolerance = 50

  for (const sym of allSymbols) {
    if (!sym.color) {
      // Card symbols (A, K, Q, J, 10) – skip colour matching
      symbolScores.push({ name: sym.name, confidence: 0.3 })
      continue
    }

    let matchCount = 0
    let sampleCount = 0

    // Sample every 8th pixel for performance
    for (let i = 0; i < data.length; i += 32) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const dr = Math.abs(r - sym.color.r)
      const dg = Math.abs(g - sym.color.g)
      const db = Math.abs(b - sym.color.b)
      if (dr < colorTolerance && dg < colorTolerance && db < colorTolerance) {
        matchCount++
      }
      sampleCount++
    }

    const confidence = sampleCount > 0 ? Math.min(1, (matchCount / sampleCount) * 10) : 0
    symbolScores.push({ name: sym.name, confidence })
  }

  // Sort by confidence, return top symbols
  symbolScores.sort((a, b) => b.confidence - a.confidence)
  const detectedSymbols = symbolScores.filter((s) => s.confidence > 0.1).slice(0, 6)

  // ── Bonus detection ──
  // Check for high-saturation bright flash patterns (bonus screens tend to
  // be brighter and more saturated than normal reel spins)
  let highSatBrightCount = 0
  let bonusSampleCount = 0
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max > 0 ? (max - min) / max : 0
    const val = max / 255
    if (sat > 0.5 && val > 0.7) highSatBrightCount++
    bonusSampleCount++
  }

  const bonusRatio = bonusSampleCount > 0 ? highSatBrightCount / bonusSampleCount : 0
  const bonusDetected = bonusRatio > 0.3

  // ── Jackpot tier detection ──
  // Simple heuristic: if the reel area has a large block of gold/yellow
  // pixels, a jackpot display is likely active
  let goldCount = 0
  let jpSampleCount = 0
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    // Gold range: high R, high G, low B
    if (r > 180 && g > 150 && b < 100 && r > g) goldCount++
    jpSampleCount++
  }

  let jackpotTier = null
  const goldRatio = jpSampleCount > 0 ? goldCount / jpSampleCount : 0
  if (goldRatio > 0.15 && profile.jackpotTiers.length > 0) {
    // Higher gold saturation → higher tier
    if (goldRatio > 0.4) jackpotTier = profile.jackpotTiers[0] // Grand
    else if (goldRatio > 0.25) jackpotTier = profile.jackpotTiers[1] // Major
    else jackpotTier = profile.jackpotTiers[Math.min(2, profile.jackpotTiers.length - 1)]
  }

  return { symbols: detectedSymbols, bonusDetected, jackpotTier }
}

/**
 * Get a snapshot summary of the current reel state.
 * Combines symbol recognition with descriptive text.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ x,y,w,h }} screenBox
 * @param {string} machineName
 * @returns {{ topSymbols: string[], bonusActive: boolean, jackpot: string|null }}
 */
export function getReelSnapshot(canvas, screenBox, machineName) {
  const { symbols, bonusDetected, jackpotTier } = analyseReels(
    canvas,
    screenBox,
    machineName
  )

  return {
    topSymbols: symbols.slice(0, 4).map((s) => s.name),
    bonusActive: bonusDetected,
    jackpot: jackpotTier,
  }
}
