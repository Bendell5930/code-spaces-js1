import { describe, test, expect } from '@jest/globals'
import {
  parseOlgrCsv,
  aggregateByLga,
  aggregateByVenue,
  topVenues,
  totalsByMonth,
  loadSampleDataset,
} from '../lib/olgrLoader.js'
import {
  OLGR_VENUE_TYPES,
  OLGR_SAMPLE_LGAS,
} from '../data/olgrGamingData.js'

const SAMPLE_CSV = `month,licenseeName,venueType,lga,suburb,approvedEgms,operatingEgms,meteredWin
2026-03,"Aspley Hornets, Inc.",Club,Brisbane City,Aspley,45,45,"$410,000"
2026-03,Aspley Central Tavern,Hotel,Brisbane City,Aspley,40,40,385000
2026-03,Kedron-Wavell Services Club,Club,Brisbane City,Chermside,280,280,2950000
2026-02,"Aspley Hornets, Inc.",Club,Brisbane City,Aspley,45,45,395000
2026-02,Kedron-Wavell Services Club,Club,Brisbane City,Chermside,280,280,2810000
`

describe('olgrLoader – parseOlgrCsv', () => {
  test('rejects non-string input', () => {
    expect(() => parseOlgrCsv(null)).toThrow(TypeError)
    expect(() => parseOlgrCsv(123)).toThrow(TypeError)
  })

  test('returns [] for empty / header-only input', () => {
    expect(parseOlgrCsv('')).toEqual([])
    expect(parseOlgrCsv('month,licenseeName,meteredWin\n')).toEqual([])
  })

  test('throws when required columns are missing', () => {
    expect(() => parseOlgrCsv('foo,bar\n1,2')).toThrow(/required columns/)
  })

  test('parses standard CSV with quoted fields, currency formatting, and embedded commas', () => {
    const rows = parseOlgrCsv(SAMPLE_CSV)
    expect(rows.length).toBe(5)

    const aspley = rows.find(
      (r) => r.licenseeName === 'Aspley Hornets, Inc.' && r.month === '2026-03'
    )
    expect(aspley).toBeDefined()
    expect(aspley.venueType).toBe(OLGR_VENUE_TYPES.CLUB)
    expect(aspley.lga).toBe('Brisbane City')
    expect(aspley.suburb).toBe('Aspley')
    expect(aspley.approvedEgms).toBe(45)
    expect(aspley.meteredWin).toBe(410_000)
  })

  test('coerces venueType from various synonyms', () => {
    const csv = `month,licenseeName,venueType,meteredWin
2026-03,A,HOTEL,1
2026-03,B,Pub,2
2026-03,C,Club,3
2026-03,D,RSL,4
2026-03,E,community,5
`
    const rows = parseOlgrCsv(csv)
    expect(rows.map((r) => r.venueType)).toEqual([
      OLGR_VENUE_TYPES.HOTEL,
      OLGR_VENUE_TYPES.HOTEL,
      OLGR_VENUE_TYPES.CLUB,
      OLGR_VENUE_TYPES.CLUB,
      OLGR_VENUE_TYPES.CLUB,
    ])
  })

  test('coerces month from named, slash, and reversed forms', () => {
    const csv = `month,licenseeName,meteredWin
March 2026,A,1
2026/3,B,2
03/2026,C,3
2026-03,D,4
`
    const rows = parseOlgrCsv(csv)
    expect(rows.map((r) => r.month)).toEqual([
      '2026-03',
      '2026-03',
      '2026-03',
      '2026-03',
    ])
  })

  test('handles CRLF line endings and BOM', () => {
    const csv = '\uFEFFmonth,licenseeName,meteredWin\r\n2026-03,A,100\r\n'
    const rows = parseOlgrCsv(csv)
    expect(rows.length).toBe(1)
    expect(rows[0].licenseeName).toBe('A')
    expect(rows[0].meteredWin).toBe(100)
  })

  test('header alias matching is case- and punctuation-insensitive', () => {
    const csv =
      'Reporting Period,Trading Name,Licence Type,Local Government Area,Suburb,Number of EGMs,Machines in Operation,Gross Gaming Revenue\n' +
      '2026-03,Test Venue,Hotel,Brisbane City,Aspley,40,40,300000\n'
    const rows = parseOlgrCsv(csv)
    expect(rows.length).toBe(1)
    expect(rows[0]).toMatchObject({
      month: '2026-03',
      licenseeName: 'Test Venue',
      venueType: OLGR_VENUE_TYPES.HOTEL,
      lga: 'Brisbane City',
      suburb: 'Aspley',
      approvedEgms: 40,
      operatingEgms: 40,
      meteredWin: 300_000,
    })
  })

  test('falls back operatingEgms = approvedEgms when missing', () => {
    const csv =
      'month,licenseeName,approvedEgms,meteredWin\n2026-03,X,30,100000\n'
    const rows = parseOlgrCsv(csv)
    expect(rows[0].operatingEgms).toBe(30)
  })
})

