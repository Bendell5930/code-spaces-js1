/**
 * Session Manager — Active session tracking with "Reality Check" protocol.
 *
 * Tracks session duration, enforces cool-off intervals, and detects
 * rapid data entry patterns that may indicate dissociation.
 *
 * All state persisted in localStorage so it survives page refreshes.
 */

const SESSION_KEY = 'pokie-session-state'
const SETTINGS_KEY = 'pokie-harm-settings'

// ─── Default harm-minimization settings ───

const DEFAULT_SETTINGS = {
  coolOffIntervalMin: 30,       // minutes between mandatory cool-off prompts
  lossLimit: 0,                 // pre-commitment loss cap ($0 = not set)
  rapidEntryThreshold: 8,       // spins in 5 minutes triggers dissociation alert
  rapidEntryWindowMin: 5,       // window for rapid entry detection (minutes)
  enableCoolOff: true,
  enableDissociationAlerts: true,
  enableBudgetGuard: true,
}

// ─── Settings persistence ───

export function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...settings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
  return merged
}

// ─── Session state ───

function getSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function startSession() {
  const existing = getSession()
  if (existing && existing.active) return existing

  const session = {
    active: true,
    startedAt: Date.now(),
    lastCoolOff: Date.now(),
    spinTimestamps: [],
    totalSessionBet: 0,
    totalSessionWin: 0,
    coolOffsDismissed: 0,
    paused: false,
    pausedAt: null,
  }
  saveSession(session)
  return session
}

export function endSession() {
  const session = getSession()
  if (session) {
    session.active = false
    saveSession(session)
  }
  return session
}

export function getActiveSession() {
  return getSession()
}

export function pauseSession() {
  const session = getSession()
  if (!session || !session.active) return session
  session.paused = true
  session.pausedAt = Date.now()
  saveSession(session)
  return session
}

export function resumeSession() {
  const session = getSession()
  if (!session || !session.active) return session
  session.paused = false
  session.pausedAt = null
  session.lastCoolOff = Date.now() // Reset cool-off timer after break
  saveSession(session)
  return session
}

// ─── Record a spin in the session ───

export function recordSessionSpin(betAmount, winAmount) {
  let session = getSession()
  if (!session || !session.active) {
    session = startSession()
  }
  session.spinTimestamps.push(Date.now())
  session.totalSessionBet += (betAmount || 0)
  session.totalSessionWin += (winAmount || 0)
  // Keep only last 60 timestamps to save memory
  if (session.spinTimestamps.length > 60) {
    session.spinTimestamps = session.spinTimestamps.slice(-60)
  }
  saveSession(session)
  return session
}

// ─── Cool-off check ───

export function checkCoolOff() {
  const settings = loadSettings()
  const session = getSession()
  if (!session || !session.active || session.paused) return { needed: false }
  if (!settings.enableCoolOff) return { needed: false }

  const now = Date.now()
  const elapsed = (now - session.lastCoolOff) / 60000 // minutes
  const intervalMin = settings.coolOffIntervalMin || 30

  if (elapsed >= intervalMin) {
    return {
      needed: true,
      minutesElapsed: Math.floor(elapsed),
      sessionMinutes: Math.floor((now - session.startedAt) / 60000),
      netPosition: session.totalSessionWin - session.totalSessionBet,
    }
  }
  return { needed: false }
}

export function acknowledgeCoolOff() {
  const session = getSession()
  if (!session) return
  session.lastCoolOff = Date.now()
  session.coolOffsDismissed++
  saveSession(session)
  return session
}

// ─── Rapid entry (dissociation) detection ───

export function checkRapidEntry() {
  const settings = loadSettings()
  const session = getSession()
  if (!session || !session.active) return { triggered: false }
  if (!settings.enableDissociationAlerts) return { triggered: false }

  const now = Date.now()
  const windowMs = (settings.rapidEntryWindowMin || 5) * 60000
  const recentSpins = session.spinTimestamps.filter(ts => (now - ts) <= windowMs)

  if (recentSpins.length >= (settings.rapidEntryThreshold || 8)) {
    return {
      triggered: true,
      spinsInWindow: recentSpins.length,
      windowMinutes: settings.rapidEntryWindowMin,
      netPosition: session.totalSessionWin - session.totalSessionBet,
      totalBet: session.totalSessionBet,
    }
  }
  return { triggered: false }
}

// ─── Session duration helper ───

export function getSessionDuration() {
  const session = getSession()
  if (!session || !session.active) return 0
  return Math.floor((Date.now() - session.startedAt) / 60000)
}

// ─── Net position for current session ───

export function getNetPosition() {
  const session = getSession()
  if (!session) return { bet: 0, win: 0, net: 0 }
  return {
    bet: session.totalSessionBet,
    win: session.totalSessionWin,
    net: session.totalSessionWin - session.totalSessionBet,
  }
}

// ─── Budget guard (loss limit check) ───

export function checkBudgetStatus() {
  const settings = loadSettings()
  const session = getSession()
  if (!settings.enableBudgetGuard || !settings.lossLimit || settings.lossLimit <= 0) {
    return { status: 'none', lossLimit: 0 }
  }

  const totalLoss = session
    ? Math.max(0, session.totalSessionBet - session.totalSessionWin)
    : 0

  const ratio = totalLoss / settings.lossLimit

  let status = 'green'            // 0–60%
  if (ratio >= 1.0) status = 'exceeded'  // 100%+
  else if (ratio >= 0.8) status = 'red'  // 80–100%
  else if (ratio >= 0.6) status = 'amber'// 60–80%

  return {
    status,
    lossLimit: settings.lossLimit,
    currentLoss: totalLoss,
    ratio: Math.min(ratio, 1.5), // Cap at 150% for display
    remaining: Math.max(0, settings.lossLimit - totalLoss),
  }
}

export { DEFAULT_SETTINGS }
