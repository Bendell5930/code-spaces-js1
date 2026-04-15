/**
 * Interactive sound effects using the Web Audio API.
 * No external audio files needed – all sounds are synthesized.
 */

let ctx = null

function getCtx() {
  if (!ctx && typeof window !== 'undefined') {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return ctx
}

/** Resume AudioContext after user gesture (required by browsers). */
export function resumeAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume()
}

// ─── Individual sound effects ───

/** Short click / tap feedback */
export function playTap() {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.06)
  gain.gain.setValueAtTime(0.12, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
  osc.connect(gain).connect(c.destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + 0.08)
}

/** Tab switch / navigation sound */
export function playSwitch() {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(500, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.1)
  gain.gain.setValueAtTime(0.1, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
  osc.connect(gain).connect(c.destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + 0.12)
}

/** Confirm / success chime (two-note) */
export function playSuccess() {
  const c = getCtx()
  if (!c) return

  // Note 1
  const osc1 = c.createOscillator()
  const g1 = c.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(660, c.currentTime)
  g1.gain.setValueAtTime(0.15, c.currentTime)
  g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
  osc1.connect(g1).connect(c.destination)
  osc1.start(c.currentTime)
  osc1.stop(c.currentTime + 0.2)

  // Note 2 (higher, delayed)
  const osc2 = c.createOscillator()
  const g2 = c.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(880, c.currentTime + 0.12)
  g2.gain.setValueAtTime(0.001, c.currentTime)
  g2.gain.setValueAtTime(0.15, c.currentTime + 0.12)
  g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35)
  osc2.connect(g2).connect(c.destination)
  osc2.start(c.currentTime + 0.12)
  osc2.stop(c.currentTime + 0.35)
}

/** Warning / alert buzz */
export function playWarn() {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(200, c.currentTime)
  gain.gain.setValueAtTime(0.08, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
  osc.connect(gain).connect(c.destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + 0.15)
}

/** Coin / jackpot jingle (descending sparkle) */
export function playCoin() {
  const c = getCtx()
  if (!c) return
  const notes = [1200, 1000, 1400, 1100, 1500]
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t = c.currentTime + i * 0.07
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.1, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.connect(gain).connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.12)
  })
}

/** Scan / camera start beep */
export function playScan() {
  const c = getCtx()
  if (!c) return
  ;[0, 0.12, 0.24].forEach((delay) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t = c.currentTime + delay
    osc.type = 'square'
    osc.frequency.setValueAtTime(1200, t)
    gain.gain.setValueAtTime(0.06, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
    osc.connect(gain).connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.06)
  })
}
