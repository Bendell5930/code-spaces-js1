import { useState, useEffect } from 'react'
import {
  loadReviews, postReview, getVenueReviews, getVenueAverageRating,
  markReviewHelpful, REVIEW_CATEGORIES,
} from '../lib/viralStore'
import { playTap, playSuccess } from '../lib/sounds'

function StarRating({ value, onChange, size = 20 }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          style={{
            background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default',
            fontSize: size, padding: 0, color: star <= value ? '#fbbf24' : '#334155',
            transition: 'color 0.15s',
          }}
        >★</button>
      ))}
    </div>
  )
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

export default function VenueRatings({ activeVenue }) {
  const [reviews, setReviews] = useState([])
  const [average, setAverage] = useState({ overall: 0, count: 0, categories: {} })
  const [showForm, setShowForm] = useState(false)
  const [ratings, setRatings] = useState({})
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (activeVenue?.name) {
      setReviews(getVenueReviews(activeVenue.name))
      setAverage(getVenueAverageRating(activeVenue.name))
    }
  }, [activeVenue])

  function handleSubmit(e) {
    e.preventDefault()
    if (!activeVenue?.name) return
    const hasRating = Object.values(ratings).some(v => v > 0)
    if (!hasRating) return

    postReview(activeVenue.name, activeVenue.suburb || '', ratings, comment)
    setReviews(getVenueReviews(activeVenue.name))
    setAverage(getVenueAverageRating(activeVenue.name))
    setShowForm(false)
    setRatings({})
    setComment('')
    playSuccess()
  }

  function handleHelpful(id) {
    markReviewHelpful(id)
    setReviews(getVenueReviews(activeVenue.name))
    playTap()
  }

  if (!activeVenue) {
    return (
      <div style={cardStyle}>
        <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>
          📍 Select a venue from the Venues tab to see and leave reviews.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #2d1a00, #1e293b)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '1rem' }}>
              ⭐ {activeVenue.name}
            </h3>
            {activeVenue.suburb && (
              <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.75rem' }}>
                {activeVenue.suburb}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24' }}>
              {average.overall > 0 ? average.overall : '—'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {average.count} review{average.count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Category averages */}
        {average.count > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.25rem', marginTop: '0.75rem' }}>
            {REVIEW_CATEGORIES.map(cat => (
              <div key={cat.key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem' }}>{cat.emoji}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{cat.label}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: (average.categories[cat.key] || 0) >= 4 ? '#22c55e' : (average.categories[cat.key] || 0) >= 3 ? '#fbbf24' : '#ef4444' }}>
                  {average.categories[cat.key] || '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => { setShowForm(!showForm); playTap() }}
          style={btnStyle}
        >
          {showForm ? '✕ Cancel' : '✍️ Write Review'}
        </button>
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...cardStyle, border: '1px solid #fbbf24' }}>
          <p style={{ margin: '0 0 0.5rem', color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 700 }}>
            Rate {activeVenue.name}
          </p>
          {REVIEW_CATEGORIES.map(cat => (
            <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{cat.emoji} {cat.label}</span>
              <StarRating value={ratings[cat.key] || 0} onChange={v => setRatings({ ...ratings, [cat.key]: v })} />
            </div>
          ))}
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Optional comment (max 300 chars)..."
            maxLength={300}
            rows={3}
            style={inputStyle}
          />
          <button type="submit" style={{ ...btnStyle, background: '#22c55e', opacity: Object.values(ratings).some(v => v > 0) ? 1 : 0.4 }}>
            ✅ Submit Review
          </button>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p style={{ color: '#475569', textAlign: 'center', fontSize: '0.85rem' }}>
          No reviews yet. Be the first!
        </p>
      ) : reviews.map(r => (
        <div key={r.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>{r.userAvatar}</span>
              <span style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600 }}>{r.userName}</span>
            </div>
            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{timeAgo(r.timestamp)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0.4rem 0' }}>
            <StarRating value={Math.round(r.overall)} size={14} />
            <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>{r.overall}</span>
          </div>
          {r.comment && (
            <p style={{ color: '#cbd5e1', fontSize: '0.8rem', margin: '0.4rem 0 0', lineHeight: 1.4 }}>
              {r.comment}
            </p>
          )}
          <button
            onClick={() => handleHelpful(r.id)}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', padding: '0.3rem 0 0', textAlign: 'left' }}
          >
            👍 Helpful {r.helpful > 0 && `(${r.helpful})`}
          </button>
        </div>
      ))}
    </div>
  )
}

const cardStyle = {
  background: '#1e293b',
  borderRadius: 12,
  padding: '0.85rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const btnStyle = {
  background: '#fbbf24',
  color: '#0f172a',
  border: 'none',
  borderRadius: 8,
  padding: '0.5rem 1rem',
  fontWeight: 700,
  fontSize: '0.8rem',
  cursor: 'pointer',
  marginTop: '0.5rem',
}

const inputStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '0.5rem',
  color: '#f1f5f9',
  fontSize: '0.8rem',
  resize: 'vertical',
  fontFamily: 'inherit',
}
