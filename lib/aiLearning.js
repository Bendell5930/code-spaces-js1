/**
 * AI Learning / Auto-Discovery — core logic module.
 *
 * Pure helpers with no React dependencies.  Used by the AutoDiscovery
 * wizard component to:
 *   - Match GPS coordinates against known venues
 *   - Parse OCR text into machine name + variant
 *   - Detect near-duplicate entries (keeps the data set clean)
 *   - Persist new custom machines to localStorage
 *   - Track usage counts so popular items surface first in dropdowns
 *
 * Public API (all named exports):
 *   levenshteinDistance(a, b)
 *   haversineDistance(lat1, lng1, lat2, lng2)
 *   findNearbyVenue(lat, lng, venues, radiusM?)
 *   toTitleCase(str)
 *   parseOcrText(rawText)
 *   findNearDuplicate(text, list, maxDist?)
 *   getCustomMachines()
 *   addCustomMachine(brand, variant?)
 *   getMergedMachines()
 *   bumpCount(type, name)
 *   getCount(type, name)
 *   getSortedBrands(mergedMachines)
 */

import { MACHINES } from '../data/machines'

// ─── localStorage keys ───────────────────────────────────────────────────────
const CUSTOM_MACHINES_KEY = 'pokie-custom-machines'
const COUNTS_KEY          = 'pokie-ai-counts'

/**
 * Window event name dispatched whenever the custom-machines store changes.
 * Components that render machine/variant dropdowns can listen for this to
 * refresh their data live (without waiting for a remount).
 */
export const CUSTOM_MACHINES_EVENT = 'pokie-custom-machines-changed'

/**
 * Separator used in the combined "Brand – Variant" string emitted by
 * MachineSelector and consumed by callers that pre-select a machine
 * (e.g. via `initialMachine`). Centralised here so composition + parsing
 * sites stay in sync.
 */
export const BRAND_VARIANT_SEPARATOR = ' – '

// ─── String utilities ────────────────────────────────────────────────────────

/**
 * Classic dynamic-programming Levenshtein edit distance.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshteinDistance(a, b) {
  const m = a.length
  const n = b.length
  // Use two rows to save memory
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1])
    }
    prev = curr
  }
  return prev[n]
}

/**
 * Haversine great-circle distance between two GPS points.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in metres
 */
const EARTH_RADIUS_METERS = 6_371_000

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const a =
    sinDLat * sinDLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLng * sinDLng
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Find the closest known venue within a given GPS radius.
 * Venues must have numeric `lat` and `lon` properties (as returned by
 * `getAllVenues()` from data/qldVenues.js which enriches them).
 *
 * @param {number} lat
 * @param {number} lng
 * @param {Array}  venues  — array of venue objects with lat/lon fields
 * @param {number} [radiusM=75] — match radius in metres
 * @returns {object|null} Matched venue or null
 */
export function findNearbyVenue(lat, lng, venues, radiusM = 75) {
  let best = null
  let bestDist = Infinity
  for (const v of venues) {
    if (typeof v.lat !== 'number' || typeof v.lon !== 'number') continue
    const d = haversineDistance(lat, lng, v.lat, v.lon)
    if (d < radiusM && d < bestDist) {
      best = v
      bestDist = d
    }
  }
  return best
}

// ─── Text normalisation ──────────────────────────────────────────────────────

/**
 * Convert a string to Title Case, trimming whitespace.
 * @param {string} str
 * @returns {string}
 */
export function toTitleCase(str) {
  if (!str) return ''
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── OCR text parsing ────────────────────────────────────────────────────────

/** Minimum character count for an OCR line to be considered meaningful */
const MIN_OCR_LINE_LENGTH = 3

/**
 * Parse raw Tesseract OCR text into a machine name and optional variant.
 *
 * Strategy:
 *   1. Split into non-empty lines, strip lines that are pure digits / very short.
 *   2. Sort lines by word count (most words first) — the main game title
 *      usually spans the widest banner and therefore yields the most tokens.
 *   3. Longest line → machine name; next distinct line → variant.
 *
 * @param {string} rawText
 * @returns {{ machineName: string, variant: string }}
 */
export function parseOcrText(rawText) {
  if (!rawText) return { machineName: '', variant: '' }

  const lines = rawText
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= MIN_OCR_LINE_LENGTH && !/^\d+$/.test(l))

  if (lines.length === 0) return { machineName: '', variant: '' }

  // Sort by word count descending
  const sorted = [...lines].sort(
    (a, b) => b.split(/\s+/).length - a.split(/\s+/).length
  )

  const machineName = toTitleCase(sorted[0] || '')
  const variant = sorted.length > 1 ? toTitleCase(sorted[1]) : ''
  return { machineName, variant }
}

