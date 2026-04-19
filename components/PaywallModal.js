import { useState } from 'react'
import { getPremiumFeatures, PLAN_DETAILS, PLANS } from '../lib/featureGates'
import { startCheckout, NEEDS_LOGIN } from '../lib/subscriptionStore'
import { playTap, playSuccess } from '../lib/sounds'
import AuthModal from './AuthModal'
import styles from './Subscription.module.css'

const PENDING_UPGRADE_KEY = 'pokie-pending-upgrade'

export default function PaywallModal({ feature, onClose }) {
  const premiumFeatures = getPremiumFeatures()
  const premium = PLAN_DETAILS[PLANS.PREMIUM]
  const [showAuth, setShowAuth] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    playSuccess()
    setCheckoutError(null)
    setLoading(true)
    try {
      await startCheckout()
      // startCheckout does a full-page redirect; we only get here on error
    } catch (err) {
      if (err === NEEDS_LOGIN) {
        // Set a pending flag so index.js continues after login
        if (typeof window !== 'undefined') {
          localStorage.setItem(PENDING_UPGRADE_KEY, 'true')
        }
        setLoading(false)
        setShowAuth(true)
      } else {
        setCheckoutError(err?.message || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    }
  }

  if (showAuth) {
    return (
      <AuthModal
        message="Sign in to upgrade — we'll send you a magic link, then take you to checkout."
        onClose={() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(PENDING_UPGRADE_KEY)
          }
          setShowAuth(false)
          onClose()
        }}
      />
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Crown header */}
        <div className={styles.modalHeader}>
          <span className={styles.crownEmoji}>👑</span>
          <h2 className={styles.modalTitle}>Unlock Premium</h2>
          {feature && (
            <p className={styles.modalSubtitle}>
              <strong>{feature.label}</strong> requires a Premium subscription
            </p>
          )}
        </div>

        {/* Feature list */}
        <div className={styles.featureList}>
          <p className={styles.featureListTitle}>Everything you get with Premium:</p>
          {premiumFeatures.map((f) => (
            <div key={f.key} className={styles.featureItem}>
              <span className={styles.featureCheck}>✓</span>
              <span className={styles.featureText}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className={styles.priceBox}>
          <span className={styles.priceAmount}>{premium.price}</span>
          <span className={styles.priceNote}>Cancel anytime · Instant access</span>
        </div>

        {checkoutError && (
          <p style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            {checkoutError}
          </p>
        )}

        {/* Actions */}
        <div className={styles.modalActions}>
          <button
            className={styles.upgradeBtn}
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Loading…' : '🚀 Upgrade to Premium'}
          </button>
          <button className={styles.laterBtn} onClick={() => { playTap(); onClose() }}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

