import { useState, useMemo, useEffect, useRef } from 'react'
import { buildLeaderboard, getBadges, getRank, getProfile } from '../lib/communityStore'
import { playTap } from '../lib/sounds'
import Pagination from './Pagination'
import { pageForIndex, totalPagesFor, clampPage } from '../lib/pagination'
import styles from './CommunityHub.module.css'
import paginationStyles from './Pagination.module.css'

const PAGE_SIZE = 10

export default function Leaderboard({ spins }) {
  const [sortBy, setSortBy] = useState('totalWins')
  const [page, setPage] = useState(1)
  const profile = typeof window !== 'undefined' ? getProfile() : null
  const myCardRef = useRef(null)
  const [pendingScroll, setPendingScroll] = useState(false)

  const board = useMemo(() => buildLeaderboard(spins), [spins])

  const sorted = useMemo(() => {
    return [...board].sort((a, b) => {
      if (sortBy === 'totalWins') return b.totalWins - a.totalWins
      if (sortBy === 'biggestWin') return b.biggestWin - a.biggestWin
      if (sortBy === 'totalSpins') return b.totalSpins - a.totalSpins
      if (sortBy === 'bonuses') return b.bonuses - a.bonuses
      if (sortBy === 'roi') return b.roi - a.roi
      return 0
    })
  }, [board, sortBy])

  // Reset to page 1 whenever the sort or list size changes.
  useEffect(() => {
    setPage(1)
  }, [sortBy, sorted.length])

  const totalPages = totalPagesFor(sorted.length, PAGE_SIZE)
  const currentPage = clampPage(page, totalPages)

  const myIndex = useMemo(() => {
    if (!profile) return -1
    return sorted.findIndex((p) => p.userId === profile.id)
  }, [sorted, profile])

  const myPage = myIndex >= 0 ? pageForIndex(myIndex, PAGE_SIZE) : null
  const myPosition = myIndex >= 0 ? myIndex + 1 : null

  const startIdx = (currentPage - 1) * PAGE_SIZE
  const pageRows = sorted.slice(startIdx, startIdx + PAGE_SIZE)

  // After navigating via "Jump to my rank", scroll the user's card into view.
  useEffect(() => {
    if (!pendingScroll) return
    if (myCardRef.current) {
      myCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setPendingScroll(false)
  }, [pendingScroll, currentPage])

  function handleSort(key) {
    setSortBy(key)
    playTap()
  }

  function handlePageChange(p) {
    setPage(p)
    playTap()
  }

  function handleJumpToMe() {
    if (myPage === null) return
    if (myPage !== currentPage) setPage(myPage)
    setPendingScroll(true)
    playTap()
  }

  const SORT_OPTIONS = [
    { key: 'totalWins', label: '💰 Wins' },
    { key: 'biggestWin', label: '💎 Biggest' },
    { key: 'totalSpins', label: '🎰 Spins' },
    { key: 'bonuses', label: '⭐ Bonuses' },
    { key: 'roi', label: '📈 ROI' },
  ]

  const showJumpChip =
    myIndex >= 0 && myPage !== null && myPage !== currentPage

  const jumpChip = showJumpChip ? (
    <button
      type="button"
      className={paginationStyles.jumpChip}
      onClick={handleJumpToMe}
      aria-label={`Jump to your rank, position ${myPosition}`}
    >
      You're #{myPosition} — Jump →
    </button>
  ) : null

  return (
    <div className={styles.lbWrap}>
      {/* Sort bar */}
      <div className={styles.lbSortBar}>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`${styles.lbSortBtn} ${sortBy === opt.key ? styles.lbSortActive : ''}`}
            onClick={() => handleSort(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className={styles.feedEmpty}>
          <span className={styles.feedEmptyEmoji}>🏆</span>
          <p>No data yet. Start spinning to climb the ranks!</p>
        </div>
      ) : (
        <>
          {/* Top pagination */}
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={handlePageChange}
            extra={jumpChip}
            label="Leaderboard pagination (top)"
          />

          <div className={styles.lbList}>
            {pageRows.map((player, idx) => {
              const rank = getRank(player.totalWins)
              const badges = getBadges(player)
              const position = startIdx + idx + 1
              const isMe = profile && player.userId === profile.id

              return (
                <div
                  key={player.userId}
                  ref={isMe ? myCardRef : undefined}
                  className={`${styles.lbCard} ${isMe ? styles.lbCardMe : ''}`}
                >
                  {/* Position */}
                  <div className={styles.lbPosition}>
                    {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`}
                  </div>

                  {/* Avatar + name */}
                  <div className={styles.lbPlayer}>
                    <span className={styles.lbAvatar}>{player.avatar}</span>
                    <div className={styles.lbPlayerInfo}>
                      <span className={styles.lbName}>
                        {player.name} {isMe && <span className={styles.lbYou}>(You)</span>}
                      </span>
                      <span className={styles.lbRank} style={{ color: rank.color }}>
                        {rank.emoji} {rank.title}
                      </span>
                      {player.location && (
                        <span className={styles.lbLocation}>📍 {player.location}</span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className={styles.lbStats}>
                    <div className={styles.lbStatItem}>
                      <span className={styles.lbStatValue}>${player.totalWins.toFixed(0)}</span>
                      <span className={styles.lbStatLabel}>Won</span>
                    </div>
                    <div className={styles.lbStatItem}>
                      <span className={styles.lbStatValue}>{player.totalSpins}</span>
                      <span className={styles.lbStatLabel}>Spins</span>
                    </div>
                    <div className={styles.lbStatItem}>
                      <span className={styles.lbStatValue}>${player.biggestWin.toFixed(0)}</span>
                      <span className={styles.lbStatLabel}>Best</span>
                    </div>
                    <div className={styles.lbStatItem}>
                      <span className={styles.lbStatValue}>{player.bonuses}</span>
                      <span className={styles.lbStatLabel}>Bonus</span>
                    </div>
                    <div className={styles.lbStatItem}>
                      <span className={styles.lbStatValue} style={{ color: player.roi >= 0 ? '#4ade80' : '#f87171' }}>
                        {player.roi > 0 ? '+' : ''}{player.roi}%
                      </span>
                      <span className={styles.lbStatLabel}>ROI</span>
                    </div>
                  </div>

                  {/* Badges */}
                  {badges.length > 0 && (
                    <div className={styles.lbBadges}>
                      {badges.map((b, i) => (
                        <span key={i} className={styles.lbBadge} title={b.label}>
                          {b.emoji}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Streak */}
                  {player.streak >= 3 && (
                    <div className={styles.lbStreak}>
                      🔥 {player.streak} win streak
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom pagination — only when long enough to need re-rendering */}
          {totalPages > 1 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={handlePageChange}
              label="Leaderboard pagination (bottom)"
            />
          )}
        </>
      )}
    </div>
  )
}
