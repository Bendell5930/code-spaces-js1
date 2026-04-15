/**
 * Screen Detection Engine
 *
 * Uses canvas pixel analysis to:
 *  1. Detect a pokie machine screen vs background
 *  2. Locate the screen bounding box
 *  3. Score the match against the expected machine profile colour
 *
 * No external ML model required – works with raw pixel heuristics.
 * Can be augmented with TensorFlow.js for higher accuracy later.
 */

import { getMachineProfile } from '../data/machineProfiles'
import { THRESHOLDS } from '../data/recordingPolicy'

/**
 * Convert RGB → HSV (hue 0-360, sat/val 0-100).
 */
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  const s = max === 0 ? 0 : (d / max) * 100
  const v = max * 100
  return { h, s, v }
}

/**
 * Sample a rectangular region of the canvas and return the average HSV
 * plus a brightness histogram.
 */
function sampleRegion(ctx, x, y, w, h, canvasW, canvasH) {
  const px = Math.round(x * canvasW)
  const py = Math.round(y * canvasH)
  const pw = Math.max(1, Math.round(w * canvasW))
  const ph = Math.max(1, Math.round(h * canvasH))

  const imgData = ctx.getImageData(px, py, pw, ph)
  const data = imgData.data
  const total = pw * ph

  let rSum = 0, gSum = 0, bSum = 0
  let brightPixels = 0
  let darkPixels = 0

  // Sample every 4th pixel for performance
  const step = 4
  let counted = 0
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    rSum += r; gSum += g; bSum += b
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    if (lum > 180) brightPixels++
    if (lum < 40) darkPixels++
    counted++
  }

  if (counted === 0) return null

  const avgR = rSum / counted
  const avgG = gSum / counted
  const avgB = bSum / counted
  const hsv = rgbToHsv(avgR, avgG, avgB)

  return {
    avgR, avgG, avgB,
    ...hsv,
    brightRatio: brightPixels / counted,
    darkRatio: darkPixels / counted,
    totalPixels: total,
  }
}

/**
 * Detect a machine screen in the canvas by searching for a bright,
 * high-contrast rectangular region.  Returns a normalised bounding box
 * { x, y, w, h } or null.
 */
export function detectScreen(canvas) {
  const ctx = canvas.getContext('2d')
  const cw = canvas.width
  const ch = canvas.height
  if (cw === 0 || ch === 0) return null

  // Strategy: scan a grid of sample regions and find the largest cluster
  // of screen-like pixels (bright, saturated, high-contrast against border).

  const gridCols = 10
  const gridRows = 8
  const cellW = 1 / gridCols
  const cellH = 1 / gridRows
  const screenCells = []

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const sample = sampleRegion(ctx, col * cellW, row * cellH, cellW, cellH, cw, ch)
      if (!sample) continue

      // A pokie screen cell is typically bright with moderate saturation
      const isScreenLike =
        sample.brightRatio > 0.15 &&
        sample.darkRatio < 0.7 &&
        sample.v > 25

      if (isScreenLike) {
        screenCells.push({ col, row })
      }
    }
  }

  if (screenCells.length < 6) return null // not enough screen-like cells

  // Find bounding box of screen-like cluster
  let minCol = gridCols, maxCol = 0, minRow = gridRows, maxRow = 0
  for (const c of screenCells) {
    if (c.col < minCol) minCol = c.col
    if (c.col > maxCol) maxCol = c.col
    if (c.row < minRow) minRow = c.row
    if (c.row > maxRow) maxRow = c.row
  }

  const bx = minCol * cellW
  const by = minRow * cellH
  const bw = (maxCol - minCol + 1) * cellW
  const bh = (maxRow - minRow + 1) * cellH

  // Reject if too small or fills entire frame (likely venue, not screen)
  if (bw < 0.25 || bh < 0.20) return null
  if (bw > 0.98 && bh > 0.98) return null

  return { x: bx, y: by, w: bw, h: bh }
}

/**
 * Score how well the detected screen matches a machine profile's
 * expected colour signature.  Returns 0–1.
 */
