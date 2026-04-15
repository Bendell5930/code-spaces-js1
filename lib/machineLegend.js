/**
 * Machine Legend — Private per-user code ↔ real machine name mapping.
 *
 * PUBLIC view: Everyone sees machine codes like "A1", "A2", "B3"
 * PRIVATE view: Only the submitting user sees their legend mapping
 *   e.g. A1 = "Dragon Link — Autumn Moon"
 *
 * Codes are per-user per-venue. Each user has their own legend.
 * Code format: Letter (A-Z) + Number (1-99)
 *   - Letter increments per unique venue visit (A = first venue, B = second, etc.)
 *   - Number increments per unique machine at that venue
 *
 * Storage: localStorage (user-private, never shared)
 */

const LEGEND_KEY = 'pokie-machine-legend'
const VENUE_LETTER_KEY = 'pokie-venue-letters'

// ─── Storage helpers ───

function loadLegend() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LEGEND_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveLegend(legend) {
  localStorage.setItem(LEGEND_KEY, JSON.stringify(legend))
}

function loadVenueLetters() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(VENUE_LETTER_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveVenueLetters(letters) {
  localStorage.setItem(VENUE_LETTER_KEY, JSON.stringify(letters))
}

// ─── Code Assignment ───

/**
 * Get or assign a machine code for a real machine name at a venue.
 * If user already logged this machine at this venue, returns existing code.
 * Otherwise assigns next available code.
 *
 * @param {string} venueId — venue identifier
 * @param {string} realMachineName — actual game name (e.g. "Dragon Link — Autumn Moon")
 * @returns {string} code like "A1"
 */
export function getOrAssignCode(venueId, realMachineName) {
  const legend = loadLegend()
  const venueLegend = legend[venueId] || {}

  // Check if this machine already has a code at this venue
  for (const [code, entry] of Object.entries(venueLegend)) {
    if (entry.name === realMachineName) return code
  }

  // Assign new code: get venue letter
  const letters = loadVenueLetters()
  if (!letters[venueId]) {
    const usedCount = Object.keys(letters).length
    letters[venueId] = String.fromCharCode(65 + (usedCount % 26)) // A, B, C...
    saveVenueLetters(letters)
  }
  const letter = letters[venueId]

  // Find next number for this venue-letter
  const existingNumbers = Object.keys(venueLegend)
    .filter(c => c.startsWith(letter))
    .map(c => parseInt(c.slice(1), 10))
    .filter(n => !isNaN(n))

  const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
  const code = `${letter}${nextNum}`

  // Save to legend
  venueLegend[code] = {
    name: realMachineName,
    addedAt: Date.now(),
  }
  legend[venueId] = venueLegend
  saveLegend(legend)

  return code
}

/**
 * Look up real machine name from a code (private — only for the current user).
 * @returns {string|null} real machine name or null if not in user's legend
 */
export function lookupCode(venueId, code) {
  const legend = loadLegend()
  return legend[venueId]?.[code]?.name || null
}

/**
 * Get the full legend for a venue (all codes → real names).
 * @returns {Object} e.g. { "A1": { name: "Dragon Link...", addedAt: ... }, ... }
 */
export function getVenueLegend(venueId) {
  const legend = loadLegend()
  return legend[venueId] || {}
}

/**
 * Get all venues the user has legend entries for.
 * @returns {string[]} array of venueIds
 */
export function getLegendVenues() {
  const legend = loadLegend()
  return Object.keys(legend)
}

/**
 * Check if user has any legend data (to show legend toggle in UI).
 */
export function hasLegendData() {
  const legend = loadLegend()
  return Object.keys(legend).length > 0
}

/**
 * Get code for display — returns existing code or null (read-only, no assignment).
 */
export function getExistingCode(venueId, realMachineName) {
  const legend = loadLegend()
  const venueLegend = legend[venueId] || {}
  for (const [code, entry] of Object.entries(venueLegend)) {
    if (entry.name === realMachineName) return code
  }
  return null
}
