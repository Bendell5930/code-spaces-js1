import { useState, useEffect } from 'react'
import { loadWinsFeed, cheerWin, postWin } from '../lib/communityStore'
import { playTap, playCoin } from '../lib/sounds'
import styles from './CommunityHub.module.css'

export default function RecentWinsFeed({ spins }) {
  const [feed, setFeed] = useState([])

  useEffect(() => {
    setFeed(loadWinsFeed())
  }, [])

  // Auto-post new wins from spins that aren't in the feed yet
  useEffect(() => {
    if (!spins || spins.length === 0) return
    const currentFeed = loadWinsFeed()
    const lastFeedTs = currentFeed.length > 0
      ? Math.max(...currentFeed.map((w) => w.timestamp))
      : 0

    // Only post wins that are newer than the last feed entry and actually have a win
    const newWins = spins.filter(
      (s) => (s.winAmount || 0) > 0 && (s.timestamp || 0) > lastFeedTs
    )

    if (newWins.length > 0) {
      let updated = currentFeed
      for (const s of newWins.slice(-5)) { // max 5 at a time
        updated = postWin(s)
      }
      setFeed(updated)
    }
  }, [spins])

  function handleCheer(winId) {
    const updated = cheerWin(winId)
    setFeed(updated)
    playCoin()
  }

  function formatTime(ts) {
    const diffMin = Math.floor((Date.now() - ts) / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    return new Date(ts).toLocaleDateString()
  }

  function getWinTier(amount) {
    if (amount >= 500) return { label: 'JACKPOT', emoji: '🏆', cls: styles.tierJackpot }
    if (amount >= 100) return { label: 'BIG WIN', emoji: '💎', cls: styles.tierBig }
    if (amount >= 50)  return { label: 'NICE WIN', emoji: '🔥', cls: styles.tierNice }
    if (amount >= 10)  return { label: 'WIN', emoji: '✨', cls: styles.tierWin }
    return { label: 'SMALL WIN', emoji: '🍀', cls: styles.tierSmall }
  }

  const sortedFeed = [...feed].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className={styles.feedWrap}>
      <div className={styles.feedHeader}>
        <span className={styles.feedLive}>● LIVE</span>
        <span className={styles.feedTitle}>Recent Wins</span>
      </div>

      {sortedFeed.length === 0 ? (
        <div className={styles.feedEmpty}>
          <span className={styles.feedEmptyEmoji}>🎰</span>
          <p>No wins yet. Get spinning!</p>
        </div>
      ) : (
        <div className={styles.feedList}>
          {sortedFeed.map((w) => {
            const tier = getWinTier(w.winAmount)
            return (
              <div key={w.id} className={styles.winCard}>
                <div className={styles.winCardLeft}>
                  <span className={styles.winAvatar}>{w.userAvatar}</span>
                  <div className={styles.winInfo}>
                    <span className={styles.winUser}>{w.userName}</span>
                    <span className={styles.winMachine}>{w.machineName}</span>
                    {w.location && (
                      <span className={styles.winLocation}>📍 {w.location}</span>
                    )}
                  </div>
                </div>
                <div className={styles.winCardRight}>
                  <span className={`${styles.winTier} ${tier.cls}`}>
                    {tier.emoji} {tier.label}
                  </span>
                  <span className={styles.winAmount}>${w.winAmount.toFixed(2)}</span>
                  {w.multiplier > 1 && (
                    <span className={styles.winMulti}>{w.multiplier}x</span>
                  )}
                  <span className={styles.winTime}>{formatTime(w.timestamp)}</span>
                </div>
                <button
                  className={styles.cheerBtn}
                  onClick={() => handleCheer(w.id)}
                  title="Cheer this win!"
                >
                  🎉 {w.cheers > 0 ? w.cheers : ''}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
