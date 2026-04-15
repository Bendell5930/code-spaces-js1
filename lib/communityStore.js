/**
 * Community data store — localStorage-based persistence for chat,
 * recent wins feed, and leaderboard.
 *
 * Each user gets a random fun nickname on first visit.
 * All data lives in localStorage so it works offline.
 */

const CHAT_KEY = 'pokie-community-chat'
const WINS_KEY = 'pokie-community-wins'
const PROFILE_KEY = 'pokie-community-profile'

// ─── Fun nickname generator ───
const ADJECTIVES = [
  'Lucky', 'Golden', 'Wild', 'Royal', 'Diamond', 'Blazing', 'Thunder',
  'Mystic', 'Mega', 'Turbo', 'Neon', 'Cosmic', 'Electric', 'Rapid',
  'Shadow', 'Jolly', 'Daring', 'Bold', 'Slick', 'Fierce',
]
const NOUNS = [
  'Spinner', 'Dragon', 'Phoenix', 'Tiger', 'Panther', 'Ace', 'Baron',
  'Legend', 'Hawk', 'Wolf', 'Shark', 'Wizard', 'Ninja', 'Maverick',
  'Raider', 'Hustler', 'Boss', 'King', 'Chief', 'Champ',
]

const AVATARS = ['🐉', '🔥', '⚡', '💎', '🎰', '🦁', '🐺', '🦅', '🎲', '🏆',
  '🃏', '👑', '🐍', '🦈', '🌟', '💰', '🎯', '🍀', '🐅', '🦊']

const REACTIONS = ['🔥', '💰', '🎉', '👏', '🍀', '😮']

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Profile ───

