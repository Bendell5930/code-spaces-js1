/**
 * QLD OLGR Monthly Gaming Data — Schema + Sample Seed
 *
 * The Queensland Office of Liquor and Gaming Regulation (OLGR), administered
 * by the Department of Justice and Attorney-General, publishes monthly
 * Electronic Gaming Machine (EGM) data for every licensed gaming venue in
 * Queensland. The reports cover hotels, clubs, the Brisbane Treasury and
 * Queen's Wharf casinos, the Star Gold Coast, and The Ville (Townsville).
 *
 * Public source:
 *   https://www.publications.qld.gov.au/dataset/qld-gaming-statistics
 *
 * Each monthly release publishes one row per venue with at minimum:
 *   • month (reporting period, ISO yyyy-mm)
 *   • licenseeName (the trading name on the gaming machine licence)
 *   • venueType   ('HOTEL' | 'CLUB')
 *   • lga         (Local Government Area, e.g. 'Brisbane City')
 *   • suburb
 *   • approvedEgms (count of approved gaming machines on the licence)
 *   • operatingEgms (count actually in operation that month — sometimes
 *                    omitted, defaults to approvedEgms)
 *   • meteredWin  ($ AUD: net amount kept by the venue = player losses,
 *                  i.e. gross gaming machine profit before tax)
 *
 * ────────────────────────────────────────────────────────────────────────
 * IMPORTANT: The `OLGR_SAMPLE_DATA` array below is a **seed dataset only**.
 * Venue names and LGAs are real (so map / dropdown components render
 * sensibly), but the dollar figures and EGM counts are illustrative
 * placeholders generated for development and demos. They MUST NOT be
 * presented as real OLGR figures. Replace with the actual published CSV
 * via `lib/olgrLoader.js#parseOlgrCsv` before showing to a regulator,
 * lawyer, or member of the public.
 * ────────────────────────────────────────────────────────────────────────
 */

export const OLGR_VENUE_TYPES = Object.freeze({
  HOTEL: 'HOTEL',
  CLUB: 'CLUB',
})

/**
 * Canonical column order produced by the OLGR public CSV release.
 * Used by the loader to detect the file format and by the demo data
 * generator so seeded rows round-trip through the parser.
 */
export const OLGR_CSV_COLUMNS = Object.freeze([
  'month',
  'licenseeName',
  'venueType',
  'lga',
  'suburb',
  'approvedEgms',
  'operatingEgms',
  'meteredWin',
])

/**
 * A small, self-contained sample of QLD venues across several LGAs.
 * Clearly marked as sample data. See the warning above.
 */
export const OLGR_SAMPLE_DATA = Object.freeze([
  // ── Brisbane City (north side incl. Aspley) ──
  row('2026-03', 'Aspley Hornets Football Sporting & Community Club', 'CLUB',  'Brisbane City',  'Aspley',         45,  410_000),
  row('2026-03', 'Aspley Central Tavern',                              'HOTEL', 'Brisbane City',  'Aspley',         40,  385_000),
  row('2026-03', 'Geebung RSL Services Club',                          'CLUB',  'Brisbane City',  'Geebung',        45,  430_000),
  row('2026-03', 'Chermside Bowls Club',                               'CLUB',  'Brisbane City',  'Chermside',      40,  340_000),
  row('2026-03', 'Kedron-Wavell Services Club',                        'CLUB',  'Brisbane City',  'Chermside',     280, 2_950_000),
  row('2026-03', 'The Sandgate RSL & Citizens Memorial Club',          'CLUB',  'Brisbane City',  'Sandgate',       45,  390_000),
  row('2026-03', 'Bracken Ridge Tavern',                               'HOTEL', 'Brisbane City',  'Bracken Ridge',  45,  410_000),

  // ── Moreton Bay ──
  row('2026-03', 'Redcliffe RSL',                                      'CLUB',  'Moreton Bay',    'Redcliffe',     180, 1_780_000),
  row('2026-03', 'Caboolture Sports Club',                             'CLUB',  'Moreton Bay',    'Caboolture',    150, 1_320_000),
  row('2026-03', 'North Lakes Hotel',                                  'HOTEL', 'Moreton Bay',    'North Lakes',    45,  470_000),

  // ── Gold Coast ──
  row('2026-03', 'Surfers Paradise RSL',                               'CLUB',  'Gold Coast',     'Surfers Paradise', 100, 1_050_000),
  row('2026-03', 'Southport Sharks',                                   'CLUB',  'Gold Coast',     'Southport',      280, 3_100_000),
  row('2026-03', 'Burleigh Heads Mowbray Park Bowls Club',             'CLUB',  'Gold Coast',     'Burleigh Heads',  45,  430_000),

  // ── Sunshine Coast ──
  row('2026-03', 'Caloundra RSL',                                      'CLUB',  'Sunshine Coast', 'Caloundra',     280, 2_650_000),
  row('2026-03', 'Maroochy RSL',                                       'CLUB',  'Sunshine Coast', 'Maroochydore',  180, 1_690_000),

  // ── Logan ──
  row('2026-03', 'Logan Diggers Services Club',                        'CLUB',  'Logan',          'Logan Central', 145, 1_410_000),

  // ── Ipswich ──
  row('2026-03', 'Ipswich Jets Leagues Club',                          'CLUB',  'Ipswich',        'Ipswich',       100, 940_000),

  // ── February 2026 (prior month, for trend graphs) ──
  row('2026-02', 'Aspley Hornets Football Sporting & Community Club', 'CLUB',  'Brisbane City',  'Aspley',         45,  395_000),
  row('2026-02', 'Aspley Central Tavern',                              'HOTEL', 'Brisbane City',  'Aspley',         40,  370_000),
  row('2026-02', 'Kedron-Wavell Services Club',                        'CLUB',  'Brisbane City',  'Chermside',     280, 2_810_000),
  row('2026-02', 'Redcliffe RSL',                                      'CLUB',  'Moreton Bay',    'Redcliffe',     180, 1_690_000),
  row('2026-02', 'Southport Sharks',                                   'CLUB',  'Gold Coast',     'Southport',      280, 2_980_000),
  row('2026-02', 'Caloundra RSL',                                      'CLUB',  'Sunshine Coast', 'Caloundra',     280, 2_540_000),
])

function row(month, licenseeName, venueType, lga, suburb, egms, meteredWin) {
  return Object.freeze({
    month,
    licenseeName,
    venueType,
    lga,
    suburb,
    approvedEgms: egms,
    operatingEgms: egms,
    meteredWin,
    isSample: true, // flag so UI can render a "SAMPLE DATA" badge
  })
}

/** All distinct LGAs present in the seed dataset. */
export const OLGR_SAMPLE_LGAS = Object.freeze(
  Array.from(new Set(OLGR_SAMPLE_DATA.map((r) => r.lga))).sort()
)

/** All distinct months present in the seed dataset (ascending). */
export const OLGR_SAMPLE_MONTHS = Object.freeze(
  Array.from(new Set(OLGR_SAMPLE_DATA.map((r) => r.month))).sort()
)
