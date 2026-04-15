/**
 * Viral Features Store — localStorage persistence for check-ins,
 * challenges, streaks, seasonal events, achievements, and machine diary.
 */

import { getProfile } from './communityStore'

// ─── Storage keys ───
const CHECKIN_KEY = 'pokie-checkins'
const CHALLENGE_KEY = 'pokie-challenges'
const STREAK_KEY = 'pokie-streaks'
const EVENTS_KEY = 'pokie-seasonal-events'
const ACHIEVEMENTS_KEY = 'pokie-achievements'
const DIARY_KEY = 'pokie-machine-diary'

function load(key, fallback = []) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ════════════════════════════════════════
//  VENUE CHECK-IN
// ════════════════════════════════════════

const STATUS_OPTIONS = [
  { key: 'hunting', label: '🎯 Hunting Bonuses', emoji: '🎯' },
  { key: 'vibing', label: '😎 Just Vibing', emoji: '😎' },
  { key: 'scouting', label: '🔍 Scouting Machines', emoji: '🔍' },
  { key: 'chilling', label: '🍺 Chilling at the Bar', emoji: '🍺' },
  { key: 'winning', label: '🔥 On a Hot Streak', emoji: '🔥' },
  { key: 'casual', label: '🎲 Casual Session', emoji: '🎲' },
]

export { STATUS_OPTIONS }

export function loadCheckIns() {
  return load(CHECKIN_KEY, [])
}

export function checkIn(venue, status, machineName) {
  const profile = getProfile()
  const entry = {
    id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: profile.id,
    userName: profile.name,
    userAvatar: profile.avatar,
    venueId: venue.id || venue.name,
    venueName: venue.name,
    venueSuburb: venue.suburb || '',
    venueRegion: venue.region || '',
    status: status || 'casual',
    machineName: machineName || null,
    timestamp: Date.now(),
    expiresAt: Date.now() + (4 * 60 * 60 * 1000), // 4 hours
  }
  const checkins = loadCheckIns()
  checkins.push(entry)
  // Keep last 500 and remove expired
  const now = Date.now()
  const active = checkins.filter(c => c.expiresAt > now).slice(-500)
  save(CHECKIN_KEY, active)
  return active
}

export function checkOut(checkInId) {
  const checkins = loadCheckIns()
  const updated = checkins.filter(c => c.id !== checkInId)
  save(CHECKIN_KEY, updated)
  return updated
}

export function getActiveCheckIns() {
  const now = Date.now()
  return loadCheckIns().filter(c => c.expiresAt > now)
}

export function getMyActiveCheckIn() {
  const profile = getProfile()
  const now = Date.now()
  return loadCheckIns().find(c => c.userId === profile.id && c.expiresAt > now) || null
}

// ════════════════════════════════════════
//  CHALLENGE A MATE
// ════════════════════════════════════════

const CHALLENGE_TYPES = [
  { key: 'bonus_count', label: 'Most Bonuses This Week', emoji: '⭐', unit: 'bonuses', duration: 7 },
  { key: 'budget_hero', label: 'Stay Under Budget Longest', emoji: '🛡️', unit: 'sessions', duration: 7 },
  { key: 'spin_count', label: 'Most Spins This Week', emoji: '🔄', unit: 'spins', duration: 7 },
  { key: 'biggest_win', label: 'Biggest Single Win', emoji: '💰', unit: '$', duration: 7 },
  { key: 'venue_explorer', label: 'Visit Most Venues', emoji: '📍', unit: 'venues', duration: 14 },
  { key: 'streak_master', label: 'Longest Daily Streak', emoji: '🔥', unit: 'days', duration: 14 },
]

export { CHALLENGE_TYPES }

export function loadChallenges() {
  return load(CHALLENGE_KEY, [])
}

export function createChallenge(type, friendCode) {
  const profile = getProfile()
  const cType = CHALLENGE_TYPES.find(t => t.key === type)
  if (!cType) return null
  const challenge = {
    id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: cType.key,
    label: cType.label,
    emoji: cType.emoji,
    unit: cType.unit,
    creatorId: profile.id,
    creatorName: profile.name,
    creatorAvatar: profile.avatar,
    creatorScore: 0,
    friendCode: friendCode || '',
    friendName: friendCode ? `Mate #${friendCode.slice(-4)}` : 'Waiting...',
    friendScore: 0,
    friendJoined: false,
    status: 'active', // active | completed | expired
    startedAt: Date.now(),
    endsAt: Date.now() + (cType.duration * 24 * 60 * 60 * 1000),
    createdAt: Date.now(),
  }
  const challenges = loadChallenges()
  challenges.push(challenge)
  save(CHALLENGE_KEY, challenges.slice(-50))
  return challenge
}

export function updateChallengeScore(challengeId, score) {
  const challenges = loadChallenges()
  const ch = challenges.find(c => c.id === challengeId)
  if (!ch) return challenges
  const profile = getProfile()
  if (ch.creatorId === profile.id) {
    ch.creatorScore = score
  } else {
    ch.friendScore = score
    ch.friendJoined = true
    ch.friendName = profile.name
  }
  // Check completion
  if (Date.now() > ch.endsAt) {
    ch.status = 'completed'
  }
  save(CHALLENGE_KEY, challenges)
  return challenges
}

export function getActiveChallenges() {
  const now = Date.now()
  const challenges = loadChallenges()
  return challenges.map(ch => {
    if (ch.status === 'active' && now > ch.endsAt) {
      ch.status = 'completed'
    }
    return ch
  }).filter(ch => ch.status === 'active')
}

