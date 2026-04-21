import { useState, useEffect, useMemo } from 'react'
import { getAllVenues } from '../data/qldVenues'
import { playTap } from '../lib/sounds'

/**
 * VenuePicker — small inline search-and-select control for choosing the
 * "active venue" used by Check-In, Reviews and other social features.
 *
 * Props:
 *   activeVenue   – currently selected venue (or null)
 *   onSelect(v)   – called with the picked venue object
 *   onClear()     – optional, called when the user clears the selection
 *   label         – optional CTA label shown when no venue is selected
 *                   (defaults to "Pick a venue")
 *   compact       – if true, renders without the wrapping card chrome
 *                   (useful when the parent already provides a card)
 */
export default function VenuePicker({
  activeVenue,
  onSelect,
  onClear,
  label = 'Pick a venue',
  compact = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [venues, setVenues] = useState([])

  // Lazily load the full venue list only when the picker is opened — keeps
  // the initial render cheap on tabs that may never use the picker.
  useEffect(() => {
    if (open && venues.length === 0) {
      try { setVenues(getAllVenues()) } catch { setVenues([]) }
    }
  }, [open, venues.length])

  const matches = useMemo(() => {
    if (!venues.length) return []
    const q = query.trim().toLowerCase()
    const list = q
      ? venues.filter(v =>
          v.name?.toLowerCase().includes(q) ||
          v.suburb?.toLowerCase().includes(q) ||
          v.region?.toLowerCase().includes(q)
        )
      : venues
    // Cap the dropdown so a 500-venue list doesn't render at once.
    return list.slice(0, 50)
  }, [venues, query])

  function handlePick(v) {
    playTap()
    setOpen(false)
    setQuery('')
    onSelect && onSelect(v)
  }

  function handleClear() {
    playTap()
    onClear && onClear()
  }

  const wrap = compact ? compactWrap : cardWrap

  // Selected state — show the venue with Change / Clear controls.
  if (activeVenue && !open) {
    return (
      <div style={wrap}>
        <div style={selectedRow}>
          <div style={{ minWidth: 0 }}>
            <div style={selectedName}>📍 {activeVenue.name}</div>
            {(activeVenue.suburb || activeVenue.region) && (
              <div style={selectedMeta}>
                {[activeVenue.suburb, activeVenue.region].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => { playTap(); setOpen(true) }}
              style={smallBtn}
            >
              Change
            </button>
            {onClear && (
              <button
                type="button"
                onClick={handleClear}
                style={{ ...smallBtn, background: '#1f2937', color: '#94a3b8' }}
                aria-label="Clear selected venue"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // No selection or actively picking — show search input + results.
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input
          autoFocus={open}
          value={query}
          onChange={e => { setQuery(e.target.value); if (!open) setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={`🔎 ${label} — search by name or suburb…`}
          style={inputStyle}
        />
        {activeVenue && (
          <button
            type="button"
            onClick={() => { setOpen(false); setQuery('') }}
            style={smallBtn}
          >
            Cancel
          </button>
        )}
      </div>

      {open && (
        <div style={resultsBox} role="listbox">
          {matches.length === 0 ? (
            <div style={emptyMsg}>
              {venues.length === 0 ? 'Loading venues…' : 'No venues match that search.'}
            </div>
          ) : matches.map(v => (
            <button
              key={v.id || `${v.name}-${v.suburb}`}
              type="button"
              role="option"
              onClick={() => handlePick(v)}
              style={resultRow}
            >
              <div style={{ color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 600 }}>
                {v.name}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                {[v.suburb, v.region].filter(Boolean).join(' · ') || '—'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const cardWrap = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 10,
  padding: '0.6rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.45rem',
}

const compactWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.45rem',
}

const selectedRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
}

const selectedName = {
  color: '#f1f5f9',
  fontWeight: 700,
  fontSize: '0.9rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const selectedMeta = {
  color: '#64748b',
  fontSize: '0.72rem',
  marginTop: 2,
}

const smallBtn = {
  background: '#334155',
  color: '#f1f5f9',
  border: 'none',
  borderRadius: 8,
  padding: '0.3rem 0.6rem',
  fontSize: '0.72rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const inputStyle = {
  flex: 1,
  background: '#0f172a',
  border: '1px solid #475569',
  borderRadius: 8,
  color: '#f1f5f9',
  padding: '0.45rem 0.6rem',
  fontSize: '0.8rem',
  outline: 'none',
  minWidth: 0,
}

const resultsBox = {
  maxHeight: 220,
  overflowY: 'auto',
  background: '#0b1220',
  border: '1px solid #1f2937',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
}

const resultRow = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #1f2937',
  textAlign: 'left',
  padding: '0.5rem 0.6rem',
  cursor: 'pointer',
}

const emptyMsg = {
  color: '#64748b',
  fontSize: '0.78rem',
  padding: '0.6rem',
  textAlign: 'center',
}
