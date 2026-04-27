import { useState, useEffect } from 'react'
import {
  checkIn, checkOut, getActiveCheckIns, getMyActiveCheckIn, STATUS_OPTIONS,
} from '../lib/viralStore'
import { playTap, playSuccess } from '../lib/sounds'
import VenuePicker from './VenuePicker'
import AutoDiscovery from './AutoDiscovery'

export default function VenueCheckIn({ activeVenue, onSelectVenue, onStartScan }) {
  const [myCheckIn, setMyCheckIn] = useState(null)
  const [allCheckIns, setAllCheckIns] = useState([])
  const [status, setStatus] = useState('casual')
  const [machine, setMachine] = useState('')
  const [showAutoDiscovery, setShowAutoDiscovery] = useState(false)

  useEffect(() => {
    setMyCheckIn(getMyActiveCheckIn())
    setAllCheckIns(getActiveCheckIns())
  }, [])

  function handleAutoDiscoveryComplete(venue, machineName) {
    // Reflect the auto-detected venue into parent state
    if (venue && onSelectVenue) onSelectVenue(venue)
    if (machineName) setMachine(machineName)
    // Refresh check-in display
    setMyCheckIn(getMyActiveCheckIn())
    setAllCheckIns(getActiveCheckIns())
    playSuccess()
  }

  function handleCheckIn() {
    if (!activeVenue) return
    const result = checkIn(activeVenue, status, machine || null)
    setAllCheckIns(result)
    setMyCheckIn(getMyActiveCheckIn())
    playSuccess()
  }

  function handleCheckOut() {
    if (!myCheckIn) return
    const result = checkOut(myCheckIn.id)
    setAllCheckIns(result)
    setMyCheckIn(null)
    playTap()
  }

  const othersHere = allCheckIns.filter(c => c.userId !== myCheckIn?.userId)
  const statusLabel = s => STATUS_OPTIONS.find(o => o.key === s)?.label || s

  function timeAgo(ts) {
    const mins = Math.floor((Date.now() - ts) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* My Check-In */}
      {myCheckIn ? (
        <div style={{
          background: 'linear-gradient(135deg, #1a3a2a, #1e293b)',
          border: '1px solid #22c55e',
          borderRadius: 12, padding: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>
                📍 Checked In
              </div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, marginTop: 4 }}>
                {myCheckIn.venueName}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                {statusLabel(myCheckIn.status)} · {timeAgo(myCheckIn.timestamp)}
              </div>
            </div>
            <button onClick={handleCheckOut} style={{
              background: '#334155', border: 'none', color: '#f1f5f9',
              borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600,
            }}>
              Check Out
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#1e293b', borderRadius: 12, padding: '1rem',
          border: '1px solid #334155',
        }}>
          <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            📍 Check In at a Venue
          </div>

          {/* ── AI Auto-detect button ── */}
          <button
            onClick={() => { playTap(); setShowAutoDiscovery(true) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.45rem', width: '100%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(79,70,229,0.12))',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: 10, color: '#a5b4fc', fontSize: '0.83rem', fontWeight: 600,
              padding: '0.55rem 0.9rem', cursor: 'pointer', marginBottom: '0.6rem',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🤖</span>
            Auto-detect Venue &amp; Machine
          </button>

          {/* Inline venue picker — pick once and the same venue is reused
              for Reviews and other social tabs (shared via ViralHub). */}
          <div style={{ marginBottom: '0.6rem' }}>
            <VenuePicker
              activeVenue={activeVenue}
              onSelect={onSelectVenue}
              onClear={onSelectVenue ? () => onSelectVenue(null) : undefined}
              label="Or pick the venue you're at"
            />
          </div>

          {!activeVenue ? (
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
              Pick a venue above to check in.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => { setStatus(opt.key); playTap() }} style={{
                    background: status === opt.key ? '#fbbf24' : '#334155',
                    color: status === opt.key ? '#000' : '#cbd5e1',
                    border: 'none', borderRadius: 20, padding: '0.3rem 0.65rem',
                    fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              <input
                value={machine}
                onChange={e => setMachine(e.target.value)}
                placeholder="Machine name (optional)"
                style={{
                  background: '#0f172a', border: '1px solid #475569', borderRadius: 8,
                  color: '#f1f5f9', padding: '0.4rem 0.6rem', fontSize: '0.8rem',
                  width: '100%', marginBottom: '0.5rem', boxSizing: 'border-box',
                }}
              />

              <button onClick={handleCheckIn} style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000', border: 'none', borderRadius: 8, padding: '0.5rem 1rem',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', width: '100%',
              }}>
                📍 Check In Now
              </button>
            </>
          )}
        </div>
      )}

      {/* Others Nearby */}
      {othersHere.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: '0.75rem', border: '1px solid #334155' }}>
          <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>
            👥 {othersHere.length} {othersHere.length === 1 ? 'person' : 'people'} at venues now
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {othersHere.slice(0, 8).map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#0f172a', borderRadius: 8, padding: '0.4rem 0.6rem',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{c.userAvatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 600 }}>
                    {c.userName}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                    {c.venueName} · {statusLabel(c.status)} · {timeAgo(c.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {othersHere.length === 0 && !myCheckIn && (
        <div style={{
          textAlign: 'center', padding: '1.5rem', color: '#475569', fontSize: '0.8rem',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>📍</div>
          Be the first to check in today!
        </div>
      )}

      {/* Auto-discovery wizard modal */}
      {showAutoDiscovery && (
        <AutoDiscovery
          onComplete={handleAutoDiscoveryComplete}
          onStartScan={onStartScan}
          onClose={() => setShowAutoDiscovery(false)}
        />
      )}
    </div>
  )
}
