import { useState, useEffect } from 'react'
import {
  CHALLENGE_TYPES, loadChallenges, createChallenge, getActiveChallenges, getChallengeShareCode,
} from '../lib/viralStore'
import { playTap, playSuccess } from '../lib/sounds'

export default function ChallengeAMate() {
  const [challenges, setChallenges] = useState([])
  const [allChallenges, setAllChallenges] = useState([])
  const [selectedType, setSelectedType] = useState('bonus_count')
  const [friendCode, setFriendCode] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    setChallenges(getActiveChallenges())
    setAllChallenges(loadChallenges())
  }, [])

  function handleCreate() {
    const ch = createChallenge(selectedType, friendCode)
    if (ch) {
      setChallenges(getActiveChallenges())
      setAllChallenges(loadChallenges())
      setShowCreate(false)
      setFriendCode('')
      playSuccess()
    }
  }

  function timeLeft(endsAt) {
    const diff = endsAt - Date.now()
    if (diff <= 0) return 'Ended'
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`
  }

  const completed = allChallenges.filter(c => c.status === 'completed').slice(-5).reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header + create button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>
          🤝 Challenge a Mate
        </div>
        <button onClick={() => { setShowCreate(!showCreate); playTap() }} style={{
          background: showCreate ? '#334155' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: showCreate ? '#f1f5f9' : '#000', border: 'none', borderRadius: 8,
          padding: '0.35rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
        }}>
          {showCreate ? 'Cancel' : '+ New Challenge'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{
          background: '#1e293b', borderRadius: 12, padding: '0.75rem',
          border: '1px solid #334155',
        }}>
          <div style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Choose Challenge Type:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
            {CHALLENGE_TYPES.map(ct => (
              <button key={ct.key} onClick={() => { setSelectedType(ct.key); playTap() }} style={{
                background: selectedType === ct.key ? '#fbbf24' : '#334155',
                color: selectedType === ct.key ? '#000' : '#cbd5e1',
                border: 'none', borderRadius: 20, padding: '0.3rem 0.6rem',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
              }}>
                {ct.emoji} {ct.label}
              </button>
            ))}
          </div>
          <input
            value={friendCode}
            onChange={e => setFriendCode(e.target.value)}
            placeholder="Friend's referral code (optional)"
            style={{
              background: '#0f172a', border: '1px solid #475569', borderRadius: 8,
              color: '#f1f5f9', padding: '0.4rem 0.6rem', fontSize: '0.8rem',
              width: '100%', marginBottom: '0.5rem', boxSizing: 'border-box',
            }}
          />
          <button onClick={handleCreate} style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', width: '100%',
          }}>
            🚀 Launch Challenge
          </button>
        </div>
      )}

      {/* Active challenges */}
      {challenges.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {challenges.map(ch => (
            <div key={ch.id} style={{
              background: '#1e293b', borderRadius: 12, padding: '0.75rem',
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.85rem' }}>
                  {ch.emoji} {ch.label}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                  {timeLeft(ch.endsAt)}
                </div>
              </div>

              {/* Score bars */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: 2 }}>
                    {ch.creatorAvatar} {ch.creatorName}
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 99, height: 20, overflow: 'hidden' }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                      height: '100%', width: `${Math.min(100, ch.creatorScore * 2)}%`,
                      borderRadius: 99, display: 'flex', alignItems: 'center',
                      paddingLeft: 6, fontSize: '0.7rem', fontWeight: 700, color: '#000',
                      minWidth: ch.creatorScore > 0 ? 30 : 0,
                    }}>
                      {ch.creatorScore}
                    </div>
                  </div>
                </div>
                <div style={{ color: '#475569', fontWeight: 700, alignSelf: 'flex-end', fontSize: '0.8rem' }}>
                  VS
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: 2 }}>
                    {ch.friendJoined ? ch.friendName : '⏳ Waiting...'}
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 99, height: 20, overflow: 'hidden' }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                      height: '100%', width: `${Math.min(100, ch.friendScore * 2)}%`,
                      borderRadius: 99, display: 'flex', alignItems: 'center',
                      paddingLeft: 6, fontSize: '0.7rem', fontWeight: 700, color: '#000',
                      minWidth: ch.friendScore > 0 ? 30 : 0,
                    }}>
                      {ch.friendScore}
                    </div>
                  </div>
                </div>
              </div>

              {/* Share code */}
              <div style={{
                background: '#0f172a', borderRadius: 8, padding: '0.3rem 0.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                  Share code: <strong style={{ color: '#fbbf24' }}>{getChallengeShareCode(ch.id)}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showCreate && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#475569', fontSize: '0.8rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🤝</div>
            No active challenges. Create one and share the code with a mate!
          </div>
        )
      )}

      {/* Completed challenges */}
      {completed.length > 0 && (
        <div>
          <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.3rem' }}>
            Recent Completed
          </div>
          {completed.map(ch => (
            <div key={ch.id} style={{
              background: '#0f172a', borderRadius: 8, padding: '0.4rem 0.6rem',
              marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                {ch.emoji} {ch.label}
              </span>
              <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>
                {ch.creatorScore} vs {ch.friendScore} {ch.creatorScore > ch.friendScore ? '🏆 Won!' : ch.creatorScore < ch.friendScore ? '😅 Lost' : '🤝 Draw'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
