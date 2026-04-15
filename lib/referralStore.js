/**
 * Referral System
 *
 * Each user gets a unique referral code. When a friend signs up using the code,
 * both the referrer and friend get rewards:
 *
 *   Referrer → 1 free month of Premium per successful referral
 *   Friend   → 7-day free trial of Premium
 *
 * Milestones unlock bonus rewards:
 *   3 referrals  → "Recruiter" badge
 *   5 referrals  → 1 extra free month
 *   10 referrals → "Ambassador" badge + permanent 50% off
 *   25 referrals → "Legend" badge + lifetime Premium
 *
 * All state persisted in localStorage. In production this would be
 * verified server-side with Stripe coupon codes.
 */

const REFERRAL_KEY = 'pokie-referral'

// ─── Generate a short referral code ───
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PA-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ─── Load / Init referral data ───
export function loadReferral() {
  if (typeof window === 'undefined') {
    return { code: '', referrals: [], appliedCode: null, rewards: [] }
  }
  try {
    const raw = localStorage.getItem(REFERRAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }

  const data = {
    code: generateCode(),
    referrals: [],       // { friendName, date, rewarded }
    appliedCode: null,   // code this user entered as a friend
    rewards: [],         // { type, label, date, claimed }
    freeMonthsEarned: 0,
    totalReferrals: 0,
  }
  localStorage.setItem(REFERRAL_KEY, JSON.stringify(data))
  return data
}

function saveReferral(data) {
  localStorage.setItem(REFERRAL_KEY, JSON.stringify(data))
}

// ─── Apply a friend's referral code ───
export function applyReferralCode(code) {
  const data = loadReferral()

  if (data.appliedCode) {
    return { success: false, message: 'You\'ve already used a referral code.' }
  }

  if (code === data.code) {
    return { success: false, message: 'You can\'t use your own code!' }
  }

  if (!code || code.length < 4) {
    return { success: false, message: 'Invalid referral code.' }
  }

  data.appliedCode = code
  data.rewards.push({
    type: 'friend_trial',
    label: '7-Day Premium Trial',
    emoji: '🎁',
    date: Date.now(),
    claimed: true,
  })
  saveReferral(data)

  return { success: true, message: 'Code applied! You\'ve unlocked a 7-day Premium trial.' }
}

// ─── Record a successful referral (when friend subscribes) ───
export function recordReferral(friendName) {
  const data = loadReferral()

  data.referrals.push({
    friendName: friendName || 'A friend',
    date: Date.now(),
    rewarded: true,
  })
  data.totalReferrals = data.referrals.length
  data.freeMonthsEarned += 1

  // Award: 1 free month per referral
  data.rewards.push({
    type: 'free_month',
    label: '1 Month Free Premium',
    emoji: '🎉',
    date: Date.now(),
    claimed: false,
  })

  // Milestone checks
  const count = data.totalReferrals

  if (count === 3) {
    data.rewards.push({
      type: 'badge',
      label: 'Recruiter Badge',
      emoji: '🎖️',
      date: Date.now(),
      claimed: true,
    })
  }

  if (count === 5) {
    data.freeMonthsEarned += 1
    data.rewards.push({
      type: 'free_month',
      label: 'Milestone Bonus: 1 Extra Free Month',
      emoji: '🌟',
      date: Date.now(),
      claimed: false,
    })
  }

  if (count === 10) {
    data.rewards.push({
      type: 'badge',
      label: 'Ambassador Badge',
      emoji: '🏅',
      date: Date.now(),
      claimed: true,
    })
    data.rewards.push({
      type: 'discount',
      label: 'Permanent 50% Off Premium',
      emoji: '💰',
      date: Date.now(),
      claimed: false,
    })
  }

  if (count === 25) {
    data.rewards.push({
      type: 'badge',
      label: 'Legend Badge',
      emoji: '👑',
      date: Date.now(),
      claimed: true,
    })
    data.rewards.push({
      type: 'lifetime',
      label: 'Lifetime Premium',
      emoji: '♾️',
      date: Date.now(),
      claimed: false,
    })
  }

  saveReferral(data)
  return data
}

// ─── Claim a reward ───
export function claimReward(index) {
  const data = loadReferral()
  if (data.rewards[index]) {
    data.rewards[index].claimed = true
  }
  saveReferral(data)
  return data
}

// ─── Milestone definitions for display ───
export const MILESTONES = [
  { count: 1,  label: '1 Free Month per referral',       emoji: '🎁' },
  { count: 3,  label: 'Recruiter Badge',                  emoji: '🎖️' },
  { count: 5,  label: 'Bonus: Extra Free Month',          emoji: '🌟' },
  { count: 10, label: 'Ambassador + 50% Off Forever',     emoji: '🏅' },
  { count: 25, label: 'Legend + Lifetime Premium',         emoji: '👑' },
]

// ─── Get referral badges for a user ───
export function getReferralBadges(totalReferrals) {
  const badges = []
  if (totalReferrals >= 1)  badges.push({ emoji: '🤝', label: 'Referrer' })
  if (totalReferrals >= 3)  badges.push({ emoji: '🎖️', label: 'Recruiter' })
  if (totalReferrals >= 10) badges.push({ emoji: '🏅', label: 'Ambassador' })
  if (totalReferrals >= 25) badges.push({ emoji: '👑', label: 'Legend' })
  return badges
}

// ─── Build share text ───
export function getShareText(code) {
  return `Join me on Pokie Analyzer — the smart slot machine tracker! Use my code ${code} for a free 7-day Premium trial. 🎰🔥`
}
