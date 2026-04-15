import { useState, useEffect } from 'react'
import {
  loadMateMode, setupMateMode, linkMate, disableMateMode,
  getMateAlerts, dismissMateAlert, sendMateAlert,
} from '../lib/viralStore'
import { playTap, playSuccess, playWarn } from '../lib/sounds'

export default function MateMode({ sessionData }) {
  const [mate, setMate] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [linkCode, setLinkCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [alertSent, setAlertSent] = useState(false)

  useEffect(() => {
    setMate(loadMateMode())
    setAlerts(getMateAlerts())
  }, [])

  // Auto-trigger mate alerts based on session data
  useEffect(() => {
    if (!mate?.enabled || !mate?.mateLinked || !sessionData) return

    if (sessionData.budgetPercent >= 90 && !alertSent) {
      sendMateAlert('budget_hit', `Your mate hit 90% of their budget! ($${sessionData.totalBet?.toFixed(0) || 0} spent)`)
      setAlertSent(true)
      playWarn()
    }
    if (sessionData.timeMinutes >= 120 && !alertSent) {
      sendMateAlert('long_session', `Your mate has been playing for ${sessionData.timeMinutes} minutes!`)
      setAlertSent(true)
    }
    if (sessionData.netPosition <= -200 && !alertSent) {
      sendMateAlert('big_loss', `Your mate is down $${Math.abs(sessionData.netPosition).toFixed(0)}`)
      setAlertSent(true)
    }
  }, [sessionData, mate, alertSent])

  function handleSetup() {
    const result = setupMateMode()
    setMate(result)
    playSuccess()
  }

  function handleLink() {
    if (!linkCode.trim()) return
    const result = linkMate(linkCode.trim())
    setMate(result)
    setLinkCode('')
    playSuccess()
  }

  function handleDisable() {
    const result = disableMateMode()
    setMate(result)
    playTap()
  }

  function handleDismiss(alertId) {
    dismissMateAlert(alertId)
    setAlerts(getMateAlerts())
    playTap()
  }

  function copyCode() {
    if (mate?.myCode) {
      navigator.clipboard?.writeText(mate.myCode)
      setCopied(true)
      playTap()
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleManualAlert() {
    sendMateAlert('manual', 'Hey mate, just checking in! How are you going?')
    setAlerts(getMateAlerts())
    playSuccess()
  }

  if (!mate) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1rem' }}>🤝 Mate Mode</h3>
          <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.7rem' }}>
            Buddy system for responsible gambling
          </p>
        </div>
        {mate.enabled ? (
          <span style={statusBadge('#22c55e')}>● Active</span>
        ) : (
          <span style={statusBadge('#64748b')}>○ Off</span>
        )}
      </div>

      {/* Not set up yet */}
      {!mate.enabled && (
        <div style={cardStyle}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            Link up with a mate! If either of you hits a budget limit, goes on a long session,
            or takes a big loss — the other gets an alert.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', margin: '0.5rem 0' }}>
            <div style={featureStyle}>🛡️<br /><span style={{ fontSize: '0.6rem' }}>Budget Alerts</span></div>
            <div style={featureStyle}>⏰<br /><span style={{ fontSize: '0.6rem' }}>Time Alerts</span></div>
            <div style={featureStyle}>📉<br /><span style={{ fontSize: '0.6rem' }}>Loss Alerts</span></div>
          </div>
          <button onClick={handleSetup} style={btnPrimary}>
            🤝 Enable Mate Mode
          </button>
        </div>
      )}

      {/* Active — show code and linking */}
      {mate.enabled && (
        <>
          {/* My code */}
          <div style={cardStyle}>
            <p style={{ color: '#64748b', fontSize: '0.7rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Mate Code
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <code style={codeStyle}>{mate.myCode}</code>
              <button onClick={copyCode} style={copyBtn}>
                {copied ? '✅' : '📋'}
              </button>
            </div>
            <p style={{ color: '#475569', fontSize: '0.7rem', margin: 0 }}>
              Share this code with your mate so they can link to you.
            </p>
          </div>

          {/* Link mate */}
          {!mate.mateLinked ? (
            <div style={cardStyle}>
              <p style={{ color: '#f1f5f9', fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>
                Link Your Mate
              </p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  value={linkCode}
                  onChange={e => setLinkCode(e.target.value)}
                  placeholder="Enter mate's code (PA-MATE-...)"
                  style={inputStyle}
                />
                <button onClick={handleLink} style={btnPrimary}>
                  Link
                </button>
              </div>
            </div>
          ) : (
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0a2a1a, #1e293b)', border: '1px solid #22c55e40' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#22c55e', fontSize: '0.85rem', margin: 0, fontWeight: 700 }}>
                    ✅ Linked with {mate.mateName}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.7rem', margin: '0.15rem 0 0' }}>
                    Code: {mate.mateCode}
                  </p>
                </div>
                <button onClick={handleManualAlert} style={pingBtn}>
                  📢 Ping
                </button>
              </div>
            </div>
          )}

          {/* Alerts */}
          {alerts.length > 0 && (
            <div style={cardStyle}>
              <p style={{ color: '#f97316', fontSize: '0.85rem', margin: 0, fontWeight: 700 }}>
                🔔 Mate Alerts ({alerts.length})
              </p>
              {alerts.map(a => (
                <div key={a.id} style={alertStyle}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#f1f5f9', fontSize: '0.8rem', margin: 0 }}>
                      {a.type === 'budget_hit' ? '🛡️' : a.type === 'long_session' ? '⏰' : a.type === 'big_loss' ? '📉' : '📢'}
                      {' '}{a.details}
                    </p>
                    <p style={{ color: '#475569', fontSize: '0.65rem', margin: '0.15rem 0 0' }}>
                      {new Date(a.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => handleDismiss(a.id)} style={dismissBtn}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Auto-alert status */}
          <div style={cardStyle}>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>
              ⚡ Auto-alerts trigger when:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }}>
              <span style={ruleStyle}>🛡️ Budget hits 90%</span>
              <span style={ruleStyle}>⏰ Session exceeds 2 hours</span>
              <span style={ruleStyle}>📉 Losses exceed $200</span>
            </div>
          </div>

          {/* Disable */}
          <button onClick={handleDisable} style={disableBtn}>
            Disable Mate Mode
          </button>
        </>
      )}
    </div>
  )
}

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'linear-gradient(135deg, #0a1a3d, #1e293b)',
  borderRadius: 12, padding: '0.75rem 0.85rem',
}

const cardStyle = {
  background: '#1e293b', borderRadius: 12, padding: '0.75rem',
  display: 'flex', flexDirection: 'column', gap: '0.5rem',
}

const statusBadge = (color) => ({
  background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 8,
  padding: '0.2rem 0.5rem', fontSize: '0.7rem', color, fontWeight: 600,
})

const featureStyle = {
  background: '#0f172a', borderRadius: 10, padding: '0.6rem 0.25rem',
  textAlign: 'center', fontSize: '1.2rem', color: '#94a3b8',
}

const btnPrimary = {
  background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 8,
  padding: '0.45rem 0.75rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const codeStyle = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  padding: '0.4rem 0.6rem', color: '#38bdf8', fontSize: '0.85rem',
  fontWeight: 700, flex: 1, fontFamily: 'monospace',
}

const copyBtn = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  padding: '0.35rem 0.5rem', fontSize: '1rem', cursor: 'pointer',
}

const inputStyle = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  padding: '0.45rem 0.6rem', color: '#f1f5f9', fontSize: '0.8rem',
  fontFamily: 'inherit', flex: 1,
}

const pingBtn = {
  background: '#1a2a3d', border: '1px solid #38bdf840', borderRadius: 8,
  padding: '0.3rem 0.6rem', color: '#38bdf8', fontSize: '0.75rem',
  fontWeight: 600, cursor: 'pointer',
}

const alertStyle = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  background: '#0f172a', borderRadius: 8, padding: '0.5rem',
  border: '1px solid #f9731630',
}

const dismissBtn = {
  background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem',
  cursor: 'pointer', padding: '0.2rem',
}

const ruleStyle = {
  color: '#94a3b8', fontSize: '0.7rem',
}

const disableBtn = {
  background: 'none', border: '1px solid #334155', borderRadius: 8,
  padding: '0.4rem', color: '#64748b', fontSize: '0.75rem',
  cursor: 'pointer', textAlign: 'center',
}
