import { useState, useEffect } from 'react'
import { getSeasonalEvents, updateEventProgress, claimEventBadge } from '../lib/viralStore'
import { playSuccess, playTap } from '../lib/sounds'

export default function SeasonalEvents({ spins }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const ev = getSeasonalEvents()
    // Auto-update progress from spins
    for (const e of ev) {
      let current = 0
      if (e.metric === 'spins') {
        current = e.machine
          ? spins.filter(s => (s.machineName || '').includes(e.machine)).length
          : spins.length
      } else if (e.metric === 'bonuses') {
        current = spins.filter(s => s.bonusHit).length
      } else if (e.metric === 'venues') {
        current = new Set(spins.map(s => s.venueName).filter(Boolean)).size
      } else if (e.metric === 'biggest_win') {
        current = spins.reduce((max, s) => Math.max(max, s.winAmount || 0), 0) > 0 ? 1 : 0
      }
      if (current > e.progress) {
        updateEventProgress(e.id, current)
      }
    }
    setEvents(getSeasonalEvents())
  }, [spins])

  function handleClaim(eventId) {
    claimEventBadge(eventId)
    setEvents(getSeasonalEvents())
    playSuccess()
  }

  const month = new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>
        🗓️ Seasonal Events — {month}
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.8rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🗓️</div>
          No active events this month. Check back soon!
        </div>
      ) : (
        events.map(ev => {
          const pct = Math.min(100, Math.round((ev.progress / ev.target) * 100))
          return (
            <div key={ev.id} style={{
              background: ev.completed ? 'linear-gradient(135deg, #1a2a1a, #1e293b)' : '#1e293b',
              borderRadius: 12, padding: '0.75rem',
              border: ev.completed ? '1px solid #22c55e40' : '1px solid #334155',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>
                  {ev.title}
                </div>
                {ev.completed && !ev.claimedBadge && (
                  <button onClick={() => handleClaim(ev.id)} style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '0.25rem 0.5rem', fontSize: '0.72rem', fontWeight: 700,
                    cursor: 'pointer', animation: 'pulse 1.5s infinite',
                  }}>
                    Claim {ev.badge}
                  </button>
                )}
                {ev.claimedBadge && (
                  <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 600 }}>
                    {ev.badge} Claimed!
                  </span>
                )}
              </div>

              <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                {ev.description}
              </div>

              {/* Progress bar */}
              <div style={{ background: '#0f172a', borderRadius: 99, height: 22, overflow: 'hidden', marginBottom: '0.2rem' }}>
                <div style={{
                  background: ev.completed
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                  height: '100%', width: `${pct}%`, borderRadius: 99,
                  display: 'flex', alignItems: 'center', paddingLeft: 8,
                  fontSize: '0.7rem', fontWeight: 700,
                  color: ev.completed ? '#fff' : '#000',
                  minWidth: ev.progress > 0 ? 40 : 0,
                  transition: 'width 0.5s ease',
                }}>
                  {ev.progress}/{ev.target}
                </div>
              </div>
              <div style={{ color: '#475569', fontSize: '0.68rem', textAlign: 'right' }}>
                {pct}% · Reward: {ev.badge} {ev.badgeLabel}
              </div>
            </div>
          )
        })
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
