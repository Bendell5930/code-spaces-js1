/**
 * PokieCalculator — Australian Pub/Club Poker Machine Display Panel
 *
 * Mirrors the exact layout and functionality of an Australian EGM (Electronic Gaming Machine):
 *
 * ┌─────────────────────────────────────────────────┐
 * │  [Machine Name]              [LIVE SYNC badge]  │ ← Top bar
 * ├──────────┬──────────────────┬───────────────────┤
 * │  CREDIT  │       WIN        │     BET           │ ← Main meters
 * │  1,250   │      350cr       │   50cr ($0.50)    │   (in CREDITS)
 * ├──────────┴──────────────────┴───────────────────┤
 * │  ★ FEATURE / BONUS PANEL ★                      │ ← Bonus Feature
 * │  [Feature Active: Free Spins 8/15]              │   (AI-synced)
 * │  [Feature Win: 1,200cr]                         │
 * ├─────────────────────────────────────────────────┤
 * │  DENOM   │  BET/LINE  │  LINES  │  TOTAL BET   │ ← Config row
 * │  1c ◀▶   │   1x ◀▶   │  25 ◀▶  │   25cr       │
 * ├──────┬──────┬──────┬──────┬──────┬──────────────┤
 * │ NOTE │ BET  │ BET  │LINES │GAMBLE│   PLAY       │ ← Button panel
 * │  IN  │  1   │ MAX  │      │      │   (SPIN)     │   (machine buttons)
 * ├──────┴──────┴──────┴──────┴──────┴──────────────┤
 * │  TAKE WIN  │              COLLECT               │ ← Collect bar
 * ├─────────────────────────────────────────────────┤
 * │  SESSION: Spins│Bonus│Since│In│Won│P&L          │ ← Session stats
 * └─────────────────────────────────────────────────┘
 *
 * Australian pokie specifics:
 * - All displays in CREDITS (not dollars) — credits = dollars / denomination
 * - Denominations: 1c, 2c, 5c, 10c, 20c, $1
 * - Bet Per Line: 1-50 credits
 * - Lines: 1-50 paylines
 * - Total Bet = Bet Per Line × Lines (displayed in credits)
 * - Gamble feature: double-up on wins (pick red/black)
 * - Feature/Bonus: free spins with separate running win counter
 * - Take Win: accept current win (ends gamble)
 * - Collect: cash out all credits
 * - Note In: insert money ($10/$20/$50/$100 notes)
 *
 * Real-time AI Sync:
 * - AI Video Detection pushes bonusTriggered → starts Feature panel
 * - Feature spins + wins tracked separately during bonus
 * - When bonus ends, feature win is added to main credit balance
 * - All data mirrors between physical machine and app in real-time
 */

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { DENOMINATIONS } from '../data/machines'
import { playTap, playCoin, playSuccess, playWarn } from '../lib/sounds'
import { submitSession, classifyWin, WIN_THRESHOLDS } from '../lib/venueAnalytics'
import { getOrAssignCode } from '../lib/machineLegend'
import styles from './PokieCalculator.module.css'

const CALC_SESSION_KEY = 'pokie-calc-session'

// Australian standard bet multipliers — matches Dragon Link / Lightning Link pub machines
const BET_PER_LINE = [1, 2, 3, 4, 5, 10]
// Australian standard payline counts — modern AU pokies (Dragon Link = 25-50, some 100)
const LINE_PRESETS = [1, 5, 10, 25, 50, 100]
// Note denominations accepted by Australian pokies (including $5 coins)
const NOTE_VALUES = [5, 10, 20, 50, 100]
// AU Gaming Code: max 5 consecutive gamble attempts, max $5 gamble risk
const MAX_GAMBLE_ATTEMPTS = 5
const MAX_GAMBLE_DOLLARS = 5

function loadSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CALC_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(data) {
  localStorage.setItem(CALC_SESSION_KEY, JSON.stringify(data))
}

function fmtCredits(credits) {
  return Math.floor(credits).toLocaleString('en-AU')
}

