import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { PLAN_DETAILS, PLANS } from '../lib/featureGates'
import { openCustomerPortal } from '../lib/subscriptionStore'
import { playTap } from '../lib/sounds'
import styles from './Subscription.module.css'

export default function SubscriptionBadge({ plan, onUpgradeClick, userEmail }) {
  const supabase = useSupabaseClient()
  const details = PLAN_DETAILS[plan] || PLAN_DETAILS[PLANS.BASIC]
  const isPremium = plan === PLANS.PREMIUM

  async function handleManage() {
    playTap()
    try {
      await openCustomerPortal()
    } catch (err) {
      if (err.message === 'NOT_AUTHENTICATED') {
        alert('Please sign in to manage your subscription.')
      } else {
        alert('Unable to open subscription management. Please try again.')
      }
    }
  }

  async function handleSignOut() {
    playTap()
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className={styles.badge} style={{ borderColor: details.color }}>
      <span className={styles.badgeEmoji}>{details.emoji}</span>
      <span className={styles.badgePlan} style={{ color: details.color }}>
        {details.name}
      </span>
      {userEmail && (
        <span style={{ fontSize: '0.55rem', color: '#64748b', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userEmail}
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
      {userEmail && (
        <button className={styles.manageBtn} onClick={handleSignOut} style={{ marginLeft: '0.15rem' }}>
          Sign out
        </button>
      )}
    </div>
  )
}
