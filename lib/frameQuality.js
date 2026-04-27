/**
 * Frame quality analysis for the AI scan camera preview.
 *
 * analyzeFrameQuality runs each tick inside the RAF loop and detects:
 *   - dark frames (under-exposed)
 *   - bright frames (over-exposed, but not glare)
 *   - glare (large patch of over-exposed pixels on the machine screen)
 *   - camera shake (high per-pixel motion diff vs previous frame)
 *
 * The pure classifyQuality function is exported separately so it can be
 * unit-tested without a DOM / canvas environment.
 */

/**
 * Pure classifier — given pre-computed metrics, return quality flags.
 *
 * Thresholds (chosen for typical mobile cameras at arm's length):
 *   avgLum < 35        — below ~14% of max brightness; frame is too dark to read OCR reliably
 *   avgLum > 210       — above ~82% of max brightness; over-exposed (but not glare-dominated)
 *   glareFrac > 0.12   — >12% of sampled pixels are fully blown out (≥ 235/255 luminance)
 *   avgMotionDiff > 45 — average per-channel inter-frame delta of 45/255 indicates noticeable blur
 *
 * @param {number} avgLum          Average pixel luminance 0–255
 * @param {number} glareFrac       Fraction of overexposed pixels (0–1)
 * @param {number} avgMotionDiff   Average per-channel pixel diff vs previous frame
 * @returns {{ dark: boolean, bright: boolean, glare: boolean, shake: boolean }}
 */
export function classifyQuality(avgLum, glareFrac, avgMotionDiff) {
  return {
    dark: avgLum < 35,           // minimum acceptable luminance
    bright: avgLum > 210 && glareFrac < 0.15, // over-exposed but not dominated by glare
    glare: glareFrac > 0.12,     // more than 12% of pixels are blown-out
    shake: avgMotionDiff > 45,   // per-channel motion diff exceeds readable threshold
  }
}

/**
 * Sample canvas pixels and analyse frame quality.
 *
 * Designed to be cheap — samples at most ~500 pixels of the centre 80% of the
 * frame and a much sparser set (~60 samples) for motion comparison.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ current: number[]|null }} prevSampleRef  Ref that stores the sparse
 *   pixel sample from the previous call (mutated in-place for the next call).
 * @returns {{ dark: boolean, bright: boolean, glare: boolean, shake: boolean }}
 */
export function analyzeFrameQuality(canvas, prevSampleRef) {
  const w = canvas.width
  const h = canvas.height
  if (!w || !h) return { dark: false, bright: false, glare: false, shake: false }

  const ctx = canvas.getContext('2d')

  // Sample the central 80% of the frame to avoid black borders
  const sx = Math.floor(w * 0.1)
  const sy = Math.floor(h * 0.1)
  const sw = Math.max(1, Math.floor(w * 0.8))
  const sh = Math.max(1, Math.floor(h * 0.8))

  const imageData = ctx.getImageData(sx, sy, sw, sh)
  const data = imageData.data
  const total = sw * sh

  // ── Brightness / glare pass (~500 samples) ──────────────────────────
  const step = Math.max(4, Math.floor(total / 500))
  let sumLum = 0
  let overexposedCount = 0

  for (let i = 0; i < total; i += step) {
    const idx = i * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sumLum += lum
    if (lum > 235) overexposedCount++
  }

  const sampleCount = Math.ceil(total / step)
  const avgLum = sumLum / sampleCount
  const glareFrac = overexposedCount / sampleCount

  // ── Motion / shake pass (sparser — ~60 samples) ──────────────────────
  const shakeStep = Math.max(step * 8, Math.floor(total / 60))
  const currentSample = []
  for (let i = 0; i < total; i += shakeStep) {
    const idx = i * 4
    currentSample.push(data[idx], data[idx + 1], data[idx + 2])
  }

  let avgMotionDiff = 0
  const prev = prevSampleRef.current
  if (prev && prev.length === currentSample.length) {
    let diffSum = 0
    for (let j = 0; j < currentSample.length; j++) {
      diffSum += Math.abs(currentSample[j] - prev[j])
    }
    avgMotionDiff = diffSum / currentSample.length
  }
  prevSampleRef.current = currentSample

  return classifyQuality(avgLum, glareFrac, avgMotionDiff)
}