describe('olgrLoader – aggregations', () => {
  const rows = parseOlgrCsv(SAMPLE_CSV)

  test('aggregateByLga sums totals per LGA, sorted desc', () => {
    const agg = aggregateByLga(rows, { month: '2026-03' })
    expect(agg.length).toBe(1) // only Brisbane City in this sample
    expect(agg[0].lga).toBe('Brisbane City')
    expect(agg[0].totalMeteredWin).toBe(410_000 + 385_000 + 2_950_000)
    expect(agg[0].totalEgms).toBe(45 + 40 + 280)
    expect(agg[0].venueCount).toBe(3)
    expect(agg[0].perEgmWin).toBeCloseTo(
      (410_000 + 385_000 + 2_950_000) / (45 + 40 + 280),
      2
    )
  })

  test('aggregateByVenue produces per-venue trend across months', () => {
    const venues = aggregateByVenue(rows)
    const aspley = venues.find((v) => v.licenseeName === 'Aspley Hornets, Inc.')
    expect(aspley).toBeDefined()
    expect(aspley.months.map((m) => m.month)).toEqual(['2026-02', '2026-03'])
    expect(aspley.totalMeteredWin).toBe(395_000 + 410_000)
  })

  test('topVenues respects n and month filter', () => {
    const top = topVenues(rows, { n: 2, month: '2026-03' })
    expect(top.length).toBe(2)
    expect(top[0].licenseeName).toBe('Kedron-Wavell Services Club')
    expect(top[0].meteredWin).toBe(2_950_000)
  })

  test('totalsByMonth returns monthly state-wide totals sorted ascending', () => {
    const totals = totalsByMonth(rows)
    expect(totals.map((t) => t.month)).toEqual(['2026-02', '2026-03'])
    expect(totals[0].totalMeteredWin).toBe(395_000 + 2_810_000)
    expect(totals[1].totalMeteredWin).toBe(410_000 + 385_000 + 2_950_000)
    expect(totals[1].venueCount).toBe(3)
  })
})

describe('olgrLoader – sample dataset', () => {
  const sample = loadSampleDataset()

  test('returns a non-empty defensively-copied array', () => {
    expect(Array.isArray(sample)).toBe(true)
    expect(sample.length).toBeGreaterThan(10)
    // Mutating the returned array must not affect subsequent loads.
    sample[0].meteredWin = -1
    const fresh = loadSampleDataset()
    expect(fresh[0].meteredWin).not.toBe(-1)
  })

  test('every sample row carries the isSample flag (so UI can label it)', () => {
    for (const r of loadSampleDataset()) {
      expect(r.isSample).toBe(true)
    }
  })

  test('sample LGAs include Brisbane City (covers Aspley)', () => {
    expect(OLGR_SAMPLE_LGAS).toContain('Brisbane City')
  })

  test('aggregations work end-to-end on the bundled sample', () => {
    const data = loadSampleDataset()
    const lga = aggregateByLga(data, { month: '2026-03' })
    expect(lga.length).toBeGreaterThan(0)
    expect(lga[0].totalMeteredWin).toBeGreaterThan(0)

    const top = topVenues(data, { n: 5, month: '2026-03' })
    expect(top.length).toBe(5)
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].meteredWin).toBeGreaterThanOrEqual(top[i].meteredWin)
    }
  })
})
