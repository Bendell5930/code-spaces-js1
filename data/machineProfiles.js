/**
 * Machine Visual Profiles
 *
 * Each profile tells the detection engine WHERE to look on a machine screen
 * and WHAT to look for. Regions are normalised (0-1) relative to the detected
 * screen bounding box.
 *
 * ── Extending ──
 * To add a new machine, copy an existing profile block and fill in:
 *   • screenColor   – dominant colour range of the machine bezel/trim
 *   • regions       – where balance, win, bet, lines appear on screen
 *   • symbols       – reel symbol names and dominant colour hints
 *   • bonusKeywords – text strings that indicate a bonus/feature trigger
 *   • jackpotTiers  – jackpot level names shown on the machine
 *
 * NOTE: The user will add more detail over time. Profiles with empty arrays
 * still work — the engine falls back to generic OCR for those fields.
 */

const PROFILES = {
  // ───────────────── DRAGON LINK ─────────────────
  'Dragon Link': {
    screenColor: { hMin: 0, hMax: 20, sMin: 60, vMin: 40 }, // red/gold bezel
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.15, w: 0.90, h: 0.65 },
    },
    symbols: [
      { name: 'Dragon',       color: { r: 200, g: 50,  b: 30  } },
      { name: 'Gold Coin',    color: { r: 230, g: 190, b: 50  } },
      { name: 'Firecracker',  color: { r: 220, g: 40,  b: 40  } },
      { name: 'Red Envelope', color: { r: 190, g: 30,  b: 30  } },
      { name: 'Lantern',      color: { r: 210, g: 60,  b: 30  } },
      { name: 'A',  color: null },
      { name: 'K',  color: null },
      { name: 'Q',  color: null },
      { name: 'J',  color: null },
      { name: '10', color: null },
    ],
    bonusKeywords: ['HOLD & SPIN', 'BONUS', 'FREE GAMES'],
    jackpotTiers: ['Grand', 'Major', 'Minor', 'Mini'],
    variants: {
      'Happy Prosperous':   { extraSymbols: ['Prosperity God'] },
      'Peace & Long Life':  { extraSymbols: ['Phoenix'] },
      'Panda Magic':        { extraSymbols: ['Panda'] },
      'Autumn Moon':        { extraSymbols: ['Moon', 'Rabbit'] },
      'Genghis Khan':       { extraSymbols: ['Khan', 'Horse'] },
      'Silk Road':          { extraSymbols: ['Camel', 'Silk'] },
      'Spring Festival':    { extraSymbols: ['Fireworks'] },
      'Golden Bong':        { extraSymbols: ['Bong', 'Temple'] },
    },
  },

  // ───────────────── LIGHTNING LINK ─────────────────
  'Lightning Link': {
    screenColor: { hMin: 30, hMax: 60, sMin: 50, vMin: 40 }, // yellow/amber trim
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.15, w: 0.90, h: 0.65 },
    },
    symbols: [
      { name: 'Lightning Bolt', color: { r: 255, g: 220, b: 50 } },
      { name: 'Pearl',          color: { r: 200, g: 200, b: 220 } },
      { name: 'Gold Coin',      color: { r: 230, g: 190, b: 50  } },
      { name: 'A',  color: null },
      { name: 'K',  color: null },
      { name: 'Q',  color: null },
      { name: 'J',  color: null },
      { name: '10', color: null },
    ],
    bonusKeywords: ['HOLD & SPIN', 'BONUS', 'FREE GAMES', 'LIGHTNING'],
    jackpotTiers: ['Grand', 'Major', 'Minor', 'Mini'],
    variants: {
      'Wild Chuco':      { extraSymbols: ['Chuco', 'Cactus'] },
      'Tiki Fire':       { extraSymbols: ['Tiki Mask', 'Fire'] },
      'Bengal Treasures': { extraSymbols: ['Tiger', 'Jewel'] },
      'Magic Totem':     { extraSymbols: ['Totem'] },
      'Aussie Boomer':   { extraSymbols: ['Kangaroo', 'Boomerang'] },
      'Miner':           { extraSymbols: ['Miner', 'Pickaxe', 'Nugget'] },
    },
  },

  // ───────────────── DRAGON TRAIN LINK ─────────────────
  'Dragon Train Link': {
    screenColor: { hMin: 0, hMax: 25, sMin: 50, vMin: 35 },
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.15, w: 0.90, h: 0.65 },
    },
    symbols: [
      { name: 'Dragon Train', color: { r: 200, g: 50, b: 30 } },
      { name: 'Gold Coin',    color: { r: 230, g: 190, b: 50 } },
      { name: 'A', color: null }, { name: 'K', color: null },
      { name: 'Q', color: null }, { name: 'J', color: null },
    ],
    bonusKeywords: ['HOLD & SPIN', 'BONUS', 'FREE GAMES'],
    jackpotTiers: ['Grand', 'Major', 'Minor', 'Mini'],
    variants: {},
  },

  // ───────────────── SUPER GRAND STAR LINK ─────────────────
  'Super Grand Star Link': {
    screenColor: { hMin: 35, hMax: 55, sMin: 60, vMin: 50 },
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.15, w: 0.90, h: 0.65 },
    },
    symbols: [
      { name: 'Star', color: { r: 255, g: 215, b: 0 } },
      { name: 'A', color: null }, { name: 'K', color: null },
      { name: 'Q', color: null }, { name: 'J', color: null },
    ],
    bonusKeywords: ['SUPER GRAND', 'BONUS', 'FREE GAMES'],
    jackpotTiers: ['Super Grand', 'Grand', 'Major', 'Minor', 'Mini'],
    variants: {},
  },

  // ───────────────── BULL RUSH LINK ─────────────────
  'Bull Rush Link': {
    screenColor: { hMin: 15, hMax: 40, sMin: 50, vMin: 35 },
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.15, w: 0.90, h: 0.65 },
    },
    symbols: [
      { name: 'Bull',    color: { r: 140, g: 80, b: 30 } },
      { name: 'Cowboy',  color: { r: 160, g: 120, b: 60 } },
      { name: 'A', color: null }, { name: 'K', color: null },
      { name: 'Q', color: null }, { name: 'J', color: null },
    ],
    bonusKeywords: ['BULL RUSH', 'BONUS', 'FREE GAMES'],
    jackpotTiers: ['Grand', 'Major', 'Minor', 'Mini'],
    variants: {},
  },

  // ───────────────── MONOPOLY HUFF N PUFF ─────────────────
  'Monopoly Huff n Puff': {
    screenColor: { hMin: 90, hMax: 140, sMin: 40, vMin: 40 }, // green Monopoly theme
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.18, w: 0.90, h: 0.60 },
    },
    symbols: [
      { name: 'Mr. Monopoly', color: { r: 220, g: 200, b: 160 } },
      { name: 'Wolf',         color: { r: 100, g: 100, b: 110 } },
      { name: 'Pig House',    color: { r: 180, g: 100, b: 80  } },
      { name: 'Gold Coin',    color: { r: 230, g: 190, b: 50  } },
      { name: 'A', color: null }, { name: 'K', color: null },
      { name: 'Q', color: null }, { name: 'J', color: null },
    ],
    bonusKeywords: ['HUFF', 'PUFF', 'BONUS', 'FREE SPINS', 'WHEEL'],
    jackpotTiers: ['Grand', 'Major', 'Minor', 'Mini'],
    variants: {},
  },

  // ───────────────── PIGGY BANKIN ─────────────────
  'Piggy Bankin': {
    screenColor: { hMin: 310, hMax: 350, sMin: 40, vMin: 40 }, // pink
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.18, w: 0.90, h: 0.60 },
    },
    symbols: [
      { name: 'Piggy Bank', color: { r: 230, g: 150, b: 170 } },
      { name: 'Gold Coin',  color: { r: 230, g: 190, b: 50  } },
      { name: 'A', color: null }, { name: 'K', color: null },
      { name: 'Q', color: null }, { name: 'J', color: null },
    ],
    bonusKeywords: ['SMASH', 'BONUS', 'FREE SPINS'],
    jackpotTiers: ['Grand', 'Major', 'Minor', 'Mini'],
    variants: {},
  },

  // ───────────────── THUNDER LINK ─────────────────
  'Thunder Link': {
    screenColor: { hMin: 220, hMax: 270, sMin: 50, vMin: 30 }, // purple/blue
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.15, w: 0.90, h: 0.65 },
    },
    symbols: [
      { name: 'Thunder',    color: { r: 100, g: 80,  b: 200 } },
      { name: 'Lightning',  color: { r: 255, g: 220, b: 50  } },
      { name: 'Gold Coin',  color: { r: 230, g: 190, b: 50  } },
      { name: 'A', color: null }, { name: 'K', color: null },
      { name: 'Q', color: null }, { name: 'J', color: null },
    ],
    bonusKeywords: ['HOLD & SPIN', 'BONUS', 'FREE GAMES', 'THUNDER'],
    jackpotTiers: ['Grand', 'Major', 'Minor', 'Mini'],
    variants: {
      'Inca Diamonds':     { extraSymbols: ['Inca Mask', 'Diamond'] },
      'Thunder Kingdom':   { extraSymbols: ['Crown', 'Castle'] },
      'Samari King':       { extraSymbols: ['Samurai', 'Katana'] },
      'Mongolian Express': { extraSymbols: ['Horse', 'Yurt'] },
    },
  },

  // ───────────────── ROYAL SPARK ─────────────────
  'Royal Spark': {
    screenColor: { hMin: 40, hMax: 65, sMin: 60, vMin: 50 },
    regions: {
      balance:  { x: 0.02, y: 0.90, w: 0.25, h: 0.08 },
      winAmount:{ x: 0.35, y: 0.90, w: 0.30, h: 0.08 },
      betAmount:{ x: 0.70, y: 0.90, w: 0.15, h: 0.08 },
      lines:    { x: 0.88, y: 0.90, w: 0.10, h: 0.08 },
      reels:    { x: 0.05, y: 0.15, w: 0.90, h: 0.65 },
    },
    symbols: [
      { name: 'Crown',     color: { r: 230, g: 190, b: 50 } },
      { name: 'Spark',     color: { r: 255, g: 220, b: 50 } },
      { name: 'A', color: null }, { name: 'K', color: null },
      { name: 'Q', color: null }, { name: 'J', color: null },
    ],
    bonusKeywords: ['SPARK', 'BONUS', 'FREE GAMES'],
    jackpotTiers: ['Grand', 'Major', 'Minor', 'Mini'],
    variants: {},
  },
}

/**
 * Get profile for a machine. Handles "Brand – Variant" naming convention.
 * Returns { profile, variant } or null if unknown.
 */
export function getMachineProfile(machineName) {
  if (!machineName) return null

  // Direct match first
  if (PROFILES[machineName]) {
    return { profile: PROFILES[machineName], variant: null }
  }

  // Try "Brand – Variant" split
  const sep = machineName.indexOf(' – ')
  if (sep !== -1) {
    const brand = machineName.slice(0, sep)
    const varName = machineName.slice(sep + 3)
    if (PROFILES[brand]) {
      const variantData = PROFILES[brand].variants?.[varName] || null
      return { profile: PROFILES[brand], variant: variantData }
    }
  }

  return null
}

/**
 * Return all known symbol names for a machine (base + variant extras).
 */
export function getSymbolsForMachine(machineName) {
  const result = getMachineProfile(machineName)
  if (!result) return []
  const base = result.profile.symbols.map((s) => s.name)
  const extra = result.variant?.extraSymbols || []
  return [...base, ...extra]
}

export default PROFILES