export function scoreProfileMatch(canvas, region, machineName) {
  const result = getMachineProfile(machineName)
  if (!result) return 0.5 // no profile yet – neutral score

  const ctx = canvas.getContext('2d')
  const cw = canvas.width
  const ch = canvas.height

  // Sample the border area around the screen (the machine bezel)
  const bezelSamples = [
    sampleRegion(ctx, Math.max(0, region.x - 0.05), region.y, 0.04, region.h, cw, ch),
    sampleRegion(ctx, region.x + region.w + 0.01, region.y, 0.04, region.h, cw, ch),
    sampleRegion(ctx, region.x, Math.max(0, region.y - 0.05), region.w, 0.04, cw, ch),
  ].filter(Boolean)

  if (bezelSamples.length === 0) return 0.3

  const { screenColor } = result.profile
  let matches = 0
  for (const s of bezelSamples) {
    const hueOk =
      screenColor.hMax >= screenColor.hMin
        ? s.h >= screenColor.hMin && s.h <= screenColor.hMax
        : s.h >= screenColor.hMin || s.h <= screenColor.hMax // wraps 360
    const satOk = s.s >= screenColor.sMin
    const valOk = s.v >= screenColor.vMin
    if (hueOk && satOk && valOk) matches++
  }

  return matches / bezelSamples.length
}

/**
 * Detect whether the centre of the frame contains a person-like region.
 * Basic skin-tone heuristic. Returns true if large skin-tone area found.
 */
export function detectSkinTone(canvas) {
  const ctx = canvas.getContext('2d')
  const cw = canvas.width
  const ch = canvas.height
  if (cw === 0 || ch === 0) return false

  // Sample the centre 60% of the frame
  const sample = sampleRegion(ctx, 0.2, 0.2, 0.6, 0.6, cw, ch)
  if (!sample) return false

  // Count skin-tone pixels in centre region
  const px = Math.round(0.2 * cw)
  const py = Math.round(0.2 * ch)
  const pw = Math.round(0.6 * cw)
  const ph = Math.round(0.6 * ch)
  const imgData = ctx.getImageData(px, py, pw, ph)
  const data = imgData.data
  let skinCount = 0
  let counted = 0

  for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
    const r = data[i], g = data[i + 1], b = data[i + 2]
    // Skin-tone rule (works across a range of skin tones)
    if (r > 80 && g > 40 && b > 20 &&
        r > g && r > b &&
        (r - g) > 15 &&
        Math.abs(r - g) < 120 &&
        r - b > 20) {
      skinCount++
    }
    counted++
  }

  // If more than 25% of sampled pixels are skin-toned, likely a person
  return counted > 0 && (skinCount / counted) > 0.25
}

/**
 * Detect whether the scene looks like a wide venue interior rather
 * than a closeup of a single machine. Heuristic: low contrast,
 * lots of mid-range colours, bright spread across the full frame.
 */
export function detectWideScene(canvas) {
  const ctx = canvas.getContext('2d')
  const cw = canvas.width
  const ch = canvas.height
  if (cw === 0 || ch === 0) return false

  // Sample four corners and centre
  const corners = [
    sampleRegion(ctx, 0, 0, 0.15, 0.15, cw, ch),
    sampleRegion(ctx, 0.85, 0, 0.15, 0.15, cw, ch),
    sampleRegion(ctx, 0, 0.85, 0.15, 0.15, cw, ch),
    sampleRegion(ctx, 0.85, 0.85, 0.15, 0.15, cw, ch),
  ].filter(Boolean)

  const centre = sampleRegion(ctx, 0.3, 0.3, 0.4, 0.4, cw, ch)
  if (!centre || corners.length < 3) return false

  // If all corners and centre are similarly bright, it's a wide scene
  let brightCorners = 0
  for (const c of corners) {
    if (c.v > 20 && c.brightRatio > 0.1) brightCorners++
  }

  // Wide venue: bright in all corners (uniform lighting)
  return brightCorners >= 3 && centre.brightRatio > 0.15
}
