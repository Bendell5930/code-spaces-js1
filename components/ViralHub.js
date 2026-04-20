import { useState } from 'react'
import VenueCheckIn from './VenueCheckIn'
import ChallengeAMate from './ChallengeAMate'
import DailyStreaks from './DailyStreaks'
import SeasonalEvents from './SeasonalEvents'
import AchievementWall from './AchievementWall'
import LuckyMachineDiary from './LuckyMachineDiary'
import VenueRatings from './VenueRatings'
import HotTipFeed from './HotTipFeed'
import WeeklyWrap from './WeeklyWrap'
import PokieBingo from './PokieBingo'
import StayOrGoMeter from './StayOrGoMeter'
import MateMode from './MateMode'
import VenueFinderMap from './VenueFinderMap'
import PushNotifications from './PushNotifications'
import TrackedVenueList from './TrackedVenueList'
import { playTap } from '../lib/sounds'
import styles from './ViralHub.module.css'

const GROUPS = [
  { key: 'social', label: '🤝 Social' },
  { key: 'games', label: '🎮 Games' },
  { key: 'stats', label: '📊 Stats' },
  { key: 'tools', label: '🛠 Tools' },
]

const FEATURES = {
  social: [
    { key: 'checkin', label: '📍 Check-In' },
    { key: 'venues', label: '📌 My Venues' },
    { key: 'tips', label: '🔥 Hot Tips' },
    { key: 'reviews', label: '⭐ Reviews' },
    { key: 'mate', label: '🤝 Mate Mode' },
  ],
  games: [
    { key: 'bingo', label: '🎯 Bingo' },
    { key: 'challenge', label: '⚔️ Challenge' },
    { key: 'streaks', label: '🔥 Streaks' },
    { key: 'events', label: '🏆 Events' },
  ],
  stats: [
    { key: 'wrap', label: '📊 Weekly Wrap' },
    { key: 'staygo', label: '🎯 Stay/Go' },
    { key: 'achieve', label: '🏅 Trophies' },
    { key: 'diary', label: '📔 Diary' },
  ],
  tools: [
    { key: 'finder', label: '🗺 Finder' },
    { key: 'notify', label: '🔔 Alerts' },
  ],
}

export default function ViralHub({ spins }) {
  const [group, setGroup] = useState('social')
  const [feature, setFeature] = useState('checkin')

  function switchGroup(g) {
    if (g !== group) {
      playTap()
      setGroup(g)
      setFeature(FEATURES[g][0].key)
    }
  }

  function switchFeature(f) {
    if (f !== feature) {
      playTap()
      setFeature(f)
    }
  }

  return (
    <div className={styles.hubWrap}>
      {/* Group tabs */}
      <div className={styles.groupTabs}>
        {GROUPS.map((g) => (
          <button
            key={g.key}
            className={`${styles.groupTab} ${group === g.key ? styles.groupTabActive : ''}`}
            onClick={() => switchGroup(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Feature sub-tabs */}
      <div className={styles.featureTabs}>
        {FEATURES[group].map((f) => (
          <button
            key={f.key}
            className={`${styles.featureTab} ${feature === f.key ? styles.featureTabActive : ''}`}
            onClick={() => switchFeature(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {feature === 'checkin' && <VenueCheckIn />}
        {feature === 'venues' && <TrackedVenueList />}
        {feature === 'tips' && <HotTipFeed />}
        {feature === 'reviews' && <VenueRatings />}
        {feature === 'mate' && <MateMode />}
        {feature === 'bingo' && <PokieBingo />}
        {feature === 'challenge' && <ChallengeAMate />}
        {feature === 'streaks' && <DailyStreaks />}
        {feature === 'events' && <SeasonalEvents />}
        {feature === 'wrap' && <WeeklyWrap spins={spins} />}
        {feature === 'staygo' && <StayOrGoMeter />}
        {feature === 'achieve' && <AchievementWall spins={spins} />}
        {feature === 'diary' && <LuckyMachineDiary />}
        {feature === 'finder' && <VenueFinderMap />}
        {feature === 'notify' && <PushNotifications />}
      </div>
    </div>
  )
}
