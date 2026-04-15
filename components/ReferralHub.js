import { useState, useEffect } from 'react'
import {
  loadReferral,
  applyReferralCode,
  recordReferral,
  claimReward,
  getShareText,
  MILESTONES,
} from '../lib/referralStore'
import { playTap, playSuccess, playCoin } from '../lib/sounds'
import styles from './ReferralHub.module.css'

export default function ReferralHub() {
  const [data, setData] = useState(null)
  const [friendCode, setFriendCode] = useState('')
  const [applyMsg, setApplyMsg] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showSimulate, setShowSimulate] = useState(false)

  useEffect(() => {
    setData(loadReferral())
  }, [])

  if (!data) return null

  function handleCopyCode() {
    navigator.clipboard?.writeText(data.code).then(() => {
      setCopied(true)
      playSuccess()
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    const text = getShareText(data.code)
    if (navigator.share) {
      navigator.share({ title: 'Pokie Analyzer', text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true)
        playSuccess()
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  function handleApplyCode() {
    const result = applyReferralCode(friendCode.trim().toUpperCase())
    setApplyMsg(result)
    if (result.success) {
      playCoin()
      setData(loadReferral())
      setFriendCode('')
    } else {
      playTap()
    }
  }

  function handleClaim(index) {
    const updated = claimReward(index)
    setData(updated)
    playCoin()
  }

  // Demo: simulate a referral (for testing)
  function handleSimulateReferral() {
    const names = ['LuckyAce', 'GoldenDragon', 'SpinMaster', 'NeonTiger', 'CosmicWolf']
    const name = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 99)
    const updated = recordReferral(name)
    setData(updated)
    playCoin()
  }

  const unclaimedCount = data.rewards.filter((r) => !r.claimed).length

  return (
    <div className={styles.wrap}>
      {/* ── Your Referral Code ── */}
      <div className={styles.codeSection}>
        <h3 className={styles.heading}>Your Referral Code</h3>
        <div className={styles.codeBox}>
          <span className={styles.code}>{data.code}</span>
          <button className={styles.copyBtn} onClick={handleCopyCode}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        <button className={styles.shareBtn} onClick={handleShare}>
          📤 Share with Friends
        </button>
        <p className={styles.codeHint}>
          Friends get a <strong>7-day free trial</strong>. You get a <strong>free month</strong> for each signup!
        </p>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>👥</span>
          <span className={styles.statValue}>{data.totalReferrals}</span>
          <span className={styles.statLabel}>Referrals</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>🎁</span>
          <span className={styles.statValue}>{data.freeMonthsEarned}</span>
          <span className={styles.statLabel}>Free Months</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>🏆</span>
          <span className={styles.statValue}>{data.rewards.filter((r) => r.type === 'badge').length}</span>
          <span className={styles.statLabel}>Badges</span>
        </div>
      </div>

      {/* ── Milestones ── */}
      <div className={styles.section}>
        <h3 className={styles.heading}>Milestone Rewards</h3>
        <div className={styles.milestoneList}>
          {MILESTONES.map((m, i) => {
            const reached = data.totalReferrals >= m.count
            return (
              <div
                key={i}
                className={`${styles.milestone} ${reached ? styles.milestoneReached : ''}`}
              >
                <span className={styles.milestoneEmoji}>{reached ? m.emoji : '🔒'}</span>
                <div className={styles.milestoneInfo}>
                  <span className={styles.milestoneLabel}>{m.label}</span>
                  <span className={styles.milestoneCount}>{m.count} referral{m.count > 1 ? 's' : ''}</span>
                </div>
                {reached && <span className={styles.milestoneCheck}>✓</span>}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(100, (data.totalReferrals / 25) * 100)}%` }}
            />
          </div>
          <span className={styles.progressText}>{data.totalReferrals}/25 to Legend</span>
        </div>
      </div>

      {/* ── Rewards ── */}
      {data.rewards.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.heading}>
            Your Rewards {unclaimedCount > 0 && <span className={styles.rewardBubble}>{unclaimedCount} new</span>}
          </h3>
          <div className={styles.rewardList}>
            {[...data.rewards].reverse().map((r, i) => {
              const realIndex = data.rewards.length - 1 - i
              return (
                <div key={i} className={`${styles.rewardCard} ${!r.claimed ? styles.rewardNew : ''}`}>
                  <span className={styles.rewardEmoji}>{r.emoji}</span>
                  <div className={styles.rewardInfo}>
                    <span className={styles.rewardLabel}>{r.label}</span>
                    <span className={styles.rewardDate}>
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                  </div>
                  {!r.claimed && r.type !== 'badge' ? (
                    <button className={styles.claimBtn} onClick={() => handleClaim(realIndex)}>
                      Claim
                    </button>
                  ) : (
                    <span className={styles.rewardClaimed}>
                      {r.type === 'badge' ? 'Earned' : 'Claimed'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent Referrals ── */}
      {data.referrals.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.heading}>Recent Referrals</h3>
          <div className={styles.referralList}>
            {[...data.referrals].reverse().slice(0, 10).map((r, i) => (
              <div key={i} className={styles.referralItem}>
                <span className={styles.referralIcon}>🤝</span>
                <span className={styles.referralName}>{r.friendName}</span>
                <span className={styles.referralDate}>{new Date(r.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Apply a Friend's Code ── */}
      {!data.appliedCode && (
        <div className={styles.section}>
          <h3 className={styles.heading}>Have a Friend&apos;s Code?</h3>
          <div className={styles.applyRow}>
            <input
              className={styles.applyInput}
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              placeholder="Enter code (e.g. PA-ABC123)"
              maxLength={10}
            />
            <button
              className={styles.applyBtn}
              onClick={handleApplyCode}
              disabled={!friendCode.trim()}
            >
              Apply
            </button>
          </div>
          {applyMsg && (
            <p className={applyMsg.success ? styles.applySuccess : styles.applyError}>
              {applyMsg.message}
            </p>
          )}
        </div>
      )}

      {data.appliedCode && (
        <div className={styles.appliedNote}>
          ✓ You used referral code: <strong>{data.appliedCode}</strong>
        </div>
      )}

      {/* ── Simulate (dev/testing) ── */}
      <div className={styles.simSection}>
        <button className={styles.simToggle} onClick={() => setShowSimulate(!showSimulate)}>
          {showSimulate ? '▲ Hide' : '▼ Test Tools'}
        </button>
        {showSimulate && (
          <button className={styles.simBtn} onClick={handleSimulateReferral}>
            🧪 Simulate a Referral
          </button>
        )}
      </div>
    </div>
  )
}
