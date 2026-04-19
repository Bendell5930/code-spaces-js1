import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { getPremiumFeatures, PLAN_DETAILS, PLANS } from '../lib/featureGates'
import { startCheckout } from '../lib/subscriptionStore'
import { playTap, playSuccess } from '../lib/sounds'
import styles from './Subscription.module.css'
import AuthModal from './AuthModal'

export default function PaywallModal({ feature, onClose }) {
  const supabase = useSupabaseClient()
  const premiumFeatures = getPremiumFeatures()
  const premium = PLAN_DETAILS[PLANS.PREMIUM]
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    playSuccess()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Not signed in — show auth modal
        setLoading(false)
        setShowAuth(true)
        return
      }

      // Signed in — go straight to checkout
      await startCheckout()
    } catch (err) {
      setLoading(false)
      if (err.message === 'NOT_AUTHENTICATED') {
        setShowAuth(true)
      } else {
        alert('Unable to start checkout. Please try again.')
      }
    }
  }

  // After sign-in, automatically start checkout
  async function handleAuthClose() {
    setShowAuth(false)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      onClose()
      try {
        await startCheckout()
      } catch {
        alert('Unable to start checkout. Please try again.')
      }
    }
  }

  if (showAuth) {
    return (
      <AuthModal
        message="Sign in to upgrade to Premium"
        onClose={handleAuthClose}
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

        {/* Actions */}
        <div className={styles.modalActions}>
          <button className={styles.upgradeBtn} onClick={handleUpgrade} disabled={loading}>
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
