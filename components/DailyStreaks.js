import { useState, useEffect } from 'react'
import { loadStreakData, recordDailyCheckIn, STREAK_MILESTONES, getStreakFrame, getStreakFlairs } from '../lib/viralStore'
import { playSuccess, playTap } from '../lib/sounds'

export default function DailyStreaks() {
  const [streak, setStreak] = useState(null)
  const [newRewards, setNewRewards] = useState([])
  const [checkedIn, setCheckedIn] = useState(false)

  useEffect(() => {
    setStreak(loadStreakData())
  }, [])

  function handleCheckIn() {
    const result = recordDailyCheckIn()
    setStreak(result)
    if (result.alreadyCheckedIn) {
      setCheckedIn(true)
      return
    }
    setCheckedIn(true)
    if (result.newRewards && result.newRewards.length > 0) {
      setNewRewards(result.newRewards)
      playSuccess()
    } else {
      playTap()
    }
  }

  if (!streak) return null

  const frame = getStreakFrame()
  const flairs = getStreakFlairs()
  const today = new Date().toISOString().slice(0, 10)
  const alreadyDone = streak.lastCheckIn === today

  // Build visual streak calendar (last 14 days)
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    const hasCheck = streak.history?.some(h => h.date === ds)
    days.push({ date: ds, day: d.toLocaleDateString('en-AU', { weekday: 'narrow' }), active: hasCheck })
  }

  // Next milestone
  const nextMilestone = STREAK_MILESTONES.find(m => m.days > streak.currentStreak)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Streak header */}
      <div style={{
        background: 'linear-gradient(135deg, #2d1a00, #1e293b)',
        borderRadius: 12, padding: '1rem', textAlign: 'center',
        border: '1px solid #f59e0b40',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
          {frame ? frame.reward : '🔥'}
        </div>
        <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '2rem' }}>
          {streak.currentStreak}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
          Day Streak
        </div>

        {flairs.length > 0 && (
          <div style={{ marginTop: '0.3rem', display: 'flex', justifyContent: 'center', gap: '0.3rem' }}>
            {flairs.map(f => (
              <span key={f.label} title={f.label} style={{ fontSize: '1.2rem' }}>{f.reward}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700 }}>{streak.longestStreak}</div>
            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Best</div>
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700 }}>{streak.totalDays}</div>
            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Total Days</div>
          </div>
        </div>
      </div>

      {/* Check in button */}
      <button
        onClick={handleCheckIn}
        disabled={alreadyDone || checkedIn}
        style={{
          background: alreadyDone || checkedIn
            ? '#334155'
            : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: alreadyDone || checkedIn ? '#64748b' : '#000',
          border: 'none', borderRadius: 10, padding: '0.65rem',
          fontWeight: 700, fontSize: '0.9rem', cursor: alreadyDone || checkedIn ? 'default' : 'pointer',
          width: '100%',
        }}
      >
        {alreadyDone || checkedIn ? '✅ Checked In Today!' : '🔥 Check In & Keep Streak'}
      </button>

      {/* New rewards popup */}
      {newRewards.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1a3a1a, #1e293b)',
          border: '1px solid #22c55e', borderRadius: 12, padding: '0.75rem',
          textAlign: 'center',
        }}>
          <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: '0.3rem' }}>
            🎉 New Rewards Unlocked!
          </div>
          {newRewards.map(r => (
            <div key={r.label} style={{ color: r.color, fontWeight: 600, fontSize: '0.85rem' }}>
              {r.reward} {r.label}
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '0.75rem', border: '1px solid #334155' }}>
        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          Last 14 Days
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3 }}>
          {days.map(d => (
            <div key={d.date} style={{ textAlign: 'center' }}>
              <div style={{ color: '#475569', fontSize: '0.6rem' }}>{d.day}</div>
              <div style={{
                width: 22, height: 22, borderRadius: 6, margin: '2px auto',
                background: d.active ? '#f59e0b' : '#0f172a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', color: d.active ? '#000' : '#334155',
              }}>
                {d.active ? '🔥' : '·'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '0.75rem', border: '1px solid #334155' }}>
        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          Streak Milestones
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {STREAK_MILESTONES.map(m => {
            const unlocked = streak.unlockedRewards?.includes(m.label)
            const isNext = nextMilestone && m.days === nextMilestone.days
            return (
              <div key={m.label} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: unlocked ? '#0f2a1a' : '#0f172a',
                borderRadius: 8, padding: '0.35rem 0.5rem',
                border: isNext ? '1px solid #f59e0b40' : '1px solid transparent',
                opacity: unlocked ? 1 : 0.6,
              }}>
                <span style={{ fontSize: '1.1rem' }}>{m.reward}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: unlocked ? m.color : '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>
                    {m.label}
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.68rem' }}>
                    {m.days} day streak · {m.type === 'frame' ? 'Profile Frame' : 'Chat Flair'}
                  </div>
                </div>
                {unlocked ? (
                  <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>✓</span>
                ) : isNext ? (
                  <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 600 }}>
                    {m.days - streak.currentStreak}d away
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
