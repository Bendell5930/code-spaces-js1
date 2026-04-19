import { getPremiumFeatures, PLAN_DETAILS, PLANS } from '../lib/featureGates'
import { openPremiumCheckout } from '../lib/stripeLinks'
import { playTap, playSuccess } from '../lib/sounds'
import styles from './Subscription.module.css'

export default function PaywallModal({ feature, onClose }) {
  const premiumFeatures = getPremiumFeatures()
  const premium = PLAN_DETAILS[PLANS.PREMIUM]

  function handleUpgrade() {
    playSuccess()
    openPremiumCheckout()
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
          <button className={styles.upgradeBtn} onClick={handleUpgrade}>
            🚀 Upgrade to Premium
          </button>
          <button className={styles.laterBtn} onClick={() => { playTap(); onClose() }}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
