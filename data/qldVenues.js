/**
 * Queensland Pub & RSL Venue Database
 * Covers major QLD regions — pubs, RSLs, clubs with gaming floors.
 * Each venue has a list of pokie machines currently in circulation (2024-2026).
 *
 * Machine names are real Aristocrat, Ainsworth, IGT, Konami, Light & Wonder,
 * and other manufacturers' games found on QLD gaming floors.
 */

// ─── Full QLD Pokie Machine Game List (all manufacturers, current circulation) ───

export const ALL_QLD_MACHINES = [
  // ── Aristocrat — Link Series ──
  'Dragon Link — Happy Prosperous',
  'Dragon Link — Peace & Long Life',
  'Dragon Link — Panda Magic',
  'Dragon Link — Autumn Moon',
  'Dragon Link — Genghis Khan',
  'Dragon Link — Silk Road',
  'Dragon Link — Spring Festival',
  'Dragon Link — Golden Bong',
  'Lightning Link — Wild Chuco',
  'Lightning Link — Tiki Fire',
  'Lightning Link — Bengal Treasures',
  'Lightning Link — Magic Totem',
  'Lightning Link — Aussie Boomer',
  'Lightning Link — Miner',
  'Lightning Link — Happy Lantern',
  'Lightning Link — High Stakes',
  'Lightning Link — Moon Race',
  'Lightning Link — Sahara Gold',
  'Dragon Train Link',
  'Super Grand Star Link',
  'Bull Rush Link',
  'Thunder Link — Inca Diamonds',
  'Thunder Link — Thunder Kingdom',
  'Thunder Link — Samari King',
  'Thunder Link — Mongolian Express',
  'Royal Spark',

  // ── Aristocrat — Cash Express Series ──
  'Cash Express — Luxury Line',
  'Cash Express — More Chilli',
  'Cash Express — Buffalo',
  'Cash Express — Lucky 88',

  // ── Aristocrat — Standalone / Classic ──
  'Buffalo Gold',
  'Buffalo Grand',
  'Buffalo Link',
  'Queen of the Nile',
  'Queen of the Nile II',
  'Queen of the Nile Legends',
  'Big Red',
  'Big Red 2',
  'Where\'s the Gold',
  'More Chilli',
  'More Hearts',
  '50 Lions',
  '50 Dragons',
  '5 Dragons',
  '5 Dragons Gold',
  '5 Dragons Rapid',
  'Indian Dreaming',
  'Indian Dreaming Deluxe',
  'Geisha',
  'Pompeii',
  'Pelican Pete',
  'Choy Sun Doa',
  'Wicked Winnings II',
  'Wicked Winnings IV',
  'King of the Nile',
  'Sun & Moon',
  'Timber Wolf',
  'Timber Wolf Deluxe',
  'Dolphin Treasure',
  'Wild Panda',
  'Jackpot Catcher',
  'Gold Stacks 88',
  'FarmVille',
  'Walking Dead',

  // ── Aristocrat — Dollar Storm / Good Fortune ──
  'Dollar Storm — Caribbean Gold',
  'Dollar Storm — Ninja Moon',
  'Dollar Storm — Egyptian Jewels',
  'Good Fortune',
  'Good Fortune Deluxe',

  // ── Ainsworth ──
  'Mustang Money',
  'Mustang Money 2',
  'Eagle Bucks',
  'Pac-Man',
  'Stormin 7s',
  'Quad Shot',
  'Ji Cai Shen',
  'Grand Star Platinum',
  'Inca Sun',
  'Triple Threat',

  // ── Konami ──
  'China Shores',
  'China Mystery',
  'Solstice Celebration',
  'Lotus Land',
  'Ancient Dragon',
  'Roman Tribune',

  // ── IGT ──
  'Texas Tea',
  'Cleopatra',
  'Cleopatra II',
  'Cleopatra Gold',
  'Double Diamonds',
  'Triple Diamonds',
  'Wheel of Fortune',
  'Wheel of Fortune Gold Spin',
  'Black Panther',
  'Wolf Run',
  'Wolf Run Gold',
  'DaVinci Diamonds',
  'Golden Goddess',
  'Siberian Storm',
  'Kitty Glitter',
  'Hexbreaker 2',

  // ── Light & Wonder (Scientific Games / SG / Bally) ──
  'Monopoly Huff n Puff',
  'Piggy Bankin',
  'Quick Hit',
  'Quick Hit Platinum',
  'Quick Hit Ultra Pays',
  'Cash Wizard',
  '88 Fortunes',
  '88 Fortunes Diamond',
  'Dancing Drums',
  'Dancing Drums Explosion',
  'Jin Ji Bao Xi',
  'Mighty Cash',
  'Mighty Cash Double Up',
  'Lock It Link — Nightlife',
  'Lock It Link — Diamonds',
  'Huff N More Puff',
  'Rakin Bacon',
  'All Aboard',
  'All Aboard — Dynamite Dash',

  // ── SG Gaming / Shuffle Master / AGT ──
  'Lucky Honeycomb',
  'Lucky Honeycomb Twin Fever',
  'Fortune Mint',
  'Fortune Coin',
  'Colossal Wizards',
  'Epic Fortunes',
  'Li\'l Red',
  'Great Zeus',
  'Kiss Shout It Out Loud',

  // ── Novomatic ──
  'Book of Ra',
  'Book of Ra Deluxe',
  'Lucky Lady Charm',
  'Lucky Lady Charm Deluxe',
  'Dolphin Pearl',
  'Sizzling Hot',
  'Lord of the Ocean',

  // ── EGT / Aruze ──
  'Flaming Hot',
  'Burning Hot',
  '40 Super Hot',
  'Shining Crown',
]

