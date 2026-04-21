import { useState, useEffect, useMemo } from 'react'
import {
  loadBingoCard,
  completeBingoTask,
  checkBingoWins,
  getBingoTaskProgress,
  postHotTip,
} from '../lib/viralStore'
import { playTap, playSuccess } from '../lib/sounds'

export default function PokieBingo() {
  const [card, setCard] = useState(null)
  const [wins, setWins] = useState([])
  const [newWin, setNewWin] = useState(null)
  const [progress, setProgress] = useState({})
  const [autoFlash, setAutoFlash] = useState(null)   // { taskId, label, source }
  const [shared, setShared] = useState(false)

  // Initial load + live refresh whenever auto-detection updates the card
  useEffect(() => {
    function refresh(detail) {
      const c = loadBingoCard()
      const newWins = checkBingoWins(c)
      setProgress(getBingoTaskProgress())
      setWins(prevWins => {
        if (newWins.length > prevWins.length) {
          setNewWin(newWins[newWins.length - 1])
          playSuccess()
          setTimeout(() => setNewWin(null), 3500)
        }
        return newWins
      })
      setCard(c)
      if (detail && detail.taskId) {
        setAutoFlash(detail)
        setTimeout(() => setAutoFlash(null), 3500)
      }
    }
    refresh()
    function onUpdate(e) { refresh(e?.detail) }
    function onStorage(e) { if (e.key === 'pokie-bingo' || e.key === 'pokie-bingo-progress') refresh() }
    if (typeof window !== 'undefined') {
      window.addEventListener('pokie-bingo-update', onUpdate)
      window.addEventListener('storage', onStorage)
    }
    // Poll progress every 10s so countdown hints stay fresh while card is open
    const t = setInterval(() => setProgress(getBingoTaskProgress()), 10000)
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pokie-bingo-update', onUpdate)
        window.removeEventListener('storage', onStorage)
      }
      clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset "shared" indicator when card resets to a new week
  useEffect(() => { setShared(false) }, [card?.weekId])

  function toggleTask(taskId) {
    if (taskId === 'free') return
    const cell = card?.grid.find(g => g.id === taskId)
    if (cell?.completed) return // can't un-complete
    const updated = completeBingoTask(taskId)
    setCard(updated)
    const bWins = checkBingoWins(updated)
    if (bWins.length > wins.length) {
      setNewWin(bWins[bWins.length - 1])
      playSuccess()
      setTimeout(() => setNewWin(null), 3500)
    } else {
      playTap()
    }
    setWins(bWins)
  }

  function handleShareWin() {
    if (!card || wins.length === 0) return
    const top = wins[wins.length - 1]
    const completed = card.grid.filter(g => g.completed).length
    const text = top.type === 'full'
      ? `🎉 FULL CARD on Pokie Bingo this week! 25/25 ✅`
      : `🎯 BINGO! ${top.label} on this week's Pokie Bingo (${completed}/25) — who can catch up?`
    try {
      postHotTip('Pokie Bingo', '', text)
      setShared(true)
      playSuccess()
      setTimeout(() => setShared(false), 4000)
    } catch { /* ignore share failures */ }
  }

  const completedCount = useMemo(
    () => (card ? card.grid.filter(g => g.completed).length : 0),
    [card]
  )
  const autoCount = useMemo(
    () => (card ? card.grid.filter(g => g.autoCompleted).length : 0),
    [card]
  )
  const totalTasks = 25

  if (!card) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
      {/* Animations */}
      <style>{keyframes}</style>

      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, color: '#ec4899', fontSize: '1rem' }}>🎱 Pokie Bingo</h3>
          <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.7rem' }}>
            Weekly challenge • Auto-fills from your live AI scan 🤖
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ec4899' }}>
            {completedCount}/{totalTasks}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
            {wins.length} line{wins.length !== 1 ? 's' : ''}
            {autoCount > 0 && ` • ${autoCount} auto`}
          </div>
        </div>
      </div>

      {/* Auto-detected toast (within the card) */}
      {autoFlash && (
        <div style={autoToastStyle}>
          <span style={{ fontSize: '1.1rem' }}>🤖</span>
          <span>
            <strong>Auto-detected:</strong> {autoFlash.label}
          </span>
        </div>
      )}

      {/* New BINGO celebration */}
      {newWin && (
        <div style={celebrationStyle}>
          <div style={confettiStyle} aria-hidden="true">
            {['🎉', '✨', '🎊', '⭐', '💫', '🎉', '✨', '🎊'].map((c, i) => (
              <span key={i} style={{ ...confettiPiece, animationDelay: `${i * 0.08}s` }}>{c}</span>
            ))}
          </div>
          <p style={{ color: '#ec4899', fontWeight: 800, margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            {newWin.type === 'full' ? '🏆 FULL CARD!' : `🎉 BINGO! ${newWin.label}`}
          </p>
        </div>
      )}

      {/* Existing wins + share */}
      {wins.length > 0 && !newWin && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {wins.map((w, i) => (
            <span key={i} style={winBadgeStyle}>
              ✅ {w.label}
            </span>
          ))}
          <button
            onClick={handleShareWin}
            style={shareBtnStyle}
            title="Share your bingo win to the Hot Tip feed"
          >
            {shared ? '✅ Shared!' : '📣 Share win'}
          </button>
        </div>
      )}

      {/* 5×5 Grid */}
      <div style={gridStyle}>
        {card.grid.map((cell) => {
          const prog = progress[cell.id]
          const showProg = !cell.completed && prog && prog.current > 0 && prog.current < prog.target
          const isAuto = cell.completed && cell.autoCompleted
          return (
            <button
              key={cell.id}
              onClick={() => toggleTask(cell.id)}
              style={{
                ...cellStyle,
                background: cell.completed
                  ? (cell.id === 'free'
                      ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                      : isAuto
                          ? 'linear-gradient(135deg, #6366f1, #4338ca)'
                          : 'linear-gradient(135deg, #22c55e, #16a34a)')
                  : '#0f172a',
                border: cell.completed
                  ? (cell.id === 'free'
                      ? '2px solid #fbbf24'
                      : isAuto
                          ? '2px solid #818cf8'
                          : '2px solid #22c55e40')
                  : '1px solid #1e293b',
                color: cell.completed ? '#fff' : '#94a3b8',
                cursor: cell.id === 'free' || cell.completed ? 'default' : 'pointer',
                transform: cell.completed && cell.id !== 'free' ? 'scale(0.98)' : 'none',
                animation: isAuto && autoFlash?.taskId === cell.id ? 'bingoSparkle 1.2s ease' : 'none',
                position: 'relative',
              }}
              aria-label={cell.text + (isAuto ? ' (auto-detected)' : '')}
            >
              <div style={{ fontSize: '1rem' }}>{cell.completed ? (isAuto ? '🤖' : '✅') : cell.emoji}</div>
              <div style={{
                fontSize: '0.55rem', lineHeight: 1.2, fontWeight: 600,
                wordBreak: 'break-word',
              }}>
                {cell.id === 'free' ? '⭐ FREE' : cell.text}
              </div>
              {showProg && (
                <div style={progressTagStyle}>
                  {prog.current}/{prog.target}
                </div>
              )}
            </button>
          )
        })}
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
        New card every Monday • 🤖 Indigo cells were auto-filled by your live AI scan
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

const shareBtnStyle = {
  background: 'linear-gradient(135deg, #ec4899, #a855f7)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '0.3rem 0.65rem',
  fontSize: '0.7rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const autoToastStyle = {
  background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
  border: '1px solid #818cf8',
  borderRadius: 10,
  padding: '0.5rem 0.75rem',
  color: '#c7d2fe',
  fontSize: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  animation: 'bingoFadeIn 0.3s ease',
}

const celebrationStyle = {
  background: 'linear-gradient(135deg, #4a1942, #1e293b)',
  border: '1px solid #ec4899',
  borderRadius: 12,
  padding: '0.75rem',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  animation: 'bingoFadeIn 0.3s ease',
}

const confettiStyle = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'flex-start',
}

const confettiPiece = {
  display: 'inline-block',
  fontSize: '1.1rem',
  animation: 'bingoConfetti 1.6s ease-out forwards',
}

const progressTagStyle = {
  position: 'absolute',
  bottom: 2,
  right: 4,
  fontSize: '0.5rem',
  fontWeight: 700,
  color: '#fbbf24',
  background: 'rgba(0,0,0,0.5)',
  borderRadius: 4,
  padding: '1px 4px',
  lineHeight: 1.2,
}

const keyframes = `
@keyframes bingoFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bingoSparkle {
  0%   { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7); transform: scale(1); }
  50%  { box-shadow: 0 0 18px 6px rgba(129, 140, 248, 0.5); transform: scale(1.05); }
  100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); transform: scale(0.98); }
}
@keyframes bingoConfetti {
  0%   { opacity: 0; transform: translateY(-6px) rotate(0deg); }
  20%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(40px) rotate(360deg); }
}
`