export function getChallengeShareCode(challengeId) {
  return `PA-CH-${challengeId.replace('ch-', '').slice(0, 8).toUpperCase()}`
}

// ════════════════════════════════════════
//  DAILY STREAKS
// ════════════════════════════════════════

const STREAK_MILESTONES = [
  { days: 3,   reward: '🔥', label: 'Flame Frame',      type: 'frame', color: '#ef4444' },
  { days: 7,   reward: '⚡', label: 'Lightning Flair',  type: 'flair', color: '#fbbf24' },
  { days: 14,  reward: '💎', label: 'Diamond Frame',    type: 'frame', color: '#38bdf8' },
  { days: 21,  reward: '🌟', label: 'Star Flair',       type: 'flair', color: '#a78bfa' },
  { days: 30,  reward: '👑', label: 'Gold Crown Frame', type: 'frame', color: '#f59e0b' },
  { days: 50,  reward: '🐉', label: 'Dragon Flair',     type: 'flair', color: '#22c55e' },
  { days: 100, reward: '🏆', label: 'Legend Frame',      type: 'frame', color: '#ec4899' },
]

export { STREAK_MILESTONES }

export function loadStreakData() {
  return load(STREAK_KEY, {
    currentStreak: 0,
    longestStreak: 0,
    lastCheckIn: null,
    totalDays: 0,
    unlockedRewards: [],
    history: [],
  })
}

export function recordDailyCheckIn() {
  const data = loadStreakData()
  const now = new Date()
  const today = now.toISOString().slice(0, 10) // YYYY-MM-DD

  // Already checked in today
  if (data.lastCheckIn === today) {
    return { ...data, alreadyCheckedIn: true }
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  if (data.lastCheckIn === yesterdayStr) {
    // Consecutive day
    data.currentStreak += 1
  } else {
    // Streak broken
    data.currentStreak = 1
  }

  data.lastCheckIn = today
  data.totalDays += 1
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak
  }

  // Check for new milestone unlocks
  const newRewards = []
  for (const m of STREAK_MILESTONES) {
    if (data.currentStreak >= m.days && !data.unlockedRewards.includes(m.label)) {
      data.unlockedRewards.push(m.label)
      newRewards.push(m)
    }
  }

  // Track history (last 100 days)
  data.history.push({ date: today, streak: data.currentStreak })
  data.history = data.history.slice(-100)

  save(STREAK_KEY, data)
  return { ...data, newRewards, alreadyCheckedIn: false }
}

export function getStreakFrame() {
  const data = loadStreakData()
  // Return highest unlocked frame
  const frames = STREAK_MILESTONES.filter(
    m => m.type === 'frame' && data.unlockedRewards.includes(m.label)
  )
  return frames.length > 0 ? frames[frames.length - 1] : null
}

export function getStreakFlairs() {
  const data = loadStreakData()
  return STREAK_MILESTONES.filter(
    m => m.type === 'flair' && data.unlockedRewards.includes(m.label)
  )
}

// ════════════════════════════════════════
//  SEASONAL EVENTS
// ════════════════════════════════════════

function getCurrentSeasonalEvents() {
  const now = new Date()
  const month = now.getMonth() // 0-11
  const year = now.getFullYear()

  const events = [
    { id: `ev-${year}-00`, month: 0, title: '🎆 New Year Blitz', description: 'Log 100 spins in January', target: 100, metric: 'spins', machine: null, badge: '🎆', badgeLabel: 'New Year Blitzer' },
    { id: `ev-${year}-01`, month: 1, title: '💘 Lucky Hearts', description: 'Hit 10 bonuses in February', target: 10, metric: 'bonuses', machine: null, badge: '💘', badgeLabel: 'Lucky Heart' },
    { id: `ev-${year}-02`, month: 2, title: '🐉 Dragon Month', description: 'Log 50 spins on any Dragon Link', target: 50, metric: 'spins', machine: 'Dragon Link', badge: '🐉', badgeLabel: 'Dragon Master' },
    { id: `ev-${year}-03`, month: 3, title: '🍀 Lucky Streak April', description: 'Maintain a 7-day streak', target: 7, metric: 'streak', machine: null, badge: '🍀', badgeLabel: 'Lucky Charm' },
    { id: `ev-${year}-04`, month: 4, title: '⚡ Lightning Rush', description: 'Log 50 spins on any Lightning Link', target: 50, metric: 'spins', machine: 'Lightning Link', badge: '⚡', badgeLabel: 'Lightning Striker' },
    { id: `ev-${year}-05`, month: 5, title: '🏆 Mid-Year Champion', description: 'Visit 5 different venues', target: 5, metric: 'venues', machine: null, badge: '🏆', badgeLabel: 'Mid-Year Champ' },
    { id: `ev-${year}-06`, month: 6, title: '❄️ Winter Warm-Up', description: 'Log 75 spins in July', target: 75, metric: 'spins', machine: null, badge: '❄️', badgeLabel: 'Winter Warrior' },
    { id: `ev-${year}-07`, month: 7, title: '🐂 Bull Rush Month', description: 'Log 30 spins on Bull Rush Link', target: 30, metric: 'spins', machine: 'Bull Rush Link', badge: '🐂', badgeLabel: 'Bull Rider' },
    { id: `ev-${year}-08`, month: 8, title: '🛡️ Budget Hero Challenge', description: 'Stay under budget for 10 sessions', target: 10, metric: 'budget_sessions', machine: null, badge: '🛡️', badgeLabel: 'Budget Hero' },
    { id: `ev-${year}-09`, month: 9, title: '🎃 Spooky Spins', description: 'Hit 15 bonuses in October', target: 15, metric: 'bonuses', machine: null, badge: '🎃', badgeLabel: 'Spooky Spinner' },
    { id: `ev-${year}-10`, month: 10, title: '💎 Diamond Quest', description: 'Log your biggest single win', target: 1, metric: 'biggest_win', machine: null, badge: '💎', badgeLabel: 'Diamond Chaser' },
    { id: `ev-${year}-11`, month: 11, title: '🎄 Festive Fortune', description: 'Log 100 spins in December and win $500+', target: 100, metric: 'spins', machine: null, badge: '🎄', badgeLabel: 'Festive King' },
  ]

  return events.filter(e => e.month === month)
}

