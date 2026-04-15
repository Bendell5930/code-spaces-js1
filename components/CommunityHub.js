import { useState } from 'react'
import ChatForum from './ChatForum'
import RecentWinsFeed from './RecentWinsFeed'
import Leaderboard from './Leaderboard'
import ReferralHub from './ReferralHub'
import { playTap } from '../lib/sounds'
import styles from './CommunityHub.module.css'

const SUB_TABS = [
  { key: 'chat', label: '💬 Chat', emoji: '💬' },
  { key: 'wins', label: '🏆 Wins', emoji: '🏆' },
  { key: 'board', label: '🏅 Ranks', emoji: '🏅' },
  { key: 'refer', label: '🎁 Refer', emoji: '🎁' },
]

export default function CommunityHub({ spins }) {
  const [subTab, setSubTab] = useState('chat')

  function switchSub(key) {
    if (key !== subTab) {
      playTap()
      setSubTab(key)
    }
  }

  return (
    <div className={styles.hubWrap}>
      {/* Sub-tab bar */}
      <div className={styles.subTabs}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.subTab} ${subTab === t.key ? styles.subTabActive : ''}`}
            onClick={() => switchSub(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === 'chat' && <ChatForum />}
      {subTab === 'wins' && <RecentWinsFeed spins={spins} />}
      {subTab === 'board' && <Leaderboard spins={spins} />}
      {subTab === 'refer' && <ReferralHub />}
    </div>
  )
}
