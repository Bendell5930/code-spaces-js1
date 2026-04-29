/**
 * Unit tests for lib/communityStore.js.
 *
 * The module is browser-first (uses localStorage and crypto.randomUUID)
 * and writes through to Supabase. We stub:
 *   - globalThis.window with an in-memory localStorage
 *   - globalThis.crypto.randomUUID
 *   - lib/supabaseClient (jest.unstable_mockModule) with a chainable mock
 *     that records every call and returns successful empty results.
 *
 * Tests cover:
 *   - profile generation persists locally and is upserted to Supabase
 *   - postMessage / postWin write through to Supabase
 *   - cheerWin / addReaction issue update calls
 *   - subscribeChat / subscribeWins fire on the custom window event
 *   - module degrades to local-only when supabase is null
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'

function makeStorage() {
  const map = new Map()
  return {
    getItem: jest.fn((k) => (map.has(k) ? map.get(k) : null)),
    setItem: jest.fn((k, v) => { map.set(k, String(v)) }),
    removeItem: jest.fn((k) => { map.delete(k) }),
    clear: jest.fn(() => map.clear()),
    _map: map,
  }
}

function makeWindow(localStorage) {
  const listeners = new Map()
  return {
    localStorage,
    addEventListener: jest.fn((event, cb) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event).add(cb)
    }),
    removeEventListener: jest.fn((event, cb) => {
      if (listeners.has(event)) listeners.get(event).delete(cb)
    }),
    dispatchEvent: jest.fn((event) => {
      const set = listeners.get(event.type)
      if (!set) return true
      for (const cb of Array.from(set)) cb(event)
      return true
    }),
    _listeners: listeners,
  }
}

function makeSupabaseMock() {
  const calls = []
  const okResult = { data: [], error: null }
  function record(table, op, args) {
    calls.push({ table, op, args })
    return Promise.resolve(okResult)
  }
  function from(table) {
    const builder = {
      _filters: {},
      _payload: null,
      insert(payload) { return record(table, 'insert', { payload }) },
      upsert(payload, options) { return record(table, 'upsert', { payload, options }) },
      update(payload) {
        builder._payload = payload
        return {
          eq: (col, val) => record(table, 'update', { payload, eq: { col, val } }),
        }
      },
      select() {
        return {
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }
      },
    }
    return builder
  }
  const channel = jest.fn(() => {
    const ch = {
      on: jest.fn(() => ch),
      subscribe: jest.fn(() => ch),
    }
    return ch
  })
  return { client: { from, channel }, calls }
}

let store
let supabaseMock
let win
let localStorage

async function loadStore({ withSupabase = true } = {}) {
  jest.resetModules()
  supabaseMock = makeSupabaseMock()
  jest.unstable_mockModule('../lib/supabaseClient.js', () => ({
    supabase: withSupabase ? supabaseMock.client : null,
    getServiceSupabase: () => null,
  }))
  store = await import('../lib/communityStore.js')
  if (store._resetForTests) store._resetForTests()
}

beforeEach(async () => {
  localStorage = makeStorage()
  win = makeWindow(localStorage)
  globalThis.window = win
  globalThis.localStorage = localStorage
  globalThis.crypto = {
    randomUUID: () => '11111111-2222-3333-4444-555555555555',
  }
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) {
      this.type = type
      this.detail = init && init.detail
    }
  }
  await loadStore({ withSupabase: true })
})

describe('getProfile', () => {
  test('generates a profile on first call and persists locally', () => {
    const p = store.getProfile()
    expect(p.id).toBe('11111111-2222-3333-4444-555555555555')
    expect(typeof p.name).toBe('string')
    expect(typeof p.avatar).toBe('string')
    const stored = JSON.parse(localStorage.getItem('pokie-community-profile'))
    expect(stored.id).toBe(p.id)
  })

  test('returns the same profile on subsequent calls', () => {
    const p1 = store.getProfile()
    const p2 = store.getProfile()
    expect(p2).toEqual(p1)
  })

  test('upserts the new profile to Supabase', async () => {
    store.getProfile()
    // Allow microtasks to flush
    await Promise.resolve()
    const upsertCall = supabaseMock.calls.find(
      (c) => c.table === 'community_profiles' && c.op === 'upsert',
    )
    expect(upsertCall).toBeDefined()
    expect(upsertCall.args.payload.id).toBe('11111111-2222-3333-4444-555555555555')
  })
})

describe('updateProfile', () => {
  test('merges updates and writes through to Supabase', async () => {
    store.getProfile()
    const updated = store.updateProfile({ name: 'NewName' })
    expect(updated.name).toBe('NewName')
    await Promise.resolve()
    const upserts = supabaseMock.calls.filter(
      (c) => c.table === 'community_profiles' && c.op === 'upsert',
    )
    // One on first getProfile, one on update
    expect(upserts.length).toBeGreaterThanOrEqual(2)
    expect(upserts[upserts.length - 1].args.payload.name).toBe('NewName')
  })
})

describe('postMessage', () => {
  test('appends to local cache and inserts to Supabase', async () => {
    const messages = store.postMessage('hello world')
    expect(messages.length).toBe(1)
    expect(messages[0].text).toBe('hello world')
    await Promise.resolve()
    const insert = supabaseMock.calls.find(
      (c) => c.table === 'community_chat' && c.op === 'insert',
    )
    expect(insert).toBeDefined()
    expect(insert.args.payload.text).toBe('hello world')
  })
})

describe('addReaction', () => {
  test('bumps the reaction counter and updates Supabase', async () => {
    const messages = store.postMessage('hi')
    const id = messages[0].id
    const after = store.addReaction(id, '🔥')
    expect(after[0].reactions['🔥']).toBe(1)
    await Promise.resolve()
    const update = supabaseMock.calls.find(
      (c) => c.table === 'community_chat' && c.op === 'update',
    )
    expect(update).toBeDefined()
    expect(update.args.eq.col).toBe('id')
    expect(update.args.eq.val).toBe(id)
  })
})

describe('postWin', () => {
  test('appends to feed and inserts to Supabase', async () => {
    const feed = store.postWin({
      machineName: 'Wolf Treasure', winAmount: 50, betAmount: 1, bonusHit: false,
    })
    expect(feed.length).toBe(1)
    expect(feed[0].machineName).toBe('Wolf Treasure')
    expect(feed[0].multiplier).toBe(50)
    await Promise.resolve()
    const insert = supabaseMock.calls.find(
      (c) => c.table === 'community_wins' && c.op === 'insert',
    )
    expect(insert).toBeDefined()
    expect(insert.args.payload.amount).toBe(50)
  })
})

describe('cheerWin', () => {
  test('increments cheers and updates Supabase', async () => {
    const feed = store.postWin({ machineName: 'X', winAmount: 5, betAmount: 1 })
    const id = feed[0].id
    const after = store.cheerWin(id)
    expect(after[0].cheers).toBe(1)
    await Promise.resolve()
    const update = supabaseMock.calls.find(
      (c) => c.table === 'community_wins' && c.op === 'update',
    )
    expect(update).toBeDefined()
    expect(update.args.eq.val).toBe(id)
  })
})

describe('subscribeChat / subscribeWins', () => {
  test('subscribeChat fires on the chat update event', () => {
    const cb = jest.fn()
    const unsub = store.subscribeChat(cb)
    win.dispatchEvent({ type: 'pokie-community-update', detail: { kind: 'chat' } })
    expect(cb).toHaveBeenCalledTimes(1)
    unsub()
    win.dispatchEvent({ type: 'pokie-community-update', detail: { kind: 'chat' } })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('subscribeWins ignores chat-only events', () => {
    const cb = jest.fn()
    store.subscribeWins(cb)
    win.dispatchEvent({ type: 'pokie-community-update', detail: { kind: 'chat' } })
    expect(cb).not.toHaveBeenCalled()
    win.dispatchEvent({ type: 'pokie-community-update', detail: { kind: 'wins' } })
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('local-only fallback (supabase = null)', () => {
  beforeEach(async () => {
    await loadStore({ withSupabase: false })
  })

  test('postMessage still works without Supabase', () => {
    const msgs = store.postMessage('offline')
    expect(msgs[0].text).toBe('offline')
    expect(supabaseMock.calls.length).toBe(0)
  })

  test('postWin still works without Supabase', () => {
    const feed = store.postWin({ machineName: 'X', winAmount: 1, betAmount: 1 })
    expect(feed[0].machineName).toBe('X')
    expect(supabaseMock.calls.length).toBe(0)
  })
})

describe('buildLeaderboard', () => {
  test('aggregates spins and produces ROI', () => {
    const spins = [
      { winAmount: 10, betAmount: 1, machineName: 'A', bonusHit: false },
      { winAmount: 0, betAmount: 1, machineName: 'A', bonusHit: false },
      { winAmount: 50, betAmount: 1, machineName: 'B', bonusHit: true },
    ]
    const board = store.buildLeaderboard(spins)
    expect(board.length).toBeGreaterThanOrEqual(1)
    const me = board[0]
    expect(me.totalSpins).toBe(3)
    expect(me.totalWins).toBe(60)
    expect(me.bonuses).toBe(1)
    expect(me.machinesPlayed).toBe(2)
    expect(typeof me.roi).toBe('number')
  })
})

describe('getBadges / getRank', () => {
  test('getRank tiers by total wins', () => {
    expect(store.getRank(0).title).toBe('Rookie')
    expect(store.getRank(150).title).toBe('Bronze')
    expect(store.getRank(750).title).toBe('Silver')
    expect(store.getRank(2000).title).toBe('Gold')
    expect(store.getRank(6000).title).toBe('Platinum')
    expect(store.getRank(20000).title).toBe('Diamond')
  })

  test('getBadges returns badges for thresholds', () => {
    const stats = {
      totalSpins: 600, biggestWin: 600, bonuses: 60, streak: 12,
      machinesPlayed: 10, roi: 5,
    }
    const badges = store.getBadges(stats)
    const labels = badges.map((b) => b.label)
    expect(labels).toContain('Spin Master')
    expect(labels).toContain('Jackpot Royal')
    expect(labels).toContain('Bonus King')
    expect(labels).toContain('On Fire')
    expect(labels).toContain('Globetrotter')
    expect(labels).toContain('In Profit')
  })
})