export function loadEventProgress() {
  return load(EVENTS_KEY, {})
}

export function getSeasonalEvents() {
  const events = getCurrentSeasonalEvents()
  const progress = loadEventProgress()

  return events.map(ev => ({
    ...ev,
    progress: progress[ev.id]?.current || 0,
    completed: progress[ev.id]?.completed || false,
    claimedBadge: progress[ev.id]?.claimedBadge || false,
  }))
}

export function updateEventProgress(eventId, current) {
  const progress = loadEventProgress()
  const events = getCurrentSeasonalEvents()
  const ev = events.find(e => e.id === eventId)
  if (!ev) return

  if (!progress[eventId]) {
    progress[eventId] = { current: 0, completed: false, claimedBadge: false }
  }
  progress[eventId].current = Math.max(progress[eventId].current, current)
  if (progress[eventId].current >= ev.target) {
    progress[eventId].completed = true
  }
  save(EVENTS_KEY, progress)
}

export function claimEventBadge(eventId) {
  const progress = loadEventProgress()
  if (progress[eventId] && progress[eventId].completed) {
    progress[eventId].claimedBadge = true
    save(EVENTS_KEY, progress)
    return true
  }
  return false
}

// ════════════════════════════════════════
//  ACHIEVEMENT WALL
// ════════════════════════════════════════

const ALL_ACHIEVEMENTS = [
  // Gambling achievements
  { id: 'first_spin', emoji: '🎲', label: 'First Spin', description: 'Log your first ever spin', category: 'gambling' },
  { id: 'first_bonus', emoji: '⭐', label: 'First Bonus', description: 'Hit your first bonus feature', category: 'gambling' },
  { id: 'first_jackpot', emoji: '🎰', label: 'First Jackpot', description: 'Log a jackpot-level win ($500+)', category: 'gambling' },
  { id: 'century', emoji: '💯', label: 'Century Spinner', description: 'Log 100 spins', category: 'gambling' },
  { id: 'thousand', emoji: '🏅', label: 'Spin Legend', description: 'Log 1,000 spins', category: 'gambling' },
  { id: 'big_winner', emoji: '💰', label: 'Big Winner', description: 'Win $100+ in a single spin', category: 'gambling' },
  { id: 'mega_win', emoji: '👑', label: 'Mega Winner', description: 'Win $500+ in a single spin', category: 'gambling' },
  { id: 'bonus_hunter_10', emoji: '🎯', label: 'Bonus Hunter', description: 'Hit 10 bonus features', category: 'gambling' },
  { id: 'bonus_king_50', emoji: '🌟', label: 'Bonus King', description: 'Hit 50 bonus features', category: 'gambling' },

  // Venue achievements
  { id: 'first_venue', emoji: '📍', label: 'First Venue', description: 'Visit your first venue', category: 'venue' },
  { id: 'venue_5', emoji: '🗺️', label: 'Venue Explorer', description: 'Visit 5 different venues', category: 'venue' },
  { id: 'venue_10', emoji: '🌏', label: 'Venue Globetrotter', description: 'Visit 10 different venues', category: 'venue' },
  { id: 'venue_regular', emoji: '🏠', label: 'Regular', description: 'Visit the same venue 10 times', category: 'venue' },

  // Responsible gambling
  { id: 'budget_hero_1', emoji: '🛡️', label: 'Budget Conscious', description: 'Stay under budget for 1 session', category: 'responsible' },
  { id: 'budget_hero_5', emoji: '💪', label: 'Budget Warrior', description: 'Stay under budget for 5 sessions', category: 'responsible' },
  { id: 'budget_hero_10', emoji: '🏆', label: 'Budget Hero', description: 'Stay under budget for 10 sessions', category: 'responsible' },
  { id: 'cool_off', emoji: '🧊', label: 'Cool Off Pro', description: 'Complete 3 cool-off breaks', category: 'responsible' },
  { id: 'time_limit', emoji: '⏰', label: 'Time Keeper', description: 'End 5 sessions on time', category: 'responsible' },

  // Streaks
  { id: 'streak_3', emoji: '🔥', label: 'Streak Starter', description: '3-day login streak', category: 'streak' },
  { id: 'streak_7', emoji: '⚡', label: 'Week Warrior', description: '7-day login streak', category: 'streak' },
  { id: 'streak_14', emoji: '💎', label: 'Fortnight Hero', description: '14-day login streak', category: 'streak' },
  { id: 'streak_30', emoji: '👑', label: 'Monthly Master', description: '30-day login streak', category: 'streak' },

  // Social
  { id: 'first_chat', emoji: '💬', label: 'First Chat', description: 'Send your first community message', category: 'social' },
  { id: 'first_cheer', emoji: '🎉', label: 'Good Sport', description: 'Cheer someone\'s win', category: 'social' },
  { id: 'first_challenge', emoji: '🤝', label: 'Challenger', description: 'Create your first mate challenge', category: 'social' },
  { id: 'referral_1', emoji: '🎁', label: 'Recruiter', description: 'Get your first referral', category: 'social' },
  { id: 'checkin_1', emoji: '📌', label: 'Checked In', description: 'Do your first venue check-in', category: 'social' },

  // Machine mastery
  { id: 'dragon_master', emoji: '🐉', label: 'Dragon Master', description: 'Log 50 spins on Dragon Link', category: 'mastery' },
  { id: 'lightning_master', emoji: '⚡', label: 'Lightning Master', description: 'Log 50 spins on Lightning Link', category: 'mastery' },
  { id: 'machine_variety', emoji: '🎰', label: 'Variety Player', description: 'Play 5 different machine brands', category: 'mastery' },
  { id: 'diary_entry', emoji: '📖', label: 'Machine Diarist', description: 'Claim your first lucky machine', category: 'mastery' },

  // Seasonal
  { id: 'seasonal_1', emoji: '🏅', label: 'Seasonal Player', description: 'Complete your first seasonal event', category: 'seasonal' },
  { id: 'seasonal_3', emoji: '🌟', label: 'Event Hunter', description: 'Complete 3 seasonal events', category: 'seasonal' },
]

