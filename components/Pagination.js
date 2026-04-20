import { useEffect, useRef } from 'react'
import {
  buildPageItems,
  clampPage,
  totalPagesFor,
} from '../lib/pagination'
import styles from './Pagination.module.css'

const DEFAULT_PAGE_SIZES = [10, 25, 50]

/**
 * Sleek, accessible numbered pagination control.
 *
 * Props
 *  - page              (number, 1-based) current page
 *  - totalPages        (number)          total page count (>= 1)
 *  - onChange          (fn)              called with the new clamped page
 *  - pageSize          (number, optional) currently selected page size
 *  - onPageSizeChange  (fn,     optional) called with the new page size
 *  - pageSizeOptions   (number[], optional) page-size choices for the select
 *  - compact           (bool,   optional) force the compact "‹ Page X of Y ›" layout
 *  - extra             (ReactNode, optional) extra slot rendered to the left
 *                                            (used for "Jump to my rank" chip)
 *  - label             (string, optional) aria-label for the <nav>
 */
export default function Pagination({
  page,
  totalPages,
  onChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  compact = false,
  extra = null,
  label = 'Pagination',
}) {
  const tp = Math.max(1, Math.floor(Number(totalPages) || 1))
  const current = clampPage(page, tp)

  const navRef = useRef(null)

  // Notify parent if the clamped page differs from the prop (e.g. data shrank).
  useEffect(() => {
    if (current !== page && typeof onChange === 'function') {
      onChange(current)
    }
  }, [current, page, onChange])

  function go(p) {
    const next = clampPage(p, tp)
    if (next !== current && typeof onChange === 'function') onChange(next)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(current - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(current + 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      go(1)
    } else if (e.key === 'End') {
      e.preventDefault()
      go(tp)
    }
  }

  // Hide the control entirely if there's only one page AND no extras to show.
  if (tp <= 1 && !extra && !onPageSizeChange) return null

  const items = buildPageItems(current, tp)
  const showNumbers = !compact && tp > 1

  return (
    <nav
      ref={navRef}
      className={styles.wrap}
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {extra && <div className={styles.extra}>{extra}</div>}

      {tp > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => go(current - 1)}
            disabled={current <= 1}
            aria-label="Previous page"
          >
            <span aria-hidden="true">‹</span> Prev
          </button>

          {showNumbers ? (
            <ol className={styles.pageList}>
              {items.map((it, idx) =>
                it.type === 'gap' ? (
                  <li key={`gap-${idx}`} className={styles.gap} aria-hidden="true">
                    …
                  </li>
                ) : (
                  <li key={it.page}>
                    <button
                      type="button"
                      className={`${styles.pageBtn} ${it.active ? styles.pageBtnActive : ''}`}
                      onClick={() => go(it.page)}
                      aria-current={it.active ? 'page' : undefined}
                      aria-label={`Page ${it.page}${it.active ? ', current page' : ''}`}
                    >
                      {it.page}
                    </button>
                  </li>
                )
              )}
            </ol>
          ) : (
            <span className={styles.compactLabel} aria-live="polite">
              Page <strong>{current}</strong> of {tp}
            </span>
          )}

          <button
            type="button"
            className={styles.navBtn}
            onClick={() => go(current + 1)}
            disabled={current >= tp}
            aria-label="Next page"
          >
            Next <span aria-hidden="true">›</span>
          </button>
        </div>
      )}

      {onPageSizeChange && (
        <label className={styles.sizePicker}>
          <span className={styles.sizeLabel}>Show</span>
          <select
            className={styles.sizeSelect}
            value={pageSize ?? pageSizeOptions[0]}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  )
}

// Re-export helpers so consumers don't have to import them separately.
export { totalPagesFor }
