/**
 * Recording Policy Configuration
 * Compliant with Australian privacy standards for recording in public venues.
 *
 * - Audio is ALWAYS disabled during capture (no conversation recording).
 * - Only the machine screen region is processed; surrounding areas are masked.
 * - Face / person detection triggers an immediate pause.
 * - Camera movement away from the target machine stops the session.
 * - Raw video frames are NEVER stored – only extracted numeric data.
 * - Only data fields listed in ALLOWED_DATA_FIELDS are captured.
 */

/** Fields the AI is permitted to extract from the machine screen. */
export const ALLOWED_DATA_FIELDS = [
  'balance',
  'winAmount',
  'betAmount',
  'denomination',
  'lines',
  'bonusTriggered',
  'jackpotTier',
  'jackpotAmount',
  'spinCount',
]

/** Recording policy flags – every flag must remain true at runtime. */
export const POLICY = {
  audioDisabled: true,
  singleMachineOnly: true,
  noPersonRecording: true,
  noVenueInterior: true,
  noMachineInternals: true,
  rawFramesDiscarded: true,
  onlyAllowedFields: true,
}

/** How many consecutive "off-target" frames before auto-stop (≈ 1–2 s). */
export const OFF_TARGET_FRAME_LIMIT = 30

/** Confidence thresholds (0-1) for the detectors. */
export const THRESHOLDS = {
  machineScreen: 0.65,
  personDetected: 0.40,
  venueInterior: 0.50,
  cameraMovement: 0.55,
}

/** Status codes returned by the guard system. */
export const GUARD_STATUS = {
  OK: 'OK',
  PERSON_DETECTED: 'PERSON_DETECTED',
  VENUE_DETECTED: 'VENUE_DETECTED',
  OFF_TARGET: 'OFF_TARGET',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  AUDIO_LEAK: 'AUDIO_LEAK',
}