export { ALL_ACHIEVEMENTS }

export function loadUnlockedAchievements() {
  return load(ACHIEVEMENTS_KEY, [])
}

export function unlockAchievement(achievementId) {
  const unlocked = loadUnlockedAchievements()
  if (unlocked.find(a => a.id === achievementId)) return unlocked // already unlocked

  const def = ALL_ACHIEVEMENTS.find(a => a.id === achievementId)
  if (!def) return unlocked

  unlocked.push({
    ...def,
    unlockedAt: Date.now(),
  })
  save(ACHIEVEMENTS_KEY, unlocked)
  return unlocked
}

export function checkAndUnlockAchievements(stats) {
  const newlyUnlocked = []

  const checks = [
    { id: 'first_spin', cond: stats.totalSpins >= 1 },
    { id: 'century', cond: stats.totalSpins >= 100 },
    { id: 'thousand', cond: stats.totalSpins >= 1000 },
    { id: 'first_bonus', cond: stats.totalBonuses >= 1 },
    { id: 'bonus_hunter_10', cond: stats.totalBonuses >= 10 },
    { id: 'bonus_king_50', cond: stats.totalBonuses >= 50 },
    { id: 'big_winner', cond: stats.biggestWin >= 100 },
    { id: 'mega_win', cond: stats.biggestWin >= 500 },
    { id: 'first_jackpot', cond: stats.biggestWin >= 500 },
    { id: 'first_venue', cond: stats.venuesVisited >= 1 },
    { id: 'venue_5', cond: stats.venuesVisited >= 5 },
    { id: 'venue_10', cond: stats.venuesVisited >= 10 },
    { id: 'venue_regular', cond: stats.maxVenueVisits >= 10 },
    { id: 'budget_hero_1', cond: stats.budgetSessions >= 1 },
    { id: 'budget_hero_5', cond: stats.budgetSessions >= 5 },
    { id: 'budget_hero_10', cond: stats.budgetSessions >= 10 },
    { id: 'cool_off', cond: stats.coolOffs >= 3 },
    { id: 'time_limit', cond: stats.timeLimitSessions >= 5 },
    { id: 'streak_3', cond: stats.longestStreak >= 3 },
    { id: 'streak_7', cond: stats.longestStreak >= 7 },
    { id: 'streak_14', cond: stats.longestStreak >= 14 },
    { id: 'streak_30', cond: stats.longestStreak >= 30 },
    { id: 'first_chat', cond: stats.chatMessages >= 1 },
    { id: 'first_cheer', cond: stats.cheers >= 1 },
    { id: 'first_challenge', cond: stats.challenges >= 1 },
    { id: 'referral_1', cond: stats.referrals >= 1 },
    { id: 'checkin_1', cond: stats.checkIns >= 1 },
    { id: 'dragon_master', cond: stats.dragonSpins >= 50 },
    { id: 'lightning_master', cond: stats.lightningSpins >= 50 },
    { id: 'machine_variety', cond: stats.machineTypes >= 5 },
    { id: 'diary_entry', cond: stats.diaryEntries >= 1 },
    { id: 'seasonal_1', cond: stats.seasonalCompleted >= 1 },
    { id: 'seasonal_3', cond: stats.seasonalCompleted >= 3 },
  ]

  const unlocked = loadUnlockedAchievements()
  const unlockedIds = new Set(unlocked.map(a => a.id))

  for (const { id, cond } of checks) {
    if (cond && !unlockedIds.has(id)) {
      const result = unlockAchievement(id)
      const def = ALL_ACHIEVEMENTS.find(a => a.id === id)
      if (def) newlyUnlocked.push(def)
    }
  }

  return newlyUnlocked
}

