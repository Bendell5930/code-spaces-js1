import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadSettings,
  saveSettings,
  startSession,
  endSession,
  getActiveSession,
  pauseSession,
  resumeSession,
  checkCoolOff,
  acknowledgeCoolOff,
  checkRapidEntry,
  getSessionDuration,
  getNetPosition,
  checkBudgetStatus,
} from '../lib/sessionManager'
import { playWarn } from '../lib/sounds'
import styles from './HarmMinimization.module.css'

// ═══════════════════════════════════════════
// Session Timer Bar
// ═══════════════════════════════════════════

export function SessionTimer({ onPause, onEnd, onHistory, paused }) {
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    const tick = () => setMinutes(getSessionDuration())
    tick()
    const id = setInterval(tick, 10000) // Update every 10s
    return () => clearInterval(id)
  }, [])

  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  const display = hrs > 0
    ? `${hrs}h ${String(mins).padStart(2, '0')}m`
    : `${mins}m`

  return (
    <div className={styles.sessionBar}>
      <div className={styles.sessionClock}>
        <span className={styles.sessionClockIcon}>⏱️</span>
        <span>Session:</span>
        <span className={styles.sessionDuration}>{display}</span>
      </div>
      {paused ? null : (
        <button className={styles.sessionPause} onClick={onPause}>
          ⏸ Break
        </button>
      )}
      <button className={styles.sessionHistory} onClick={onHistory}>
        📊 History
      </button>
      <button className={styles.sessionEnd} onClick={onEnd}>
        End Session
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
// Net Position Display
// ═══════════════════════════════════════════

export function NetPositionDisplay({ calcData }) {
  const [pos, setPos] = useState({ bet: 0, win: 0, net: 0 })

  useEffect(() => {
    const tick = () => setPos(getNetPosition())
    tick()
    const id = setInterval(tick, 3000)
    return () => clearInterval(id)
  }, [])

  // Use calculator data if available, fall back to session manager
  const spent = calcData ? calcData.totalIn : pos.bet
  const won = calcData ? calcData.totalOut : pos.win
  const net = won - spent
  const startPos = calcData ? calcData.totalIn : pos.bet
  const biggest = calcData ? calcData.biggestWin : 0

  const colorClass = net > 0
    ? styles.netPositive
    : net < 0 ? styles.netNegative : styles.netZero

  return (
    <div className={styles.netPosition}>
      <div>
        <div className={styles.netLabel}>Net Position</div>
        <div className={`${styles.netValue} ${colorClass}`}>
          {net >= 0 ? '+' : ''}{net < 0 ? '-' : ''}${Math.abs(net).toFixed(2)}
        </div>
      </div>
      <div className={styles.netDetails}>
        <div className={styles.netDetailItem}>
          <span className={styles.netDetailValue}>${startPos.toFixed(2)}</span>
          <span className={styles.netLabel}>Start Position</span>
        </div>
        <div className={styles.netDetailItem}>
          <span className={styles.netDetailValue}>${spent.toFixed(2)}</span>
          <span className={styles.netLabel}>Spent</span>
        </div>
        <div className={styles.netDetailItem}>
          <span className={styles.netDetailValue}>${won.toFixed(2)}</span>
          <span className={styles.netLabel}>Won</span>
        </div>
        {biggest > 0 && (
          <div className={styles.netDetailItem}>
            <span className={`${styles.netDetailValue} ${styles.netPositive}`}>${biggest.toFixed(2)}</span>
            <span className={styles.netLabel}>Biggest Win</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Budget Guard Bar
// ═══════════════════════════════════════════

export function BudgetGuard() {
  const [budget, setBudget] = useState({ status: 'none' })

  useEffect(() => {
    const tick = () => setBudget(checkBudgetStatus())
    tick()
    const id = setInterval(tick, 3000)
    return () => clearInterval(id)
  }, [])

  if (budget.status === 'none' || !budget.lossLimit) return null

  const colorClass =
    budget.status === 'exceeded' ? styles.budgetExceeded
      : budget.status === 'red' ? styles.budgetRed
        : budget.status === 'amber' ? styles.budgetAmber
          : styles.budgetGreen

  const pct = Math.min(budget.ratio * 100, 100)

  return (
    <div className={styles.budgetBar}>
      <div className={styles.budgetHeader}>
        <span className={styles.budgetLabel}>
          🛡️ Loss Limit: ${budget.lossLimit}
        </span>
        <span className={`${styles.budgetRemaining} ${colorClass}`}>
          ${budget.remaining.toFixed(2)} remaining
        </span>
      </div>
      <div className={styles.budgetTrack}>
        <div
          className={`${styles.budgetFill} ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Cool-Off Overlay
// ═══════════════════════════════════════════

export function CoolOffOverlay({ data, onTakeBreak, onContinue }) {
  if (!data || !data.needed) return null

  return (
    <div className={styles.coolOffOverlay}>
      <div className={styles.coolOffCard}>
        <div className={styles.coolOffEmoji}>☕</div>
        <h2 className={styles.coolOffTitle}>Time for a Reality Check</h2>
        <p className={styles.coolOffBody}>
          You&apos;ve been playing for <strong>{data.minutesElapsed} minutes</strong> this session.
          Take a moment to check in with yourself.
        </p>
        <div className={styles.coolOffStats}>
          <div className={styles.coolOffStat}>
            <span className={styles.coolOffStatLabel}>Session Time</span>
            <span className={styles.coolOffStatValue}>{data.sessionMinutes}m</span>
          </div>
          <div className={styles.coolOffStat}>
            <span className={styles.coolOffStatLabel}>Net Position</span>
            <span
              className={styles.coolOffStatValue}
              style={{ color: data.netPosition >= 0 ? '#4ade80' : '#f87171' }}
            >
              {data.netPosition >= 0 ? '+' : '-'}${Math.abs(data.netPosition).toFixed(2)}
            </span>
          </div>
        </div>
        <div className={styles.coolOffActions}>
          <button className={styles.coolOffBreak} onClick={onTakeBreak}>
            🍃 Take a Break
          </button>
          <button className={styles.coolOffContinue} onClick={onContinue}>
            I&apos;m OK, continue
          </button>
        </div>
        <div className={styles.helpLink}>
          Need help? <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer">
            Gambling Help: 1800 858 858
          </a>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Dissociation Alert
// ═══════════════════════════════════════════

export function DissociationAlert({ data, onSlowDown, onAcknowledge }) {
  if (!data || !data.triggered) return null

  return (
    <div className={styles.dissociationOverlay}>
      <div className={styles.dissociationCard}>
        <div className={styles.dissociationEmoji}>🧘</div>
        <h2 className={styles.dissociationTitle}>Mindfulness Check</h2>
        <p className={styles.dissociationBody}>
          You&apos;ve logged <strong>{data.spinsInWindow} spins</strong> in the
          last {data.windowMinutes} minutes. That&apos;s pretty fast.
        </p>
        <div className={styles.dissociationHighlight}>
          <span
            className={styles.dissociationNet}
            style={{ color: data.netPosition >= 0 ? '#4ade80' : '#f87171' }}
          >
            {data.netPosition >= 0 ? '+' : '-'}${Math.abs(data.netPosition).toFixed(2)}
          </span>
          <span className={styles.dissociationLabel}>
            Current Net Position | Total Bet: ${data.totalBet.toFixed(2)}
          </span>
        </div>
        <p className={styles.dissociationBody}>
          Is this within your planned budget? Take a breath and verify.
        </p>
        <div className={styles.dissociationActions}>
          <button className={styles.dissociationSlowDown} onClick={onSlowDown}>
            🐢 Slow Down
          </button>
          <button className={styles.dissociationAcknowledge} onClick={onAcknowledge}>
            I&apos;ve checked, continue
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Budget Exceeded Alert
// ═══════════════════════════════════════════

export function BudgetExceededAlert({ data, onStop }) {
  if (!data || data.status !== 'exceeded') return null

  return (
    <div className={styles.budgetOverlay}>
      <div className={styles.budgetCard}>
        <div className={styles.budgetAlertEmoji}>🛑</div>
        <h2 className={styles.budgetAlertTitle}>Loss Limit Reached</h2>
        <p className={styles.budgetAlertBody}>
          You&apos;ve reached the loss limit you set for this session.
          This is the boundary you decided on when you were in a clear state of mind.
        </p>
        <div className={styles.budgetAlertAmount}>
          <div className={styles.budgetAlertLoss}>
            -${data.currentLoss.toFixed(2)}
          </div>
          <div className={styles.budgetAlertLimit}>
            of ${data.lossLimit} limit
          </div>
        </div>
        <div className={styles.budgetAlertActions}>
          <button className={styles.budgetAlertStop} onClick={onStop}>
            ✋ End Session Now
          </button>
        </div>
        <div className={styles.helpLink}>
          <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer">
            Gambling Help Online
          </a>
          &nbsp;| 1800 858 858
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Loss Limit Setup Prompt
// ═══════════════════════════════════════════

export function LossLimitPrompt({ onSet, onSkip }) {
  const [amount, setAmount] = useState('')

  const QUICK_AMOUNTS = [20, 50, 100, 200, 500]

  function handleSet() {
    const val = parseFloat(amount)
    if (val > 0) onSet(val)
  }

  return (
    <div className={styles.lossLimitPrompt}>
      <h3 className={styles.lossLimitTitle}>🛡️ Set Your Loss Limit</h3>
      <p className={styles.lossLimitBody}>
        How much are you prepared to lose today? Set a budget now
        while you&apos;re thinking clearly.
      </p>
      <div className={styles.lossLimitQuick}>
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            className={styles.lossLimitQuickBtn}
            onClick={() => setAmount(String(amt))}
          >
            ${amt}
          </button>
        ))}
      </div>
      <div className={styles.lossLimitInputRow}>
        <span className={styles.lossLimitDollar}>$</span>
        <input
          type="number"
          min="1"
          step="1"
          className={styles.lossLimitInput}
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className={styles.lossLimitActions}>
        <button
          className={styles.lossLimitSet}
          onClick={handleSet}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          ✅ Set Limit
        </button>
        <button className={styles.lossLimitSkip} onClick={onSkip}>
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Safety Settings Panel
// ═══════════════════════════════════════════

export function SafetySettings({ settings, onUpdate }) {
  function toggle(key) {
    onUpdate({ ...settings, [key]: !settings[key] })
  }

  function setVal(key, value) {
    onUpdate({ ...settings, [key]: value })
  }

  return (
    <div className={styles.settingsPanel}>
      <h3 className={styles.settingsTitle}>⚙️ Safety Settings</h3>

      {/* Cool-off interval */}
      <div className={styles.settingsRow}>
        <div>
          <div className={styles.settingsLabel}>Cool-Off Reminders</div>
          <div className={styles.settingsDescription}>Prompt to take a break at set intervals</div>
        </div>
        <button
          className={`${styles.settingsToggle} ${settings.enableCoolOff ? styles.settingsToggleOn : ''}`}
          onClick={() => toggle('enableCoolOff')}
          aria-label="Toggle cool-off reminders"
        />
      </div>
      {settings.enableCoolOff && (
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Interval (minutes)</span>
          <input
            type="number"
            min="5"
            max="120"
            step="5"
            className={styles.settingsInput}
            value={settings.coolOffIntervalMin}
            onChange={(e) => setVal('coolOffIntervalMin', Math.max(5, parseInt(e.target.value) || 30))}
          />
        </div>
      )}

      {/* Dissociation alerts */}
      <div className={styles.settingsRow}>
        <div>
          <div className={styles.settingsLabel}>Rapid-Play Alerts</div>
          <div className={styles.settingsDescription}>Mindfulness check when logging spins too fast</div>
        </div>
        <button
          className={`${styles.settingsToggle} ${settings.enableDissociationAlerts ? styles.settingsToggleOn : ''}`}
          onClick={() => toggle('enableDissociationAlerts')}
          aria-label="Toggle rapid-play alerts"
        />
      </div>

      {/* Budget guard */}
      <div className={styles.settingsRow}>
        <div>
          <div className={styles.settingsLabel}>Budget Guard</div>
          <div className={styles.settingsDescription}>Track spending against your loss limit</div>
        </div>
        <button
          className={`${styles.settingsToggle} ${settings.enableBudgetGuard ? styles.settingsToggleOn : ''}`}
          onClick={() => toggle('enableBudgetGuard')}
          aria-label="Toggle budget guard"
        />
      </div>
      {settings.enableBudgetGuard && (
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Loss Limit ($)</span>
          <input
            type="number"
            min="0"
            step="10"
            className={styles.settingsInput}
            value={settings.lossLimit}
            onChange={(e) => setVal('lossLimit', Math.max(0, parseFloat(e.target.value) || 0))}
          />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Paused Session Banner
// ═══════════════════════════════════════════

export function PausedBanner({ onResume }) {
  return (
    <div className={styles.pausedBanner}>
      <div className={styles.pausedTitle}>🍃 Taking a Break</div>
      <p className={styles.pausedMsg}>
        Good call. Take your time — there&apos;s no rush.
      </p>
      <button className={styles.pausedResume} onClick={onResume}>
        Resume Session
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
// MAIN ORCHESTRATOR — HarmMinimization
// Wraps the entire app content, manages all safety features
// ═══════════════════════════════════════════

export default function HarmMinimization({ children, onSpinLogged, onHistory, calculatorRef }) {
  const [settings, setSettings] = useState(null)
  const [session, setSession] = useState(null)
  const [showLossPrompt, setShowLossPrompt] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [coolOffData, setCoolOffData] = useState(null)
  const [dissociationData, setDissociationData] = useState(null)
  const [budgetData, setBudgetData] = useState({ status: 'none' })
  const [paused, setPaused] = useState(false)
  const [calcData, setCalcData] = useState(null)
  const lastDissociationRef = useRef(0)

  // Poll calculator session data for net position display
  useEffect(() => {
    const tick = () => {
      if (calculatorRef?.current?.getSessionData) {
        setCalcData(calculatorRef.current.getSessionData())
      }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => clearInterval(id)
  }, [calculatorRef])

  // Load initial state
  useEffect(() => {
    const s = loadSettings()
    setSettings(s)

    const existing = getActiveSession()
    if (existing && existing.active) {
      setSession(existing)
      setPaused(existing.paused || false)
    } else {
      const newSession = startSession()
      setSession(newSession)
      // Show loss limit prompt for new sessions if no limit set
      if (!s.lossLimit || s.lossLimit <= 0) {
        setShowLossPrompt(true)
      }
    }
  }, [])

  // Periodic checks for cool-off and budget
  useEffect(() => {
    if (!session || !session.active || paused) return

    const id = setInterval(() => {
      // Cool-off check
      const coolOff = checkCoolOff()
      if (coolOff.needed && !coolOffData) {
        playWarn()
        setCoolOffData(coolOff)
      }

      // Budget check
      const budget = checkBudgetStatus()
      setBudgetData(budget)
    }, 15000) // Check every 15 seconds

    return () => clearInterval(id)
  }, [session, paused, coolOffData])

  // This callback is called by index.js after each spin log
  const handleSpinLogged = useCallback((betAmount, winAmount) => {
    // Check rapid entry / dissociation
    const now = Date.now()
    const rapid = checkRapidEntry()
    if (rapid.triggered && (now - lastDissociationRef.current) > 120000) {
      // Only show every 2 minutes max
      lastDissociationRef.current = now
      playWarn()
      setDissociationData(rapid)
    }

    // Refresh budget
    setBudgetData(checkBudgetStatus())
  }, [])

  // Expose the spin callback
  useEffect(() => {
    if (onSpinLogged) onSpinLogged(handleSpinLogged)
  }, [onSpinLogged, handleSpinLogged])

  function handleSetLossLimit(amount) {
    const updated = saveSettings({ ...settings, lossLimit: amount, enableBudgetGuard: true })
    setSettings(updated)
    setShowLossPrompt(false)
  }

  function handleSkipLossLimit() {
    setShowLossPrompt(false)
  }

  function handleUpdateSettings(updates) {
    const updated = saveSettings(updates)
    setSettings(updated)
  }

  function handleTakeBreak() {
    setCoolOffData(null)
    const s = pauseSession()
    setSession(s)
    setPaused(true)
  }

  function handleContinueAfterCoolOff() {
    const s = acknowledgeCoolOff()
    setSession(s)
    setCoolOffData(null)
  }

  function handleResume() {
    const s = resumeSession()
    setSession(s)
    setPaused(false)
  }

  function handleDissociationSlowDown() {
    setDissociationData(null)
    const s = pauseSession()
    setSession(s)
    setPaused(true)
  }

  function handleDissociationAcknowledge() {
    setDissociationData(null)
  }

  function handleEndSession() {
    endSession()
    const s = startSession()
    setSession(s)
    setPaused(false)
    setCoolOffData(null)
    setDissociationData(null)
    setBudgetData({ status: 'none' })
    // Show loss limit prompt for new session
    if (!settings.lossLimit || settings.lossLimit <= 0) {
      setShowLossPrompt(true)
    }
  }

  function handleBudgetStop() {
    handleEndSession()
  }

  if (!settings) return null

  return (
    <>
      {/* Session Timer + Net Position + Budget - always visible */}
      {session && session.active && !paused && (
        <>
          <SessionTimer
            onPause={handleTakeBreak}
            onEnd={handleEndSession}
            onHistory={onHistory}
            paused={paused}
          />
          <NetPositionDisplay calcData={calcData} />
          <BudgetGuard />
        </>
      )}

      {/* Paused banner */}
      {paused && <PausedBanner onResume={handleResume} />}

      {/* Loss limit prompt for new sessions */}
      {showLossPrompt && (
        <LossLimitPrompt
          onSet={handleSetLossLimit}
          onSkip={handleSkipLossLimit}
        />
      )}

      {/* Safety settings toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className={styles.safetyGear}
          onClick={() => setShowSettings(!showSettings)}
          title="Safety Settings"
        >
          ⚙️ Safety
        </button>
      </div>

      {showSettings && (
        <SafetySettings
          settings={settings}
          onUpdate={handleUpdateSettings}
        />
      )}

      {/* Main app content */}
      {!paused && children}

      {/* Modal overlays */}
      <CoolOffOverlay
        data={coolOffData}
        onTakeBreak={handleTakeBreak}
        onContinue={handleContinueAfterCoolOff}
      />
      <DissociationAlert
        data={dissociationData}
        onSlowDown={handleDissociationSlowDown}
        onAcknowledge={handleDissociationAcknowledge}
      />
      <BudgetExceededAlert
        data={budgetData}
        onStop={handleBudgetStop}
      />
    </>
  )
}