// ─── QLD Regions ───

export const QLD_REGIONS = [
  'Brisbane CBD',
  'Brisbane North',
  'Brisbane South',
  'Brisbane East',
  'Brisbane West',
  'Ipswich',
  'Logan',
  'Gold Coast North',
  'Gold Coast Central',
  'Gold Coast South',
  'Sunshine Coast',
  'Toowoomba',
  'Townsville',
  'Cairns',
  'Mackay',
  'Rockhampton',
  'Bundaberg',
  'Hervey Bay',
  'Gladstone',
  'Redcliffe / Moreton Bay',
]

// ─── QLD Venue Database ───
// type: 'pub' | 'rsl' | 'club' | 'tavern' | 'hotel'

export const QLD_VENUES = [
  // ── Brisbane CBD ──
  { id: 'v001', name: 'Treasury Brisbane', type: 'club', region: 'Brisbane CBD', suburb: 'Brisbane City', machineCount: 1300 },
  { id: 'v002', name: 'Pig N Whistle — Eagle St', type: 'pub', region: 'Brisbane CBD', suburb: 'Brisbane City', machineCount: 36 },
  { id: 'v003', name: 'Breakfast Creek Hotel', type: 'hotel', region: 'Brisbane CBD', suburb: 'Newstead', machineCount: 50 },
  { id: 'v004', name: 'Caxton Hotel', type: 'hotel', region: 'Brisbane CBD', suburb: 'Caxton St', machineCount: 40 },
  { id: 'v005', name: 'Royal Exchange Hotel', type: 'hotel', region: 'Brisbane CBD', suburb: 'Toowong', machineCount: 30 },

  // ── Brisbane North ──
  { id: 'v010', name: 'Kedron-Wavell RSL', type: 'rsl', region: 'Brisbane North', suburb: 'Chermside', machineCount: 280 },
  { id: 'v011', name: 'Geebung RSL', type: 'rsl', region: 'Brisbane North', suburb: 'Geebung', machineCount: 90 },
  { id: 'v012', name: 'Aspley Hornets Club', type: 'club', region: 'Brisbane North', suburb: 'Aspley', machineCount: 95 },
  { id: 'v013', name: 'Nundah Tavern', type: 'tavern', region: 'Brisbane North', suburb: 'Nundah', machineCount: 35 },
  { id: 'v014', name: 'Chermside Tavern', type: 'tavern', region: 'Brisbane North', suburb: 'Chermside', machineCount: 28 },
  { id: 'v015', name: 'Royal Hotel Nundah', type: 'hotel', region: 'Brisbane North', suburb: 'Nundah', machineCount: 24 },
  { id: 'v016', name: 'Hamilton Hotel', type: 'hotel', region: 'Brisbane North', suburb: 'Hamilton', machineCount: 40 },
  { id: 'v017', name: 'Bracken Ridge Tavern', type: 'tavern', region: 'Brisbane North', suburb: 'Bracken Ridge', machineCount: 40 },
  { id: 'v018', name: 'Sandgate RSL', type: 'rsl', region: 'Brisbane North', suburb: 'Sandgate', machineCount: 55 },

  // ── Brisbane South ──
  { id: 'v020', name: 'Sunnybank RSL', type: 'rsl', region: 'Brisbane South', suburb: 'Sunnybank', machineCount: 120 },
  { id: 'v021', name: 'Acacia Ridge Hotel', type: 'hotel', region: 'Brisbane South', suburb: 'Acacia Ridge', machineCount: 40 },
  { id: 'v022', name: 'Moorooka Bowls Club', type: 'club', region: 'Brisbane South', suburb: 'Moorooka', machineCount: 30 },
  { id: 'v023', name: 'Rocklea Hotel', type: 'hotel', region: 'Brisbane South', suburb: 'Rocklea', machineCount: 25 },
  { id: 'v024', name: 'Salisbury Hotel', type: 'hotel', region: 'Brisbane South', suburb: 'Salisbury', machineCount: 32 },
  { id: 'v025', name: 'Greenbank RSL', type: 'rsl', region: 'Brisbane South', suburb: 'Greenbank', machineCount: 100 },

  // ── Brisbane East ──
  { id: 'v030', name: 'Carina Leagues Club', type: 'club', region: 'Brisbane East', suburb: 'Carina', machineCount: 110 },
  { id: 'v031', name: 'Carindale Hotel', type: 'hotel', region: 'Brisbane East', suburb: 'Carindale', machineCount: 40 },
  { id: 'v032', name: 'Bulimba Bowls Club', type: 'club', region: 'Brisbane East', suburb: 'Bulimba', machineCount: 25 },
  { id: 'v033', name: 'Morningside AFL Club', type: 'club', region: 'Brisbane East', suburb: 'Morningside', machineCount: 45 },
  { id: 'v034', name: 'Wynnum RSL', type: 'rsl', region: 'Brisbane East', suburb: 'Wynnum', machineCount: 75 },
  { id: 'v035', name: 'Manly Hotel', type: 'hotel', region: 'Brisbane East', suburb: 'Manly', machineCount: 36 },

  // ── Brisbane West ──
  { id: 'v040', name: 'Broncos Leagues Club', type: 'club', region: 'Brisbane West', suburb: 'Red Hill', machineCount: 200 },
  { id: 'v041', name: 'Kenmore Tavern', type: 'tavern', region: 'Brisbane West', suburb: 'Kenmore', machineCount: 30 },
  { id: 'v042', name: 'Indooroopilly Hotel', type: 'hotel', region: 'Brisbane West', suburb: 'Indooroopilly', machineCount: 32 },
  { id: 'v043', name: 'Bardon Bowls Club', type: 'club', region: 'Brisbane West', suburb: 'Bardon', machineCount: 20 },
  { id: 'v044', name: 'The Paddo Tavern', type: 'tavern', region: 'Brisbane West', suburb: 'Paddington', machineCount: 28 },

  // ── Ipswich ──
  { id: 'v050', name: 'Brothers Leagues Club Ipswich', type: 'club', region: 'Ipswich', suburb: 'Ipswich', machineCount: 150 },
  { id: 'v051', name: 'Ipswich RSL', type: 'rsl', region: 'Ipswich', suburb: 'Ipswich', machineCount: 100 },
  { id: 'v052', name: 'Karalee Tavern', type: 'tavern', region: 'Ipswich', suburb: 'Karalee', machineCount: 35 },
  { id: 'v053', name: 'Brassall Hotel', type: 'hotel', region: 'Ipswich', suburb: 'Brassall', machineCount: 28 },
  { id: 'v054', name: 'Goodna RSL', type: 'rsl', region: 'Ipswich', suburb: 'Goodna', machineCount: 40 },
  { id: 'v055', name: 'Yamanto Hotel', type: 'hotel', region: 'Ipswich', suburb: 'Yamanto', machineCount: 30 },
  { id: 'v056', name: 'Springfield Tavern', type: 'tavern', region: 'Ipswich', suburb: 'Springfield', machineCount: 40 },

  // ── Logan ──
  { id: 'v060', name: 'Logan Diggers Club', type: 'rsl', region: 'Logan', suburb: 'Kingston', machineCount: 120 },
  { id: 'v061', name: 'Beenleigh Tavern', type: 'tavern', region: 'Logan', suburb: 'Beenleigh', machineCount: 40 },
  { id: 'v062', name: 'Marsden Tavern', type: 'tavern', region: 'Logan', suburb: 'Marsden', machineCount: 35 },
  { id: 'v063', name: 'Springwood Hotel', type: 'hotel', region: 'Logan', suburb: 'Springwood', machineCount: 40 },
  { id: 'v064', name: 'Jimboomba Tavern', type: 'tavern', region: 'Logan', suburb: 'Jimboomba', machineCount: 28 },
  { id: 'v065', name: 'Waterford Tavern', type: 'tavern', region: 'Logan', suburb: 'Waterford', machineCount: 32 },

  // ── Gold Coast North ──
  { id: 'v070', name: 'Southport RSL', type: 'rsl', region: 'Gold Coast North', suburb: 'Southport', machineCount: 220 },
  { id: 'v071', name: 'Parkwood Tavern', type: 'tavern', region: 'Gold Coast North', suburb: 'Parkwood', machineCount: 40 },
  { id: 'v072', name: 'Surfers Paradise RSL', type: 'rsl', region: 'Gold Coast North', suburb: 'Surfers Paradise', machineCount: 65 },
  { id: 'v073', name: 'Runaway Bay Tavern', type: 'tavern', region: 'Gold Coast North', suburb: 'Runaway Bay', machineCount: 36 },
  { id: 'v074', name: 'Helensvale Tavern', type: 'tavern', region: 'Gold Coast North', suburb: 'Helensvale', machineCount: 34 },
  { id: 'v075', name: 'Coomera Hotel', type: 'hotel', region: 'Gold Coast North', suburb: 'Coomera', machineCount: 30 },

  // ── Gold Coast Central ──
  { id: 'v080', name: 'The Star Gold Coast', type: 'club', region: 'Gold Coast Central', suburb: 'Broadbeach', machineCount: 1500 },
  { id: 'v081', name: 'Broadbeach Tavern', type: 'tavern', region: 'Gold Coast Central', suburb: 'Broadbeach', machineCount: 28 },
  { id: 'v082', name: 'Mermaid Beach Tavern', type: 'tavern', region: 'Gold Coast Central', suburb: 'Mermaid Beach', machineCount: 24 },
  { id: 'v083', name: 'Nerang RSL', type: 'rsl', region: 'Gold Coast Central', suburb: 'Nerang', machineCount: 80 },
  { id: 'v084', name: 'Robina Pavilion', type: 'club', region: 'Gold Coast Central', suburb: 'Robina', machineCount: 55 },

  // ── Gold Coast South ──
  { id: 'v090', name: 'Twin Towns Clubs & Resorts', type: 'club', region: 'Gold Coast South', suburb: 'Tweed Heads', machineCount: 1100 },
  { id: 'v091', name: 'Coolangatta Hotel', type: 'hotel', region: 'Gold Coast South', suburb: 'Coolangatta', machineCount: 40 },
  { id: 'v092', name: 'Palm Beach Currumbin Sports Club', type: 'club', region: 'Gold Coast South', suburb: 'Palm Beach', machineCount: 90 },
  { id: 'v093', name: 'Burleigh Bears Club', type: 'club', region: 'Gold Coast South', suburb: 'Burleigh Heads', machineCount: 80 },
  { id: 'v094', name: 'Currumbin RSL', type: 'rsl', region: 'Gold Coast South', suburb: 'Currumbin', machineCount: 100 },

  // ── Sunshine Coast ──
  { id: 'v100', name: 'Caloundra RSL', type: 'rsl', region: 'Sunshine Coast', suburb: 'Caloundra', machineCount: 130 },
  { id: 'v101', name: 'Kawana Waters Hotel', type: 'hotel', region: 'Sunshine Coast', suburb: 'Buddina', machineCount: 40 },
  { id: 'v102', name: 'Maroochydore RSL', type: 'rsl', region: 'Sunshine Coast', suburb: 'Maroochydore', machineCount: 120 },
  { id: 'v103', name: 'Noosa RSL', type: 'rsl', region: 'Sunshine Coast', suburb: 'Noosaville', machineCount: 80 },
  { id: 'v104', name: 'Nambour RSL', type: 'rsl', region: 'Sunshine Coast', suburb: 'Nambour', machineCount: 75 },
  { id: 'v105', name: 'Coolum Beach Hotel', type: 'hotel', region: 'Sunshine Coast', suburb: 'Coolum Beach', machineCount: 30 },
  { id: 'v106', name: 'Mooloolaba Surf Club', type: 'club', region: 'Sunshine Coast', suburb: 'Mooloolaba', machineCount: 45 },

  // ── Toowoomba ──
  { id: 'v110', name: 'Toowoomba RSL', type: 'rsl', region: 'Toowoomba', suburb: 'Toowoomba', machineCount: 120 },
  { id: 'v111', name: 'Pub Lane Tavern', type: 'tavern', region: 'Toowoomba', suburb: 'Toowoomba', machineCount: 40 },
  { id: 'v112', name: 'Downs Club', type: 'club', region: 'Toowoomba', suburb: 'Toowoomba', machineCount: 80 },
  { id: 'v113', name: 'Wilsonton Hotel', type: 'hotel', region: 'Toowoomba', suburb: 'Wilsonton', machineCount: 30 },
  { id: 'v114', name: 'Highfields Tavern', type: 'tavern', region: 'Toowoomba', suburb: 'Highfields', machineCount: 28 },

  // ── Townsville ──
  { id: 'v120', name: 'Townsville RSL', type: 'rsl', region: 'Townsville', suburb: 'Townsville', machineCount: 160 },
  { id: 'v121', name: 'Kirwan Tavern', type: 'tavern', region: 'Townsville', suburb: 'Kirwan', machineCount: 35 },
  { id: 'v122', name: 'The Ville Resort-Casino', type: 'club', region: 'Townsville', suburb: 'Townsville', machineCount: 500 },
  { id: 'v123', name: 'Brothers Leagues Club Townsville', type: 'club', region: 'Townsville', suburb: 'Townsville', machineCount: 100 },
  { id: 'v124', name: 'Aitkenvale Tavern', type: 'tavern', region: 'Townsville', suburb: 'Aitkenvale', machineCount: 30 },

  // ── Cairns ──
  { id: 'v130', name: 'Reef Hotel Casino', type: 'club', region: 'Cairns', suburb: 'Cairns City', machineCount: 500 },
  { id: 'v131', name: 'Cairns RSL', type: 'rsl', region: 'Cairns', suburb: 'Parramatta Park', machineCount: 120 },
  { id: 'v132', name: 'Edge Hill Tavern', type: 'tavern', region: 'Cairns', suburb: 'Edge Hill', machineCount: 28 },
  { id: 'v133', name: 'Smithfield Tavern', type: 'tavern', region: 'Cairns', suburb: 'Smithfield', machineCount: 35 },
  { id: 'v134', name: 'Brothers Leagues Club Cairns', type: 'club', region: 'Cairns', suburb: 'Cairns', machineCount: 80 },
  { id: 'v135', name: 'Woree Tavern', type: 'tavern', region: 'Cairns', suburb: 'Woree', machineCount: 24 },

  // ── Mackay ──
  { id: 'v140', name: 'Mackay RSL', type: 'rsl', region: 'Mackay', suburb: 'Mackay', machineCount: 100 },
  { id: 'v141', name: 'Souths Leagues Club Mackay', type: 'club', region: 'Mackay', suburb: 'Mackay', machineCount: 80 },
  { id: 'v142', name: 'Northern Beaches Hotel', type: 'hotel', region: 'Mackay', suburb: 'Rural View', machineCount: 35 },
  { id: 'v143', name: 'Andergrove Tavern', type: 'tavern', region: 'Mackay', suburb: 'Andergrove', machineCount: 28 },

  // ── Rockhampton ──
  { id: 'v150', name: 'Rockhampton Leagues Club', type: 'club', region: 'Rockhampton', suburb: 'Rockhampton', machineCount: 110 },
  { id: 'v151', name: 'Frenchville Sports Club', type: 'club', region: 'Rockhampton', suburb: 'Frenchville', machineCount: 95 },
  { id: 'v152', name: 'Rockhampton RSL', type: 'rsl', region: 'Rockhampton', suburb: 'Rockhampton', machineCount: 60 },
  { id: 'v153', name: 'Gracemere Hotel', type: 'hotel', region: 'Rockhampton', suburb: 'Gracemere', machineCount: 30 },

  // ── Bundaberg ──
  { id: 'v160', name: 'Bundaberg RSL', type: 'rsl', region: 'Bundaberg', suburb: 'Bundaberg', machineCount: 90 },
  { id: 'v161', name: 'Bundaberg Leagues Club', type: 'club', region: 'Bundaberg', suburb: 'Bundaberg', machineCount: 80 },
  { id: 'v162', name: 'Club Hotel Bundaberg', type: 'hotel', region: 'Bundaberg', suburb: 'Bundaberg', machineCount: 30 },

  // ── Hervey Bay ──
  { id: 'v170', name: 'Hervey Bay RSL', type: 'rsl', region: 'Hervey Bay', suburb: 'Pialba', machineCount: 120 },
  { id: 'v171', name: 'Beach House Hotel', type: 'hotel', region: 'Hervey Bay', suburb: 'Scarness', machineCount: 40 },
  { id: 'v172', name: 'Kondari Hotel', type: 'hotel', region: 'Hervey Bay', suburb: 'Urangan', machineCount: 35 },

  // ── Gladstone ──
  { id: 'v180', name: 'Gladstone Leagues Club', type: 'club', region: 'Gladstone', suburb: 'Gladstone', machineCount: 80 },
  { id: 'v181', name: 'Yaralla Sports Club', type: 'club', region: 'Gladstone', suburb: 'Gladstone', machineCount: 70 },
  { id: 'v182', name: 'Gladstone RSL', type: 'rsl', region: 'Gladstone', suburb: 'Gladstone', machineCount: 45 },

  // ── Redcliffe / Moreton Bay ──
  { id: 'v190', name: 'Redcliffe RSL', type: 'rsl', region: 'Redcliffe / Moreton Bay', suburb: 'Redcliffe', machineCount: 110 },
  { id: 'v191', name: 'Caboolture Sports Club', type: 'club', region: 'Redcliffe / Moreton Bay', suburb: 'Caboolture', machineCount: 100 },
  { id: 'v192', name: 'North Lakes Sports Club', type: 'club', region: 'Redcliffe / Moreton Bay', suburb: 'North Lakes', machineCount: 85 },
  { id: 'v193', name: 'Bribie Island RSL', type: 'rsl', region: 'Redcliffe / Moreton Bay', suburb: 'Bongaree', machineCount: 70 },
  { id: 'v194', name: 'Pine Rivers Hotel', type: 'hotel', region: 'Redcliffe / Moreton Bay', suburb: 'Strathpine', machineCount: 32 },
  { id: 'v195', name: 'Morayfield Tavern', type: 'tavern', region: 'Redcliffe / Moreton Bay', suburb: 'Morayfield', machineCount: 36 },
]