export function buildAchievementStats(spins) {
  const venues = new Set()
  const venueCounts = {}
  const machines = new Set()
  let dragonSpins = 0
  let lightningSpins = 0
  let biggestWin = 0
  let totalBonuses = 0

  for (const s of spins) {
    if (s.venueName) {
      venues.add(s.venueName)
      venueCounts[s.venueName] = (venueCounts[s.venueName] || 0) + 1
    }
    if (s.machineName) {
      machines.add(s.machineName)
      if (s.machineName.toLowerCase().includes('dragon')) dragonSpins++
      if (s.machineName.toLowerCase().includes('lightning')) lightningSpins++
    }
    if ((s.winAmount || 0) > biggestWin) biggestWin = s.winAmount
    if (s.bonusHit) totalBonuses++
  }

  const streakData = loadStreakData()
  const diary = loadMachineDiary()
  const challenges = loadChallenges()
  const checkIns = loadCheckIns()
  const eventProgress = loadEventProgress()
  const seasonalCompleted = Object.values(eventProgress).filter(e => e.completed).length

  return {
    totalSpins: spins.length,
    totalBonuses,
    biggestWin,
    venuesVisited: venues.size,
    maxVenueVisits: Math.max(0, ...Object.values(venueCounts)),
    budgetSessions: parseInt(localStorage.getItem('pokie-budget-sessions') || '0', 10),
    coolOffs: parseInt(localStorage.getItem('pokie-cooloff-count') || '0', 10),
    timeLimitSessions: parseInt(localStorage.getItem('pokie-timelimit-sessions') || '0', 10),
    longestStreak: streakData.longestStreak || 0,
    chatMessages: parseInt(localStorage.getItem('pokie-chat-count') || '0', 10),
    cheers: parseInt(localStorage.getItem('pokie-cheer-count') || '0', 10),
    challenges: challenges.length,
    referrals: parseInt(localStorage.getItem('pokie-referral-count') || '0', 10),
    checkIns: checkIns.length,
    dragonSpins,
    lightningSpins,
    machineTypes: machines.size,
    diaryEntries: diary.length,
    seasonalCompleted,
  }
}

// ════════════════════════════════════════
//  LUCKY MACHINE DIARY
// ════════════════════════════════════════

export function loadMachineDiary() {
  return load(DIARY_KEY, [])
}

export function addDiaryEntry(machineName, venueName, venueSuburb) {
  const diary = loadMachineDiary()
  // Check for existing claim
  const existing = diary.find(
    d => d.machineName === machineName && d.venueName === venueName
  )
  if (existing) return { diary, existing: true }

  const entry = {
    id: `md-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    machineName,
    venueName,
    venueSuburb: venueSuburb || '',
    nickname: `My ${machineName}`,
    claimedAt: Date.now(),
    sessions: 0,
    totalSpins: 0,
    totalWins: 0,
    totalBet: 0,
    bonuses: 0,
    biggestWin: 0,
    notes: '',
    rating: 0, // 0-5 stars
    luckyScore: 50, // 0-100
  }
  diary.push(entry)
  save(DIARY_KEY, diary.slice(-50)) // Max 50 machines
  return { diary: diary.slice(-50), existing: false }
}

export function updateDiaryEntry(entryId, updates) {
  const diary = loadMachineDiary()
  const entry = diary.find(d => d.id === entryId)
  if (!entry) return diary
  Object.assign(entry, updates)
  save(DIARY_KEY, diary)
  return diary
}

export function recordDiarySpin(machineName, venueName, spin) {
  const diary = loadMachineDiary()
  const entry = diary.find(
    d => d.machineName === machineName && d.venueName === venueName
  )
  if (!entry) return diary

  entry.totalSpins += 1
  entry.totalWins += (spin.winAmount || 0)
  entry.totalBet += (spin.betAmount || 0)
  if (spin.bonusHit) entry.bonuses += 1
  if ((spin.winAmount || 0) > entry.biggestWin) entry.biggestWin = spin.winAmount || 0

  // Recalculate lucky score (0-100)
  const rtp = entry.totalBet > 0 ? (entry.totalWins / entry.totalBet) * 100 : 50
  const bonusRate = entry.totalSpins > 0 ? (entry.bonuses / entry.totalSpins) * 100 : 0
  entry.luckyScore = Math.min(100, Math.max(0, Math.round(
    (rtp * 0.5) + (bonusRate * 10 * 0.3) + (entry.biggestWin > 100 ? 20 : entry.biggestWin * 0.2)
  )))
  entry.sessions = (entry.sessions || 0) // sessions tracked separately

  save(DIARY_KEY, diary)
  return diary
}

export function removeDiaryEntry(entryId) {
  const diary = loadMachineDiary().filter(d => d.id !== entryId)
  save(DIARY_KEY, diary)
  return diary
}

// ════════════════════════════════════════
//  VENUE RATINGS & REVIEWS
// ════════════════════════════════════════

const REVIEWS_KEY = 'pokie-venue-reviews'

const REVIEW_CATEGORIES = [
  { key: 'atmosphere', label: 'Atmosphere', emoji: '🎭' },
  { key: 'machines', label: 'Machine Variety', emoji: '🎰' },
  { key: 'food', label: 'Food & Drinks', emoji: '🍔' },
  { key: 'staff', label: 'Staff', emoji: '👤' },
  { key: 'cleanliness', label: 'Cleanliness', emoji: '✨' },
]

export { REVIEW_CATEGORIES }

export function loadReviews() {
  return load(REVIEWS_KEY, [])
}

export function postReview(venueName, venueSuburb, ratings, comment) {
  const profile = getProfile()
  const review = {
    id: `rv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: profile.id,
    userName: profile.name,
    userAvatar: profile.avatar,
    venueName,
    venueSuburb: venueSuburb || '',
    ratings, // { atmosphere: 4, machines: 3, food: 5, staff: 4, cleanliness: 3 }
    overall: Object.values(ratings).length > 0
      ? +(Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1)
      : 0,
    comment: (comment || '').slice(0, 300),
    timestamp: Date.now(),
    helpful: 0,
  }
  const reviews = loadReviews()
  reviews.push(review)
  save(REVIEWS_KEY, reviews.slice(-500))
  return reviews.slice(-500)
}

export function getVenueReviews(venueName) {
  return loadReviews()
    .filter(r => r.venueName === venueName)
    .sort((a, b) => b.timestamp - a.timestamp)
}

