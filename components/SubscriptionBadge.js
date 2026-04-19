import { PLAN_DETAILS, PLANS } from '../lib/featureGates'
import { openCustomerPortal, applyPremiumUnlock } from '../lib/subscriptionStore'
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

  function handleRestorePremium() {
    if (confirm('Have you already paid for Premium on Stripe? Click OK to unlock.')) {
      applyPremiumUnlock()
      window.location.reload()
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
        <>
          <button
            className={styles.upgradeBadgeBtn}
            onClick={() => { playTap(); onUpgradeClick() }}
          >
            👑 Upgrade
          </button>
          <button className={styles.manageBtn} onClick={handleRestorePremium}>
            Already paid?
          </button>
        </>
      )}
    </div>
  )
}
