/**
 * Chat Moderation Engine — AI-driven keyword filtering & report system.
 *
 * Filters harassment, loan-sharking solicitation, anti-social language,
 * and predatory behaviour from chat messages.
 *
 * Uses multi-layer detection:
 *  1. Exact banned phrases
 *  2. Regex patterns for obfuscated variants
 *  3. Category scoring for contextual flags
 */

const REPORTS_KEY = 'pokie-chat-reports'

// ─── Banned phrase categories ───

const HARASSMENT = [
  'kill yourself', 'kys', 'go die', 'neck yourself', 'end yourself',
  'stupid idiot', 'dumb bitch', 'fat ugly', 'retard', 'retarded',
  'shut the fuck up', 'stfu', 'piece of shit', 'worthless',
  'no one likes you', 'nobody loves you', 'loser',
]

const LOAN_SHARKING = [
  'i can lend', 'need a loan', 'borrow money', 'quick cash',
  'payday loan', 'i\'ll front you', 'interest rate', 'pay me back',
  'venmo me', 'cashapp me', 'send money', 'wire transfer',
  'western union', 'money transfer', 'lending money', 'loan shark',
  'pay weekly', 'easy repayments', 'no credit check', 'dm me for cash',
  'message me for money', 'i can help with cash',
]

const PREDATORY = [
  'where are you playing', 'what venue are you at', 'which club',
  'which pub', 'come meet me', 'meet up', 'what\'s your address',
  'where do you live', 'follow me', 'i\'m watching you',
  'i know where', 'i found you', 'real name', 'phone number',
  'facebook', 'instagram handle', 'snapchat', 'tiktok name',
  'give me your number', 'what suburb',
]

const ANTISOCIAL = [
  'fuck off', 'piss off', 'go away loser', 'eat shit',
  'you suck', 'trash player', 'waste of space', 'pathetic',
  'scam', 'rigged app', 'ponzi', 'pyramid scheme',
]

// ─── Regex patterns for obfuscated variants ───

const OBFUSCATION_PATTERNS = [
  /k+[\s._-]*y+[\s._-]*s+/i,                      // k.y.s variations
  /f+[\s._-]*u+[\s._-]*c+[\s._-]*k/i,             // f.u.c.k
  /s+[\s._-]*h+[\s._-]*[i1]+[\s._-]*t/i,          // s.h.i.t
  /b+[\s._-]*[i1]+[\s._-]*t+[\s._-]*c+[\s._-]*h/i, // b.i.t.c.h
  /n+[\s._-]*[i1]+[\s._-]*g+/i,                    // racial slur patterns
  /r+[\s._-]*e+[\s._-]*t+[\s._-]*a+[\s._-]*r+[\s._-]*d/i,
  /wh[o0]re/i,
  /sl[u0]t/i,
]

// ─── Moderation function ───

/**
 * Checks a message for policy violations.
 * Returns { allowed, reason, category } where:
 *   - allowed: boolean
 *   - reason: human-readable explanation (if blocked)
 *   - category: 'harassment'|'loan_sharking'|'predatory'|'antisocial'|'obfuscated'|null
 */
export function moderateMessage(text) {
  if (!text || typeof text !== 'string') {
    return { allowed: false, reason: 'Empty message', category: null }
  }

  const lower = text.toLowerCase().trim()

  // 1. Check exact banned phrases
  for (const phrase of HARASSMENT) {
    if (lower.includes(phrase)) {
      return {
        allowed: false,
        reason: 'Message blocked: harassment or abusive language detected.',
        category: 'harassment',
      }
    }
  }

  for (const phrase of LOAN_SHARKING) {
    if (lower.includes(phrase)) {
      return {
        allowed: false,
        reason: 'Message blocked: financial solicitation is not permitted.',
        category: 'loan_sharking',
      }
    }
  }

  for (const phrase of PREDATORY) {
    if (lower.includes(phrase)) {
      return {
        allowed: false,
        reason: 'Message blocked: sharing or requesting personal/location info is prohibited.',
        category: 'predatory',
      }
    }
  }

  for (const phrase of ANTISOCIAL) {
    if (lower.includes(phrase)) {
      return {
        allowed: false,
        reason: 'Message blocked: anti-social language detected.',
        category: 'antisocial',
      }
    }
  }

  // 2. Check obfuscation patterns
  for (const pattern of OBFUSCATION_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        allowed: false,
        reason: 'Message blocked: inappropriate content detected.',
        category: 'obfuscated',
      }
    }
  }

  return { allowed: true, reason: null, category: null }
}

// ─── Sanitise display text (light cleanup) ───

export function sanitiseText(text) {
  if (!text) return ''
  // Strip excessive whitespace
  return text.replace(/\s{3,}/g, '  ').trim()
}

// ─── Report User system ───

export function loadReports() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(REPORTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveReports(reports) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(-500)))
}

/**
 * File a report against a user.
 * @param {string} reportedUserId
 * @param {string} reportedUserName
 * @param {string} messageId - the offending message ID
 * @param {string} reason - reporter's description
 */
export function reportUser(reportedUserId, reportedUserName, messageId, reason) {
  const reports = loadReports()

  // Prevent duplicate reports for same message from same reporter
  const profile = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('pokie-community-profile') || '{}')
    : {}
  const existing = reports.find(r =>
    r.messageId === messageId && r.reporterId === (profile.id || 'unknown')
  )
  if (existing) return { success: false, reason: 'Already reported' }

  const report = {
    id: `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    reporterId: profile.id || 'unknown',
    reportedUserId,
    reportedUserName,
    messageId,
    reason: (reason || '').slice(0, 200),
    timestamp: Date.now(),
    status: 'pending',
  }
  reports.push(report)
  saveReports(reports)
  return { success: true, reportId: report.id }
}

/**
 * Check if a user has been reported multiple times (auto-flag threshold).
 */
export function getUserReportCount(userId) {
  const reports = loadReports()
  return reports.filter(r => r.reportedUserId === userId).length
}

export const MODERATION_CATEGORIES = {
  harassment: { label: 'Harassment', emoji: '🚫', color: '#ef4444' },
  loan_sharking: { label: 'Financial Solicitation', emoji: '💸', color: '#f97316' },
  predatory: { label: 'Privacy Violation', emoji: '👁️', color: '#a855f7' },
  antisocial: { label: 'Anti-social', emoji: '⚠️', color: '#eab308' },
  obfuscated: { label: 'Inappropriate Content', emoji: '🔇', color: '#ef4444' },
}
