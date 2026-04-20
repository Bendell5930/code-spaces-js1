import { useState, useEffect, useMemo } from 'react'
import {
  getUserTrackedVenues, isVenueTracked, trackVenue, untrackVenue,
} from '../lib/venueAnalytics'
import {
  QLD_VENUES, getAllVenues, addCustomVenue,
} from '../data/qldVenues'
import styles from './TrackedVenueList.module.css'

const MODES = { MY: 'my', BROWSE: 'browse', ADD: 'add' }

/**
 * Self-contained tracked-venues UI.
 *
 *  ┌─ My Venues ─┬─ Browse ─┬─ ➕ Add ─┐
 *  │ list of tracked venues with Remove buttons     │
 *  │ Add Venue button at top opens Browse / Add     │
 *  │ Empty-state CTAs route to Browse / Add         │
 *  └────────────────────────────────────────────────┘
 *
 *  Browse: single scrollable, filterable list of ALL QLD + custom venues.
 *  Add:    form to add a custom venue, which is auto-added to tracked list.
 *
 * onSelectVenue (optional): called with venueId when a tracked venue card is tapped.
 *                           If not provided, tapping a card is a no-op.
 */
export default function TrackedVenueList({ onSelectVenue, initialMode = MODES.MY }) {
  const [mode, setMode] = useState(initialMode)
  const [tracked, setTracked] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [addForm, setAddForm] = useState({ name: '', suburb: '', region: '' })
  const [addError, setAddError] = useState('')

  function reload() {
    setTracked(getUserTrackedVenues())
    setRefreshKey(k => k + 1)
  }

  useEffect(() => { reload() }, [])

  // ─── Browse data ───
  const allVenues = useMemo(() => getAllVenues(), [refreshKey])
  const totalCount = QLD_VENUES.length

  const allRegions = useMemo(() => {
    return ['all', ...Array.from(new Set(allVenues.map(v => v.region))).sort()]
  }, [allVenues])

  const allTypes = useMemo(() => {
    return ['all', ...Array.from(new Set(allVenues.map(v => v.type))).sort()]
  }, [allVenues])

  const filteredVenues = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allVenues.filter(v => {
      if (typeFilter !== 'all' && v.type !== typeFilter) return false
      if (regionFilter !== 'all' && v.region !== regionFilter) return false
      if (!q) return true
      return (
        v.name.toLowerCase().includes(q) ||
        (v.suburb || '').toLowerCase().includes(q) ||
        (v.region || '').toLowerCase().includes(q)
      )
    })
  }, [allVenues, search, typeFilter, regionFilter])

  // ─── Actions ───

  function handleTrack(v) {
    if (trackVenue(v)) reload()
  }

  function handleUntrack(venueId, name) {
    if (typeof window !== 'undefined' && !window.confirm(`Remove "${name}" from your tracked venues?`)) {
      return
    }
    untrackVenue(venueId)
    reload()
  }

  function handleAddSubmit(e) {
    e.preventDefault()
    setAddError('')
    const name = addForm.name.trim()
    if (!name) {
      setAddError('Venue name is required.')
      return
    }
    const newVenue = addCustomVenue(addForm)
    // Auto-add the brand-new custom venue to the tracked list so the user sees it.
    trackVenue(newVenue)
    setAddForm({ name: '', suburb: '', region: '' })
    reload()
    setMode(MODES.MY)
  }

  // ─── Render ───

  return (
    <div className={styles.wrap}>
      {/* Sub-nav */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${mode === MODES.MY ? styles.tabActive : ''}`}
          onClick={() => setMode(MODES.MY)}
        >
          📌 Tracked ({tracked.length})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === MODES.BROWSE ? styles.tabActive : ''}`}
          onClick={() => setMode(MODES.BROWSE)}
        >
          🔍 Browse ({totalCount})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === MODES.ADD ? styles.tabActive : ''}`}
          onClick={() => setMode(MODES.ADD)}
        >
          ➕ Add Venue
        </button>
      </div>

      {/* ─── My Venues ─── */}
      {mode === MODES.MY && (
        <div className={styles.section}>
          <div className={styles.headerRow}>
            <h3 className={styles.title}>Your Tracked Venues</h3>
            <span className={styles.count}>{tracked.length} / 200</span>
          </div>

          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setMode(MODES.BROWSE)}
            >
              ➕ Add from QLD list
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setMode(MODES.ADD)}
            >
              ✏️ Add custom venue
            </button>
          </div>

          {tracked.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📍</div>
              <p className={styles.emptyTitle}>No venues tracked yet.</p>
              <p className={styles.emptyHint}>
                Pick from the {totalCount} QLD venues, or add your own.
              </p>
              <div className={styles.emptyActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => setMode(MODES.BROWSE)}
                >
                  Browse {totalCount} QLD venues
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setMode(MODES.ADD)}
                >
                  Add a custom venue
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.list}>
              {tracked.map(v => (
                <div key={v.id} className={styles.cardWrap}>
                  <button
                    type="button"
                    className={styles.card}
                    onClick={() => onSelectVenue?.(v.id)}
                  >
                    <span className={styles.venueName}>{v.name}</span>
                    <span className={styles.venueMeta}>
                      {v.suburb || '—'}{v.region ? ` · ${v.region}` : ''}{v.type ? ` · ${v.type}` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleUntrack(v.id, v.name)}
                    title={`Remove ${v.name} from tracked list`}
                    aria-label={`Remove ${v.name}`}
                  >
                    🗑 Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Browse all venues ─── */}
      {mode === MODES.BROWSE && (
        <div className={styles.section}>
          <div className={styles.headerRow}>
            <h3 className={styles.title}>Browse Venues</h3>
            <span className={styles.count}>Tracked: {tracked.length} / 200</span>
          </div>

          <input
            type="text"
            className={styles.search}
            placeholder={`Search ${allVenues.length} venues by name, suburb, or region…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className={styles.filterRow}>
            <select
              className={styles.filterSelect}
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              aria-label="Filter by region"
            >
              {allRegions.map(r => (
                <option key={r} value={r}>{r === 'all' ? 'All regions' : r}</option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              aria-label="Filter by venue type"
            >
              {allTypes.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>
              ))}
            </select>
          </div>

          <div className={styles.resultMeta}>
            Showing {filteredVenues.length} of {allVenues.length} venues
          </div>

          {filteredVenues.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No venues match your filters.</p>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => { setSearch(''); setRegionFilter('all'); setTypeFilter('all') }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className={styles.browseList}>
              {filteredVenues.map(v => {
                const isTracked = isVenueTracked(v.id)
                return (
                  <div key={v.id} className={styles.cardWrap}>
                    <button
                      type="button"
                      className={styles.card}
                      onClick={() => onSelectVenue?.(v.id)}
                    >
                      <span className={styles.venueName}>{v.name}</span>
                      <span className={styles.venueMeta}>
                        {v.suburb || '—'} · {v.region} · {v.type}
                      </span>
                    </button>
                    {isTracked ? (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => handleUntrack(v.id, v.name)}
                        title="Remove from tracked list"
                      >
                        🗑 Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.addBtn}
                        onClick={() => handleTrack(v)}
                        title="Add to tracked list"
                      >
                        ➕ Add
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Add custom venue ─── */}
      {mode === MODES.ADD && (
        <div className={styles.section}>
          <div className={styles.headerRow}>
            <h3 className={styles.title}>Add Custom Venue</h3>
          </div>
          <p className={styles.helpText}>
            Can&apos;t find your venue in the QLD list? Add it here and it will be added to your tracked venues automatically.
          </p>
          <form className={styles.form} onSubmit={handleAddSubmit}>
            <input
              className={styles.formInput}
              placeholder="Venue name *"
              value={addForm.name}
              onChange={e => setAddForm({ ...addForm, name: e.target.value })}
              required
            />
            <input
              className={styles.formInput}
              placeholder="Suburb"
              value={addForm.suburb}
              onChange={e => setAddForm({ ...addForm, suburb: e.target.value })}
            />
            <input
              className={styles.formInput}
              placeholder="Region"
              value={addForm.region}
              onChange={e => setAddForm({ ...addForm, region: e.target.value })}
            />
            {addError && <div className={styles.errorText}>{addError}</div>}
            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryBtn}>
                ➕ Add &amp; Track Venue
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => { setAddForm({ name: '', suburb: '', region: '' }); setMode(MODES.MY) }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
