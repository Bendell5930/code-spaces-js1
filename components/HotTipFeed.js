import { useState, useEffect } from 'react'
import { loadHotTips, postHotTip, fireTip } from '../lib/viralStore'
import { playTap, playSuccess } from '../lib/sounds'

function timeLeft(expiresAt) {
  const diff = expiresAt - Date.now()
  if (diff <= 0) return 'expired'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m left`
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function HotTipFeed({ activeVenue }) {
  const [tips, setTips] = useState([])
  const [showPost, setShowPost] = useState(false)
  const [venue, setVenue] = useState('')
  const [machine, setMachine] = useState('')
  const [tipText, setTipText] = useState('')

  useEffect(() => {
    setTips(loadHotTips())
    // Refresh every 30 seconds to update expiry
    const iv = setInterval(() => setTips(loadHotTips()), 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (activeVenue?.name) setVenue(activeVenue.name)
  }, [activeVenue])

  function handlePost(e) {
    e.preventDefault()
    if (!venue.trim() || !tipText.trim()) return
    const result = postHotTip(venue, machine, tipText)
    setTips(result)
    setShowPost(false)
    setTipText('')
    setMachine('')
    playSuccess()
  }

  function handleFire(id) {
    const result = fireTip(id)
    setTips(result)
    playTap()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, color: '#f97316', fontSize: '1rem' }}>🔥 Hot Tips</h3>
          <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.7rem' }}>
            Anonymous tips • expire after 2 hours
          </p>
        </div>
        <button
          onClick={() => { setShowPost(!showPost); playTap() }}
          style={postBtnStyle}
        >
          {showPost ? '✕' : '💡 Post Tip'}
        </button>
      </div>

      {/* Post form */}
      {showPost && (
        <form onSubmit={handlePost} style={{ ...cardStyle, border: '1px solid #f97316' }}>
          <input
            value={venue}
            onChange={e => setVenue(e.target.value)}
            placeholder="Venue name..."
            style={inputStyle}
            required
          />
          <input
            value={machine}
            onChange={e => setMachine(e.target.value)}
            placeholder="Machine (optional)"
            style={inputStyle}
          />
          <textarea
            value={tipText}
            onChange={e => setTipText(e.target.value)}
            placeholder='e.g. "Lightning Link has been paying all arvo"'
            maxLength={200}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            required
          />
          <button type="submit" style={{ ...postBtnStyle, width: '100%', background: '#f97316' }}>
            🔥 Post Hot Tip
          </button>
        </form>
      )}

      {/* Tips feed */}
      {tips.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ color: '#475569', margin: 0, fontSize: '0.85rem' }}>
            No active tips right now. Be the first to drop one! 💡
          </p>
        </div>
      ) : tips.map(tip => (
        <div key={tip.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem' }}>{tip.userAvatar}</span>
                <span style={venueTagStyle}>📍 {tip.venueName}</span>
                {tip.machineName && (
                  <span style={machineTagStyle}>🎰 {tip.machineName}</span>
                )}
              </div>
              <p style={{ color: '#f1f5f9', margin: '0.4rem 0', fontSize: '0.85rem', lineHeight: 1.4 }}>
                "{tip.text}"
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#64748b' }}>
              <span>🕐 {timeAgo(tip.timestamp)}</span>
              <span style={{ color: tip.expiresAt - Date.now() < 1800000 ? '#ef4444' : '#22c55e' }}>
                ⏳ {timeLeft(tip.expiresAt)}
              </span>
            </div>
            <button
              onClick={() => handleFire(tip.id)}
              style={fireBtnStyle}
            >
              🔥 {tip.fires || 0}
            </button>
          </div>
        </div>
      ))}

      <p style={{ color: '#334155', fontSize: '0.65rem', textAlign: 'center', margin: 0 }}>
        Tips are anonymous and auto-expire. Past results don't predict future outcomes.
      </p>
    </div>
  )
}

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'linear-gradient(135deg, #3d1a00, #1e293b)',
  borderRadius: 12, padding: '0.75rem 0.85rem',
}

const cardStyle = {
  background: '#1e293b', borderRadius: 12, padding: '0.75rem',
  display: 'flex', flexDirection: 'column', gap: '0.4rem',
}

const inputStyle = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  padding: '0.45rem 0.6rem', color: '#f1f5f9', fontSize: '0.8rem', fontFamily: 'inherit',
}

const postBtnStyle = {
  background: '#fbbf24', color: '#0f172a', border: 'none', borderRadius: 8,
  padding: '0.4rem 0.75rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
}

const venueTagStyle = {
  background: '#0f172a', borderRadius: 6, padding: '0.15rem 0.4rem',
  fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600,
}

const machineTagStyle = {
  background: '#1a0a2e', borderRadius: 6, padding: '0.15rem 0.4rem',
  fontSize: '0.7rem', color: '#a78bfa', fontWeight: 600,
}

const fireBtnStyle = {
  background: '#2a1500', border: '1px solid #f9731640', borderRadius: 8,
  padding: '0.25rem 0.6rem', color: '#f97316', fontSize: '0.8rem',
  fontWeight: 700, cursor: 'pointer',
}
