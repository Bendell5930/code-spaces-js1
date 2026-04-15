import { useState, useEffect } from 'react'
import {
  ALL_ACHIEVEMENTS, loadUnlockedAchievements, checkAndUnlockAchievements, buildAchievementStats,
} from '../lib/viralStore'
import { playSuccess } from '../lib/sounds'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'gambling', label: '🎰 Gambling' },
  { key: 'venue', label: '📍 Venue' },
  { key: 'responsible', label: '🛡️ Responsible' },
  { key: 'streak', label: '🔥 Streak' },
  { key: 'social', label: '💬 Social' },
  { key: 'mastery', label: '🐉 Mastery' },
  { key: 'seasonal', label: '🏅 Seasonal' },
]

export default function AchievementWall({ spins }) {
  const [unlocked, setUnlocked] = useState([])
  const [category, setCategory] = useState('all')
  const [newlyUnlocked, setNewlyUnlocked] = useState([])

  useEffect(() => {
    // Check for new achievements
    const stats = buildAchievementStats(spins || [])
    const newOnes = checkAndUnlockAchievements(stats)
    if (newOnes.length > 0) {
      setNewlyUnlocked(newOnes)
      playSuccess()
    }
    setUnlocked(loadUnlockedAchievements())
  }, [spins])

  const unlockedIds = new Set(unlocked.map(a => a.id))
  const filtered = category === 'all'
    ? ALL_ACHIEVEMENTS
    : ALL_ACHIEVEMENTS.filter(a => a.category === category)

  const totalUnlocked = unlocked.length
  const totalAchievements = ALL_ACHIEVEMENTS.length
  const pct = Math.round((totalUnlocked / totalAchievements) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* New unlock banner */}
      {newlyUnlocked.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #2d1a00, #1e293b)',
          border: '1px solid #f59e0b', borderRadius: 12, padding: '0.75rem',
          textAlign: 'center',
        }}>
          <div style={{ color: '#fbbf24', fontWeight: 700 }}>🎉 New Achievement{newlyUnlocked.length > 1 ? 's' : ''}!</div>
          {newlyUnlocked.map(a => (
            <div key={a.id} style={{ color: '#f1f5f9', fontSize: '0.85rem', marginTop: 4 }}>
              {a.emoji} <strong>{a.label}</strong> — {a.description}
            </div>
          ))}
        </div>
      )}

      {/* Progress header */}
      <div style={{
        background: '#1e293b', borderRadius: 12, padding: '0.75rem',
        border: '1px solid #334155', textAlign: 'center',
      }}>
        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
          🏆 Achievement Wall
        </div>
        <div style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.5rem' }}>
          {totalUnlocked}/{totalAchievements}
        </div>
        <div style={{ background: '#0f172a', borderRadius: 99, height: 10, margin: '0.4rem 0', overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{pct}% Complete</div>
      </div>

      {/* Category filter */}
      <div style={{
        display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: 4,
        WebkitOverflowScrolling: 'touch',
      }}>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
            background: category === cat.key ? '#fbbf24' : '#334155',
            color: category === cat.key ? '#000' : '#94a3b8',
            border: 'none', borderRadius: 20, padding: '0.28rem 0.55rem',
            fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem',
      }}>
        {filtered.map(a => {
          const isUnlocked = unlockedIds.has(a.id)
          const unlockData = unlocked.find(u => u.id === a.id)
          return (
            <div key={a.id} style={{
              background: isUnlocked ? '#0f2a1a' : '#0f172a',
              borderRadius: 10, padding: '0.6rem',
              border: isUnlocked ? '1px solid #22c55e40' : '1px solid #1e293b',
              opacity: isUnlocked ? 1 : 0.5,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>
                {isUnlocked ? a.emoji : '🔒'}
              </div>
              <div style={{
                color: isUnlocked ? '#f1f5f9' : '#475569',
                fontWeight: 700, fontSize: '0.75rem',
              }}>
                {a.label}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: 2 }}>
                {a.description}
              </div>
              {isUnlocked && unlockData && (
                <div style={{ color: '#22c55e', fontSize: '0.6rem', marginTop: 4 }}>
                  ✓ {new Date(unlockData.unlockedAt).toLocaleDateString('en-AU')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