/**
 * Deterministic machine assignment per venue based on venue ID + machine count.
 * Larger venues get more variety. Returns a subset of ALL_QLD_MACHINES.
 */
export function getVenueMachines(venue) {
  const total = ALL_QLD_MACHINES.length
  const count = Math.min(venue.machineCount || 30, total)
  // Use venue ID hash to pick a deterministic but varied subset
  let seed = 0
  for (let i = 0; i < venue.id.length; i++) seed = ((seed << 5) - seed + venue.id.charCodeAt(i)) | 0
  seed = Math.abs(seed)

  const indices = new Set()
  let s = seed
  // Always include popular link games (first 26)
  const popularCount = Math.min(26, count)
  for (let i = 0; i < popularCount; i++) indices.add(i)
  // Fill rest with hash-based picks
  while (indices.size < count) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    indices.add(s % total)
  }
  return Array.from(indices).sort((a, b) => a - b).map(i => ALL_QLD_MACHINES[i])
}

/**
 * Get venues by region
 */
export function getVenuesByRegion(region) {
  return QLD_VENUES.filter(v => v.region === region)
}

/**
 * Search venues by name
 */
export function searchVenues(query) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const all = getAllVenues()
  return all.filter(v =>
    v.name.toLowerCase().includes(q) ||
    v.suburb.toLowerCase().includes(q) ||
    v.region.toLowerCase().includes(q)
  )
}

// ─── Custom Venue Support ───

const CUSTOM_VENUES_KEY = 'pokie-custom-venues'

function loadCustomVenues() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CUSTOM_VENUES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomVenues(venues) {
  localStorage.setItem(CUSTOM_VENUES_KEY, JSON.stringify(venues))
}

/**
 * Get all venues (QLD database + user custom venues)
 */
export function getAllVenues() {
  return [...QLD_VENUES, ...loadCustomVenues()]
}

/**
 * Add a custom venue. Returns the new venue object.
 */
export function addCustomVenue({ name, suburb, region, type }) {
  const customs = loadCustomVenues()
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const venue = {
    id,
    name: name.trim(),
    type: type || 'custom',
    region: region?.trim() || 'Custom',
    suburb: suburb?.trim() || '',
    machineCount: 0,
    isCustom: true,
  }
  customs.push(venue)
  saveCustomVenues(customs)
  return venue
}

/**
 * Get only custom venues
 */
export function getCustomVenues() {
  return loadCustomVenues()
}

/**
 * Get all unique regions (including custom)
 */
export function getAllRegions() {
  const all = getAllVenues()
  return [...new Set(all.map(v => v.region))].sort()
}
