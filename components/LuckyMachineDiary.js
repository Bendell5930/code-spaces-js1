import { useState, useEffect } from 'react'
import {
  loadMachineDiary, addDiaryEntry, updateDiaryEntry, removeDiaryEntry,
} from '../lib/viralStore'
import { MACHINES } from '../data/machines'
import { playSuccess, playTap } from '../lib/sounds'

const STAR_LABELS = ['', 'Terrible', 'Meh', 'Decent', 'Good', 'Lucky!']

export default function LuckyMachineDiary() {
  const [diary, setDiary] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [machine, setMachine] = useState('')
  const [venue, setVenue] = useState('')
  const [suburb, setSuburb] = useState('')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setDiary(loadMachineDiary())
  }, [])

  function handleAdd() {
    if (!machine || !venue) return
    const result = addDiaryEntry(machine, venue, suburb)
    if (result.existing) return // already claimed
    setDiary(result.diary)
    setShowAdd(false)
    setMachine('')
    setVenue('')
    setSuburb('')
    playSuccess()
  }

  function handleRate(entryId, rating) {
    const updated = updateDiaryEntry(entryId, { rating })
    setDiary(updated)
    if (selectedEntry?.id === entryId) setSelectedEntry({ ...selectedEntry, rating })
    playTap()
  }

  function handleSaveNotes(entryId) {
    const updated = updateDiaryEntry(entryId, { notes })
    setDiary(updated)
    playTap()
  }

  function handleRemove(entryId) {
    const updated = removeDiaryEntry(entryId)
    setDiary(updated)
    setSelectedEntry(null)
    playTap()
  }

  function luckyColor(score) {
    if (score >= 70) return '#22c55e'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const machineList = Object.keys(MACHINES)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>
          📖 Lucky Machine Diary
        </div>
        <button onClick={() => { setShowAdd(!showAdd); playTap() }} style={{
          background: showAdd ? '#334155' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: showAdd ? '#f1f5f9' : '#000', border: 'none', borderRadius: 8,
          padding: '0.35rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
        }}>
          {showAdd ? 'Cancel' : '+ Claim Machine'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{
          background: '#1e293b', borderRadius: 12, padding: '0.75rem',
          border: '1px solid #334155',
        }}>
          <select
            value={machine}
            onChange={e => setMachine(e.target.value)}
            style={{
              background: '#0f172a', border: '1px solid #475569', borderRadius: 8,
              color: '#f1f5f9', padding: '0.4rem 0.6rem', fontSize: '0.8rem',
              width: '100%', marginBottom: '0.4rem',
            }}
          >
            <option value="">Select Machine Brand</option>
            {machineList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            value={venue}
            onChange={e => setVenue(e.target.value)}
            placeholder="Venue name"
            style={{
              background: '#0f172a', border: '1px solid #475569', borderRadius: 8,
              color: '#f1f5f9', padding: '0.4rem 0.6rem', fontSize: '0.8rem',
              width: '100%', marginBottom: '0.4rem', boxSizing: 'border-box',
            }}
          />
          <input
            value={suburb}
            onChange={e => setSuburb(e.target.value)}
            placeholder="Suburb (optional)"
            style={{
              background: '#0f172a', border: '1px solid #475569', borderRadius: 8,
              color: '#f1f5f9', padding: '0.4rem 0.6rem', fontSize: '0.8rem',
              width: '100%', marginBottom: '0.5rem', boxSizing: 'border-box',
            }}
          />
          <button onClick={handleAdd} disabled={!machine || !venue} style={{
            background: machine && venue ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#334155',
            color: machine && venue ? '#fff' : '#64748b',
            border: 'none', borderRadius: 8, padding: '0.5rem',
            fontWeight: 700, fontSize: '0.85rem', cursor: machine && venue ? 'pointer' : 'default',
            width: '100%',
          }}>
            📖 Claim This Machine
          </button>
        </div>
      )}

      {/* Machine cards */}
      {diary.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {diary.map(entry => (
            <div key={entry.id} onClick={() => {
              setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)
              setNotes(entry.notes || '')
            }} style={{
              background: '#1e293b', borderRadius: 12, padding: '0.75rem',
              border: selectedEntry?.id === entry.id ? '1px solid #fbbf24' : '1px solid #334155',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.85rem' }}>
                    {entry.nickname || entry.machineName}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {entry.venueName}{entry.venueSuburb ? ` · ${entry.venueSuburb}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: luckyColor(entry.luckyScore), fontWeight: 700, fontSize: '0.9rem' }}>
                    {entry.luckyScore}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.6rem' }}>Lucky Score</div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem',
                marginTop: '0.4rem',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.8rem' }}>{entry.totalSpins}</div>
                  <div style={{ color: '#475569', fontSize: '0.6rem' }}>Spins</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.8rem' }}>${entry.totalWins.toFixed(0)}</div>
                  <div style={{ color: '#475569', fontSize: '0.6rem' }}>Wins</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.8rem' }}>{entry.bonuses}</div>
                  <div style={{ color: '#475569', fontSize: '0.6rem' }}>Bonuses</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem' }}>${entry.biggestWin.toFixed(0)}</div>
                  <div style={{ color: '#475569', fontSize: '0.6rem' }}>Best Win</div>
                </div>
              </div>

              {/* Star rating */}
              <div style={{ display: 'flex', gap: 4, marginTop: '0.4rem', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={e => { e.stopPropagation(); handleRate(entry.id, star) }}
                    style={{
                      fontSize: '1.1rem', cursor: 'pointer',
                      filter: star <= (entry.rating || 0) ? 'none' : 'grayscale(1) brightness(0.4)',
                    }}
                  >
                    ⭐
                  </span>
                ))}
                <span style={{ color: '#64748b', fontSize: '0.7rem', marginLeft: 4 }}>
                  {STAR_LABELS[entry.rating || 0]}
                </span>
              </div>

              {/* Expanded detail */}
              {selectedEntry?.id === entry.id && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    placeholder="Notes about this machine..."
                    rows={3}
                    style={{
                      background: '#0f172a', border: '1px solid #475569', borderRadius: 8,
                      color: '#f1f5f9', padding: '0.4rem', fontSize: '0.78rem',
                      width: '100%', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <button onClick={e => { e.stopPropagation(); handleSaveNotes(entry.id) }} style={{
                      background: '#334155', color: '#f1f5f9', border: 'none', borderRadius: 8,
                      padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      flex: 1,
                    }}>
                      💾 Save Notes
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleRemove(entry.id) }} style={{
                      background: '#3a1515', color: '#ef4444', border: '1px solid #ef444440',
                      borderRadius: 8, padding: '0.35rem 0.6rem', fontSize: '0.75rem',
                      fontWeight: 600, cursor: 'pointer',
                    }}>
                      🗑️ Remove
                    </button>
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.65rem', marginTop: '0.3rem' }}>
                    Claimed {new Date(entry.claimedAt).toLocaleDateString('en-AU')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showAdd && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.8rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>📖</div>
            Claim your favourite machine at a venue and track its performance over time!
          </div>
        )
      )}
    </div>
  )
}
