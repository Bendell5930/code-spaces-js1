import { useState, useEffect, useRef, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import JackpotDisplay from '../components/JackpotDisplay'
import SpinHistory from '../components/SpinHistory'
import AIVideoCapture from '../components/AIVideoCapture'
import MachineHeatMap from '../components/MachineHeatMap'
import CommunityHub from '../components/CommunityHub'
import SubscriptionBadge from '../components/SubscriptionBadge'
import PaywallModal from '../components/PaywallModal'
import LockedFeature from '../components/LockedFeature'
import HarmMinimization from '../components/HarmMinimization'
import PokieCalculator from '../components/PokieCalculator'
import VenueInsights from '../components/VenueInsights'
import ViralHub from '../components/ViralHub'
import { recordSessionSpin } from '../lib/sessionManager'
import { canAccessTab, FEATURES, PLANS, BASIC_HISTORY_LIMIT } from '../lib/featureGates'
import { loadSubscription, verifySubscription } from '../lib/subscriptionStore'
import { resumeAudio, playTap, playSwitch, playSuccess, playCoin, playWarn } from '../lib/sounds'
import styles from '../styles/home.module.css'

const STORAGE_KEY = 'pokie-analyzer-spins'

function loadSpins() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSpins(spins) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(spins))
}

export default function Home() {
  const supabase = useSupabaseClient()
  const [spins, setSpins] = useState([])
  const [tab, setTab] = useState('calc')
  const [plan, setPlan] = useState(PLANS.BASIC)
  const [userEmail, setUserEmail] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState(null)
  const [activeVenue, setActiveVenue] = useState(null)
  const [toast, setToast] = useState(null)
  const spinCallbackRef = useRef(null)
  const calculatorRef = useRef(null)
  const [, forceUpdate] = useState(0)

  function showToast(msg, durationMs = 4000) {
    setToast(msg)
    setTimeout(() => setToast(null), durationMs)
  }

  useEffect(() => {
    setSpins(loadSpins())

    // Load saved active venue
    try {
      const v = localStorage.getItem('pokie-active-venue')
      if (v) setActiveVenue(JSON.parse(v))
    } catch {}

    // Show cached plan immediately while server responds
    const cached = loadSubscription()
    setPlan(cached.plan)
    if (cached.email) setUserEmail(cached.email)

    // Verify with server (authoritative)
    verifySubscription().then((sub) => {
      setPlan(sub.plan)
      if (sub.email) setUserEmail(sub.email)
    })

    // Handle return from Stripe Checkout
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgrade') === 'success') {
      // Clean URL immediately
      window.history.replaceState({}, '', '/')

      // Poll /api/me — webhook may take a moment to land
      const poll = (attempt) => {
        verifySubscription().then((sub) => {
          setPlan(sub.plan)
          if (sub.email) setUserEmail(sub.email)
          if (sub.plan === PLANS.PREMIUM) {
            playSuccess()
            showToast('Welcome to Premium! 🎉')
          } else if (attempt < 2) {
            // Retry after 3s then 5s
            setTimeout(() => poll(attempt + 1), attempt === 0 ? 3000 : 5000)
          }
        })
      }
      // First attempt after 2s
      setTimeout(() => poll(0), 2000)
    }

    // Handle ?upgrade=1 from landing page — open paywall automatically
    if (params.get('upgrade') === '1') {
      window.history.replaceState({}, '', '/')
      setShowPaywall(true)
    }

    // Handle return after sign-in from auth callback
    if (params.get('signedin') === '1') {
      window.history.replaceState({}, '', '/')
      verifySubscription().then((sub) => {
        setPlan(sub.plan)
        if (sub.email) setUserEmail(sub.email)
      })
    }
  }, [])

  /** Resume audio context on first interaction */
  function handleInteraction() {
    resumeAudio()
  }

  function handleSubmit(spin) {
    const updated = [...spins, spin]
    setSpins(updated)
    saveSpins(updated)
    // Record in session manager for harm minimization tracking
    recordSessionSpin(spin.betAmount || 0, spin.winAmount || 0)
    // Notify harm minimization of new spin
    if (spinCallbackRef.current) {
      spinCallbackRef.current(spin.betAmount || 0, spin.winAmount || 0)
    }
    if (spin.winAmount > 0) {
      playCoin()
    } else {
      playSuccess()
    }
    // Force re-read of calculator session data for stat cards
    forceUpdate(n => n + 1)
  }

  function switchTab(t) {
    if (t !== tab) {
      const access = canAccessTab(t, plan)
      if (!access.allowed) {
        playWarn()
        setPaywallFeature(access.feature)
        setShowPaywall(true)
        return
      }
      playSwitch()
      setTab(t)
    }
  }

  function openPaywall(feature) {
    setPaywallFeature(feature || null)
    setShowPaywall(true)
  }

  function handleSetActiveVenue(venue) {
    setActiveVenue(venue)
    if (venue) {
      localStorage.setItem('pokie-active-venue', JSON.stringify(venue))
    } else {
      localStorage.removeItem('pokie-active-venue')
    }
  }

  const handleSpinCallback = useCallback((cb) => {
    spinCallbackRef.current = cb
  }, [])

  // Read live calculator session data so stat cards mirror session stats exactly
  const calcSession = calculatorRef.current?.getSessionData?.() || null
  const totalWins = calcSession ? calcSession.totalOut : spins.reduce((sum, s) => sum + (s.winAmount || 0), 0)
  const totalBet = spins.reduce((sum, s) => sum + (s.betAmount || 0), 0)
  const bonusCount = spins.filter((s) => s.bonusHit).length

  return (
    <div className={styles.shell} onClick={handleInteraction}>
      <header className={styles.header}>
        <h1 className={styles.title}>POKIE ANALYZER</h1>
        <p className={styles.subtitle}>Smart Machine Tracker</p>
        <div className={styles.badgeRow}>
          <SubscriptionBadge plan={plan} userEmail={userEmail} onUpgradeClick={() => openPaywall()} />
        </div>
      </header>

      <main className={styles.main}>
        <JackpotDisplay />

        <HarmMinimization onSpinLogged={handleSpinCallback} onHistory={() => switchTab('history')} calculatorRef={calculatorRef}>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Spins</span>
            <span className={styles.statValue}>{calcSession ? calcSession.spinCount : spins.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Wins</span>
            <span className={`${styles.statValue} ${styles.green}`}>
              ${totalWins.toFixed(2)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Bet</span>
            <span className={styles.statValue}>${totalBet.toFixed(2)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Bonuses</span>
            <span className={`${styles.statValue} ${styles.amber}`}>
              {bonusCount}
            </span>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'scan' ? styles.tabActive : ''}`}
            onClick={() => switchTab('scan')}
          >
            AI Scan {plan !== PLANS.PREMIUM && '🔒'}
          </button>

          <button
            className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`}
            onClick={() => switchTab('history')}
          >
            History
          </button>
          <button
            className={`${styles.tab} ${tab === 'heat' ? styles.tabActive : ''}`}
            onClick={() => switchTab('heat')}
          >
            Heat Map {plan !== PLANS.PREMIUM && '🔒'}
          </button>
          <button
            className={`${styles.tab} ${tab === 'community' ? styles.tabActive : ''}`}
            onClick={() => switchTab('community')}
          >
            Community {plan !== PLANS.PREMIUM && '🔒'}
          </button>
          <button
            className={`${styles.tab} ${tab === 'calc' ? styles.tabActive : ''}`}
            onClick={() => switchTab('calc')}
          >
            Calculator
          </button>
          <button
            className={`${styles.tab} ${tab === 'venues' ? styles.tabActive : ''}`}
            onClick={() => switchTab('venues')}
          >
            Venues {plan !== PLANS.PREMIUM && '🔒'}
          </button>
          <button
            className={`${styles.tab} ${tab === 'viral' ? styles.tabActive : ''}`}
            onClick={() => switchTab('viral')}
          >
            Viral {plan !== PLANS.PREMIUM && '🔒'}
          </button>
        </div>

        {tab === 'scan' ? (
          <AIVideoCapture
            onCapture={handleSubmit}
            calculatorRef={calculatorRef}
            venueId={activeVenue?.id}
            venueName={activeVenue?.name}
            venueSuburb={activeVenue?.suburb}
            venueRegion={activeVenue?.region}
          />
        ) : tab === 'heat' ? (
          <MachineHeatMap spins={spins} />
        ) : tab === 'community' ? (
          <CommunityHub spins={spins} />
        ) : tab === 'calc' ? (
          <PokieCalculator
            ref={calculatorRef}
            onSpinRecord={handleSubmit}
            venueId={activeVenue?.id}
            venueName={activeVenue?.name}
            venueSuburb={activeVenue?.suburb}
            venueRegion={activeVenue?.region}
          />
        ) : tab === 'venues' ? (
          <VenueInsights
            activeVenue={activeVenue}
            onSetActiveVenue={handleSetActiveVenue}
          />
        ) : tab === 'viral' ? (
          <ViralHub spins={spins} />
        ) : (
          <>
            <SpinHistory
              spins={plan === PLANS.PREMIUM ? spins : spins.slice(-BASIC_HISTORY_LIMIT)}
            />
            {plan !== PLANS.PREMIUM && spins.length > BASIC_HISTORY_LIMIT && (
              <LockedFeature
                feature={FEATURES.HISTORY_FULL}
                onUpgrade={() => openPaywall(FEATURES.HISTORY_FULL)}
              />
            )}
          </>
        )}

        </HarmMinimization>
      </main>

      {/* Paywall modal */}
      {showPaywall && (
        <PaywallModal
          feature={paywallFeature}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            border: '1px solid #fbbf24',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
            color: '#fbbf24',
            fontWeight: 700,
            fontSize: '0.9rem',
            zIndex: 2000,
            boxShadow: '0 0 20px rgba(251,191,36,0.2)',
          }}
        >
          {toast}
        </div>
      )}

      <footer className={styles.footer}>
        <p>
          Please gamble responsibly.{' '}
          <a
            href="https://www.gamblinghelponline.org.au"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gambling Help Online
          </a>{' '}
          | 1800 858 858
          {' · '}
          <a href="/privacy">Privacy Policy</a>
          {' · '}
          <a href="/terms">Terms of Service</a>
        </p>
      </footer>
    </div>
  )
}
