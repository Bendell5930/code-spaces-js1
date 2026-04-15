/**
 * OCR & Number Extraction Pipeline
 *
 * Reads numeric values (balance, win, bet, lines) from specific screen
 * regions using canvas pixel analysis + character segmentation.
 *
 * This is a lightweight built-in OCR that handles the bright-on-dark
 * digit style used by virtually all Australian pokie machines.  It does
 * NOT require Tesseract.js or any external library.
 *
 * The pipeline:
 *   1. Crop the target region from the canvas
 *   2. Convert to greyscale
 *   3. Adaptive threshold → binary image
 *   4. Segment individual character blobs
 *   5. Match each blob against digit/symbol templates
 *   6. Assemble and parse the numeric result
 */

import { getMachineProfile } from '../data/machineProfiles'

// ── 3×5 pixel templates for digits 0-9, '$', '.' ──
// Each template is a 3-wide × 5-tall bitmask (15 bits).
// 1 = foreground, 0 = background
const DIGIT_TEMPLATES = {
  '0': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1],
  '1': [0,1,0, 1,1,0, 0,1,0, 0,1,0, 1,1,1],
  '2': [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1],
  '3': [1,1,1, 0,0,1, 1,1,1, 0,0,1, 1,1,1],
  '4': [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1],
  '5': [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1],
  '6': [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1],
  '7': [1,1,1, 0,0,1, 0,1,0, 0,1,0, 0,1,0],
  '8': [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1],
  '9': [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1],
}

/**
 * Crop a normalised region from a canvas into a new small canvas.
 */
function cropRegion(srcCanvas, region) {
  const sx = Math.round(region.x * srcCanvas.width)
  const sy = Math.round(region.y * srcCanvas.height)
  const sw = Math.max(1, Math.round(region.w * srcCanvas.width))
  const sh = Math.max(1, Math.round(region.h * srcCanvas.height))

  const crop = document.createElement('canvas')
  crop.width = sw
  crop.height = sh
  const ctx = crop.getContext('2d')
  ctx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, sw, sh)
  return crop
}

/**
 * Convert to greyscale and apply adaptive binary threshold.
 * Returns a Uint8Array where 1 = foreground (text), 0 = background.
 */
function binarise(canvas) {
  const ctx = canvas.getContext('2d')
  const { width: w, height: h } = canvas
  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data
  const grey = new Uint8Array(w * h)

  // Greyscale
  for (let i = 0; i < grey.length; i++) {
    const off = i * 4
    grey[i] = Math.round(0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2])
  }

  // Global Otsu-style threshold (simplified)
  let sum = 0
  const hist = new Array(256).fill(0)
  for (const v of grey) { hist[v]++; sum += v }

  let sumB = 0, wB = 0, maxVar = 0, threshold = 128
  const total = grey.length
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) * (mB - mF)
    if (between > maxVar) { maxVar = between; threshold = t }
  }

  // Pokie screens are bright text on dark; invert if needed
  // (we want text = 1)
  let brightCount = 0
  const binary = new Uint8Array(grey.length)
  for (let i = 0; i < grey.length; i++) {
    binary[i] = grey[i] > threshold ? 1 : 0
    if (binary[i]) brightCount++
  }

  // If bright pixels > 50 %, text is actually the dark part → invert
  if (brightCount > grey.length * 0.5) {
    for (let i = 0; i < binary.length; i++) binary[i] = 1 - binary[i]
  }

  return { binary, width: w, height: h }
}

/**
 * Find vertical "columns of interest" to segment characters.
 * Returns an array of { startX, endX } ranges.
 */
function segmentColumns(binary, width, height) {
  const colDensity = new Float32Array(width)
  for (let x = 0; x < width; x++) {
    let on = 0
    for (let y = 0; y < height; y++) {
      if (binary[y * width + x]) on++
    }
    colDensity[x] = on / height
  }

  const segments = []
  let inChar = false, startX = 0
  const threshold = 0.05

  for (let x = 0; x < width; x++) {
    if (!inChar && colDensity[x] > threshold) {
      inChar = true
      startX = x
    } else if (inChar && colDensity[x] <= threshold) {
      inChar = false
      if (x - startX >= 2) segments.push({ startX, endX: x })
    }
  }
  if (inChar && width - startX >= 2) segments.push({ startX, endX: width })

  return segments
}