// ─── Near-duplicate detection ────────────────────────────────────────────────

/**
 * Check if `text` is a near-duplicate of any entry in `list`.
 * Comparison is case-insensitive.  Returns the matched existing entry or null.
 *
 * @param {string}   text
 * @param {string[]} list
 * @param {number}   [maxDist=2]
 * @returns {string|null}
 */
export function findNearDuplicate(text, list, maxDist = 2) {
  if (!text || !list?.length) return null
  const norm = text.trim().toLowerCase()
  for (const entry of list) {
    if (levenshteinDistance(norm, entry.trim().toLowerCase()) <= maxDist) {
      return entry
    }
  }
  return null
}

// ─── Custom machines persistence ─────────────────────────────────────────────

function loadCustomMachinesRaw() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CUSTOM_MACHINES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCustomMachinesRaw(data) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOM_MACHINES_KEY, JSON.stringify(data))
  // Notify in-process listeners (the native `storage` event only fires across
  // tabs, so we dispatch our own event for same-tab subscribers).
  try {
    window.dispatchEvent(new Event(CUSTOM_MACHINES_EVENT))
  } catch {
    /* Event constructor unavailable in some test envs — safe to ignore */
  }
}

/**
 * Return user-added custom machines as `{ brandName: [variant, ...] }`.
 * @returns {Object.<string, string[]>}
 */
export function getCustomMachines() {
  return loadCustomMachinesRaw()
}

/**
 * Persist a new custom machine brand and/or variant.
 * Deduplicates case-insensitively and normalises to Title Case.
 *
 * @param {string}  brand
 * @param {string}  [variant]
 */
export function addCustomMachine(brand, variant) {
  if (!brand?.trim()) return
  const data = loadCustomMachinesRaw()
  const key = toTitleCase(brand)
  if (!data[key]) data[key] = []
  if (variant?.trim()) {
    const v = toTitleCase(variant)
    if (!data[key].some((x) => x.toLowerCase() === v.toLowerCase())) {
      data[key].push(v)
    }
  }
  saveCustomMachinesRaw(data)
  bumpCount('machine', key)
  if (variant?.trim()) {
    bumpCount('variant', `${key}:${toTitleCase(variant)}`)
  }
}

/**
 * Merge built-in MACHINES with user-added custom machines.
 * Custom variants are appended (deduplicated) under the matching brand key.
 *
 * @returns {Object.<string, string[]>}
 */
export function getMergedMachines() {
  const custom = loadCustomMachinesRaw()
  const merged = {}

  for (const [brand, variants] of Object.entries(MACHINES)) {
    merged[brand] = [...variants]
  }

  for (const [brand, variants] of Object.entries(custom)) {
    if (merged[brand]) {
      const existing = merged[brand].map((v) => v.toLowerCase())
      for (const v of variants) {
        if (!existing.includes(v.toLowerCase())) {
          merged[brand].push(v)
          existing.push(v.toLowerCase())
        }
      }
    } else {
      merged[brand] = [...variants]
    }
  }

  return merged
}

// ─── Popularity / usage counts ───────────────────────────────────────────────

function loadCounts() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(COUNTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Increment the usage count for a named entity.
 * @param {'venue'|'machine'|'variant'} type
 * @param {string} name
 */
export function bumpCount(type, name) {
  if (typeof window === 'undefined') return
  const counts = loadCounts()
  const k = `${type}:${name}`
  counts[k] = (counts[k] || 0) + 1
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts))
}

/**
 * Get the usage count for an entity.
 * @param {'venue'|'machine'|'variant'} type
 * @param {string} name
 * @returns {number}
 */
export function getCount(type, name) {
  return loadCounts()[`${type}:${name}`] || 0
}

/**
 * Return brand names sorted by descending popularity count.
 * Brands with zero counts (new) appear after known brands.
 *
 * @param {Object.<string, string[]>} mergedMachines
 * @returns {string[]}
 */
export function getSortedBrands(mergedMachines) {
  return Object.keys(mergedMachines).sort(
    (a, b) => getCount('machine', b) - getCount('machine', a)
  )
}
