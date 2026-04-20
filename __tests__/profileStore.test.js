/**
 * Unit tests for the user profile store (lib/profileStore.js).
 *
 * The module relies on browser storage (localStorage / sessionStorage)
 * which is not available in the default Jest "node" environment, so we
 * install lightweight in-memory shims on globalThis.window before loading
 * the module under test.
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

let localStorage
let sessionStorage
let profileStore

beforeEach(async () => {
  localStorage = makeStorage()
  sessionStorage = makeStorage()
  globalThis.window = { localStorage, sessionStorage }
  // Re-import after each reset so the module sees fresh window globals
  // (the module itself does not cache window so a single import works,
  // but we re-grab the named exports to be safe).
  profileStore = await import('../lib/profileStore.js')
})

describe('isValidEmail', () => {
  test('rejects non-strings, empty strings and obviously invalid input', () => {
    const { isValidEmail } = profileStore
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('   ')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('foo@bar')).toBe(false)
    expect(isValidEmail('foo @bar.com')).toBe(false)
  })

  test('accepts well-formed email addresses', () => {
    const { isValidEmail } = profileStore
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('user.name+tag@example.com')).toBe(true)
  })
})

describe('saveProfile / loadProfile', () => {
  test('remember=true persists to localStorage and clears sessionStorage', () => {
    const { saveProfile, loadProfile, PROFILE_KEY } = profileStore
    sessionStorage.setItem(PROFILE_KEY, '"stale"')

    const saved = saveProfile({ name: '  Alice ', email: 'alice@example.com', remember: true })

    expect(saved).toEqual(expect.objectContaining({
      name: 'Alice',
      email: 'alice@example.com',
      remember: true,
    }))
    expect(saved.createdAt).toEqual(expect.any(String))
    expect(localStorage.setItem).toHaveBeenCalledWith(PROFILE_KEY, expect.any(String))
    expect(sessionStorage.removeItem).toHaveBeenCalledWith(PROFILE_KEY)

    const loaded = loadProfile()
    expect(loaded).toEqual(saved)
  })

  test('remember=false persists to sessionStorage and clears localStorage', () => {
    const { saveProfile, loadProfile, PROFILE_KEY } = profileStore
    localStorage.setItem(PROFILE_KEY, '"stale"')

    const saved = saveProfile({ name: 'Bob', email: 'bob@example.com', remember: false })

    expect(saved.remember).toBe(false)
    expect(sessionStorage.setItem).toHaveBeenCalledWith(PROFILE_KEY, expect.any(String))
    expect(localStorage.removeItem).toHaveBeenCalledWith(PROFILE_KEY)

    const loaded = loadProfile()
    expect(loaded).toEqual(saved)
  })

  test('remember defaults to true when omitted', () => {
    const { saveProfile } = profileStore
    const saved = saveProfile({ name: 'C', email: 'c@d.io' })
    expect(saved.remember).toBe(true)
  })

  test('loadProfile prefers sessionStorage over localStorage', () => {
    const { loadProfile, PROFILE_KEY } = profileStore
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: 'Local', email: 'l@x.io' }))
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify({ name: 'Session', email: 's@x.io' }))

    const loaded = loadProfile()
    expect(loaded.name).toBe('Session')
  })

  test('loadProfile returns null when nothing is stored', () => {
    const { loadProfile } = profileStore
    expect(loadProfile()).toBeNull()
  })

  test('loadProfile returns null on malformed JSON', () => {
    const { loadProfile, PROFILE_KEY } = profileStore
    localStorage.setItem(PROFILE_KEY, 'not-json{')
    expect(loadProfile()).toBeNull()
  })
})

describe('clearProfile', () => {
  test('removes the profile from both storages', () => {
    const { saveProfile, clearProfile, loadProfile, PROFILE_KEY } = profileStore
    saveProfile({ name: 'A', email: 'a@b.co', remember: true })

    clearProfile()

    expect(localStorage.removeItem).toHaveBeenCalledWith(PROFILE_KEY)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith(PROFILE_KEY)
    expect(loadProfile()).toBeNull()
  })
})

describe('hasProfile', () => {
  test('returns false when nothing stored', () => {
    expect(profileStore.hasProfile()).toBe(false)
  })

  test('returns false when stored profile lacks a valid email', () => {
    profileStore.saveProfile({ name: 'X', email: 'not-an-email', remember: true })
    expect(profileStore.hasProfile()).toBe(false)
  })

  test('returns true when stored profile has a valid email', () => {
    profileStore.saveProfile({ name: 'X', email: 'x@y.io', remember: true })
    expect(profileStore.hasProfile()).toBe(true)
  })
})
