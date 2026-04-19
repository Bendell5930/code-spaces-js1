import { useState, useEffect, useRef, useCallback } from 'react'
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
import { loadSubscription, verifySubscription, startCheckout, NEEDS_LOGIN } from '../lib/subscriptionStore'
import { supabase } from '../lib/supabaseClient'
import { resumeAudio, playTap, playSwitch, playSuccess, playCoin, playWarn } from '../lib/sounds'
import styles from '../styles/home.module.css'

const STORAGE_KEY = 'pokie-analyzer-spins'
const PENDING_UPGRADE_KEY = 'pokie-pending-upgrade'

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

  function showToast(message, duration = 4000) {
    setToast(message)
    setTimeout(() => setToast(null), duration)
  }

  useEffect(() => {
    setSpins(loadSpins())

    // Load saved active venue
    try {
      const v = localStorage.getItem('pokie-active-venue')
      if (v) setActiveVenue(JSON.parse(v))
    } catch {}

    // Load cached subscription for instant render
    const cached = loadSubscription()
    setPlan(cached.plan)
    if (cached.email) setUserEmail(cached.email)

    // Handle URL params from Stripe / Supabase auth callbacks
    const params = new URLSearchParams(window.location.search)
    const upgradeStatus = params.get('upgrade')
    const loginStatus = params.get('login')
    // Clean URL early so back/forward won't re-trigger
    if (upgradeStatus || loginStatus) {
      window.history.replaceState({}, '', '/')
    }

    // Subscribe to Supabase auth state changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setUserEmail(session.user.email)
          const sub = await verifySubscription()
          setPlan(sub.plan)
          if (sub.email) setUserEmail(sub.email)

          // If we have a pending upgrade, trigger checkout now
          if (localStorage.getItem(PENDING_UPGRADE_KEY) === 'true') {
            localStorage.removeItem(PENDING_UPGRADE_KEY)
            try {
              await startCheckout()
            } catch (err) {
              if (err !== NEEDS_LOGIN) {
                showToast('⚠️ Checkout failed. Please try again.')
              }
            }
          }
        } else {
          setUserEmail(null)
          setPlan(PLANS.BASIC)
        }
      }
    )

    // Get current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email)
        const sub = await verifySubscription()
        setPlan(sub.plan)
        if (sub.email) setUserEmail(sub.email)
      }
    })

    // Handle return from Stripe Checkout
    if (upgradeStatus === 'success') {
      // Give webhook 2s to process, then re-verify
      setTimeout(async () => {
        const sub = await verifySubscription()
        setPlan(sub.plan)
        playSuccess()
        showToast('🎉 Welcome to Premium! Your locks are now removed.')
      }, 2000)
    } else if (upgradeStatus === 'cancelled') {
      showToast('Checkout cancelled.')
    }

    return () => {
      authSub.unsubscribe()
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
          <SubscriptionBadge
            plan={plan}
            email={userEmail}
            onUpgradeClick={() => openPaywall()}
          />
        </div>
      </header>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b',
          border: '1px solid #fbbf24',
          color: '#f1f5f9',
          padding: '0.6rem 1.25rem',
          borderRadius: '8px',
          zIndex: 2000,
          fontSize: '0.85rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

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
