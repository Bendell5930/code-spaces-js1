import { useState, useEffect } from 'react'
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
  const [activeVenue, setActiveVenue] = useState(null)

  // Load any previously-selected active venue so the Check-In form is
  // pre-populated when the user opens the hub.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const v = localStorage.getItem('pokie-active-venue')
      if (v) setActiveVenue(JSON.parse(v))
    } catch { /* ignore unavailable/corrupt localStorage */ }
  }, [])

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

  // Persist the active venue to localStorage so it survives reloads and
  // is shared across every social tab (Check-In, Reviews, etc.).
  function persistActiveVenue(venue) {
    setActiveVenue(venue)
    if (typeof window === 'undefined') return
    try {
      if (venue) {
        localStorage.setItem('pokie-active-venue', JSON.stringify(venue))
      } else {
        localStorage.removeItem('pokie-active-venue')
      }
    } catch { /* ignore localStorage write failures (quota / private mode) */ }
  }

  // Selecting a venue in the Finder automatically sets it as the active
  // venue and jumps to the Check-In sub-tab so the user can check in
  // straight away without having to re-pick the venue elsewhere.
  function handleSelectVenueFromFinder(venue) {
    if (!venue) return
    persistActiveVenue(venue)
    playTap()
    setGroup('social')
    setFeature('checkin')
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
        {feature === 'checkin' && (
          <VenueCheckIn
            activeVenue={activeVenue}
            onSelectVenue={persistActiveVenue}
          />
        )}
        {feature === 'venues' && <TrackedVenueList />}
        {feature === 'tips' && <HotTipFeed />}
        {feature === 'reviews' && (
          <VenueRatings
            activeVenue={activeVenue}
            onSelectVenue={persistActiveVenue}
          />
        )}
        {feature === 'mate' && <MateMode />}
        {feature === 'bingo' && <PokieBingo />}
        {feature === 'challenge' && <ChallengeAMate />}
        {feature === 'streaks' && <DailyStreaks />}
        {feature === 'events' && <SeasonalEvents />}
        {feature === 'wrap' && <WeeklyWrap spins={spins} />}
        {feature === 'staygo' && <StayOrGoMeter />}
        {feature === 'achieve' && <AchievementWall spins={spins} />}
        {feature === 'diary' && <LuckyMachineDiary />}
        {feature === 'finder' && (
          <VenueFinderMap onSelectVenue={handleSelectVenueFromFinder} />
        )}
        {feature === 'notify' && <PushNotifications />}
      </div>
    </div>
  )
}