export function getVenueAverageRating(venueName) {
  const reviews = getVenueReviews(venueName)
  if (reviews.length === 0) return { overall: 0, count: 0, categories: {} }
  const cats = {}
  for (const cat of REVIEW_CATEGORIES) {
    const vals = reviews.map(r => r.ratings[cat.key]).filter(v => v > 0)
    cats[cat.key] = vals.length > 0 ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0
  }
  const overall = +(reviews.reduce((sum, r) => sum + r.overall, 0) / reviews.length).toFixed(1)
  return { overall, count: reviews.length, categories: cats }
}

export function markReviewHelpful(reviewId) {
  const reviews = loadReviews()
  const r = reviews.find(rv => rv.id === reviewId)
  if (r) r.helpful = (r.helpful || 0) + 1
  save(REVIEWS_KEY, reviews)
  return reviews
}

// ════════════════════════════════════════
//  HOT TIP FEED
// ════════════════════════════════════════

const TIPS_KEY = 'pokie-hot-tips'
const TIP_EXPIRY = 2 * 60 * 60 * 1000 // 2 hours

export function loadHotTips() {
  const now = Date.now()
  const tips = load(TIPS_KEY, []).filter(t => t.expiresAt > now)
  save(TIPS_KEY, tips)
  return tips.sort((a, b) => b.timestamp - a.timestamp)
}

