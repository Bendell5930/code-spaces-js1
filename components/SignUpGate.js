import { useState } from 'react'
import { isValidEmail, saveProfile } from '../lib/profileStore'
import { startCheckout, verifySubscription } from '../lib/subscriptionStore'
import { PLANS } from '../lib/featureGates'
import styles from './SignUpGate.module.css'

/**
 * Sign-up gate shown to users who have not yet provided a profile.
 *
 * Collects Name + Email (with an optional "Remember me on this device"
 * checkbox), persists them via lib/profileStore, then starts Stripe
 * Checkout for the $9/month subscription. The email is forwarded to
 * Stripe so the resulting Customer is keyed to the same address — that
 * lets verifySubscription() unlock the app on every subsequent visit
 * without re-collecting profile information.
 *
 * Also offers an "Already paid? Restore access" action that re-runs
 * verifySubscription() against the cached customerId.
 */
export default function SignUpGate({ onProfileSaved }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function validate() {
    if (!name.trim()) return 'Please enter your name.'
    if (!isValidEmail(email)) return 'Please enter a valid email address.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setBusy(true)
    const profile = saveProfile({ name, email, remember })
    onProfileSaved?.(profile)

    try {
      // Hand off to Stripe Checkout. This navigates the current window;
      // on success Stripe will redirect back with ?checkout=success&session_id=...
      // which pages/index.js handles to flip the user to PREMIUM.
      await startCheckout({ customerEmail: profile.email })
    } catch (err) {
      setBusy(false)
      setError('Could not start checkout. Please try again.')
      // eslint-disable-next-line no-console
      console.warn('startCheckout failed:', err)
    }
  }

  async function handleRestore() {
    setError(null)
    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setBusy(true)
    const profile = saveProfile({ name, email, remember })
    onProfileSaved?.(profile)

    try {
      const sub = await verifySubscription()
      if (sub.plan === PLANS.PREMIUM) {
        // Reload so the rest of the app picks up the unlocked state from
        // the freshly-written subscription cache.
        if (typeof window !== 'undefined') window.location.reload()
        return
      }
      setBusy(false)
      setError(
        'No active subscription found for this device. Please subscribe to unlock all features.'
      )
    } catch (err) {
      setBusy(false)
      setError('Could not verify subscription. Please try again.')
      // eslint-disable-next-line no-console
      console.warn('verifySubscription failed:', err)
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="signup-title">
      <div className={styles.card}>
        <h2 id="signup-title" className={styles.title}>Welcome to Pokie Analyzer</h2>
        <p className={styles.subtitle}>
          Sign up to unlock all features for $9/month.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="signup-name" className={styles.label}>Name</label>
            <input
              id="signup-name"
              className={styles.input}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>Email</label>
            <input
              id="signup-email"
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={busy}
            />
            Remember me on this device
          </label>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button type="submit" className={styles.primary} disabled={busy}>
            {busy ? 'Loading…' : 'Continue to Payment — $9 / month'}
          </button>

          <button
            type="button"
            className={styles.secondary}
            onClick={handleRestore}
            disabled={busy}
          >
            Already paid? Restore access
          </button>
        </form>

        <p className={styles.privacy}>
          We only store your name and email to verify your monthly subscription
          with Stripe. See our <a href="/privacy">Privacy Policy</a> and{' '}
          <a href="/terms">Terms of Service</a>.
        </p>
      </div>
    </div>
  )
}
