import styles from './Subscription.module.css'

export default function LockedFeature({ feature, onUpgrade }) {
  return (
    <div className={styles.lockedOverlay}>
      <span className={styles.lockedEmoji}>🔒</span>
      <h3 className={styles.lockedTitle}>{feature?.label || 'Premium Feature'}</h3>
      <p className={styles.lockedText}>
        This feature is available with a Premium subscription.
      </p>
      <button className={styles.lockedUpgradeBtn} onClick={onUpgrade}>
        👑 Unlock Premium
      </button>
    </div>
  )
}
