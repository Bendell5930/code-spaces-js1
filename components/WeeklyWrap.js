import { useState, useMemo } from 'react'
import { getWeeklyWrap } from '../lib/viralStore'

export default function WeeklyWrap({ spins }) {
  const [sortBy, setSortBy] = useState('wins')
  const wrap = useMemo(() => getWeeklyWrap(spins || []), [spins])

  const sortedMachines = useMemo(() => {
    const m = [...(wrap.topMachines || [])]
    if (sortBy === 'wins') m.sort((a, b) => b.wins - a.wins)
    else if (sortBy === 'spins') m.sort((a, b) => b.spins - a.spins)
    else if (sortBy === 'bonuses') m.sort((a, b) => b.bonuses - a.bonuses)
    else if (sortBy === 'biggest') m.sort((a, b) => b.biggestWin - a.biggestWin)
    return m
  }, [wrap, sortBy])

  const statCards = [
    { label: 'Spins', value: wrap.totalSpins, emoji: '🔄', color: '#38bdf8' },
    { label: 'Bonuses', value: wrap.totalBonuses, emoji: '⭐', color: '#a78bfa' },
    { label: 'Total Wins', value: `$${wrap.totalWins.toFixed(0)}`, emoji: '💰', color: '#22c55e' },
    { label: 'RTP', value: `${wrap.rtp}%`, emoji: '📊', color: wrap.rtp >= 90 ? '#22c55e' : '#f59e0b' },
    { label: 'Net P&L', value: `$${wrap.netPosition >= 0 ? '+' : ''}${wrap.netPosition.toFixed(0)}`, emoji: wrap.netPosition >= 0 ? '📈' : '📉', color: wrap.netPosition >= 0 ? '#22c55e' : '#ef4444' },
    { label: 'Biggest Win', value: `$${wrap.biggestWin.toFixed(0)}`, emoji: '🏆', color: '#fbbf24' },
    { label: 'Venues', value: wrap.venueCount, emoji: '📍', color: '#f97316' },
    { label: 'Machines', value: wrap.machineCount, emoji: '🎰', color: '#ec4899' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '1rem' }}>
          📊 Weekly Wrap
        </h3>
        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
          Week of {wrap.weekStartStr}
        </span>
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={statStyle}>
            <div style={{ fontSize: '1.1rem' }}>{s.emoji}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Machine leaderboard */}
      {sortedMachines.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '0.85rem' }}>🏅 Top Machines</h4>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['wins', 'spins', 'bonuses', 'biggest'].map(key => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  style={{
                    background: sortBy === key ? '#fbbf24' : '#0f172a',
                    color: sortBy === key ? '#0f172a' : '#64748b',
                    border: sortBy === key ? 'none' : '1px solid #334155',
                    borderRadius: 6, padding: '0.2rem 0.4rem',
                    fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {sortedMachines.map((m, i) => (
            <div key={m.name} style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <span style={{
                  fontSize: '0.8rem', fontWeight: 800, width: 22, textAlign: 'center',
                  color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#475569',
                }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span style={{ color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 600 }}>{m.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem' }}>
                <span style={{ color: '#22c55e' }}>${m.wins.toFixed(0)}</span>
                <span style={{ color: '#38bdf8' }}>{m.spins}sp</span>
                <span style={{ color: '#a78bfa' }}>{m.bonuses}b</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {wrap.totalSpins === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ color: '#475569', margin: 0, fontSize: '0.85rem' }}>
            No spins logged this week yet. Start tracking to see your weekly stats! 📊
          </p>
        </div>
      )}

      <p style={{ color: '#334155', fontSize: '0.65rem', textAlign: 'center', margin: 0 }}>
        Resets every Monday. Past results don't predict future outcomes.
      </p>
    </div>
  )
}

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'linear-gradient(135deg, #1a1a3d, #1e293b)',
  borderRadius: 12, padding: '0.75rem 0.85rem',
}

const cardStyle = {
  background: '#1e293b', borderRadius: 12, padding: '0.75rem',
}

const statStyle = {
  background: '#0f172a', borderRadius: 10, padding: '0.5rem 0.25rem',
  textAlign: 'center', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '0.15rem',
}

const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0.4rem 0', borderBottom: '1px solid #1a2535',
}