/**
 * Downsample a character blob to 3×5 and match against digit templates.
 * Returns { char, confidence } or null.
 */
function matchDigit(binary, width, height, startX, endX) {
  const charW = endX - startX
  // Find vertical bounds
  let topY = height, bottomY = 0
  for (let y = 0; y < height; y++) {
    for (let x = startX; x < endX; x++) {
      if (binary[y * width + x]) {
        if (y < topY) topY = y
        if (y > bottomY) bottomY = y
      }
    }
  }
  const charH = bottomY - topY + 1
  if (charH < 3 || charW < 2) return null

  // Downsample to 3×5
  const sample = new Array(15).fill(0)
  for (let sy = 0; sy < 5; sy++) {
    for (let sx = 0; sx < 3; sx++) {
      const srcX = startX + Math.round((sx / 2) * (charW - 1))
      const srcY = topY + Math.round((sy / 4) * (charH - 1))
      if (binary[srcY * width + srcX]) sample[sy * 3 + sx] = 1
    }
  }

  // Match against templates
  let bestChar = null
  let bestScore = -1

  for (const [digit, tmpl] of Object.entries(DIGIT_TEMPLATES)) {
    let match = 0
    for (let i = 0; i < 15; i++) {
      if (sample[i] === tmpl[i]) match++
    }
    const score = match / 15
    if (score > bestScore) {
      bestScore = score
      bestChar = digit
    }
  }

  // Accept if > 60% match
  if (bestScore < 0.6) return null
  return { char: bestChar, confidence: bestScore }
}

/**
 * Read a numeric value from a specific screen region.
 *
 * @param {HTMLCanvasElement} canvas – full frame canvas
 * @param {{ x,y,w,h }} region – normalised region within the screen
 * @param {{ x,y,w,h }} screenBox – the detected screen bounding box
 * @returns {number|null}
 */
export function readNumber(canvas, region, screenBox) {
  // Convert region (relative to screen) to absolute
  const absRegion = {
    x: screenBox.x + region.x * screenBox.w,
    y: screenBox.y + region.y * screenBox.h,
    w: region.w * screenBox.w,
    h: region.h * screenBox.h,
  }

  const crop = cropRegion(canvas, absRegion)
  if (crop.width < 4 || crop.height < 4) return null

  const { binary, width, height } = binarise(crop)
  const segments = segmentColumns(binary, width, height)

  if (segments.length === 0) return null

  let numStr = ''
  let prevEnd = 0

  for (const seg of segments) {
    // Detect decimal point (narrow gap + small blob)
    const gap = seg.startX - prevEnd
    const segWidth = seg.endX - seg.startX
    if (segWidth <= 3 && gap > 2) {
      numStr += '.'
    }

    const result = matchDigit(binary, width, height, seg.startX, seg.endX)
    if (result) {
      numStr += result.char
    }
    prevEnd = seg.endX
  }

  // Clean and parse
  numStr = numStr.replace(/^[.$]+/, '').replace(/[.$]+$/, '')
  const value = parseFloat(numStr)
  return isNaN(value) ? null : value
}

/**
 * Read all numeric fields from a machine screen.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ x,y,w,h }} screenBox
 * @param {string} machineName
 * @returns {object} – { balance, winAmount, betAmount, lines }
 */
export function readAllFields(canvas, screenBox, machineName) {
  const result = getMachineProfile(machineName)
  const regions = result?.profile?.regions || {
    // Fallback generic layout
    balance:   { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
    winAmount: { x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
    betAmount: { x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
    lines:     { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
  }

  return {
    balance:   readNumber(canvas, regions.balance, screenBox),
    winAmount: readNumber(canvas, regions.winAmount, screenBox),
    betAmount: readNumber(canvas, regions.betAmount, screenBox),
    lines:     readNumber(canvas, regions.lines, screenBox),
  }
}
