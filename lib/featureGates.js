/**
 * Feature Gates — defines what's available on each subscription tier.
 *
 * BASIC (free):
 *   - Calculator (manual spin tracking)
 *   - History (last 20 spins only)
 *   - 3 machines selectable
 *
 * PREMIUM (paid subscription):
 *   - Everything in Basic
 *   - AI Scan (camera detection)
 *   - Full History & Graphs (unlimited)
 *   - Heat Map analytics
 *   - Community (chat, wins feed, leaderboard)
 *   - Venue Insights (tracked venues, analytics)
 *   - All machines
 *   - All detection engines
 */

export const PLANS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
}

export const PLAN_DETAILS = {
  [PLANS.BASIC]: {
    name: 'Basic',
    emoji: '🎲',
    price: 'Free',
    color: '#94a3b8',
  },
  [PLANS.PREMIUM]: {
    name: 'Premium',
    emoji: '👑',
    price: '$9/mo',
    color: '#fbbf24',
  },
}

/**
 * Feature keys and their required plan.
 * 'basic' = available to everyone, 'premium' = paid only.
 */
export const FEATURES = {
  LOG_SPIN:       { key: 'log_spin',       plan: PLANS.BASIC,   label: 'Log Spin',             tab: 'entry' },
  CALCULATOR:     { key: 'calculator',     plan: PLANS.BASIC,   label: 'Calculator',            tab: 'calc' },
  HISTORY_BASIC:  { key: 'history_basic',  plan: PLANS.BASIC,   label: 'History (Recent 20)',   tab: 'history' },
  AI_SCAN:        { key: 'ai_scan',        plan: PLANS.PREMIUM, label: 'AI Video Scan',         tab: 'scan' },
  HISTORY_FULL:   { key: 'history_full',   plan: PLANS.PREMIUM, label: 'Full History & Graphs', tab: 'history' },
  HEAT_MAP:       { key: 'heat_map',       plan: PLANS.PREMIUM, label: 'Heat Map Analytics',    tab: 'heat' },
  COMMUNITY:      { key: 'community',      plan: PLANS.PREMIUM, label: 'Community Hub',         tab: 'community' },
  VENUE_INSIGHTS: { key: 'venue_insights', plan: PLANS.PREMIUM, label: 'Venue Insights',        tab: 'venues' },
  VIRAL:          { key: 'viral',          plan: PLANS.PREMIUM, label: 'Viral Features',        tab: 'viral' },
  ALL_MACHINES:   { key: 'all_machines',   plan: PLANS.PREMIUM, label: 'All Machines',          tab: null },
  DETECTION:      { key: 'detection',      plan: PLANS.PREMIUM, label: 'AI Detection Engines',  tab: null },
}

/** Maximum machines a Basic user can select */
export const BASIC_MACHINE_LIMIT = 3

/** Maximum spin history visible to Basic users */
export const BASIC_HISTORY_LIMIT = 20

/**
 * Check if a feature is available for the given plan.
 */
export function canAccess(featureKey, userPlan) {
  const feature = Object.values(FEATURES).find((f) => f.key === featureKey)
  if (!feature) return false
  if (feature.plan === PLANS.BASIC) return true
  return userPlan === PLANS.PREMIUM
}

/**
 * Check if a tab is accessible for the given plan.
 * Returns { allowed, feature } — feature is the gate that blocks it.
 */
export function canAccessTab(tabKey, userPlan) {
  // Tabs available to all
  if (tabKey === 'entry') return { allowed: true, feature: null }
  if (tabKey === 'calc') return { allowed: true, feature: null }
  if (tabKey === 'history') return { allowed: true, feature: null } // basic gets limited view

  // Premium tabs
  const gatedTabs = {
    scan: FEATURES.AI_SCAN,
    heat: FEATURES.HEAT_MAP,
    community: FEATURES.COMMUNITY,
    venues: FEATURES.VENUE_INSIGHTS,
    viral: FEATURES.VIRAL,
  }

  const feature = gatedTabs[tabKey]
  if (!feature) return { allowed: true, feature: null }

  return {
    allowed: userPlan === PLANS.PREMIUM,
    feature,
  }
}

/**
 * Get list of premium-only features for display in paywall.
 */
export function getPremiumFeatures() {
  return Object.values(FEATURES).filter((f) => f.plan === PLANS.PREMIUM)
}
