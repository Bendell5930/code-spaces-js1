/**
 * Community data store — localStorage cache backed by Supabase.
 *
 * Strategy: localStorage stays the synchronous source of truth that all
 * existing callers read from (`getProfile`, `loadChat`, `loadWinsFeed`,
 * `buildLeaderboard`). On every mutation we also write through to Supabase,
 * and on first import (in the browser) we hydrate the local cache from
 * Supabase and subscribe to Realtime updates so other browsers' messages
 * and wins land in this user's view automatically.
 *
 * If `lib/supabaseClient.js` returns `null` (env vars unset), the module
 * falls back to local-only behaviour so the app keeps working offline /
 * in CI / in test environments. Every Supabase call is wrapped so a
 * network error never breaks the synchronous local API.
 */

import { supabase } from './supabaseClient'

const CHAT_KEY = 'pokie-community-chat'
const WINS_KEY = 'pokie-community-wins'
const PROFILE_KEY = 'pokie-community-profile'

const CHAT_LIMIT = 200
const WINS_LIMIT = 100

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

function isBrowser() {
  return typeof window !== 'undefined'
}

function safeLocalGet(key) {
  if (!isBrowser()) return null
  try { return localStorage.getItem(key) } catch { return null }
}

function safeLocalSet(key, value) {
  if (!isBrowser()) return
  try { localStorage.setItem(key, value) } catch { /* quota / ssr */ }
}

// Fire-and-forget Supabase calls — never throw; never block the sync API.
function fireAndForget(promise) {
  if (!promise || typeof promise.then !== 'function') return
  promise.then((res) => {
    if (res && res.error) {
      console.warn('[communityStore] Supabase write failed:', res.error.message)
    }
  }).catch((err) => {
    console.warn('[communityStore] Supabase write error:', err && err.message)
  })
}

function emitUpdate(kind) {
  if (!isBrowser()) return
  try {
    window.dispatchEvent(new CustomEvent('pokie-community-update', { detail: { kind } }))
  } catch { /* ignore */ }
}

// ─── Profile ───

export function getProfile() {
  if (!isBrowser()) return { name: 'Guest', avatar: '🎰', joined: Date.now() }
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
  safeLocalSet(PROFILE_KEY, JSON.stringify(profile))
  // Push the new profile to Supabase so leaderboards / chat can resolve it.
  upsertProfileRemote(profile)
  return profile
}

export function updateProfile(updates) {
  const current = getProfile()
  const updated = { ...current, ...updates }
  safeLocalSet(PROFILE_KEY, JSON.stringify(updated))
  upsertProfileRemote(updated)
  return updated
}

function upsertProfileRemote(profile) {
  if (!supabase || !profile || !profile.id) return
  // Profiles are keyed by the client-supplied UUID. Only persist UUID-shaped
  // ids — earlier installs may have non-UUID fallback ids.
  if (!/^[0-9a-f-]{32,36}$/i.test(profile.id)) return
  fireAndForget(
    supabase.from('community_profiles').upsert({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      joined: new Date(profile.joined || Date.now()).toISOString(),
    }, { onConflict: 'id' })
  )
}

// ─── Chat messages ───

export function loadChat() {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveChat(messages) {
  // Keep last CHAT_LIMIT messages
  const trimmed = messages.slice(-CHAT_LIMIT)
  safeLocalSet(CHAT_KEY, JSON.stringify(trimmed))
}

function chatRowToMessage(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.name,
    userAvatar: row.avatar,
    text: row.text,
    timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    reactions: row.reactions || {},
  }
}

function mergeChat(existing, incoming) {
  const byId = new Map()
  for (const m of existing) byId.set(m.id, m)
  for (const m of incoming) byId.set(m.id, { ...byId.get(m.id), ...m })
  return Array.from(byId.values())
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .slice(-CHAT_LIMIT)
}

