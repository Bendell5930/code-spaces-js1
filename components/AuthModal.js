import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { playTap } from '../lib/sounds'
import styles from './Subscription.module.css'

/**
 * AuthModal — magic link sign-in.
 *
 * Props:
 *   onClose()  — called when the user dismisses the modal
 *   message    — optional string shown above the input (e.g. "Sign in to upgrade…")
 */
export default function AuthModal({ onClose, message }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSend(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?login=success`
        : undefined

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.crownEmoji}>✉️</span>
          <h2 className={styles.modalTitle}>Sign In</h2>
          {message && (
            <p className={styles.modalSubtitle}>{message}</p>
          )}
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '0.5rem' }}>
              Check your email!
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              We sent a sign-in link to <strong style={{ color: '#f1f5f9' }}>{email}</strong>.
              Click the link to continue — this tab will stay open.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                {error}
              </p>
            )}

            <div className={styles.modalActions}>
              <button
                type="submit"
                className={styles.upgradeBtn}
                disabled={loading}
              >
                {loading ? 'Sending…' : '📧 Send magic link'}
              </button>
              <button
                type="button"
                className={styles.laterBtn}
                onClick={() => { playTap(); onClose() }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
