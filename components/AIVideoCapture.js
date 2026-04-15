import { useState, useRef, useCallback, useEffect } from 'react'
import MachineSelector from './MachineSelector'
import { DENOMINATIONS } from '../data/machines'
import { GUARD_STATUS } from '../data/recordingPolicy'
import {
  evaluateFrame,
  extractAllowedData,
  enforceAudioOff,
  resetGuard,
} from '../lib/privacyGuard'
import { postWin } from '../lib/communityStore'
import { isGeoAvailable, getLocationLabel } from '../lib/geolocation'
import { playTap, playScan, playSuccess, playWarn, playCoin } from '../lib/sounds'
import { submitSession, classifyWin } from '../lib/venueAnalytics'
import { getOrAssignCode } from '../lib/machineLegend'
import styles from './AIVideoCapture.module.css'

const BIG_WIN_THRESHOLD = 100 // $100+ auto-posted to leaderboard

const STEPS = {
  SETUP: 'SETUP',
  SCANNING: 'SCANNING',
}

export default function AIVideoCapture({ onCapture, calculatorRef, venueId, venueName, venueSuburb, venueRegion }) {
  const [step, setStep] = useState(STEPS.SETUP)

  // Quick-setup: only machine + denomination (bet & lines auto-detected)
  const [machineName, setMachineName] = useState('')
  const [denomination, setDenomination] = useState('0.01')

  // Location state
  const [locationLabel, setLocationLabel] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const locationRef = useRef(null) // stable ref for frame loop

  // Camera / scanning state
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [guardMsg, setGuardMsg] = useState(null)
  const [guardStatus, setGuardStatus] = useState(GUARD_STATUS.OK)
  const [capturedData, setCapturedData] = useState(null)
  const [scanning, setScanning] = useState(false)

  // Auto-detected session stats (from AI)
  const [aiStats, setAiStats] = useState({
    spins: 0, wins: 0, bonuses: 0, totalWon: 0,
    detectedBet: null, detectedLines: null,
    lastEvent: null, // most recent event description
  })

  // Big win toast
  const [bigWinToast, setBigWinToast] = useState(null)
  const scanWinLogRef = useRef([])
  const scanStartRef = useRef(Date.now())

  const canStartScan = machineName && denomination

  // ─── Enable Location ───
  async function handleEnableLocation() {
    setLocationLoading(true)
    const label = await getLocationLabel()
    if (label) {
      setLocationLabel(label)
      locationRef.current = label
      setLocationDenied(false)
    } else {
      setLocationDenied(true)
    }
    setLocationLoading(false)
  }

  // ─── Start camera (video-only, NO audio) ───
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      enforceAudioOff(stream)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      resetGuard()
      setScanning(true)
      setAiStats({ spins: 0, wins: 0, bonuses: 0, totalWon: 0, detectedBet: null, detectedLines: null, lastEvent: null })
      setGuardMsg(null)
      setGuardStatus(GUARD_STATUS.OK)
      setStep(STEPS.SCANNING)

      // Push initial denomination to calculator
      const denomVal = parseFloat(denomination)
      if (calculatorRef?.current?.pushLiveData) {
        calculatorRef.current.pushLiveData({ denomination: denomVal, machineName })
      }
      playScan()
    } catch (err) {
      setGuardMsg('Camera access denied. Please allow camera permissions.')
      playWarn()
    }
  }, [denomination, machineName, calculatorRef])

  // ─── Stop camera ───
  const stopCamera = useCallback(() => {
    setScanning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    if (calculatorRef?.current?.endLiveSync) {
      calculatorRef.current.endLiveSync()
    }
  }, [calculatorRef])

  // ─── Frame-processing loop with AUTO event detection ───
  useEffect(() => {
    if (!scanning) return
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d')

    function tick() {
      if (!scanning) return
      if (streamRef.current) enforceAudioOff(streamRef.current)

      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        const verdict = evaluateFrame(canvas, machineName)
        setGuardStatus(verdict.status)

        if (verdict.status === GUARD_STATUS.PERSON_DETECTED) {
          setGuardMsg('⚠ Person detected – recording paused')
          playWarn()
        } else if (verdict.status === GUARD_STATUS.VENUE_DETECTED) {
          setGuardMsg('⚠ Venue interior detected – recording paused')
          playWarn()
        } else if (verdict.status === GUARD_STATUS.OFF_TARGET) {
          setGuardMsg('Camera moved away – session stopped')
          playWarn()
          stopCamera()
          setStep(STEPS.SETUP)
          return
        } else if (verdict.status === GUARD_STATUS.POLICY_VIOLATION) {
          setGuardMsg('Policy violation detected – session terminated')
          playWarn()
          stopCamera()
          setStep(STEPS.SETUP)
          return
        } else {
          setGuardMsg(null)
        }

        // ── AUTO MODE: Extract data and push events to calculator ──
        if (verdict.status === GUARD_STATUS.OK && verdict.region) {
          const extracted = extractAllowedData(canvas, verdict.region, machineName)
          if (extracted) {
            setCapturedData(extracted)
            const events = extracted.events || {}
            const push = calculatorRef?.current?.pushLiveData

            // Always push latest balance
            if (push && extracted.balance != null) {
              push({ balance: extracted.balance })
            }

            // AUTO SPIN DETECTED — balance dropped
            if (events.spinDetected && push) {
              push({
                spinLogged: true,
                betAmount: extracted.betAmount,
              })
              setAiStats(prev => ({
                ...prev,
                spins: prev.spins + 1,
                lastEvent: 'Spin detected',
              }))
              // Record spin in main app
              if (onCapture) {
                onCapture({
                  machineName,
                  denomination: parseFloat(denomination),
                  betAmount: extracted.betAmount || 0,
                  lines: extracted.lines || 25,
                  winAmount: 0,
                  bonusHit: false,
                  location: locationRef.current || null,
                  timestamp: Date.now(),
                  source: 'ai-auto',
                })
              }
              playTap()
            }

            // AUTO WIN DETECTED — win meter > 0
            if (events.winDetected && push) {
              push({
                winAmount: events.winAmount,
              })
              const winAmt = events.winAmount || 0
              setAiStats(prev => ({
                ...prev,
                wins: prev.wins + 1,
                totalWon: prev.totalWon + winAmt,
                lastEvent: winAmt >= BIG_WIN_THRESHOLD
                  ? `🏆 BIG WIN: $${winAmt.toFixed(2)}!`
                  : `Win: $${winAmt.toFixed(2)}`,
              }))

              // Track for venue analytics
              const betAmt = extracted.betAmount || (parseFloat(denomination) * 25)
              const cats = classifyWin(winAmt, betAmt)
              scanWinLogRef.current.push({ amount: winAmt, ts: Date.now(), categories: cats, isBonus: false })

              // Record win as a spin entry in main app history
              if (onCapture) {
                onCapture({
                  machineName,
                  denomination: parseFloat(denomination),
                  betAmount: extracted.betAmount || 0,
                  lines: extracted.lines || 25,
                  winAmount: winAmt,
                  bonusHit: false,
                  location: locationRef.current || null,
                  timestamp: Date.now(),
                  source: 'ai-auto',
                })
              }

              // AUTO-POST big wins ($100+) to community leaderboard
              if (winAmt >= BIG_WIN_THRESHOLD) {
                postWin({
                  machineName,
                  winAmount: winAmt,
                  betAmount: extracted.betAmount || 0,
                  bonusHit: false,
                  location: locationRef.current || null,
                })
                setBigWinToast(`🏆 $${winAmt.toFixed(2)} posted to leaderboard!`)
                setTimeout(() => setBigWinToast(null), 4000)
                playSuccess()
              } else {
                playCoin()
              }
            }

            // AUTO BONUS STARTED
            if (events.bonusStarted && push) {
              push({
                bonusTriggered: true,
                featureType: 'Free Spins',
                featureSpins: 15,
              })
              setAiStats(prev => ({
                ...prev,
                bonuses: prev.bonuses + 1,
                lastEvent: '⭐ BONUS TRIGGERED!',
              }))
              // Record bonus trigger in history
              if (onCapture) {
                onCapture({
                  machineName,
                  denomination: parseFloat(denomination),
                  betAmount: extracted.betAmount || 0,
                  lines: extracted.lines || 25,
                  winAmount: 0,
                  bonusHit: true,
                  location: locationRef.current || null,
                  timestamp: Date.now(),
                  source: 'ai-auto',
                })
              }
              playSuccess()
            }

            // AUTO BONUS ENDED
            if (events.bonusEnded && push) {
              push({ bonusEnded: true })
              setAiStats(prev => ({
                ...prev,
                lastEvent: 'Bonus complete',
              }))
            }

            // AUTO CONFIG CHANGE (bet/lines detected from screen)
            if (events.configChanged && push) {
              if (events.detectedBet != null) {
                push({ betAmount: events.detectedBet })
                setAiStats(prev => ({ ...prev, detectedBet: events.detectedBet }))
              }
              if (events.detectedLines != null) {
                push({ detectedLines: events.detectedLines })
                setAiStats(prev => ({ ...prev, detectedLines: events.detectedLines }))
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scanning, machineName, denomination, stopCamera, calculatorRef, onCapture])

  function handleEndSession() {
    // Submit venue session data before cleanup
    if (venueId && machineName && aiStats.spins > 0) {
      const code = getOrAssignCode(venueId, machineName)
      const log = scanWinLogRef.current
      const w50 = log.filter(w => w.categories.includes('wins50plus'))
      const big = log.filter(w => w.categories.includes('bigWin'))
      const bonus = log.filter(w => w.isBonus)
      const major = log.filter(w => w.categories.includes('majorJackpot'))
      const grand = log.filter(w => w.categories.includes('grandJackpot'))

      submitSession({
        venueId,
        venueName: venueName || 'Unknown Venue',
        suburb: venueSuburb || '',
        region: venueRegion || '',
        machineCode: code,
        profileName: typeof window !== 'undefined' ? (localStorage.getItem('pokie-nickname') || 'Anonymous') : 'Anonymous',
        spins: aiStats.spins,
        totalWagered: (aiStats.detectedBet || 0.25) * aiStats.spins,
        totalWon: aiStats.totalWon,
        wins50plus: { count: w50.length, total: w50.reduce((s, w) => s + w.amount, 0) },
        bigWins: { count: big.length, total: big.reduce((s, w) => s + w.amount, 0) },
        bonusWins: { count: bonus.length, total: bonus.reduce((s, w) => s + w.amount, 0) },
        majorJackpots: { count: major.length, total: major.reduce((s, w) => s + w.amount, 0) },
        grandJackpots: { count: grand.length, total: grand.reduce((s, w) => s + w.amount, 0) },
        winLog: log,
        duration: Date.now() - scanStartRef.current,
      })

      // ── Auto-update Jackpot Display with detected Major/Grand jackpots ──
      if (major.length > 0 || grand.length > 0) {
        const JP_KEY = 'pokie-jackpot-wins'
        let existing = { grand: [], major: [] }
        try {
          const raw = localStorage.getItem(JP_KEY)
          if (raw) existing = JSON.parse(raw)
        } catch {}

        grand.forEach(w => {
          existing.grand.push({ amount: w.amount, date: new Date(w.ts).toISOString(), id: w.ts })
        })
        major.forEach(w => {
          existing.major.push({ amount: w.amount, date: new Date(w.ts).toISOString(), id: w.ts })
        })

        localStorage.setItem(JP_KEY, JSON.stringify(existing))
        window.dispatchEvent(new Event('jackpot-update'))
      }

      scanWinLogRef.current = []
      scanStartRef.current = Date.now()
    }

    stopCamera()
    playTap()
    setCapturedData(null)
    setStep(STEPS.SETUP)
  }

  useEffect(() => () => stopCamera(), [stopCamera])

  // ─────────────────────── RENDER ───────────────────────
  return (
    <div className={styles.wrap}>
      {/* ── STEP 1: Quick setup — just machine + denomination ── */}
      {step === STEPS.SETUP && (
        <div className={styles.setup}>
          <h3 className={styles.heading}>AI Live Scan</h3>
          <p className={styles.hint}>
            Select your machine and denomination. Point your camera at the screen and tap <strong>Start</strong>.
            AI will auto-detect spins, wins, bets, lines, and bonuses — no interaction needed.
          </p>

          <MachineSelector value={machineName} onChange={setMachineName} />

          {/* Denomination chips — only manual input needed */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Denomination</legend>
            <div className={styles.chipGroup}>
              {DENOMINATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`${styles.chip} ${denomination === String(d.value) ? styles.chipActive : ''}`}
                  onClick={() => { playTap(); setDenomination(String(d.value)) }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={styles.autoNote}>
            <span className={styles.autoNoteIcon}>🤖</span>
            <span>Bet, Lines, Spins, Wins &amp; Bonuses are <strong>auto-detected</strong> by AI — set and forget.</span>
          </div>

          {/* Location prompt */}
          <div className={styles.locationPrompt}>
            <div className={styles.locationHeader}>
              <span className={styles.locationIcon}>📍</span>
              <span className={styles.locationTitle}>Enable Location</span>
            </div>
            <p className={styles.locationHint}>
              Turn on location so big wins ($100+) are auto-posted to the leaderboard with your venue. Your suburb &amp; state only — no exact address stored.
            </p>
            {locationLabel ? (
              <div className={styles.locationActive}>
                <span className={styles.locationDot} />
                <span>{locationLabel}</span>
              </div>
            ) : locationLoading ? (
              <div className={styles.locationActive}>
                <span>Getting location…</span>
              </div>
            ) : (
              <button
                className={styles.locationBtn}
                onClick={handleEnableLocation}
              >
                {locationDenied ? '📍 Retry Location' : '📍 Enable Location'}
              </button>
            )}
            {locationDenied && (
              <p className={styles.locationDenied}>
                Location denied or unavailable. Wins will still post without a venue pin.
              </p>
            )}
          </div>

          <button
            className={styles.scanBtn}
            disabled={!canStartScan}
            onClick={startCamera}
          >
            🎯 Start AI Live Scan
          </button>
        </div>
      )}

      {/* ── STEP 2: Live scanning — fully automatic ── */}
      {step === STEPS.SCANNING && (
        <div className={styles.scanner}>
          <div className={styles.videoWrap}>
            <video ref={videoRef} className={styles.video} playsInline muted />
            <canvas ref={canvasRef} className={styles.hiddenCanvas} />

            {guardStatus !== GUARD_STATUS.OK && (
              <div className={styles.guardOverlay}>
                <div className={styles.guardIcon}>
                  {guardStatus === GUARD_STATUS.PERSON_DETECTED && '🚫'}
                  {guardStatus === GUARD_STATUS.VENUE_DETECTED && '🏢'}
                </div>
                <span className={styles.guardText}>{guardMsg}</span>
              </div>
            )}

            {guardStatus === GUARD_STATUS.OK && (
              <div className={styles.reticle}>
                <span className={styles.reticleLabel}>
                  AI LIVE: {machineName}
                </span>
              </div>
            )}

            {/* AI Live badge */}
            <div className={styles.aiBadge}>
              <span className={styles.aiDot} />
              AI AUTO MODE
            </div>

            {/* Location badge */}
            {locationLabel && (
              <div className={styles.locationBadge}>
                📍 {locationLabel}
              </div>
            )}

            <div className={styles.privacyBadge}>
              <span className={styles.privacyDot} />
              Audio OFF &middot; No recording stored
            </div>
          </div>

          {/* Big win toast */}
          {bigWinToast && (
            <div className={styles.bigWinToast}>
              {bigWinToast}
            </div>
          )}

          {/* ── AI Auto-Detected Live Dashboard ── */}
          <div className={styles.aiDashboard}>
            <div className={styles.aiDashHeader}>
              <span className={styles.aiDashTitle}>🤖 AI LIVE FEED</span>
              {aiStats.lastEvent && (
                <span className={styles.aiLastEvent}>{aiStats.lastEvent}</span>
              )}
            </div>

            {/* Live meters from screen OCR */}
            <div className={styles.liveData}>
              <div className={styles.liveRow}>
                <span className={styles.liveLabel}>Balance</span>
                <span className={styles.liveValue}>
                  {capturedData?.balance != null ? `$${capturedData.balance.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className={styles.liveRow}>
                <span className={styles.liveLabel}>Win</span>
                <span className={`${styles.liveValue} ${capturedData?.winAmount > 0 ? styles.liveWinActive : ''}`}>
                  {capturedData?.winAmount != null ? `$${capturedData.winAmount.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className={styles.liveRow}>
                <span className={styles.liveLabel}>Bet</span>
                <span className={styles.liveValue}>
                  {capturedData?.betAmount != null ? `$${capturedData.betAmount.toFixed(2)}` : aiStats.detectedBet ? `$${aiStats.detectedBet.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className={styles.liveRow}>
                <span className={styles.liveLabel}>Lines</span>
                <span className={styles.liveValue}>
                  {capturedData?.lines != null ? capturedData.lines : aiStats.detectedLines || '—'}
                </span>
              </div>
              <div className={styles.liveRow}>
                <span className={styles.liveLabel}>Bonus</span>
                <span className={`${styles.liveValue} ${capturedData?.bonusTriggered ? styles.liveBonus : ''}`}>
                  {capturedData?.bonusTriggered ? '⭐ ACTIVE' : '—'}
                </span>
              </div>
            </div>

            {/* Auto session counters */}
            <div className={styles.aiCounters}>
              <div className={styles.aiCounter}>
                <span className={styles.aiCounterValue}>{aiStats.spins}</span>
                <span className={styles.aiCounterLabel}>Spins</span>
              </div>
              <div className={styles.aiCounter}>
                <span className={`${styles.aiCounterValue} ${styles.green}`}>{aiStats.wins}</span>
                <span className={styles.aiCounterLabel}>Wins</span>
              </div>
              <div className={styles.aiCounter}>
                <span className={`${styles.aiCounterValue} ${styles.gold}`}>{aiStats.bonuses}</span>
                <span className={styles.aiCounterLabel}>Bonuses</span>
              </div>
              <div className={styles.aiCounter}>
                <span className={`${styles.aiCounterValue} ${styles.green}`}>${aiStats.totalWon.toFixed(2)}</span>
                <span className={styles.aiCounterLabel}>Total Won</span>
              </div>
            </div>
          </div>

          {/* Detected symbols strip */}
          {capturedData?.detectedSymbols?.length > 0 && (
            <div className={styles.symbolStrip}>
              <span className={styles.symbolLabel}>Detected Symbols</span>
              <div className={styles.symbolTags}>
                {capturedData.detectedSymbols.map((sym, i) => (
                  <span key={i} className={styles.symbolTag}>{sym}</span>
                ))}
              </div>
            </div>
          )}

          {/* Manual override row — fallback if AI misses something */}
          <div className={styles.manualOverride}>
            <span className={styles.manualLabel}>Manual Override</span>
            <div className={styles.manualBtns}>
              <button className={styles.manualBtn} onClick={() => {
                if (calculatorRef?.current?.pushLiveData) {
                  calculatorRef.current.pushLiveData({ spinLogged: true })
                }
                setAiStats(prev => ({ ...prev, spins: prev.spins + 1, lastEvent: 'Manual spin' }))
                playTap()
              }}>
                🎰 Log Spin
              </button>
              <button className={styles.manualBtn} onClick={() => {
                if (calculatorRef?.current?.pushLiveData) {
                  calculatorRef.current.pushLiveData({ bonusTriggered: true, featureType: 'Free Spins', featureSpins: 15 })
                }
                setAiStats(prev => ({ ...prev, bonuses: prev.bonuses + 1, lastEvent: '⭐ Manual bonus' }))
                playSuccess()
              }}>
                ⭐ Log Bonus
              </button>
            </div>
          </div>

          <div className={styles.scanActions}>
            <button className={styles.cancelBtn} onClick={handleEndSession}>
              ■ End Session
            </button>
          </div>
        </div>
      )}

      {/* ── Privacy notice (always visible) ── */}
      <div className={styles.privacyNotice}>
        <strong>Privacy:</strong> Audio is disabled. No video or images are stored.
        Only numeric machine data is captured. People and venue interiors are
        never recorded. Compliant with Australian public-venue recording standards.
      </div>
    </div>
  )
}