export function getProfile() {
  if (typeof window === 'undefined') return { name: 'Guest', avatar: '🎰', joined: Date.now() }
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }

  // First visit — generate profile
  const profile = {
    id: crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${randomFrom(ADJECTIVES)}${randomFrom(NOUNS)}${Math.floor(Math.random() * 99)}`,
    avatar: randomFrom(AVATARS),
    joined: Date.now(),
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

export function updateProfile(updates) {
  const current = getProfile()
  const updated = { ...current, ...updates }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
  return updated
}

// ─── Chat messages ───

export function loadChat() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveChat(messages) {
  // Keep last 200 messages
  const trimmed = messages.slice(-200)
  localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed))
}

export function postMessage(text) {
  const profile = getProfile()
  const msg = {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: profile.id,
    userName: profile.name,
    userAvatar: profile.avatar,
    text: text.trim(),
    timestamp: Date.now(),
    reactions: {},
  }
  const messages = loadChat()
  messages.push(msg)
  saveChat(messages)
  return messages
}

export function addReaction(messageId, emoji) {
  const messages = loadChat()
  const msg = messages.find((m) => m.id === messageId)
  if (!msg) return messages
  if (!msg.reactions) msg.reactions = {}
  msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1
  saveChat(messages)
  return messages
}

// ─── Recent Wins Feed ───

export function loadWinsFeed() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(WINS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function postWin(spin) {
  const profile = getProfile()
  const win = {
    id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: profile.id,
    userName: profile.name,
    userAvatar: profile.avatar,
    machineName: spin.machineName || 'Unknown',
    winAmount: spin.winAmount || 0,
    betAmount: spin.betAmount || 0,
    bonusHit: spin.bonusHit || false,
    multiplier: spin.betAmount > 0 ? +(spin.winAmount / spin.betAmount).toFixed(1) : 0,
    location: spin.location || null,
    timestamp: Date.now(),
    cheers: 0,
  }
  const feed = loadWinsFeed()
  feed.push(win)
  // Keep last 100 wins
  const trimmed = feed.slice(-100)
  localStorage.setItem(WINS_KEY, JSON.stringify(trimmed))
  return trimmed
}

export function cheerWin(winId) {
  const feed = loadWinsFeed()
  const win = feed.find((w) => w.id === winId)
  if (!win) return feed
  win.cheers = (win.cheers || 0) + 1
  localStorage.setItem(WINS_KEY, JSON.stringify(feed))
  return feed
}

// ─── Leaderboard computation ───

export function buildLeaderboard(spins) {
  const byUser = {}

  // Aggregate from spins
  for (const s of spins) {
    const key = 'you' // single-user, but structured for future multi-user
    if (!byUser[key]) {
      const profile = getProfile()
      byUser[key] = {
        userId: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        totalSpins: 0,
        totalWins: 0,
        totalBet: 0,
        biggestWin: 0,
        bonuses: 0,
        streak: 0,
        currentStreak: 0,
        machinesPlayed: new Set(),
        location: null,
      }
    }
    const u = byUser[key]
    u.totalSpins++
    u.totalWins += (s.winAmount || 0)
    u.totalBet += (s.betAmount || 0)
    if ((s.winAmount || 0) > u.biggestWin) u.biggestWin = s.winAmount
    if (s.bonusHit) u.bonuses++
    if (s.location && !u.location) u.location = s.location
    if ((s.winAmount || 0) > 0) {
      u.currentStreak++
      if (u.currentStreak > u.streak) u.streak = u.currentStreak
    } else {
      u.currentStreak = 0
    }
    if (s.machineName) u.machinesPlayed.add(s.machineName)
  }

  // Also pull wins from the community feed to simulate other players
  const feed = loadWinsFeed()
  for (const w of feed) {
    if (byUser[w.userId]) continue
    if (!byUser[w.userId]) {
      byUser[w.userId] = {
        userId: w.userId,
        name: w.userName,
        avatar: w.userAvatar,
        totalSpins: 0,
        totalWins: 0,
        totalBet: 0,
        biggestWin: 0,
        bonuses: 0,
        streak: 0,
        currentStreak: 0,
        machinesPlayed: new Set(),
        location: null,
      }
    }
    const u = byUser[w.userId]
    u.totalSpins++
    u.totalWins += (w.winAmount || 0)
    u.totalBet += (w.betAmount || 0)
    if ((w.winAmount || 0) > u.biggestWin) u.biggestWin = w.winAmount
    if (w.bonusHit) u.bonuses++
    if (w.machineName) u.machinesPlayed.add(w.machineName)
    if (w.location && !u.location) u.location = w.location
  }

  return Object.values(byUser)
    .map((u) => ({
      ...u,
      machinesPlayed: u.machinesPlayed.size,
      roi: u.totalBet > 0 ? +(((u.totalWins - u.totalBet) / u.totalBet) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.totalWins - a.totalWins)
}

// ─── Badges system ───

export function getBadges(stats) {
  const badges = []
  if (stats.totalSpins >= 100) badges.push({ emoji: '💯', label: 'Century Spinner' })
  if (stats.totalSpins >= 500) badges.push({ emoji: '🏅', label: 'Spin Master' })
  if (stats.biggestWin >= 100) badges.push({ emoji: '💎', label: 'Big Winner' })
  if (stats.biggestWin >= 500) badges.push({ emoji: '👑', label: 'Jackpot Royal' })
  if (stats.bonuses >= 10)  badges.push({ emoji: '⭐', label: 'Bonus Hunter' })
  if (stats.bonuses >= 50)  badges.push({ emoji: '🌟', label: 'Bonus King' })
  if (stats.streak >= 5)    badges.push({ emoji: '🔥', label: 'Hot Streak' })
  if (stats.streak >= 10)   badges.push({ emoji: '☄️', label: 'On Fire' })
  if (stats.machinesPlayed >= 5)  badges.push({ emoji: '🎰', label: 'Explorer' })
  if (stats.machinesPlayed >= 9)  badges.push({ emoji: '🗺️', label: 'Globetrotter' })
  if (stats.roi > 0)        badges.push({ emoji: '📈', label: 'In Profit' })
  if (stats.totalSpins >= 1) badges.push({ emoji: '🎲', label: 'First Spin' })
  return badges
}

export function getRank(totalWins) {
  if (totalWins >= 10000) return { title: 'Diamond', emoji: '💎', color: '#38bdf8' }
  if (totalWins >= 5000) return { title: 'Platinum', emoji: '🏆', color: '#e2e8f0' }
  if (totalWins >= 1000) return { title: 'Gold', emoji: '🥇', color: '#fbbf24' }
  if (totalWins >= 500) return { title: 'Silver', emoji: '🥈', color: '#94a3b8' }
  if (totalWins >= 100) return { title: 'Bronze', emoji: '🥉', color: '#d97706' }
  return { title: 'Rookie', emoji: '🎲', color: '#64748b' }
}

export { REACTIONS }
