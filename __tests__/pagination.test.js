/**
 * Unit tests for pagination math (lib/pagination.js).
 */

import { describe, test, expect } from '@jest/globals'
import {
  clampPage,
  buildPageItems,
  totalPagesFor,
  pageForIndex,
} from '../lib/pagination.js'

describe('clampPage', () => {
  test('returns 1 for empty/zero totalPages', () => {
    expect(clampPage(5, 0)).toBe(1)
    expect(clampPage(1, 0)).toBe(1)
  })

  test('clamps below range to 1', () => {
    expect(clampPage(0, 10)).toBe(1)
    expect(clampPage(-3, 10)).toBe(1)
  })

  test('clamps above range to totalPages', () => {
    expect(clampPage(99, 5)).toBe(5)
  })

  test('returns the page when in range', () => {
    expect(clampPage(3, 10)).toBe(3)
  })

  test('coerces non-numeric input', () => {
    expect(clampPage('4', '10')).toBe(4)
    expect(clampPage(undefined, 10)).toBe(1)
  })
})

describe('totalPagesFor', () => {
  test('always returns at least 1', () => {
    expect(totalPagesFor(0, 10)).toBe(1)
    expect(totalPagesFor(0, 50)).toBe(1)
  })

  test('rounds up partial last page', () => {
    expect(totalPagesFor(11, 10)).toBe(2)
    expect(totalPagesFor(20, 10)).toBe(2)
    expect(totalPagesFor(21, 10)).toBe(3)
  })

  test('handles bad input', () => {
    expect(totalPagesFor(-5, 10)).toBe(1)
    expect(totalPagesFor(10, 0)).toBe(10)
  })
})

describe('pageForIndex', () => {
  test('first item is on page 1', () => {
    expect(pageForIndex(0, 10)).toBe(1)
    expect(pageForIndex(9, 10)).toBe(1)
  })

  test('boundary item moves to next page', () => {
    expect(pageForIndex(10, 10)).toBe(2)
    expect(pageForIndex(41, 10)).toBe(5)
  })
})

describe('buildPageItems', () => {
  test('returns empty list when totalPages is 0', () => {
    expect(buildPageItems(1, 0)).toEqual([])
  })

  test('emits all pages when small enough to fit', () => {
    const items = buildPageItems(1, 5)
    expect(items.map((i) => (i.type === 'gap' ? '…' : i.page))).toEqual([1, 2, 3, 4, 5])
  })

  test('marks the active page', () => {
    const items = buildPageItems(3, 5)
    const active = items.filter((i) => i.type === 'page' && i.active)
    expect(active).toHaveLength(1)
    expect(active[0].page).toBe(3)
  })

  test('inserts a leading gap when current page is far from start', () => {
    const items = buildPageItems(20, 24)
    const labels = items.map((i) => (i.type === 'gap' ? '…' : i.page))
    // Should start with boundary "1" then gap, then sibling window, ending at 24.
    expect(labels[0]).toBe(1)
    expect(labels).toContain('…')
    expect(labels[labels.length - 1]).toBe(24)
    expect(labels).toContain(20)
  })

  test('inserts a trailing gap when current page is near the start', () => {
    const items = buildPageItems(2, 24)
    const labels = items.map((i) => (i.type === 'gap' ? '…' : i.page))
    expect(labels[0]).toBe(1)
    expect(labels).toContain(2)
    expect(labels).toContain('…')
    expect(labels[labels.length - 1]).toBe(24)
  })

  test('inserts both gaps when current page is in the middle', () => {
    const items = buildPageItems(12, 24)
    const labels = items.map((i) => (i.type === 'gap' ? '…' : i.page))
    expect(labels[0]).toBe(1)
    expect(labels[labels.length - 1]).toBe(24)
    // Two gaps for "1 … 11 12 13 … 24"
    expect(labels.filter((l) => l === '…').length).toBe(2)
    expect(labels).toContain(11)
    expect(labels).toContain(12)
    expect(labels).toContain(13)
  })

  test('clamps current page above range and still marks an active page', () => {
    const items = buildPageItems(99, 24)
    const active = items.find((i) => i.type === 'page' && i.active)
    expect(active.page).toBe(24)
  })

  test('never produces duplicate page numbers', () => {
    for (const p of [1, 2, 3, 5, 10, 15, 20, 23, 24]) {
      const items = buildPageItems(p, 24)
      const pages = items.filter((i) => i.type === 'page').map((i) => i.page)
      expect(new Set(pages).size).toBe(pages.length)
    }
  })

  test('boundary single-page case', () => {
    const items = buildPageItems(1, 1)
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual({ type: 'page', page: 1, active: true })
  })
})
