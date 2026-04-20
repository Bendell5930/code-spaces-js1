/**
 * Pagination helpers — pure functions, framework-free so they can be unit tested.
 */

/**
 * Clamp a 1-based page number into the valid range [1, totalPages].
 * Falls back to 1 when totalPages is 0 or invalid.
 */
export function clampPage(page, totalPages) {
  const tp = Math.max(1, Math.floor(Number(totalPages) || 0))
  const p = Math.floor(Number(page) || 1)
  if (p < 1) return 1
  if (p > tp) return tp
  return p
}

/**
 * Build the list of items to render in a numbered pagination control.
 *
 * Items are either { type: 'page', page: <n>, active: <bool> }
 * or          { type: 'gap' } for an ellipsis.
 *
 * Examples (with siblings = 1, boundaries = 1):
 *   total 5,  page 1 → 1 2 3 4 5
 *   total 24, page 6 → 1 … 5 6 7 … 24
 *   total 24, page 1 → 1 2 3 … 24
 *   total 24, page 24 → 1 … 22 23 24
 */
export function buildPageItems(page, totalPages, options = {}) {
  const siblings = Math.max(0, options.siblings ?? 1)
  const boundaries = Math.max(1, options.boundaries ?? 1)

  const tp = Math.max(0, Math.floor(Number(totalPages) || 0))
  if (tp <= 0) return []

  const current = clampPage(page, tp)

  // If everything fits without ellipses, just emit all pages.
  // Threshold = both boundary blocks + 2 siblings + current + 2 ellipses.
  const threshold = boundaries * 2 + siblings * 2 + 3
  if (tp <= threshold) {
    const out = []
    for (let i = 1; i <= tp; i++) {
      out.push({ type: 'page', page: i, active: i === current })
    }
    return out
  }

  const startPages = range(1, Math.min(boundaries, tp))
  const endPages = range(Math.max(tp - boundaries + 1, boundaries + 1), tp)

  const siblingStart = Math.max(
    Math.min(current - siblings, tp - boundaries - siblings * 2 - 1),
    boundaries + 2
  )
  const siblingEnd = Math.min(
    Math.max(current + siblings, boundaries + siblings * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : tp - 1
  )

  const items = []
  for (const p of startPages) items.push({ type: 'page', page: p, active: p === current })

  if (siblingStart > boundaries + 2) {
    items.push({ type: 'gap' })
  } else if (boundaries + 1 < tp - boundaries) {
    items.push({ type: 'page', page: boundaries + 1, active: boundaries + 1 === current })
  }

  for (const p of range(siblingStart, siblingEnd)) {
    items.push({ type: 'page', page: p, active: p === current })
  }

  if (siblingEnd < tp - boundaries - 1) {
    items.push({ type: 'gap' })
  } else if (tp - boundaries > boundaries) {
    items.push({
      type: 'page',
      page: tp - boundaries,
      active: tp - boundaries === current,
    })
  }

  for (const p of endPages) items.push({ type: 'page', page: p, active: p === current })

  // De-duplicate any accidental repeats (defensive).
  const seen = new Set()
  return items.filter((it) => {
    if (it.type === 'gap') return true
    if (seen.has(it.page)) return false
    seen.add(it.page)
    return true
  })
}

function range(start, end) {
  if (end < start) return []
  const out = new Array(end - start + 1)
  for (let i = 0; i < out.length; i++) out[i] = start + i
  return out
}

/**
 * Compute total pages from a total item count and page size. Always >= 1 so
 * empty lists still render "Page 1 of 1".
 */
export function totalPagesFor(totalItems, pageSize) {
  const t = Math.max(0, Math.floor(Number(totalItems) || 0))
  const ps = Math.max(1, Math.floor(Number(pageSize) || 1))
  return Math.max(1, Math.ceil(t / ps))
}

/**
 * Given a 0-based item index and page size, return the 1-based page that
 * contains that item.
 */
export function pageForIndex(index, pageSize) {
  const i = Math.max(0, Math.floor(Number(index) || 0))
  const ps = Math.max(1, Math.floor(Number(pageSize) || 1))
  return Math.floor(i / ps) + 1
}
