import {
  POLICY,
  THRESHOLDS,
  OFF_TARGET_FRAME_LIMIT,
  GUARD_STATUS,
  ALLOWED_DATA_FIELDS,
} from '../data/recordingPolicy'
import { detectScreen, scoreProfileMatch, detectSkinTone, detectWideScene } from './screenDetector'
import { readAllFields } from './ocrEngine'
import { getReelSnapshot } from './symbolRecognition'

/**
 * PrivacyGuard – runs every frame to enforce recording policies AND
 * drive the detection / OCR / symbol-recognition pipeline.
 *
 * Also includes the SmartDetector — tracks inter-frame state changes
 * to auto-detect spins, wins, bonus triggers, and config changes
 * without user interaction.
 */

let offTargetCount = 0

// ── SmartDetector: tracks previous frame state for change detection ──
let prevState = {
  balance: null,
  winAmount: null,
  betAmount: null,
  lines: null,
  bonusActive: false,
  lastSpinTime: 0,
  lastWinTime: 0,
  stableFrames: 0,       // Count of frames with stable (unchanged) readings
  spinCooldown: false,    // Prevents double-counting rapid frame changes
}

const SPIN_COOLDOWN_MS = 800 // Min time between detected spins
const STABLE_THRESHOLD = 3   // Frames of stable reading before accepting change

/** Reset between sessions. */
export function resetGuard() {
  offTargetCount = 0
  prevState = {
    balance: null, winAmount: null, betAmount: null, lines: null,
    bonusActive: false, lastSpinTime: 0, lastWinTime: 0,
    stableFrames: 0, spinCooldown: false,
  }
}

/**
 * Analyse a single video frame and return a guard verdict.
 *
 * @param {HTMLCanvasElement} canvas  – current frame drawn on a canvas
 * @param {string} targetMachine     – the machine the user selected
 * @returns {{ status: string, reason: string|null, region: object|null }}
 */
export function evaluateFrame(canvas, targetMachine) {
  // 1. Policy integrity check
  for (const [key, required] of Object.entries(POLICY)) {
    if (!required) {
      return {
        status: GUARD_STATUS.POLICY_VIOLATION,
        reason: `Policy flag "${key}" has been tampered with.`,
        region: null,
      }
    }
  }

  // 2. Person / skin-tone detection
  if (detectSkinTone(canvas)) {
    offTargetCount = 0
    return {
      status: GUARD_STATUS.PERSON_DETECTED,
      reason: 'A person was detected in the frame. Recording paused.',
      region: null,
    }
  }

  // 3. Venue interior / wide-scene detection
  if (detectWideScene(canvas)) {
    offTargetCount = 0
    return {
      status: GUARD_STATUS.VENUE_DETECTED,
      reason: 'Venue interior detected. Recording paused.',
      region: null,
    }
  }

  // 4. Machine screen detection
  const screenBox = detectScreen(canvas)
  if (!screenBox) {
    offTargetCount++
    if (offTargetCount >= OFF_TARGET_FRAME_LIMIT) {
      return {
        status: GUARD_STATUS.OFF_TARGET,
        reason: 'Camera moved away from the machine. Session stopped.',
        region: null,
      }
    }
    return { status: GUARD_STATUS.OK, reason: null, region: null }
  }

  // 5. Profile colour match — confirm it's the right machine type
  const matchScore = scoreProfileMatch(canvas, screenBox, targetMachine)
  if (matchScore < THRESHOLDS.machineScreen) {
    offTargetCount++
    if (offTargetCount >= OFF_TARGET_FRAME_LIMIT) {
      return {
        status: GUARD_STATUS.OFF_TARGET,
        reason: 'Camera moved away from the machine. Session stopped.',
        region: null,
      }
    }
    return { status: GUARD_STATUS.OK, reason: null, region: null }
  }

  // On-target — reset counter
  offTargetCount = 0
  return { status: GUARD_STATUS.OK, reason: null, region: screenBox }
}

/**
 * Extract only the allowed data fields from a detected screen region.
 * Runs OCR for numbers and symbol recognition for reel analysis.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ x: number, y: number, w: number, h: number }} region
 * @param {string} machineName
 * @returns {object}
 */
export function extractAllowedData(canvas, region, machineName) {
  // OCR: read numeric fields
  const numbers = readAllFields(canvas, region, machineName)

  // Symbol recognition: analyse reel state
  const reels = getReelSnapshot(canvas, region, machineName)

  // Assemble — only allowed fields
  const data = {}
  for (const field of ALLOWED_DATA_FIELDS) {
    data[field] = null
  }

  data.balance = numbers.balance
  data.winAmount = numbers.winAmount
  data.betAmount = numbers.betAmount
  data.lines = numbers.lines
  data.bonusTriggered = reels.bonusActive
  data.jackpotTier = reels.jackpot
  data.detectedSymbols = reels.topSymbols

  // ── Smart Detection: compare with previous frame to detect events ──
  const now = Date.now()
  const events = {
    spinDetected: false,
    winDetected: false,
    winAmount: 0,
    bonusStarted: false,
    bonusEnded: false,
    configChanged: false,
    detectedBet: null,
    detectedLines: null,
  }

  // Only process if we have valid readings
  if (data.balance != null) {
    // SPIN DETECTION: balance dropped by roughly the bet amount
    if (prevState.balance != null && data.balance < prevState.balance) {
      const drop = prevState.balance - data.balance
      const timeSinceLastSpin = now - prevState.lastSpinTime
      // Only count as spin if enough time has passed and drop is reasonable
      if (timeSinceLastSpin > SPIN_COOLDOWN_MS && drop > 0 && drop < prevState.balance * 0.5) {
        events.spinDetected = true
        prevState.lastSpinTime = now
      }
    }

    // WIN DETECTION: win meter shows a new value > 0
    if (data.winAmount != null && data.winAmount > 0) {
      const timeSinceLastWin = now - prevState.lastWinTime
      if ((prevState.winAmount === null || prevState.winAmount === 0) && timeSinceLastWin > SPIN_COOLDOWN_MS) {
        events.winDetected = true
        events.winAmount = data.winAmount
        prevState.lastWinTime = now
      }
    }

    // BONUS DETECTION: bonus started
    if (reels.bonusActive && !prevState.bonusActive) {
      events.bonusStarted = true
    }
    // BONUS ENDED: was in bonus, now not
    if (!reels.bonusActive && prevState.bonusActive) {
      events.bonusEnded = true
    }

    // CONFIG CHANGE: bet or lines changed
    if (data.betAmount != null && prevState.betAmount != null && data.betAmount !== prevState.betAmount) {
      events.configChanged = true
      events.detectedBet = data.betAmount
    }
    if (data.lines != null && prevState.lines != null && data.lines !== prevState.lines) {
      events.configChanged = true
      events.detectedLines = data.lines
    }

    // Update prev state
    prevState.balance = data.balance
    prevState.winAmount = data.winAmount
    prevState.betAmount = data.betAmount
    prevState.lines = data.lines
    prevState.bonusActive = reels.bonusActive
  }

  data.events = events
  return data
}

/**
 * Ensure the media stream has audio tracks disabled.
 */
export function enforceAudioOff(stream) {
  if (!stream) return
  stream.getAudioTracks().forEach((track) => {
    track.enabled = false
    track.stop()
  })
}
