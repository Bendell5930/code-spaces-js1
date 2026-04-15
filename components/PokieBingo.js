import { useState, useEffect } from 'react'
import { loadBingoCard, completeBingoTask, checkBingoWins } from '../lib/viralStore'
import { playTap, playSuccess } from '../lib/sounds'

export default function PokieBingo() {
  const [card, setCard] = useState(null)
  const [wins, setWins] = useState([])
  const [newWin, setNewWin] = useState(null)

  useEffect(() => {
    const c = loadBingoCard()
    setCard(c)
    setWins(checkBingoWins(c))
  }, [])

  function toggleTask(taskId) {
    if (taskId === 'free') return
    const updated = completeBingoTask(taskId)
    setCard(updated)
    const bWins = checkBingoWins(updated)
    if (bWins.length > wins.length) {
      setNewWin(bWins[bWins.length - 1])
      playSuccess()
      setTimeout(() => setNewWin(null), 3000)
    } else {
      playTap()
    }
    setWins(bWins)
  }

  if (!card) return null

  const completedCount = card.grid.filter(g => g.completed).length
  const totalTasks = 25

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, color: '#ec4899', fontSize: '1rem' }}>🎱 Pokie Bingo</h3>
          <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.7rem' }}>
            Weekly challenge card • Tap to complete
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ec4899' }}>
            {completedCount}/{totalTasks}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
            {wins.length} line{wins.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Bingo wins */}
      {newWin && (
        <div style={{
          background: 'linear-gradient(135deg, #4a1942, #1e293b)',
          border: '1px solid #ec4899',
          borderRadius: 12, padding: '0.75rem', textAlign: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🎉</span>
          <p style={{ color: '#ec4899', fontWeight: 800, margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            BINGO! {newWin.label}
          </p>
        </div>
      )}

      {wins.length > 0 && !newWin && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {wins.map((w, i) => (
            <span key={i} style={winBadgeStyle}>
              ✅ {w.label}
            </span>
          ))}
        </div>
      )}

      {/* 5×5 Grid */}
      <div style={gridStyle}>
        {card.grid.map((cell, i) => (
          <button
            key={cell.id}
            onClick={() => toggleTask(cell.id)}
            style={{
              ...cellStyle,
              background: cell.completed
                ? (cell.id === 'free' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #22c55e, #16a34a)')
                : '#0f172a',
              border: cell.completed
                ? (cell.id === 'free' ? '2px solid #fbbf24' : '2px solid #22c55e40')
                : '1px solid #1e293b',
              color: cell.completed ? '#fff' : '#94a3b8',
              cursor: cell.id === 'free' ? 'default' : 'pointer',
              transform: cell.completed && cell.id !== 'free' ? 'scale(0.98)' : 'none',
            }}
          >
            <div style={{ fontSize: '1rem' }}>{cell.completed ? '✅' : cell.emoji}</div>
            <div style={{
              fontSize: '0.55rem', lineHeight: 1.2, fontWeight: 600,
              wordBreak: 'break-word',
            }}>
              {cell.id === 'free' ? '⭐ FREE' : cell.text}
            </div>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ background: '#0f172a', borderRadius: 8, height: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 8,
          width: `${(completedCount / totalTasks) * 100}%`,
          background: 'linear-gradient(90deg, #ec4899, #a855f7)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      <p style={{ color: '#334155', fontSize: '0.65rem', textAlign: 'center', margin: 0 }}>
        New card every Monday. Tap tasks as you complete them.
      </p>
    </div>
  )
}

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'linear-gradient(135deg, #3d0a30, #1e293b)',
  borderRadius: 12, padding: '0.75rem 0.85rem',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '4px',
}

const cellStyle = {
  borderRadius: 8,
  padding: '0.35rem 0.2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.15rem',
  minHeight: 60,
  textAlign: 'center',
  transition: 'all 0.2s',
  fontFamily: 'inherit',
}

const winBadgeStyle = {
  background: '#1a2a1a',
  border: '1px solid #22c55e40',
  borderRadius: 8,
  padding: '0.25rem 0.5rem',
  fontSize: '0.7rem',
  color: '#22c55e',
  fontWeight: 600,
}
