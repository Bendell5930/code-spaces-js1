/**
 * QLD OLGR Monthly Gaming Data — Loader and Aggregator
 *
 * Parses the public CSV released monthly by the Queensland Office of
 * Liquor and Gaming Regulation (https://www.publications.qld.gov.au/dataset/qld-gaming-statistics)
 * and provides aggregations that are convenient for charts (per-LGA totals,
 * per-venue trend lines, top-N ranking, etc.).
 *
 * The loader is **pure JavaScript** — no `fs`, no `fetch`. The caller is
 * responsible for retrieving the CSV text (server route, build step, or
 * uploaded file) and passing it to `parseOlgrCsv`. This keeps the module
 * usable in both the browser and Node test environments.
 *
 * Schema reference: see `data/olgrGamingData.js#OLGR_CSV_COLUMNS`.
 */

import {
  OLGR_CSV_COLUMNS,
  OLGR_VENUE_TYPES,
  OLGR_SAMPLE_DATA,
} from '../data/olgrGamingData.js'

// ─── CSV parsing ──────────────────────────────────────────────────────────
//
// The OLGR CSV is RFC-4180-ish: comma-separated, optional double-quoted
// fields, doubled quotes inside a quoted field. This implementation handles
// embedded commas and quoted fields. It does NOT try to be a full general
// CSV parser; it covers what OLGR actually emits.

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

function normaliseHeader(h) {
  return String(h || '')
    .replace(/^\uFEFF/, '') // strip UTF-8 BOM if present
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

const HEADER_ALIASES = {
  month: ['month', 'reportingperiod', 'period', 'reportmonth'],
  licenseeName: ['licenseename', 'venuename', 'tradingname', 'venue', 'name'],
  venueType: ['venuetype', 'licencetype', 'category', 'type'],
  lga: ['lga', 'localgovernmentarea', 'localauthority'],
  suburb: ['suburb', 'town', 'locality'],
  approvedEgms: ['approvedegms', 'approvedmachines', 'machines', 'numberofegms', 'egms'],
  operatingEgms: ['operatingegms', 'operatingmachines', 'machinesinoperation'],
  meteredWin: ['meteredwin', 'monthlymeteredwin', 'grossgamingrevenue', 'ggr', 'win', 'netrevenue'],
}

function buildColumnIndex(headerCells) {
  const normHeaders = headerCells.map(normaliseHeader)
  const idx = {}
  for (const canonical of OLGR_CSV_COLUMNS) {
    const aliases = HEADER_ALIASES[canonical] || [canonical.toLowerCase()]
    const found = normHeaders.findIndex((h) => aliases.includes(h))
    if (found >= 0) idx[canonical] = found
  }
  return idx
}

function coerceVenueType(raw) {
  const v = String(raw || '').trim().toUpperCase()
  if (v.startsWith('HOT') || v === 'PUB') return OLGR_VENUE_TYPES.HOTEL
  if (v.startsWith('CLU') || v === 'RSL' || v === 'COMMUNITY') return OLGR_VENUE_TYPES.CLUB
  return v || null
}

function coerceNumber(raw) {
  if (raw == null) return null
  // Strip $, commas, whitespace; tolerate parentheses for negatives.
  const cleaned = String(raw).replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1')
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function coerceMonth(raw) {
  const s = String(raw || '').trim()
  // Accept yyyy-mm, yyyy/mm, mm/yyyy, "March 2026", etc.
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})$/)
  if (isoMatch) {
    const mm = String(isoMatch[2]).padStart(2, '0')
    return `${isoMatch[1]}-${mm}`
  }
  const swapped = s.match(/^(\d{1,2})[-/](\d{4})$/)
  if (swapped) {
    const mm = String(swapped[1]).padStart(2, '0')
    return `${swapped[2]}-${mm}`
  }
  const named = s.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (named) {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
    ]
    const idx = months.indexOf(named[1].toLowerCase())
    if (idx >= 0) return `${named[2]}-${String(idx + 1).padStart(2, '0')}`
  }
  return s || null
}

/**
 * Parse a CSV released by OLGR (or any file matching the schema).
 *
 * @param {string} csvText
 * @returns {Array<object>} normalised rows (same shape as OLGR_SAMPLE_DATA
 *   entries, minus the `isSample` flag)
 */
