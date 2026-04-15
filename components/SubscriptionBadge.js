import { PLAN_DETAILS, PLANS } from '../lib/featureGates'
import { openCustomerPortal } from '../lib/subscriptionStore'
import { playTap } from '../lib/sounds'
import styles from './Subscription.module.css'

export default function SubscriptionBadge({ plan, onUpgradeClick }) {
  const details = PLAN_DETAILS[plan] || PLAN_DETAILS[PLANS.BASIC]
  const isPremium = plan === PLANS.PREMIUM

  async function handleManage() {
    playTap()
    try {
      await openCustomerPortal()
    } catch {
      alert('Unable to open subscription management. Please try again.')
    }
  }

  return (
    <div className={styles.badge} style={{ borderColor: details.color }}>
      <span className={styles.badgeEmoji}>{details.emoji}</span>
      <span className={styles.badgePlan} style={{ color: details.color }}>
        {details.name}
      </span>
      {isPremium ? (
        <button className={styles.manageBtn} onClick={handleManage}>
          Manage
        </button>
      ) : (
        <button
          className={styles.upgradeBadgeBtn}
          onClick={() => { playTap(); onUpgradeClick() }}
        >
          👑 Upgrade
        </button>
      )}
    </div>
  )
}