export function postMessage(text) {
  const profile = getProfile()
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const msg = {
    id,
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
  if (supabase) {
    fireAndForget(
      supabase.from('community_chat').insert({
        id: msg.id,
        user_id: msg.userId,
        name: msg.userName,
        avatar: msg.userAvatar,
        text: msg.text,
        reactions: msg.reactions,
        created_at: new Date(msg.timestamp).toISOString(),
      })
    )
  }
  return messages
}

export function addReaction(messageId, emoji) {
  const messages = loadChat()
  const msg = messages.find((m) => m.id === messageId)
  if (!msg) return messages
  if (!msg.reactions) msg.reactions = {}
  msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1
  saveChat(messages)
  if (supabase) {
    fireAndForget(
      supabase.from('community_chat')
        .update({ reactions: msg.reactions })
        .eq('id', messageId)
    )
  }
  return messages
}

// ─── Recent Wins Feed ───

export function loadWinsFeed() {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(WINS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function winRowToWin(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.name,
    userAvatar: row.avatar,
    machineName: row.machine || 'Unknown',
    winAmount: Number(row.amount) || 0,
    betAmount: Number(row.bet_amount) || 0,
    bonusHit: !!row.bonus_hit,
    multiplier: Number(row.multiplier) || 0,
    location: row.location || null,
    timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    cheers: Number(row.cheers) || 0,
  }
}

function mergeWins(existing, incoming) {
  const byId = new Map()
  for (const w of existing) byId.set(w.id, w)
  for (const w of incoming) byId.set(w.id, { ...byId.get(w.id), ...w })
  return Array.from(byId.values())
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .slice(-WINS_LIMIT)
}

export function postWin(spin) {
  const profile = getProfile()
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const win = {
    id,
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
  // Keep last WINS_LIMIT wins
  const trimmed = feed.slice(-WINS_LIMIT)
  safeLocalSet(WINS_KEY, JSON.stringify(trimmed))
  if (supabase) {
    fireAndForget(
      supabase.from('community_wins').insert({
        id: win.id,
        user_id: win.userId,
        name: win.userName,
        avatar: win.userAvatar,
        machine: win.machineName,
        amount: win.winAmount,
        bet_amount: win.betAmount,
        multiplier: win.multiplier,
        bonus_hit: win.bonusHit,
        location: win.location,
        cheers: 0,
        created_at: new Date(win.timestamp).toISOString(),
      })
    )
  }
  return trimmed
}

export function cheerWin(winId) {
  const feed = loadWinsFeed()
  const win = feed.find((w) => w.id === winId)
  if (!win) return feed
  win.cheers = (win.cheers || 0) + 1
  safeLocalSet(WINS_KEY, JSON.stringify(feed))
  if (supabase) {
    fireAndForget(
      supabase.from('community_wins')
        .update({ cheers: win.cheers })
        .eq('id', winId)
    )
  }
  return feed
}

// ─── Hydration + Realtime ───
//
// On first import in the browser, pull the latest chat / wins from Supabase
// into the local cache and subscribe to Realtime inserts so other browsers'
// activity appears here. Components don't need to know about this — they
// just keep calling `loadChat()` / `loadWinsFeed()`. They can also opt in
// to live updates by listening to the `pokie-community-update` window event
// or by calling `subscribeChat` / `subscribeWins`.

let hydrated = false

async function hydrateOnce() {
  if (hydrated || !supabase || !isBrowser()) return
  hydrated = true
  try {
    const [chatRes, winsRes] = await Promise.all([
      supabase
        .from('community_chat')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(CHAT_LIMIT),
      supabase
        .from('community_wins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(WINS_LIMIT),
    ])
    if (chatRes && !chatRes.error && Array.isArray(chatRes.data)) {
      const remote = chatRes.data.map(chatRowToMessage)
      const merged = mergeChat(loadChat(), remote)
      safeLocalSet(CHAT_KEY, JSON.stringify(merged))
      emitUpdate('chat')
    }
    if (winsRes && !winsRes.error && Array.isArray(winsRes.data)) {
      const remote = winsRes.data.map(winRowToWin)
      const merged = mergeWins(loadWinsFeed(), remote)
      safeLocalSet(WINS_KEY, JSON.stringify(merged))
      emitUpdate('wins')
    }
  } catch (err) {
    console.warn('[communityStore] hydrate failed:', err && err.message)
  }
}

function startRealtime() {
  if (!supabase || !isBrowser() || !supabase.channel) return
  try {
    supabase
      .channel('community')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_chat' },
        (payload) => {
          const msg = chatRowToMessage(payload.new)
          const merged = mergeChat(loadChat(), [msg])
          safeLocalSet(CHAT_KEY, JSON.stringify(merged))
          emitUpdate('chat')
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'community_chat' },
        (payload) => {
          const msg = chatRowToMessage(payload.new)
          const merged = mergeChat(loadChat(), [msg])
          safeLocalSet(CHAT_KEY, JSON.stringify(merged))
          emitUpdate('chat')
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_wins' },
        (payload) => {
          const win = winRowToWin(payload.new)
          const merged = mergeWins(loadWinsFeed(), [win])
          safeLocalSet(WINS_KEY, JSON.stringify(merged))
          emitUpdate('wins')
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'community_wins' },
        (payload) => {
          const win = winRowToWin(payload.new)
          const merged = mergeWins(loadWinsFeed(), [win])
          safeLocalSet(WINS_KEY, JSON.stringify(merged))
          emitUpdate('wins')
        })
      .subscribe()
  } catch (err) {
    console.warn('[communityStore] realtime subscribe failed:', err && err.message)
  }
}

if (isBrowser() && supabase) {
  // Defer to the next tick so module side-effects don't block import.
  Promise.resolve().then(() => {
    hydrateOnce()
    startRealtime()
  })
}

/**
 * Subscribe to chat updates. Calls `cb(messages)` whenever the local chat
 * cache changes (either from local writes, hydration, or Realtime).
 * Returns an unsubscribe function.
 */
export function subscribeChat(cb) {
  if (!isBrowser() || typeof cb !== 'function') return () => {}
  const handler = (e) => {
    if (!e || !e.detail || e.detail.kind === 'chat') cb(loadChat())
  }
  window.addEventListener('pokie-community-update', handler)
  return () => window.removeEventListener('pokie-community-update', handler)
}

/**
 * Subscribe to wins-feed updates. Calls `cb(feed)` whenever the local wins
 * cache changes. Returns an unsubscribe function.
 */
export function subscribeWins(cb) {
  if (!isBrowser() || typeof cb !== 'function') return () => {}
  const handler = (e) => {
    if (!e || !e.detail || e.detail.kind === 'wins') cb(loadWinsFeed())
  }
  window.addEventListener('pokie-community-update', handler)
  return () => window.removeEventListener('pokie-community-update', handler)
}

// Test-only: reset the hydration latch so unit tests can re-trigger it.
export function _resetForTests() {
  hydrated = false
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