function fmtDollars(val) {
  return val.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const PokieCalculator = forwardRef(function PokieCalculator({ onSpinRecord, machineName: externalMachine, venueId, venueName, venueSuburb, venueRegion }, ref) {
  // ─── Machine config ───
  const [denomination, setDenomination] = useState(0.01)  // $ per credit
  const [betPerLine, setBetPerLine] = useState(1)          // credits per line
  const [lines, setLines] = useState(25)                   // paylines

  // ─── Credit meters (displayed in CREDITS like real AU machines) ───
  const [creditBalance, setCreditBalance] = useState(0)    // total credits on machine
  const [lastWinCredits, setLastWinCredits] = useState(0)  // last spin win (credits)

  // ─── Bonus Feature state ───
  const [featureActive, setFeatureActive] = useState(false)
  const [featureType, setFeatureType] = useState('Free Spins')  // type label
  const [featureSpinsCurrent, setFeatureSpinsCurrent] = useState(0)
  const [featureSpinsTotal, setFeatureSpinsTotal] = useState(0)
  const [featureWinCredits, setFeatureWinCredits] = useState(0) // running win during feature
  const [featureRetriggers, setFeatureRetriggers] = useState(0)
  const [featureMultiplier, setFeatureMultiplier] = useState(1)
  const [featureComplete, setFeatureComplete] = useState(false) // flash state when feature ends

  // ─── Gamble state ───
  const [gambleActive, setGambleActive] = useState(false)
  const [gambleAmount, setGambleAmount] = useState(0)
  const [gambleHistory, setGambleHistory] = useState([])   // 'win' | 'loss'

  // ─── Session running totals ───
  const [totalIn, setTotalIn] = useState(0)         // total $ inserted
  const [totalOut, setTotalOut] = useState(0)        // total $ won
  const [totalWagered, setTotalWagered] = useState(0) // total $ bet across all spins
  const [spinCount, setSpinCount] = useState(0)
  const [bonusCount, setBonusCount] = useState(0)
  const [spinsSinceBonus, setSpinsSinceBonus] = useState(0)
  const [biggestWin, setBiggestWin] = useState(0)

  // ─── UI state ───
  const [showNoteIn, setShowNoteIn] = useState(false)
  const [customNote, setCustomNote] = useState('')
  const [winFlash, setWinFlash] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [liveSync, setLiveSync] = useState(false)
  const [venueWinLog, setVenueWinLog] = useState([])
  const [sessionStartTime, setSessionStartTime] = useState(Date.now())

  // ─── Derived values ───
  const totalBetCredits = betPerLine * lines
  const totalBetDollars = totalBetCredits * denomination
  const creditDollars = creditBalance * denomination
  const winDollars = lastWinCredits * denomination
  const netPosition = totalOut - totalIn

  // ─── Load saved session on mount ───
  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setCreditBalance(saved.creditBalance || 0)
      setTotalIn(saved.totalIn || 0)
      setTotalOut(saved.totalOut || 0)
      setTotalWagered(saved.totalWagered || 0)
      setSpinCount(saved.spinCount || 0)
      setBonusCount(saved.bonusCount || 0)
      setSpinsSinceBonus(saved.spinsSinceBonus || 0)
      setBiggestWin(saved.biggestWin || 0)
      setDenomination(saved.denomination || 0.01)
      setBetPerLine(saved.betPerLine || 1)
      setLines(saved.lines || 25)
      if (saved.creditBalance > 0 || saved.spinCount > 0) setSessionActive(true)
    }
  }, [])

  // ─── Auto-save session ───
  useEffect(() => {
    if (!sessionActive) return
    saveSession({
      creditBalance, totalIn, totalOut, totalWagered, spinCount, bonusCount,
      spinsSinceBonus, biggestWin, denomination, betPerLine, lines,
      lastUpdated: Date.now(),
    })
  }, [creditBalance, totalIn, totalOut, totalWagered, spinCount, bonusCount, spinsSinceBonus, biggestWin, denomination, betPerLine, lines, sessionActive])

  // ─── Expose ref methods for AI Scan to push live data ───
  useImperativeHandle(ref, () => ({
    pushLiveData(data) {
      setLiveSync(true)

      // AI pushed denomination (from setup or auto-detect)
      if (data.denomination != null && data.denomination > 0) {
        setDenomination(data.denomination)
      }

      // AI auto-detected line count from screen
      if (data.detectedLines != null && data.detectedLines > 0) {
        if (LINE_PRESETS.includes(data.detectedLines)) {
          setLines(data.detectedLines)
        }
      }

      // AI detected a balance update — convert $ to credits
      if (data.balance != null) {
        const denom = data.denomination || denomination
        const newCredits = Math.round(data.balance / denom)
        setCreditBalance(newCredits)
      }

      // AI detected a win
      if (data.winAmount != null && data.winAmount > 0) {
        const denom = data.denomination || denomination
        const winCr = Math.round(data.winAmount / denom)
        if (featureActive) {
          setFeatureWinCredits(prev => prev + winCr)
        } else {
          setLastWinCredits(winCr)
          setTotalOut(prev => prev + data.winAmount)
          if (data.winAmount > biggestWin) setBiggestWin(data.winAmount)
          triggerWinFlash()
        }
      }

      // AI detected a bet amount — update config to match
      if (data.betAmount != null && data.betAmount > 0) {
        const denom = data.denomination || denomination
        const betCr = Math.round(data.betAmount / denom)
        const curLines = data.detectedLines || lines || 25
        const detectedBPL = Math.max(1, Math.round(betCr / curLines))
        if (BET_PER_LINE.includes(detectedBPL)) setBetPerLine(detectedBPL)
      }

      // AI detected spin logged — track wagered + spin count
      if (data.spinLogged) {
        const denom = data.denomination || denomination
        const betDollars = data.betAmount != null
          ? data.betAmount
          : betPerLine * lines * denom
        setSpinCount(prev => prev + 1)
        setTotalWagered(prev => prev + betDollars)
        setCreditBalance(prev => prev - Math.round(betDollars / denom))
        if (featureActive) {
          setFeatureSpinsCurrent(prev => prev + 1)
        } else {
          setSpinsSinceBonus(prev => prev + 1)
        }
      }

      // ★ AI detected BONUS FEATURE TRIGGERED ★
      if (data.bonusTriggered && !featureActive) {
        startFeature(data.featureSpins || 15, data.featureType || 'Free Spins', data.featureMultiplier || 1)
      }

      // AI detected bonus ended (balance jumped = feature win added)
      if (data.bonusEnded && featureActive) {
        endFeature()
      }

      // AI detected feature retrigger
      if (data.featureRetrigger && featureActive) {
        setFeatureRetriggers(prev => prev + 1)
        setFeatureSpinsTotal(prev => prev + (data.extraSpins || 5))
      }
    },

    endLiveSync() {
      setLiveSync(false)
    },

    getSessionData() {
      return {
        creditBalance, creditDollars: creditBalance * denomination,
        totalIn, totalOut, totalWagered, spinCount, bonusCount,
        spinsSinceBonus, denomination, betPerLine, lines, netPosition,
        featureActive, featureWinCredits, biggestWin,
      }
    }
  }), [creditBalance, totalIn, totalOut, totalWagered, spinCount, bonusCount, spinsSinceBonus, denomination, betPerLine, lines, netPosition, featureActive, featureWinCredits, biggestWin])

  function triggerWinFlash() {
    setWinFlash(true)
    setTimeout(() => setWinFlash(false), 1500)
  }

  // ─── BONUS FEATURE MANAGEMENT ───

  function startFeature(totalSpins, type, multiplier) {
    setFeatureActive(true)
    setFeatureType(type || 'Free Spins')
    setFeatureSpinsCurrent(0)
    setFeatureSpinsTotal(totalSpins || 15)
    setFeatureWinCredits(0)
    setFeatureRetriggers(0)
    setFeatureMultiplier(multiplier || 1)
    setFeatureComplete(false)
    setBonusCount(prev => prev + 1)
    setSpinsSinceBonus(0)
    playSuccess()
  }

  function endFeature() {
    // Add feature win to main credit balance
    const featureWin = featureWinCredits
    setCreditBalance(prev => prev + featureWin)
    const featureWinDollars = featureWin * denomination
    setTotalOut(prev => prev + featureWinDollars)
    if (featureWinDollars > biggestWin) setBiggestWin(featureWinDollars)
    setLastWinCredits(featureWin)

    // Track bonus win for venue analytics
    const cats = classifyWin(featureWinDollars, totalBetDollars)
    setVenueWinLog(prev => [...prev, { amount: featureWinDollars, ts: Date.now(), categories: cats, isBonus: true }])

    // Push bonus win record so main app stats mirror session stats
    if (onSpinRecord && featureWinDollars > 0) {
      onSpinRecord({
        machineName: externalMachine || 'Manual',
        denomination,
        betAmount: 0,
        lines,
        winAmount: featureWinDollars,
        bonusHit: true,
        timestamp: Date.now(),
        source: 'calculator-bonus',
      })
    }

    // Flash the feature complete state
    setFeatureComplete(true)
    triggerWinFlash()
    playCoin()

    // Clear feature after animation
    setTimeout(() => {
      setFeatureActive(false)
      setFeatureComplete(false)
      setFeatureSpinsCurrent(0)
      setFeatureSpinsTotal(0)
      setFeatureWinCredits(0)
      setFeatureRetriggers(0)
      setFeatureMultiplier(1)
    }, 3000)
  }

  // Manual feature spin (user taps during active feature)
  function handleFeatureSpin() {
    if (!featureActive) return
    setFeatureSpinsCurrent(prev => {
      const next = prev + 1
      // Auto-end if reached total
      if (next >= featureSpinsTotal && featureSpinsTotal > 0) {
        setTimeout(() => endFeature(), 500)
      }
      return next
    })
    setSpinCount(prev => prev + 1)
    playTap()
  }

  // Manual feature win entry
  function handleFeatureWinEntry() {
    const input = prompt('Enter feature spin win (credits):')
    if (!input) return
    const winCr = parseInt(input, 10)
    if (!winCr || winCr <= 0) return
    setFeatureWinCredits(prev => prev + winCr)
    playCoin()
  }

  // Manual start feature button
  function handleManualFeatureStart() {
    const spinsInput = prompt('How many free spins?', '15')
    if (!spinsInput) return
    const spins = parseInt(spinsInput, 10)
    if (!spins || spins <= 0) return
    startFeature(spins, 'Free Spins', 1)
  }

  // ─── MACHINE BUTTON HANDLERS ───

  // NOTE IN — Insert money
  function handleNoteIn(amount) {
    const credits = Math.round(amount / denomination)
    setCreditBalance(prev => prev + credits)
    setTotalIn(prev => prev + amount)
    setSessionActive(true)
    setShowNoteIn(false)
    setCustomNote('')
    playCoin()
  }

  function handleCustomNoteIn() {
    const amount = parseFloat(customNote)
    if (!amount || amount <= 0) return
    handleNoteIn(amount)
  }

  // BET x — Set bet multiplier directly via button
  function handleSetBet(multiplier) {
    setBetPerLine(multiplier)
    playTap()
  }

  // LINES — Set lines directly via button
  function handleSetLines(count) {
    setLines(count)
    playTap()
  }

  // PLAY / SPIN
  function handlePlay() {
    if (featureActive) {
      handleFeatureSpin()
      return
    }
    if (creditBalance < totalBetCredits) {
      playWarn()
      return
    }
    setCreditBalance(prev => prev - totalBetCredits)
    setLastWinCredits(0)
    setSpinCount(prev => prev + 1)
    setSpinsSinceBonus(prev => prev + 1)
    setTotalWagered(prev => prev + totalBetDollars)
    setSessionActive(true)
    setGambleActive(false)
    setGambleHistory([])
    playTap()

    if (onSpinRecord) {
      onSpinRecord({
        machineName: externalMachine || 'Manual',
        denomination,
        betAmount: totalBetDollars,
        lines,
        winAmount: 0,
        bonusHit: false,
        spinsSinceBonus: spinsSinceBonus + 1,
        spinCount: spinCount + 1,
        totalBalance: (creditBalance - totalBetCredits) * denomination,
        timestamp: Date.now(),
        source: 'calculator',
      })
    }
  }

  // LOG WIN (manual win entry for base game — enter credits as shown on machine)
  function handleWinEntry() {
    const input = prompt(`Enter win amount in credits (${denomLabel} denom):`)
    if (!input) return
    const winCr = parseInt(input, 10)
    if (!winCr || winCr <= 0) return
    setCreditBalance(prev => prev + winCr)
    setLastWinCredits(winCr)
    const winDol = winCr * denomination
    setTotalOut(prev => prev + winDol)
    if (winDol > biggestWin) setBiggestWin(winDol)
    triggerWinFlash()
    // AU gaming: gamble only available if win ≤ $5
    if (winDol <= MAX_GAMBLE_DOLLARS) {
      setGambleActive(true)
      setGambleAmount(winCr)
    }
    playCoin()

    // Track win for venue analytics
    const cats = classifyWin(winDol, totalBetDollars)
    setVenueWinLog(prev => [...prev, { amount: winDol, ts: Date.now(), categories: cats, isBonus: false }])

    // Push win record so main app stats mirror session stats
    if (onSpinRecord) {
      onSpinRecord({
        machineName: externalMachine || 'Manual',
        denomination,
        betAmount: 0,
        lines,
        winAmount: winDol,
        bonusHit: false,
        timestamp: Date.now(),
        source: 'calculator-win',
      })
    }
  }

  // GAMBLE — Australian pokies: pick red/black to double
  // AU Gaming Code: max 5 attempts, max $5 risk per gamble
  // Flow: win is already in credits → gamble risks it → win doubles / loss deducts
  function handleGamble(pick) {
    if (!gambleActive || gambleAmount <= 0) return
    if (gambleHistory.length >= MAX_GAMBLE_ATTEMPTS) {
      // AU gaming code: forced take win after max attempts
      handleTakeWin()
      return
    }
    const gambleDollars = gambleAmount * denomination
    if (gambleDollars > MAX_GAMBLE_DOLLARS) {
      // AU gaming code: can't gamble more than $5
      playWarn()
      return
    }
    // 50/50 chance (red/black)
    const result = Math.random() < 0.5 ? 'win' : 'loss'
    if (result === 'win') {
      // Win doubles: add extra credits (the gamble amount again)
      const extraCredits = gambleAmount
      setCreditBalance(prev => prev + extraCredits)
      const doubled = gambleAmount * 2
      setGambleAmount(doubled)
      setLastWinCredits(doubled)
      setGambleHistory(prev => [...prev, 'win'])
      const extraDollars = extraCredits * denomination
      setTotalOut(prev => prev + extraDollars)
      if (doubled * denomination > biggestWin) setBiggestWin(doubled * denomination)
      playCoin()
    } else {
      // Lose: deduct the gamble amount from credits (your win is lost)
      setCreditBalance(prev => prev - gambleAmount)
      const lostDollars = gambleAmount * denomination
      setTotalOut(prev => prev - lostDollars)
      setLastWinCredits(0)
      setGambleAmount(0)
      setGambleActive(false)
      setGambleHistory(prev => [...prev, 'loss'])
      playWarn()
    }
  }

  // TAKE WIN — Accept current win, end gamble
  function handleTakeWin() {
    setGambleActive(false)
    setGambleAmount(0)
    setGambleHistory([])
    playSuccess()
  }

  // COLLECT — Cash out all credits
  function handleCollect() {
    if (creditBalance <= 0) return
    const cashout = creditBalance * denomination
    setCreditBalance(0)
    setLastWinCredits(0)
    setGambleActive(false)
    playCoin()

    // Submit venue session data
    if (venueId && externalMachine) {
      const code = getOrAssignCode(venueId, externalMachine)
      const log = venueWinLog
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
        spins: spinCount,
        totalWagered,
        totalWon: totalOut,
        wins50plus: { count: w50.length, total: w50.reduce((s, w) => s + w.amount, 0) },
        bigWins: { count: big.length, total: big.reduce((s, w) => s + w.amount, 0) },
        bonusWins: { count: bonus.length, total: bonus.reduce((s, w) => s + w.amount, 0) },
        majorJackpots: { count: major.length, total: major.reduce((s, w) => s + w.amount, 0) },
        grandJackpots: { count: grand.length, total: grand.reduce((s, w) => s + w.amount, 0) },
        winLog: log,
        duration: Date.now() - sessionStartTime,
      })
      setVenueWinLog([])
      setSessionStartTime(Date.now())
    }

    if (onSpinRecord) {
      onSpinRecord({
        machineName: externalMachine || 'Manual',
        denomination,
        betAmount: 0,
        lines,
        winAmount: 0,
        bonusHit: false,
        cashout,
        timestamp: Date.now(),
        source: 'calculator-collect',
      })
    }
  }

  // NEW SESSION
  function handleNewSession() {
    setCreditBalance(0)
    setLastWinCredits(0)
    setTotalIn(0)
    setTotalOut(0)
    setTotalWagered(0)
    setSpinCount(0)
    setBonusCount(0)
    setSpinsSinceBonus(0)
    setBiggestWin(0)
    setFeatureActive(false)
    setFeatureWinCredits(0)
    setGambleActive(false)
    setGambleAmount(0)
    setGambleHistory([])
    setSessionActive(false)
    localStorage.removeItem(CALC_SESSION_KEY)
    playTap()
  }

  // ─── Config steppers ───
  function cycleDenom(dir) {
    const idx = DENOMINATIONS.findIndex(d => d.value === denomination)
    const next = idx + dir
    if (next >= 0 && next < DENOMINATIONS.length) {
      // Convert credits at new denomination
      const dollars = creditBalance * denomination
      const newDenom = DENOMINATIONS[next].value
      setCreditBalance(Math.round(dollars / newDenom))
      setDenomination(newDenom)
      playTap()
    }
  }





  const denomLabel = DENOMINATIONS.find(d => d.value === denomination)?.label || `${denomination * 100}c`

  // ─────────────────────── RENDER ───────────────────────
  return (
    <div className={styles.calculator}>
      {/* ─── Machine Header ─── */}
      <div className={styles.machineHeader}>
        <div className={styles.machineName}>
          {externalMachine || 'POKIE CALCULATOR'}
        </div>
        <div className={styles.headerRight}>
          {liveSync && (
            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              AI LIVE
            </div>
          )}
          <span className={styles.denomBadge}>{denomLabel}</span>
        </div>
      </div>

      {/* ─── Main Display Panel (Credit / Win / Bet meters) ─── */}
      <div className={styles.displayPanel}>
        <div className={styles.meter}>
          <span className={styles.meterLabel}>CREDIT</span>
          <span className={styles.meterValue}>${fmtDollars(creditDollars)}</span>
          <span className={styles.meterSub}>{fmtCredits(creditBalance)}cr</span>
        </div>
        <div className={`${styles.meter} ${styles.meterWin} ${winFlash ? styles.winFlash : ''}`}>
          <span className={styles.meterLabel}>WIN</span>
          <span className={styles.meterValueBig}>
            {lastWinCredits > 0 ? `$${fmtDollars(winDollars)}` : '$0.00'}
          </span>
          <span className={styles.meterSub}>
            {lastWinCredits > 0 ? `${fmtCredits(lastWinCredits)}cr` : '0cr'}
          </span>
        </div>
        <div className={styles.meter}>
          <span className={styles.meterLabel}>BET</span>
          <span className={styles.meterValue}>${fmtDollars(totalBetDollars)}</span>
          <span className={styles.meterSub}>{fmtCredits(totalBetCredits)}cr</span>
        </div>
      </div>

      {/* ─── ★ BONUS FEATURE PANEL ★ ─── */}
      {(featureActive || featureComplete) && (
        <div className={`${styles.featurePanel} ${featureComplete ? styles.featureComplete : ''}`}>
          <div className={styles.featureHeader}>
            <span className={styles.featureIcon}>⭐</span>
            <span className={styles.featureTitle}>
              {featureComplete ? 'FEATURE COMPLETE!' : featureType.toUpperCase()}
            </span>
            {featureMultiplier > 1 && (
              <span className={styles.featureMulti}>{featureMultiplier}x</span>
            )}
          </div>

          {!featureComplete && (
            <div className={styles.featureBody}>
              <div className={styles.featureMeters}>
                <div className={styles.featureMeter}>
                  <span className={styles.featureMeterLabel}>SPINS</span>
                  <span className={styles.featureMeterValue}>
                    {featureSpinsCurrent} / {featureSpinsTotal}
                  </span>
                </div>
                <div className={styles.featureMeter}>
                  <span className={styles.featureMeterLabel}>FEATURE WIN</span>
                  <span className={styles.featureMeterValueGold}>
                    {fmtCredits(featureWinCredits)}cr
                  </span>
                  <span className={styles.featureMeterSub}>
                    ${fmtDollars(featureWinCredits * denomination)}
                  </span>
                </div>
                {featureRetriggers > 0 && (
                  <div className={styles.featureMeter}>
                    <span className={styles.featureMeterLabel}>RETRIGGERS</span>
                    <span className={styles.featureMeterValue}>+{featureRetriggers}</span>
                  </div>
                )}
              </div>

              {/* Feature progress bar */}
              <div className={styles.featureProgress}>
                <div
                  className={styles.featureProgressBar}
                  style={{ width: featureSpinsTotal > 0 ? `${(featureSpinsCurrent / featureSpinsTotal) * 100}%` : '0%' }}
                />
              </div>

              <div className={styles.featureBtns}>
                <button className={styles.featureSpinBtn} onClick={handleFeatureSpin}>
                  🎰 Feature Spin
                </button>
                <button className={styles.featureWinBtn} onClick={handleFeatureWinEntry}>
                  💰 Log Feature Win
                </button>
                <button className={styles.featureEndBtn} onClick={endFeature}>
                  ✓ End Feature
                </button>
              </div>
            </div>
          )}

          {featureComplete && (
            <div className={styles.featureResult}>
              <span className={styles.featureResultLabel}>TOTAL FEATURE WIN</span>
              <span className={styles.featureResultValue}>
                {fmtCredits(lastWinCredits)} CREDITS
              </span>
              <span className={styles.featureResultDollar}>
                ${fmtDollars(lastWinCredits * denomination)}
              </span>
              <span className={styles.featureResultNote}>Added to your balance</span>
            </div>
          )}
        </div>
      )}

      {/* ─── Gamble Panel (when win is available to gamble) ─── */}
      {gambleActive && !featureActive && (
        <div className={styles.gamblePanel}>
          <div className={styles.gambleHeader}>
            <span className={styles.gambleTitle}>🃏 GAMBLE</span>
            <span className={styles.gambleAmount}>
              {fmtCredits(gambleAmount)}cr (${fmtDollars(gambleAmount * denomination)}) at risk
            </span>
          </div>
          <div className={styles.gambleBody}>
            <p className={styles.gambleText}>
              Pick to double ({MAX_GAMBLE_ATTEMPTS - gambleHistory.length} attempts left)
            </p>
            {gambleAmount * denomination > MAX_GAMBLE_DOLLARS && (
              <p className={styles.gambleLimit}>⚠ Over ${MAX_GAMBLE_DOLLARS} limit — Take Win</p>
            )}
            <div className={styles.gambleBtns}>
              <button
                className={styles.gambleRed}
                onClick={() => handleGamble('red')}
                disabled={gambleAmount * denomination > MAX_GAMBLE_DOLLARS}
              >
                ♥ RED
              </button>
              <button
                className={styles.gambleBlack}
                onClick={() => handleGamble('black')}
                disabled={gambleAmount * denomination > MAX_GAMBLE_DOLLARS}
              >
                ♠ BLACK
              </button>
            </div>
            <div className={styles.gambleHistory}>
              {gambleHistory.map((r, i) => (
                <span key={i} className={r === 'win' ? styles.gambleWin : styles.gambleLoss}>
                  {r === 'win' ? '✓' : '✕'}
                </span>
              ))}
            </div>
            <button className={styles.takeWinBtn} onClick={handleTakeWin}>
              💵 TAKE WIN ({fmtCredits(gambleAmount)}cr)
            </button>
          </div>
        </div>
      )}

      {/* ─── Config Row (Denomination / Bet Per Line / Lines / Total Bet) ─── */}
      <div className={styles.configRow}>
        <div className={styles.configItem}>
          <span className={styles.configLabel}>DENOM</span>
          <div className={styles.stepper}>
            <button className={styles.stepBtn} onClick={() => cycleDenom(-1)}>◀</button>
            <span className={styles.stepValue}>{denomLabel}</span>
            <button className={styles.stepBtn} onClick={() => cycleDenom(1)}>▶</button>
          </div>
        </div>
        <div className={styles.configItem}>
          <span className={styles.configLabel}>BET/LINE</span>
          <span className={styles.linesValue}>{betPerLine}x</span>
        </div>
        <div className={styles.configItem}>
          <span className={styles.configLabel}>LINES</span>
          <span className={styles.linesValue}>{lines}</span>
        </div>
        <div className={styles.configItem}>
          <span className={styles.configLabel}>TOTAL BET</span>
          <div className={styles.totalBet}>
            <span className={styles.totalBetValue}>${fmtDollars(totalBetDollars)}</span>
            <span className={styles.totalBetDollar}>{fmtCredits(totalBetCredits)}cr</span>
          </div>
        </div>
      </div>

      {/* ─── Bet x Buttons (5 individual bet multiplier buttons) ─── */}
      <div className={styles.betPanel}>
        {BET_PER_LINE.map(mult => (
          <button
            key={mult}
            className={`${styles.betBtn} ${betPerLine === mult ? styles.betBtnActive : ''}`}
            onClick={() => handleSetBet(mult)}
          >
            <span className={styles.betBtnCount}>x{mult}</span>
            <span className={styles.betBtnLabel}>BET x{mult}</span>
          </button>
        ))}
      </div>

      {/* ─── Play Lines Buttons (5 individual line buttons — AU standard) ─── */}
      <div className={styles.linesPanel}>
        {LINE_PRESETS.map(count => (
          <button
            key={count}
            className={`${styles.lineBtn} ${lines === count ? styles.lineBtnActive : ''}`}
            onClick={() => handleSetLines(count)}
          >
            <span className={styles.lineBtnCount}>{count}</span>
            <span className={styles.lineBtnLabel}>PLAY {count} LINE{count !== 1 ? 'S' : ''}</span>
          </button>
        ))}
      </div>

      {/* ─── Machine Button Panel (mirrors real AU pokie buttons) ─── */}
      <div className={styles.buttonPanel}>
        <button className={styles.machineBtn} onClick={() => setShowNoteIn(true)}>
          <span className={styles.machineBtnIcon}>💵</span>
          <span className={styles.machineBtnLabel}>NOTE IN</span>
        </button>
        <button
          className={`${styles.machineBtn} ${styles.gambleBtn} ${gambleActive ? styles.gambleBtnActive : ''}`}
          onClick={gambleActive ? () => {} : null}
          disabled={!gambleActive}
        >
          <span className={styles.machineBtnIcon}>🃏</span>
          <span className={styles.machineBtnLabel}>GAMBLE</span>
        </button>
        <button
          className={`${styles.playBtn} ${
            featureActive ? styles.playFeature :
            creditBalance >= totalBetCredits ? styles.playReady : ''
          }`}
          onClick={handlePlay}
          disabled={!featureActive && creditBalance < totalBetCredits}
        >
          <span className={styles.playBtnIcon}>
            {featureActive ? '⭐' : '▶'}
          </span>
          <span className={styles.playBtnLabel}>
            {featureActive ? 'FEATURE SPIN' : 'PLAY'}
          </span>
        </button>
      </div>

      {/* ─── Take Win / Log Win / Collect Row ─── */}
      <div className={styles.collectRow}>
        <button className={styles.winEntryBtn} onClick={handleWinEntry}>
          🏆 LOG WIN
        </button>
        <button
          className={styles.featureStartBtn}
          onClick={handleManualFeatureStart}
          disabled={featureActive}
        >
          ⭐ BONUS
        </button>
        <button
          className={styles.collectBtn}
          onClick={handleCollect}
          disabled={creditBalance <= 0}
        >
          💰 COLLECT
        </button>
      </div>

      {/* ─── Note In Modal ─── */}
      {showNoteIn && (
        <div className={styles.noteOverlay} onClick={() => setShowNoteIn(false)}>
          <div className={styles.noteCard} onClick={e => e.stopPropagation()}>
            <h4 className={styles.noteTitle}>Insert Notes</h4>
            <p className={styles.noteHint}>Tap a note or enter a custom amount</p>
            <div className={styles.noteGrid}>
              {NOTE_VALUES.map(amt => (
                <button
                  key={amt}
                  className={styles.noteBtn}
                  onClick={() => handleNoteIn(amt)}
                >
                  <span className={styles.noteBtnValue}>${amt}</span>
                  <span className={styles.noteBtnCredits}>{fmtCredits(Math.round(amt / denomination))}cr</span>
                </button>
              ))}
            </div>
            <div className={styles.noteCustom}>
              <span className={styles.noteDollar}>$</span>
              <input
                type="number"
                className={styles.noteField}
                placeholder="0.00"
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                min="0"
                step="0.01"
                onKeyDown={e => e.key === 'Enter' && handleCustomNoteIn()}
              />
              <button
                className={styles.noteInsertBtn}
                onClick={handleCustomNoteIn}
                disabled={!customNote || parseFloat(customNote) <= 0}
              >
                INSERT
              </button>
            </div>
            <button className={styles.noteCancelBtn} onClick={() => setShowNoteIn(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Session Stats Panel ─── */}
      <div className={styles.sessionPanel}>
        <div className={styles.sessionHeader}>
          <span className={styles.sessionTitle}>SESSION STATS</span>
          <button className={styles.resetBtn} onClick={handleNewSession}>New Session</button>
        </div>
        <div className={styles.sessionGrid}>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>Spins</span>
            <span className={styles.sessionValue}>{spinCount}</span>
          </div>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>Features</span>
            <span className={`${styles.sessionValue} ${styles.amber}`}>{bonusCount}</span>
          </div>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>Since Feature</span>
            <span className={styles.sessionValue} style={{
              color: spinsSinceBonus > 40 ? '#3b82f6' : spinsSinceBonus > 15 ? '#f59e0b' : '#4ade80'
            }}>{spinsSinceBonus}</span>
          </div>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>Total In</span>
            <span className={styles.sessionValue}>${fmtDollars(totalIn)}</span>
          </div>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>Total Won</span>
            <span className={`${styles.sessionValue} ${styles.green}`}>${fmtDollars(totalOut)}</span>
          </div>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>Net P&amp;L</span>
            <span className={`${styles.sessionValue} ${netPosition >= 0 ? styles.green : styles.red}`}>
              {netPosition >= 0 ? '+' : '-'}${fmtDollars(Math.abs(netPosition))}
            </span>
          </div>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>Biggest Win</span>
            <span className={`${styles.sessionValue} ${styles.gold}`}>${fmtDollars(biggestWin)}</span>
          </div>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>Avg Bet</span>
            <span className={styles.sessionValue}>
              {spinCount > 0 ? `$${fmtDollars(totalWagered / spinCount)}` : '$0.00'}
            </span>
          </div>
          <div className={styles.sessionStat}>
            <span className={styles.sessionLabel}>RTP Est.</span>
            <span className={styles.sessionValue}>
              {totalWagered > 0 ? `${((totalOut / totalWagered) * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default PokieCalculator
