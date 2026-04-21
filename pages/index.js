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
import SignUpGate from '../components/SignUpGate'
import { recordSessionSpin } from '../lib/sessionManager'
import { canAccessTab, FEATURES, PLANS, BASIC_HISTORY_LIMIT } from '../lib/featureGates'
import { loadSubscription, verifySubscription, applyPremiumUnlock, handleCheckoutReturn, openCustomerPortal } from '../lib/subscriptionStore'
import { loadProfile, saveProfile, clearProfile } from '../lib/profileStore'
import { evaluateBingoFromSpin } from '../lib/viralStore'
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
  const [spins, setSpins] = useState([])
  const [tab, setTab] = useState('calc')
  const [plan, setPlan] = useState(PLANS.BASIC)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState(null)
  const [activeVenue, setActiveVenue] = useState(null)
  const [toast, setToast] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const spinCallbackRef = useRef(null)
  const calculatorRef = useRef(null)
  const [, forceUpdate] = useState(0)

  /** Show a brief toast notification */
  function showToast(msg, durationMs = 4000) {
    setToast(msg)
    setTimeout(() => setToast(null), durationMs)
  }

  /**
   * Poll /api/me/subscription up to maxMs milliseconds until active=true.
   * Returns the final response or null on timeout.
   */
  async function pollUntilActive(customerId, timeoutMs = 10000, intervalMs = 1500) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      try {
        const res = await fetch(
          `/api/me/subscription?customerId=${encodeURIComponent(customerId)}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.active) return data
        }
      } catch { /* ignore network errors during polling */ }
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    return null
  }

  useEffect(() => {
    setSpins(loadSpins())

    // Load saved sign-up profile (if any). The gate uses this to decide
    // whether to render itself.
    setProfile(loadProfile())
    setProfileLoaded(true)

    // Load saved active venue
    try {
      const v = localStorage.getItem('pokie-active-venue')
      if (v) setActiveVenue(JSON.parse(v))
    } catch {}

    // Load cached subscription immediately so the UI is not blank
    const cached = loadSubscription()
    setPlan(cached.plan)

    // Re-verify subscription status with the server in the background.
    // This ensures returning users within a paid month stay unlocked and
    // cancelled/expired subscriptions are revoked automatically.
    verifySubscription().then((sub) => {
      setPlan(sub.plan)
    })

    // ── Handle return from Stripe Checkout ──────────────────────────────────
    const params = new URLSearchParams(window.location.search)

    if (params.get('checkout') === 'success') {
      const sessionId = params.get('session_id')
      // Remove query params immediately
      window.history.replaceState({}, '', '/')

      // First: verify the session directly with Stripe (doesn't depend on webhook)
      handleCheckoutReturn(sessionId).then(async (sub) => {
        // If the verified Stripe session reported an email and our local
        // profile is missing one, persist it so the gate doesn't re-appear
        // next visit (e.g. when the user paid via Stripe before completing
        // the in-app sign-up form).
        try {
          const existing = loadProfile()
          if (sub.customerEmail && (!existing || !existing.email)) {
            const saved = saveProfile({
              name: existing?.name || '',
              email: sub.customerEmail,
              remember: true,
            })
            setProfile(saved)
          }
        } catch { /* ignore */ }

        if (sub.plan === PLANS.PREMIUM) {
          setPlan(sub.plan)
          playSuccess()
          showToast('🎉 Subscription active! All features are now unlocked.')
          return
        }

        // Not yet active. handleCheckoutReturn has persisted the customerId
        // (when known) — re-read the cache so we can poll the server-side
        // endpoint until the subscription finalises (Stripe sometimes lags
        // behind the redirect by a few seconds, and the webhook may also
        // need to fire).
        const customerId = sub.customerId || loadSubscription().customerId
        if (customerId) {
          const data = await pollUntilActive(customerId)
          if (data) {
            const unlocked = applyPremiumUnlock({
              customerId,
              subscriptionId: data.subscriptionId,
              currentPeriodEnd: data.currentPeriodEnd,
              status: data.status,
            })
            setPlan(unlocked.plan)
            playSuccess()
            showToast('🎉 Subscription active! All features are now unlocked.')
          } else {
            // Customer link is saved — a refresh will re-verify and unlock
            // automatically once Stripe finalises.
            showToast('Payment processing — your account will unlock automatically. Refresh in a few seconds if it stays locked.')
          }
        } else {
          showToast('Payment could not be verified yet. Please refresh or contact support.')
        }
      })
    } else if (params.get('checkout') === 'cancel' || params.get('checkout') === 'cancelled') {
      showToast('Checkout cancelled. You can upgrade any time from any locked feature.')
      window.history.replaceState({}, '', '/')
    } else if (params.get('upgrade') === 'success') {
      // Legacy Payment Link redirect — optimistic unlock
      const sub = applyPremiumUnlock()
      setPlan(sub.plan)
      playSuccess()
      showToast('🎉 Welcome to Premium! All features are now unlocked.')
      window.history.replaceState({}, '', '/')
    } else if (params.get('upgrade') === 'cancelled') {
      showToast('Checkout cancelled. You can upgrade any time from any locked feature.')
      window.history.replaceState({}, '', '/')
    } else if (params.get('session_id')) {
      // Legacy: session_id only (old redirect format without checkout=success)
      const sessionId = params.get('session_id')
      window.history.replaceState({}, '', '/')
      handleCheckoutReturn(sessionId).then((sub) => {
        setPlan(sub.plan)
      })
    }

    // ── Cross-tab sync ───────────────────────────────────────────────────────
    function onStorage(e) {
      if (e.key === 'pokie-subscription') {
        const sub = loadSubscription()
        setPlan(sub.plan)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
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
    // Auto-detect & fill Pokie Bingo tasks from this spin (AI scan or manual)
    try {
      const calc = calculatorRef.current?.getSessionData?.() || {}
      const completed = evaluateBingoFromSpin(
        { ...spin, venueName: spin.venueName || activeVenue?.name },
        {
          activeVenueName: activeVenue?.name || spin.location || null,
          sessionTotalBet: calc.totalWagered || 0,
          sessionTotalWon: calc.totalOut || 0,
        }
      )
      if (completed && completed.length > 0) {
        // Show one consolidated toast (avoid stacking many)
        const labels = completed.map(c => c.label).join(' • ')
        showToast(`🎯 Bingo auto-filled: ${labels}`)
      }
    } catch { /* never let bingo break a spin */ }
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

  function handleSignOut() {
    clearProfile()
    setProfile(null)
    showToast('Signed out. Your subscription on Stripe is unaffected.')
  }

  function handleProfileSaved(p) {
    setProfile(p)
  }

  // Render the sign-up gate when the visitor has no remembered profile
  // and isn't already on Premium. Premium users (e.g. returning subscribers
  // whose customerId is cached) skip the gate entirely.
  const showSignUpGate =
    profileLoaded && !profile && plan !== PLANS.PREMIUM

  if (showSignUpGate) {
    return <SignUpGate onProfileSaved={handleProfileSaved} />
  }

  // Read live calculator session data so stat cards mirror session stats exactly
  const calcSession = calculatorRef.current?.getSessionData?.() || null
  const totalWins = calcSession ? calcSession.totalOut : spins.reduce((sum, s) => sum + (s.winAmount || 0), 0)
  const totalBet = spins.reduce((sum, s) => sum + (s.betAmount || 0), 0)
  const bonusCount = spins.filter((s) => s.bonusHit).length

  return (
    <div className={styles.shell} onClick={handleInteraction}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: '#f1f5f9', padding: '12px 24px',
          borderRadius: 8, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          fontSize: 15, fontWeight: 500, maxWidth: '90vw', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
      <header className={styles.header}>
        <h1 className={styles.title}>POKIE ANALYZER</h1>
        <p className={styles.subtitle}>Smart Machine Tracker</p>
        <div className={styles.badgeRow}>
          <SubscriptionBadge plan={plan} onUpgradeClick={() => openPaywall()} />
          {plan === PLANS.PREMIUM && (
            <button
              onClick={() => openCustomerPortal()}
              style={{
                marginLeft: 8, padding: '4px 12px', fontSize: 12,
                background: 'transparent', color: '#94a3b8',
                border: '1px solid #334155', borderRadius: 6, cursor: 'pointer',
              }}
            >
              Manage billing
            </button>
          )}
          {profile && (
            <button
              onClick={handleSignOut}
              title={`Signed in as ${profile.email}`}
              style={{
                marginLeft: 8, padding: '4px 12px', fontSize: 12,
                background: 'transparent', color: '#94a3b8',
                border: '1px solid #334155', borderRadius: 6, cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          )}
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
