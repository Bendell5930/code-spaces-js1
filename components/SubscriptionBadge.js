import { PLAN_DETAILS, PLANS } from '../lib/featureGates'
import { openCustomerPortal } from '../lib/subscriptionStore'
import { supabase } from '../lib/supabaseClient'
import { playTap } from '../lib/sounds'
import styles from './Subscription.module.css'

export default function SubscriptionBadge({ plan, email, onUpgradeClick }) {
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

  async function handleSignOut() {
    playTap()
    await supabase.auth.signOut()
  }

  return (
    <div className={styles.badge} style={{ borderColor: details.color }}>
      <span className={styles.badgeEmoji}>{details.emoji}</span>
      <span className={styles.badgePlan} style={{ color: details.color }}>
        {details.name}
      </span>
      {email && (
        <span
          title={email}
          style={{ fontSize: '0.6rem', color: '#64748b', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {email}
        </span>
      )}
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
      {email && (
        <button
          className={styles.manageBtn}
          onClick={handleSignOut}
          title="Sign out"
        >
          Sign out
        </button>
      )}
    </div>
  )
}

