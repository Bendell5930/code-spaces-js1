import { useState, useEffect } from 'react'
import styles from './JackpotDisplay.module.css'

const JACKPOT_KEY = 'pokie-jackpot-wins'

function loadJackpots() {
  if (typeof window === 'undefined') return { grand: [], major: [] }
  try {
    const raw = localStorage.getItem(JACKPOT_KEY)
    return raw ? JSON.parse(raw) : { grand: [], major: [] }
  } catch {
    return { grand: [], major: [] }
  }
}

function saveJackpots(data) {
  localStorage.setItem(JACKPOT_KEY, JSON.stringify(data))
}

export default function JackpotDisplay() {
  const [jackpots, setJackpots] = useState({ grand: [], major: [] })
  const [activeModal, setActiveModal] = useState(null) // 'grand' | 'major' | null
  const [inputValue, setInputValue] = useState('')
  const [showSuccess, setShowSuccess] = useState(null)

  useEffect(() => {
    setJackpots(loadJackpots())
  }, [])

  // Refresh when AI Scan pushes jackpots on session end
  useEffect(() => {
    function onJackpotUpdate() {
      setJackpots(loadJackpots())
    }
    window.addEventListener('jackpot-update', onJackpotUpdate)
    return () => window.removeEventListener('jackpot-update', onJackpotUpdate)
  }, [])

  const grandTotal = jackpots.grand.reduce((s, w) => s + w.amount, 0)
  const majorTotal = jackpots.major.reduce((s, w) => s + w.amount, 0)

  function openModal(tier) {
    setActiveModal(tier)
    setInputValue('')
  }

  function handleSave() {
    const amount = parseFloat(inputValue)
    if (!amount || amount <= 0) return

    const entry = {
      amount,
      date: new Date().toISOString(),
      id: Date.now(),
    }

    const updated = { ...jackpots }
    updated[activeModal] = [...updated[activeModal], entry]
    setJackpots(updated)
    saveJackpots(updated)
    setActiveModal(null)
    setInputValue('')

    // Flash success
    setShowSuccess(activeModal)
    setTimeout(() => setShowSuccess(null), 1500)
  }

  function handleDelete(tier, id) {
    const updated = { ...jackpots }
    updated[tier] = updated[tier].filter((w) => w.id !== id)
    setJackpots(updated)
    saveJackpots(updated)
  }

  function formatAmount(val) {
    return val.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <>
      <div className={styles.wrapper}>
        {/* Grand Jackpot Button */}
        <button
          className={`${styles.card} ${styles.grand} ${showSuccess === 'grand' ? styles.successFlash : ''}`}
          onClick={() => openModal('grand')}
        >
          <span className={styles.tier}>🏆 Grand Jackpot</span>
          <span className={styles.amount}>
            ${formatAmount(grandTotal)}
          </span>
          <span className={styles.hint}>
            {jackpots.grand.length > 0
              ? `${jackpots.grand.length} win${jackpots.grand.length > 1 ? 's' : ''} — Tap to add`
              : 'Tap to log a win'}
          </span>
        </button>

        {/* Major Jackpot Button */}
        <button
          className={`${styles.card} ${styles.major} ${showSuccess === 'major' ? styles.successFlash : ''}`}
          onClick={() => openModal('major')}
        >
          <span className={styles.tier}>💎 Major Jackpot</span>
          <span className={styles.amount}>
            ${formatAmount(majorTotal)}
          </span>
          <span className={styles.hint}>
            {jackpots.major.length > 0
              ? `${jackpots.major.length} win${jackpots.major.length > 1 ? 's' : ''} — Tap to add`
              : 'Tap to log a win'}
          </span>
        </button>
      </div>

      {/* Entry Modal */}
      {activeModal && (
        <div className={styles.overlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modalHeader} ${activeModal === 'grand' ? styles.modalGrand : styles.modalMajor}`}>
              <span className={styles.modalIcon}>
                {activeModal === 'grand' ? '🏆' : '💎'}
              </span>
              <h3 className={styles.modalTitle}>
                Log {activeModal === 'grand' ? 'Grand' : 'Major'} Jackpot Win
              </h3>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.label}>Win Amount ($AUD)</label>
              <div className={styles.inputRow}>
                <span className={styles.dollar}>$</span>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0.00"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  min="0"
                  step="0.01"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>

              <div className={styles.btnRow}>
                <button className={styles.cancelBtn} onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button
                  className={`${styles.saveBtn} ${activeModal === 'grand' ? styles.saveGrand : styles.saveMajor}`}
                  onClick={handleSave}
                  disabled={!inputValue || parseFloat(inputValue) <= 0}
                >
                  Save Win
                </button>
              </div>

              {/* History */}
              {jackpots[activeModal].length > 0 && (
                <div className={styles.history}>
                  <h4 className={styles.historyTitle}>Previous Wins</h4>
                  {[...jackpots[activeModal]].reverse().map((w) => (
                    <div key={w.id} className={styles.historyItem}>
                      <div className={styles.historyInfo}>
                        <span className={styles.historyAmount}>${formatAmount(w.amount)}</span>
                        <span className={styles.historyDate}>
                          {new Date(w.date).toLocaleDateString('en-AU', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(activeModal, w.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
