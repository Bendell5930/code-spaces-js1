import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// Minimal browser-globals shim: jest's testEnvironment is "node", but
// aiLearning.js feature-detects `typeof window` and uses `localStorage` +
// `window.dispatchEvent`. Provide just enough to exercise that code path.
function installBrowserShim() {
  const store = new Map()
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)) },
    removeItem: (k) => { store.delete(k) },
    clear: () => { store.clear() },
  }
  const listeners = new Map()
  const win = {
    localStorage,
    addEventListener: (name, fn) => {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name).add(fn)
    },
    removeEventListener: (name, fn) => listeners.get(name)?.delete(fn),
    dispatchEvent: (evt) => {
      const set = listeners.get(evt.type)
      if (set) for (const fn of set) fn(evt)
      return true
    },
  }
  global.window = win
  global.localStorage = localStorage
  global.Event = class { constructor(type) { this.type = type } }
  return { store, listeners }
}

let shim
beforeEach(() => {
  // Reset module registry so aiLearning.js re-evaluates against the fresh shim.
  jest.resetModules()
  shim = installBrowserShim()
})

describe('addCustomMachine + getMergedMachines', () => {
  test('newly added brand+variant appears in merged machine list', async () => {
    const { addCustomMachine, getMergedMachines } = await import('../lib/aiLearning.js')
    addCustomMachine('Lightning Link', 'Sahara Gold')
    const merged = getMergedMachines()
    expect(merged['Lightning Link']).toBeDefined()
    expect(merged['Lightning Link']).toEqual(expect.arrayContaining(['Sahara Gold']))
  })

  test('built-in MACHINES are preserved when custom entries are added', async () => {
    const { addCustomMachine, getMergedMachines } = await import('../lib/aiLearning.js')
    const { MACHINES } = await import('../data/machines.js')
    const builtInBrands = Object.keys(MACHINES)
    addCustomMachine('Custom Brand X', 'Variant Y')
    const merged = getMergedMachines()
    for (const brand of builtInBrands) {
      expect(merged[brand]).toBeDefined()
    }
    expect(merged['Custom Brand X']).toEqual(['Variant Y'])
  })

  test('case-insensitive variant deduplication under same brand', async () => {
    const { addCustomMachine, getMergedMachines } = await import('../lib/aiLearning.js')
    addCustomMachine('Brand A', 'Variant One')
    addCustomMachine('Brand A', 'variant one') // different case
    const merged = getMergedMachines()
    const variants = merged['Brand A']
    const lower = variants.map((v) => v.toLowerCase())
    const occurrences = lower.filter((v) => v === 'variant one').length
    expect(occurrences).toBe(1)
  })

  test('dispatches CUSTOM_MACHINES_EVENT so live listeners can refresh', async () => {
    const { addCustomMachine, CUSTOM_MACHINES_EVENT } = await import('../lib/aiLearning.js')
    let fired = 0
    window.addEventListener(CUSTOM_MACHINES_EVENT, () => { fired += 1 })
    addCustomMachine('Brand B', 'Variant Z')
    expect(fired).toBeGreaterThanOrEqual(1)
  })
})
