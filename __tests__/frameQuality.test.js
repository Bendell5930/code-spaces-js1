import { describe, test, expect } from '@jest/globals'
import { classifyQuality } from '../lib/frameQuality.js'

describe('classifyQuality – dark detection', () => {
  test('detects dark frame below threshold (avgLum < 35)', () => {
    expect(classifyQuality(20, 0, 0).dark).toBe(true)
    expect(classifyQuality(34, 0, 0).dark).toBe(true)
  })

  test('does not flag adequate brightness as dark', () => {
    expect(classifyQuality(35, 0, 0).dark).toBe(false)
    expect(classifyQuality(128, 0, 0).dark).toBe(false)
  })
})

describe('classifyQuality – bright detection', () => {
  test('detects bright frame when avgLum > 210 and glareFrac is low', () => {
    expect(classifyQuality(215, 0.05, 0).bright).toBe(true)
    expect(classifyQuality(255, 0.10, 0).bright).toBe(true)
  })

  test('does not flag avgLum exactly 210 as bright (threshold is strictly >)', () => {
    expect(classifyQuality(210, 0.05, 0).bright).toBe(false)
  })

  test('does not flag bright+glare combination as "bright" (glareFrac >= 0.15)', () => {
    expect(classifyQuality(250, 0.15, 0).bright).toBe(false)
    expect(classifyQuality(250, 0.20, 0).bright).toBe(false)
  })
})

describe('classifyQuality – glare detection', () => {
  test('detects glare when glareFrac > 0.12', () => {
    expect(classifyQuality(150, 0.13, 0).glare).toBe(true)
    expect(classifyQuality(150, 0.50, 0).glare).toBe(true)
  })

  test('does not flag glareFrac exactly 0.12 as glare (threshold is strictly >)', () => {
    expect(classifyQuality(150, 0.12, 0).glare).toBe(false)
  })

  test('no glare when fraction is low', () => {
    expect(classifyQuality(150, 0.05, 0).glare).toBe(false)
    expect(classifyQuality(150, 0, 0).glare).toBe(false)
  })
})

describe('classifyQuality – shake detection', () => {
  test('detects shake when avgMotionDiff > 45', () => {
    expect(classifyQuality(120, 0, 46).shake).toBe(true)
    expect(classifyQuality(120, 0, 100).shake).toBe(true)
  })

  test('does not flag avgMotionDiff exactly 45 as shake (threshold is strictly >)', () => {
    expect(classifyQuality(120, 0, 45).shake).toBe(false)
  })

  test('no shake when camera is still', () => {
    expect(classifyQuality(120, 0, 0).shake).toBe(false)
    expect(classifyQuality(120, 0, 10).shake).toBe(false)
  })
})

describe('classifyQuality – good quality', () => {
  test('all flags false for a normal well-lit steady frame', () => {
    const result = classifyQuality(128, 0.02, 5)
    expect(result.dark).toBe(false)
    expect(result.bright).toBe(false)
    expect(result.glare).toBe(false)
    expect(result.shake).toBe(false)
  })
})

describe('classifyQuality – multiple issues', () => {
  test('dark AND shake can be detected simultaneously', () => {
    const result = classifyQuality(10, 0.01, 60)
    expect(result.dark).toBe(true)
    expect(result.shake).toBe(true)
    expect(result.bright).toBe(false)
    expect(result.glare).toBe(false)
  })

  test('glare AND shake can be detected simultaneously', () => {
    const result = classifyQuality(180, 0.20, 55)
    expect(result.glare).toBe(true)
    expect(result.shake).toBe(true)
  })
})
