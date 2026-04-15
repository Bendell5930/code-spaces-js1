import { useState, useEffect } from 'react'
import {
  loadNotificationPrefs, requestNotificationPermission,
  updateNotificationPref, checkAndSendScheduledNotifications,
} from '../lib/viralStore'
import { playTap, playSuccess } from '../lib/sounds'

const PREF_ITEMS = [
  { key: 'weeklyWrap', label: 'Weekly Wrap Ready', emoji: '📊', description: 'Monday morning stats summary' },
  { key: 'streakReminder', label: 'Streak Reminder', emoji: '🔥', description: 'Don\'t lose your daily streak' },
  { key: 'eventReminder', label: 'Event Updates', emoji: '🏆', description: 'Seasonal event milestones' },
  { key: 'machineAlerts', label: 'Machine Alerts', emoji: '🎰', description: 'Your tracked machines activity' },
  { key: 'mateAlerts', label: 'Mate Alerts', emoji: '🤝', description: 'Budget & session buddy alerts' },
]

export default function PushNotifications() {
  const [prefs, setPrefs] = useState(null)

  useEffect(() => {
    const p = loadNotificationPrefs()
    setPrefs(p)
    // Run scheduled notification check
    checkAndSendScheduledNotifications()
  }, [])

  async function handleEnable() {
    const result = await requestNotificationPermission()
    setPrefs(result)
    if (result.enabled) {
      playSuccess()
    } else {
      playTap()
    }
  }

  function handleToggle(key) {
    const result = updateNotificationPref(key, !prefs[key])
    setPrefs(result)
    playTap()
  }

  function handleTestNotification() {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🎰 Pokie Analyzer', {
          body: 'Notifications are working! You\'ll get alerts here.',
          icon: '/icons/icon-192.png',
        })
      } catch { /* ignore */ }
    }
    playSuccess()
  }

  if (!prefs) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, color: '#a78bfa', fontSize: '1rem' }}>🔔 Notifications</h3>
          <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.7rem' }}>
            Stay in the loop with smart alerts
          </p>
        </div>
        {prefs.enabled ? (
          <span style={enabledBadge}>✅ On</span>
        ) : (
          <span style={disabledBadge}>○ Off</span>
        )}
      </div>

      {/* Permission request */}
      {!prefs.enabled && (
        <div style={cardStyle}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            Enable notifications to get streak reminders, weekly wraps, mate alerts,
            and event updates. No spam — only valuable alerts.
          </p>
          <button onClick={handleEnable} style={enableBtn}>
            🔔 Enable Notifications
          </button>
          {prefs.permission === 'denied' && (
            <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: 0 }}>
              ⚠️ Notifications are blocked in your browser. Go to site settings to allow them.
            </p>
          )}
        </div>
      )}

      {/* Preference toggles */}
      {prefs.enabled && (
        <>
          <div style={cardStyle}>
            {PREF_ITEMS.map((item, i) => (
              <div key={item.key} style={{
                ...rowStyle,
                borderBottom: i < PREF_ITEMS.length - 1 ? '1px solid #1a2535' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
                  <div>
                    <div style={{ color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 600 }}>{item.label}</div>
                    <div style={{ color: '#475569', fontSize: '0.65rem' }}>{item.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  style={{
                    ...toggleStyle,
                    background: prefs[item.key] ? '#22c55e' : '#334155',
                  }}
                >
                  <div style={{
                    ...toggleDot,
                    transform: prefs[item.key] ? 'translateX(18px)' : 'translateX(0)',
                  }} />
                </button>
              </div>
            ))}
          </div>

          {/* Test notification */}
          <button onClick={handleTestNotification} style={testBtn}>
            🔔 Send Test Notification
          </button>
        </>
      )}

      <p style={{ color: '#334155', fontSize: '0.65rem', textAlign: 'center', margin: 0 }}>
        We never spam. Notifications are local only — no data sent to any server.
      </p>
    </div>
  )
}

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'linear-gradient(135deg, #1a0a3d, #1e293b)',
  borderRadius: 12, padding: '0.75rem 0.85rem',
}

const cardStyle = {
  background: '#1e293b', borderRadius: 12, padding: '0.75rem',
  display: 'flex', flexDirection: 'column', gap: '0.5rem',
}

const enabledBadge = {
  background: '#22c55e20', border: '1px solid #22c55e40', borderRadius: 8,
  padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#22c55e', fontWeight: 600,
}

const disabledBadge = {
  background: '#33415520', border: '1px solid #33415540', borderRadius: 8,
  padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 600,
}

const enableBtn = {
  background: '#a78bfa', color: '#0f172a', border: 'none', borderRadius: 8,
  padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
}

const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0.5rem 0',
}

const toggleStyle = {
  width: 42, height: 24, borderRadius: 12, border: 'none',
  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
  padding: 0, flexShrink: 0,
}

const toggleDot = {
  width: 20, height: 20, borderRadius: '50%', background: '#fff',
  position: 'absolute', top: 2, left: 2, transition: 'transform 0.2s',
}

const testBtn = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  padding: '0.4rem', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer',
  textAlign: 'center',
}