export function parseOlgrCsv(csvText) {
  if (typeof csvText !== 'string') {
    throw new TypeError('parseOlgrCsv expects a string')
  }
  const lines = csvText
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0])
  const idx = buildColumnIndex(header)
  if (idx.licenseeName == null || idx.meteredWin == null) {
    throw new Error(
      'OLGR CSV is missing required columns (licenseeName, meteredWin)'
    )
  }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    const row = {
      month: coerceMonth(cells[idx.month]),
      licenseeName: String(cells[idx.licenseeName] || '').trim(),
      venueType: coerceVenueType(cells[idx.venueType]),
      lga: cells[idx.lga] != null ? String(cells[idx.lga]).trim() : null,
      suburb: cells[idx.suburb] != null ? String(cells[idx.suburb]).trim() : null,
      approvedEgms: coerceNumber(cells[idx.approvedEgms]),
      operatingEgms: coerceNumber(cells[idx.operatingEgms]),
      meteredWin: coerceNumber(cells[idx.meteredWin]),
    }
    if (row.operatingEgms == null) row.operatingEgms = row.approvedEgms
    if (!row.licenseeName) continue // skip blank rows
    rows.push(row)
  }
  return rows
}

// ─── Aggregations ─────────────────────────────────────────────────────────

/**
 * Sum metered win per LGA for a given month (or across all months if
 * `month` is omitted). Returns an array sorted descending by total.
 */
export function aggregateByLga(rows, { month } = {}) {
  const filtered = month ? rows.filter((r) => r.month === month) : rows
  const map = new Map()
  for (const r of filtered) {
    if (!r.lga) continue
    const cur = map.get(r.lga) || {
      lga: r.lga,
      totalMeteredWin: 0,
      totalEgms: 0,
      venueCount: 0,
    }
    cur.totalMeteredWin += r.meteredWin || 0
    cur.totalEgms += r.operatingEgms || r.approvedEgms || 0
    cur.venueCount += 1
    map.set(r.lga, cur)
  }
  return Array.from(map.values())
    .map((v) => ({
      ...v,
      perEgmWin: v.totalEgms > 0 ? v.totalMeteredWin / v.totalEgms : 0,
    }))
    .sort((a, b) => b.totalMeteredWin - a.totalMeteredWin)
}

/**
 * Group rows by venue (licenseeName) and produce a per-venue trend series
 * keyed by month. Useful for line charts.
 */
export function aggregateByVenue(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = r.licenseeName
    const cur = map.get(key) || {
      licenseeName: key,
      venueType: r.venueType,
      lga: r.lga,
      suburb: r.suburb,
      months: [],
    }
    cur.months.push({
      month: r.month,
      meteredWin: r.meteredWin || 0,
      operatingEgms: r.operatingEgms || r.approvedEgms || 0,
    })
    map.set(key, cur)
  }
  for (const v of map.values()) {
    v.months.sort((a, b) => String(a.month).localeCompare(String(b.month)))
    v.totalMeteredWin = v.months.reduce((s, m) => s + m.meteredWin, 0)
  }
  return Array.from(map.values()).sort(
    (a, b) => b.totalMeteredWin - a.totalMeteredWin
  )
}

/** Top-N venues by metered win for a given month (or all months). */
export function topVenues(rows, { n = 10, month } = {}) {
  const filtered = month ? rows.filter((r) => r.month === month) : rows
  const map = new Map()
  for (const r of filtered) {
    const cur = map.get(r.licenseeName) || {
      licenseeName: r.licenseeName,
      lga: r.lga,
      suburb: r.suburb,
      venueType: r.venueType,
      meteredWin: 0,
      operatingEgms: r.operatingEgms || r.approvedEgms || 0,
    }
    cur.meteredWin += r.meteredWin || 0
    map.set(r.licenseeName, cur)
  }
  return Array.from(map.values())
    .sort((a, b) => b.meteredWin - a.meteredWin)
    .slice(0, n)
}

/**
 * State-wide totals per month — handy for the headline figure on a demo
 * dashboard ("QLD pokie losses, March 2026: $X across N venues").
 */
export function totalsByMonth(rows) {
  const map = new Map()
  for (const r of rows) {
    const cur = map.get(r.month) || {
      month: r.month,
      totalMeteredWin: 0,
      venueCount: 0,
      totalEgms: 0,
    }
    cur.totalMeteredWin += r.meteredWin || 0
    cur.venueCount += 1
    cur.totalEgms += r.operatingEgms || r.approvedEgms || 0
    map.set(r.month, cur)
  }
  return Array.from(map.values()).sort((a, b) =>
    String(a.month).localeCompare(String(b.month))
  )
}

/**
 * Convenience accessor: returns the bundled sample dataset, ready to
 * stream into the aggregators above. Use for demos and tests; replace
 * with `parseOlgrCsv(realCsv)` before showing real numbers.
 */
export function loadSampleDataset() {
  return OLGR_SAMPLE_DATA.map((r) => ({ ...r }))
}
