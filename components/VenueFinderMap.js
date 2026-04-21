import { useState, useEffect, useMemo } from 'react'
import { sortVenuesByDistance, getVenueAverageRating } from '../lib/viralStore'
import { getAllVenues } from '../data/qldVenues'

export default function VenueFinderMap({ venues, onSelectVenue }) {
  const [userPos, setUserPos] = useState(null)
  const [locError, setLocError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [maxDist, setMaxDist] = useState(50) // km
  const [allVenues, setAllVenues] = useState(() => (venues && venues.length ? venues : []))

  // When no venues prop is supplied, source the full QLD database
  // (plus any custom venues) so the Tools → Finder tab works standalone.
  useEffect(() => {
    if (venues && venues.length) {
      setAllVenues(venues)
    } else {
      setAllVenues(getAllVenues())
    }
  }, [venues])

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported')
      return
    }
    setLoading(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setLocError(err.code === 1 ? 'Location permission denied' : 'Could not get location')
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  useEffect(() => {
    requestLocation()
  }, [])

  const sortedVenues = useMemo(() => {
    if (!allVenues || allVenues.length === 0) return []

    let list = allVenues
    if (userPos) {
      list = sortVenuesByDistance(allVenues, userPos.lat, userPos.lon)
        .filter(v => v.distance <= maxDist)
    }

    if (filter) {
      const q = filter.toLowerCase()
      list = list.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.suburb?.toLowerCase().includes(q) ||
        v.region?.toLowerCase().includes(q)
      )
    }

    // Cap at a generous limit so the user sees the full extensive list
    // within their chosen radius without rendering thousands of rows.
    return list.slice(0, 200)
  }, [allVenues, userPos, filter, maxDist])

  function getHeatColor(rating) {
    if (rating >= 4) return '#22c55e'
    if (rating >= 3) return '#fbbf24'
    if (rating >= 2) return '#f97316'
    if (rating > 0) return '#ef4444'
    return '#334155'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, color: '#22c55e', fontSize: '1rem' }}>📍 Venue Finder</h3>
          <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.7rem' }}>
            Pokies near you • {sortedVenues.length} venues
          </p>
        </div>
        {userPos ? (
          <span style={locBadge}>📡 Located</span>
        ) : loading ? (
          <span style={{ ...locBadge, color: '#fbbf24', borderColor: '#fbbf2440' }}>📡 Finding...</span>
        ) : (
          <button onClick={requestLocation} style={locBtn}>📡 Locate Me</button>
        )}
      </div>

      {locError && (
        <div style={{ ...cardStyle, border: '1px solid #ef444440', background: '#2a0a0a' }}>
          <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>
            ⚠️ {locError}
          </p>
          <button onClick={requestLocation} style={retryBtn}>Try Again</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="🔍 Search venues..."
          style={{ ...inputStyle, flex: 1 }}
        />
        {userPos && (
          <select
            value={maxDist}
            onChange={e => setMaxDist(Number(e.target.value))}
            style={selectStyle}
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
            <option value={500}>All</option>
          </select>
        )}
      </div>

      {/* Venue list */}
      {sortedVenues.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ color: '#475569', margin: 0, fontSize: '0.85rem' }}>
            No venues found. Try expanding your search radius.
          </p>
        </div>
      ) : sortedVenues.map((v, i) => {
        const rating = getVenueAverageRating(v.name)
        return (
          <button
            key={v.id || v.name}
            onClick={() => onSelectVenue && onSelectVenue(v)}
            style={venueCardStyle}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem' }}>
                    {v.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  {v.suburb && (
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>📍 {v.suburb}</span>
                  )}
                  {v.region && (
                    <span style={{ color: '#475569', fontSize: '0.65rem' }}>({v.region})</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {v.distance !== undefined && (
                  <div style={{
                    fontSize: '0.85rem', fontWeight: 800,
                    color: v.distance < 5 ? '#22c55e' : v.distance < 15 ? '#fbbf24' : '#94a3b8',
                  }}>
                    {v.distance < 1 ? `${(v.distance * 1000).toFixed(0)}m` : `${v.distance}km`}
                  </div>
                )}
                {rating.count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                    <span style={{ color: getHeatColor(rating.overall), fontSize: '0.8rem', fontWeight: 700 }}>
                      ★ {rating.overall}
                    </span>
                    <span style={{ color: '#475569', fontSize: '0.6rem' }}>({rating.count})</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}

      <p style={{ color: '#334155', fontSize: '0.65rem', textAlign: 'center', margin: 0 }}>
        Distance is approximate. Always check venue hours before visiting.
      </p>
    </div>
  )
}

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'linear-gradient(135deg, #0a3d1a, #1e293b)',
  borderRadius: 12, padding: '0.75rem 0.85rem',
}

const cardStyle = {
  background: '#1e293b', borderRadius: 12, padding: '0.75rem',
  display: 'flex', flexDirection: 'column', gap: '0.4rem',
}

const locBadge = {
  background: '#22c55e20', border: '1px solid #22c55e40', borderRadius: 8,
  padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#22c55e', fontWeight: 600,
}

const locBtn = {
  background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 8,
  padding: '0.3rem 0.6rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
}

const retryBtn = {
  background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8,
  padding: '0.3rem 0.6rem', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
}

const inputStyle = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  padding: '0.45rem 0.6rem', color: '#f1f5f9', fontSize: '0.8rem', fontFamily: 'inherit',
}

const selectStyle = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  padding: '0.45rem 0.4rem', color: '#f1f5f9', fontSize: '0.8rem', fontFamily: 'inherit',
}

const venueCardStyle = {
  background: '#1e293b', borderRadius: 12, padding: '0.7rem',
  border: '1px solid transparent', cursor: 'pointer', textAlign: 'left',
  transition: 'border-color 0.2s', width: '100%', fontFamily: 'inherit',
}