export function postHotTip(venueName, machineName, tipText) {
  const profile = getProfile()
  const tip = {
    id: `tip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: profile.id,
    userAvatar: profile.avatar,
    venueName,
    machineName: machineName || '',
    text: (tipText || '').slice(0, 200),
    timestamp: Date.now(),
    expiresAt: Date.now() + TIP_EXPIRY,
    fires: 0,
  }
  const tips = load(TIPS_KEY, [])
  tips.push(tip)
  const active = tips.filter(t => t.expiresAt > Date.now()).slice(-200)
  save(TIPS_KEY, active)
  return active.sort((a, b) => b.timestamp - a.timestamp)
}

export function fireTip(tipId) {
  const tips = load(TIPS_KEY, [])
  const t = tips.find(tp => tp.id === tipId)
  if (t) t.fires = (t.fires || 0) + 1
  save(TIPS_KEY, tips)
  return tips.filter(tp => tp.expiresAt > Date.now()).sort((a, b) => b.timestamp - a.timestamp)
}

// ════════════════════════════════════════
//  WEEKLY WRAP LEADERBOARD
// ════════════════════════════════════════

const WEEKLY_KEY = 'pokie-weekly-wrap'

function getWeekStart() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

export function getWeeklyWrap(spins) {
  const weekStart = getWeekStart()
  const weekSpins = spins.filter(s => s.timestamp >= weekStart || (s.date && new Date(s.date).getTime() >= weekStart))

  const totalSpins = weekSpins.length
  const totalBonuses = weekSpins.filter(s => s.bonusHit).length
  const totalWins = weekSpins.reduce((sum, s) => sum + (s.winAmount || 0), 0)
  const totalBet = weekSpins.reduce((sum, s) => sum + (s.betAmount || 0), 0)
  const biggestWin = weekSpins.reduce((max, s) => Math.max(max, s.winAmount || 0), 0)
  const rtp = totalBet > 0 ? +((totalWins / totalBet) * 100).toFixed(1) : 0
  const netPosition = +(totalWins - totalBet).toFixed(2)
  const venues = new Set(weekSpins.map(s => s.venueName).filter(Boolean))
  const machines = new Set(weekSpins.map(s => s.machineName).filter(Boolean))

  // Per-machine breakdown
  const byMachine = {}
  for (const s of weekSpins) {
    const m = s.machineName || 'Unknown'
    if (!byMachine[m]) byMachine[m] = { spins: 0, wins: 0, bonuses: 0, biggestWin: 0 }
    byMachine[m].spins++
    byMachine[m].wins += (s.winAmount || 0)
    if (s.bonusHit) byMachine[m].bonuses++
    if ((s.winAmount || 0) > byMachine[m].biggestWin) byMachine[m].biggestWin = s.winAmount
  }

  const topMachines = Object.entries(byMachine)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10)

  return {
    weekStart,
    weekStartStr: new Date(weekStart).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    totalSpins,
    totalBonuses,
    totalWins: +totalWins.toFixed(2),
    totalBet: +totalBet.toFixed(2),
    biggestWin,
    rtp,
    netPosition,
    venueCount: venues.size,
    machineCount: machines.size,
    topMachines,
  }
}

// ════════════════════════════════════════
//  POKIE BINGO CARD
// ════════════════════════════════════════

const BINGO_KEY = 'pokie-bingo'

function generateBingoCard() {
  const now = new Date()
  const weekId = `${now.getFullYear()}-W${Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)}-${now.getMonth()}`

  const allTasks = [
    { id: 'b1', text: 'Hit a bonus on a Monday', emoji: '📅' },
    { id: 'b2', text: 'Play 3 different brands', emoji: '🎰' },
    { id: 'b3', text: 'Stay under budget', emoji: '🛡️' },
    { id: 'b4', text: 'Win $50+ in one spin', emoji: '💰' },
    { id: 'b5', text: 'Log 20 spins in a day', emoji: '🔄' },
    { id: 'b6', text: 'Check in at a venue', emoji: '📍' },
    { id: 'b7', text: 'Play Dragon Link', emoji: '🐉' },
    { id: 'b8', text: 'Play Lightning Link', emoji: '⚡' },
    { id: 'b9', text: 'Hit 3 bonuses in a session', emoji: '⭐' },
    { id: 'b10', text: 'Visit 2 venues in a day', emoji: '🗺️' },
    { id: 'b11', text: 'Win more than you bet', emoji: '📈' },
    { id: 'b12', text: 'Post a hot tip', emoji: '💡' },
    { id: 'b13', text: 'Log a spin after 6pm', emoji: '🌙' },
    { id: 'b14', text: 'Send a chat message', emoji: '💬' },
    { id: 'b15', text: 'Cheer someone\'s win', emoji: '🎉' },
    { id: 'b16', text: 'Log spins at 3 venues', emoji: '📍' },
    { id: 'b17', text: 'Hit a bonus on a weekend', emoji: '🎊' },
    { id: 'b18', text: 'Maintain a 3-day streak', emoji: '🔥' },
    { id: 'b19', text: 'Rate a venue', emoji: '⭐' },
    { id: 'b20', text: 'Play for under 30 mins', emoji: '⏱️' },
    { id: 'b21', text: 'Log 50 spins this week', emoji: '💯' },
    { id: 'b22', text: 'Win on the first spin', emoji: '🍀' },
    { id: 'b23', text: 'Try a new machine brand', emoji: '🆕' },
    { id: 'b24', text: 'Walk away up (positive)', emoji: '🚶' },
    { id: 'b25', text: 'Complete a cool-off break', emoji: '🧊' },
  ]

  // Seeded shuffle based on weekId
  let seed = 0
  for (let i = 0; i < weekId.length; i++) seed = ((seed << 5) - seed + weekId.charCodeAt(i)) | 0
  const shuffled = [...allTasks]
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const j = seed % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 5×5 grid, center is FREE
  const grid = shuffled.slice(0, 24)
  grid.splice(12, 0, { id: 'free', text: 'FREE', emoji: '🌟', completed: true })

  return {
    weekId,
    grid: grid.map((t, i) => ({ ...t, completed: t.id === 'free', index: i })),
    createdAt: Date.now(),
  }
}

export function loadBingoCard() {
  const data = load(BINGO_KEY, null)
  const current = generateBingoCard()

  if (!data || data.weekId !== current.weekId) {
    // New week — generate fresh card
    save(BINGO_KEY, current)
    return current
  }
  return data
}

export function completeBingoTask(taskId) {
  const card = loadBingoCard()
  const cell = card.grid.find(g => g.id === taskId)
  if (cell) cell.completed = true
  save(BINGO_KEY, card)
  return card
}

export function checkBingoWins(card) {
  const g = card.grid
  const wins = []

  // Rows (5)
  for (let r = 0; r < 5; r++) {
    if (g.slice(r * 5, r * 5 + 5).every(c => c.completed)) {
      wins.push({ type: 'row', index: r, label: `Row ${r + 1}` })
    }
  }
  // Columns (5)
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every(r => g[r * 5 + c].completed)) {
      wins.push({ type: 'col', index: c, label: `Column ${c + 1}` })
    }
  }
  // Diagonals
  if ([0, 6, 12, 18, 24].every(i => g[i].completed)) {
    wins.push({ type: 'diag', index: 0, label: 'Diagonal ↘' })
  }
  if ([4, 8, 12, 16, 20].every(i => g[i].completed)) {
    wins.push({ type: 'diag', index: 1, label: 'Diagonal ↙' })
  }
  // Full card
  if (g.every(c => c.completed)) {
    wins.push({ type: 'full', index: 0, label: 'FULL CARD!' })
  }

  return wins
}

// ════════════════════════════════════════
//  SHOULD I STAY OR GO METER
// ════════════════════════════════════════

export function calculateStayOrGo(sessionData) {
  // sessionData: { timeMinutes, budgetPercent, netPosition, totalBet, spins, bonuses }
  const {
    timeMinutes = 0,
    budgetPercent = 0,
    netPosition = 0,
    totalBet = 0,
    spins = 0,
    bonuses = 0,
  } = sessionData || {}

  let score = 50 // Neutral

  // Time factor: longer = more reason to go (-2 per 10 min after 30)
  if (timeMinutes > 30) score -= Math.min(20, Math.floor((timeMinutes - 30) / 10) * 2)
  if (timeMinutes < 15) score += 5

  // Budget factor: higher % = more reason to go (-3 per 10% over 50%)
  if (budgetPercent > 50) score -= Math.min(25, Math.floor((budgetPercent - 50) / 10) * 3)
  if (budgetPercent > 90) score -= 15 // Hard penalty near budget
  if (budgetPercent < 30) score += 10

  // Net position factor
  if (netPosition > 0) score += Math.min(15, Math.floor(netPosition / 50) * 3)
  if (netPosition < 0) score -= Math.min(15, Math.floor(Math.abs(netPosition) / 50) * 2)

  // Bonus drought factor
  const spinsSinceBonus = spins > 0 && bonuses > 0
    ? Math.max(0, spins - (spins / bonuses) * bonuses)
    : spins
  if (spinsSinceBonus > 100) score -= 10
  if (spinsSinceBonus > 200) score -= 10

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score))

  let verdict, emoji, color, message
  if (score >= 70) {
    verdict = 'STAY'
    emoji = '😎'
    color = '#22c55e'
    message = 'You\'re having a good run. Enjoy it!'
  } else if (score >= 50) {
    verdict = 'MAYBE'
    emoji = '🤔'
    color = '#f59e0b'
    message = 'Could go either way. Check your gut.'
  } else if (score >= 30) {
    verdict = 'THINK ABOUT IT'
    emoji = '😬'
    color = '#f97316'
    message = 'Might be time to wind down.'
  } else {
    verdict = 'GO'
    emoji = '🚶'
    color = '#ef4444'
    message = 'Walk away while you can. Come back fresh!'
  }

  return { score, verdict, emoji, color, message }
}

// ════════════════════════════════════════
//  MATE MODE (BUDDY SYSTEM)
// ════════════════════════════════════════

const MATE_KEY = 'pokie-mate-mode'

export function loadMateMode() {
  return load(MATE_KEY, {
    enabled: false,
    myCode: '',
    mateCode: '',
    mateName: '',
    mateLinked: false,
    alerts: [],
  })
}

export function setupMateMode() {
  const profile = getProfile()
  const data = loadMateMode()
  if (!data.myCode) {
    data.myCode = `PA-MATE-${profile.id.slice(0, 8).toUpperCase()}`
  }
  data.enabled = true
  save(MATE_KEY, data)
  return data
}

export function linkMate(mateCode) {
  const data = loadMateMode()
  if (!mateCode || mateCode === data.myCode) return data
  data.mateCode = mateCode
  data.mateName = `Mate ${mateCode.slice(-4)}`
  data.mateLinked = true
  save(MATE_KEY, data)
  return data
}

export function sendMateAlert(alertType, details) {
  const data = loadMateMode()
  if (!data.enabled) return data
  const alert = {
    id: `ma-${Date.now()}`,
    type: alertType, // 'budget_hit', 'long_session', 'big_loss'
    details: details || '',
    timestamp: Date.now(),
    seen: false,
  }
  data.alerts.push(alert)
  data.alerts = data.alerts.slice(-50)
  save(MATE_KEY, data)
  return data
}

export function getMateAlerts() {
  const data = loadMateMode()
  return data.alerts.filter(a => !a.seen).sort((a, b) => b.timestamp - a.timestamp)
}

export function dismissMateAlert(alertId) {
  const data = loadMateMode()
  const alert = data.alerts.find(a => a.id === alertId)
  if (alert) alert.seen = true
  save(MATE_KEY, data)
  return data
}

export function disableMateMode() {
  const data = loadMateMode()
  data.enabled = false
  data.mateLinked = false
  data.mateCode = ''
  save(MATE_KEY, data)
  return data
}

// ════════════════════════════════════════
//  PUSH NOTIFICATION HOOKS
// ════════════════════════════════════════

const NOTIF_KEY = 'pokie-notifications'

export function loadNotificationPrefs() {
  return load(NOTIF_KEY, {
    enabled: false,
    permission: 'default',
    weeklyWrap: true,
    machineAlerts: true,
    streakReminder: true,
    eventReminder: true,
    mateAlerts: true,
  })
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { enabled: false, permission: 'denied' }
  }

  const permission = await Notification.requestPermission()
  const prefs = loadNotificationPrefs()
  prefs.permission = permission
  prefs.enabled = permission === 'granted'
  save(NOTIF_KEY, prefs)
  return prefs
}

export function sendLocalNotification(title, body, tag) {
  const prefs = loadNotificationPrefs()
  if (!prefs.enabled || typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  try {
    const n = new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/favicon-32x32.png',
      tag: tag || 'pokie-analyzer',
      silent: false,
    })
    // Auto-close after 8 seconds
    setTimeout(() => n.close(), 8000)
  } catch {
    // SW notifications fallback
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          tag: tag || 'pokie-analyzer',
        })
      })
    }
  }
}

export function updateNotificationPref(key, value) {
  const prefs = loadNotificationPrefs()
  prefs[key] = value
  save(NOTIF_KEY, prefs)
  return prefs
}

export function checkAndSendScheduledNotifications() {
  const prefs = loadNotificationPrefs()
  if (!prefs.enabled) return

  const lastCheck = localStorage.getItem('pokie-notif-last-check')
  const now = Date.now()
  if (lastCheck && now - parseInt(lastCheck, 10) < 60 * 60 * 1000) return // Max once per hour
  localStorage.setItem('pokie-notif-last-check', now.toString())

  // Streak reminder
  if (prefs.streakReminder) {
    const streak = loadStreakData()
    const today = new Date().toISOString().slice(0, 10)
    if (streak.lastCheckIn !== today && streak.currentStreak > 0) {
      sendLocalNotification(
        '🔥 Keep Your Streak!',
        `You're on a ${streak.currentStreak}-day streak! Open the app to keep it alive.`,
        'streak-reminder'
      )
    }
  }

  // Weekly wrap (Monday after 10am)
  if (prefs.weeklyWrap) {
    const now2 = new Date()
    if (now2.getDay() === 1 && now2.getHours() >= 10) {
      const lastWrapNotif = localStorage.getItem('pokie-notif-weekly')
      const thisWeek = getWeekStart().toString()
      if (lastWrapNotif !== thisWeek) {
        sendLocalNotification(
          '📊 Weekly Wrap is Ready!',
          'Check out your stats from last week.',
          'weekly-wrap'
        )
        localStorage.setItem('pokie-notif-weekly', thisWeek)
      }
    }
  }

  // Mate alerts
  if (prefs.mateAlerts) {
    const mateAlerts = getMateAlerts()
    if (mateAlerts.length > 0) {
      sendLocalNotification(
        '🤝 Mate Alert!',
        mateAlerts[0].details || 'Your mate needs a check-in.',
        'mate-alert'
      )
    }
  }
}

// ════════════════════════════════════════
//  VENUE FINDER (DISTANCE CALC)
// ════════════════════════════════════════

export function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return +(R * c).toFixed(1)
}

export function sortVenuesByDistance(venues, userLat, userLon) {
  return venues
    .filter(v => v.lat && v.lon)
    .map(v => ({
      ...v,
      distance: calculateDistance(userLat, userLon, v.lat, v.lon),
    }))
    .sort((a, b) => a.distance - b.distance)
}
