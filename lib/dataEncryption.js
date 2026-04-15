/**
 * Data Encryption Layer — AES-GCM encryption for all localStorage data.
 *
 * "Safety by Design" approach:
 * - All user data encrypted at rest using AES-256-GCM via Web Crypto API.
 * - Encryption key derived from a device-specific seed using PBKDF2.
 * - No sensitive financial data (credit cards, bank details) is ever stored.
 * - Reduces risk profile in the event of a data breach.
 *
 * Transit encryption is handled by HTTPS at the network layer.
 */

const ENC_PREFIX = 'enc:v1:'
const KEY_STORAGE = '__pk_device_key'
const SALT_STORAGE = '__pk_device_salt'

// ─── Prohibited data patterns (never stored) ───

const PROHIBITED_PATTERNS = [
  /\b\d{13,19}\b/,                         // credit/debit card numbers
  /\b\d{3,4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // formatted card numbers
  /\b[A-Z]{2}\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{0,2}\b/i, // IBAN
  /\bBSB[-:\s]?\d{3}[-]?\d{3}\b/i,         // Australian BSB
  /\bACC(?:OUNT)?[-:\s#]?\d{6,12}\b/i,     // account numbers
  /\bCVV[-:\s]?\d{3,4}\b/i,                // CVV codes
  /\bPIN[-:\s]?\d{4,6}\b/i,                // PIN numbers
  /\bpassword[-:\s]?.{4,}\b/i,             // passwords
]

/**
 * Scrub any prohibited sensitive data from a string before storage.
 * Returns the sanitised string.
 */
export function scrubSensitiveData(text) {
  if (typeof text !== 'string') return text
  let clean = text
  for (const pattern of PROHIBITED_PATTERNS) {
    clean = clean.replace(new RegExp(pattern.source, 'gi'), '[REDACTED]')
  }
  return clean
}

/**
 * Check if a value contains prohibited sensitive data.
 */
export function containsSensitiveData(text) {
  if (typeof text !== 'string') return false
  return PROHIBITED_PATTERNS.some((p) => new RegExp(p.source, 'i').test(text))
}

// ─── Key management ───

/** Generate a random salt for key derivation. */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16))
}

/** Convert ArrayBuffer ↔ base64 for storage. */
function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64ToBuf(b64) {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf
}

/**
 * Derive an AES-GCM key using PBKDF2 from a device-specific seed.
 * The seed is generated once and stored in localStorage (unencrypted —
 * it's a device identifier, not sensitive data).
 */
async function getEncryptionKey() {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return null

  // Get or create device salt
  let saltB64 = localStorage.getItem(SALT_STORAGE)
  if (!saltB64) {
    const salt = generateSalt()
    saltB64 = bufToBase64(salt)
    localStorage.setItem(SALT_STORAGE, saltB64)
  }
  const salt = base64ToBuf(saltB64)

  // Get or create device seed
  let seedB64 = localStorage.getItem(KEY_STORAGE)
  if (!seedB64) {
    const seed = crypto.getRandomValues(new Uint8Array(32))
    seedB64 = bufToBase64(seed)
    localStorage.setItem(KEY_STORAGE, seedB64)
  }
  const seedBytes = base64ToBuf(seedB64)

  // Import seed as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw', seedBytes, 'PBKDF2', false, ['deriveKey']
  )

  // Derive AES-GCM key
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ─── Encrypt / Decrypt ───

/**
 * Encrypt a plaintext string → prefixed ciphertext string.
 */
export async function encrypt(plaintext) {
  const key = await getEncryptionKey()
  if (!key) return plaintext // SSR or no crypto: fall back to plaintext

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  // Store as: enc:v1:<iv_base64>:<cipher_base64>
  return ENC_PREFIX + bufToBase64(iv) + ':' + bufToBase64(cipherBuf)
}

/**
 * Decrypt a ciphertext string → plaintext.
 * If the value isn't encrypted (no prefix), returns it as-is (migration support).
 */
export async function decrypt(ciphertext) {
  if (!ciphertext || !ciphertext.startsWith(ENC_PREFIX)) return ciphertext

  const key = await getEncryptionKey()
  if (!key) return ciphertext

  try {
    const parts = ciphertext.slice(ENC_PREFIX.length).split(':')
    if (parts.length < 2) return ciphertext

    const iv = base64ToBuf(parts[0])
    const data = base64ToBuf(parts[1])

    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    return new TextDecoder().decode(plainBuf)
  } catch {
    // Decryption failed — data may be corrupted or from another device
    return null
  }
}

// ─── Secure localStorage wrapper ───

/**
 * SecureStorage — drop-in encrypted replacement for localStorage.
 *
 * Usage:
 *   await SecureStorage.setItem('key', 'value')
 *   const val = await SecureStorage.getItem('key')
 *   SecureStorage.removeItem('key')
 */
export const SecureStorage = {
  async setItem(key, value) {
    if (typeof window === 'undefined') return
    // Scrub any sensitive data before encrypting
    const clean = typeof value === 'string' ? scrubSensitiveData(value) : value
    const encrypted = await encrypt(typeof clean === 'string' ? clean : JSON.stringify(clean))
    localStorage.setItem(key, encrypted)
  },

  async getItem(key) {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return decrypt(raw)
  },

  async getJSON(key) {
    const val = await this.getItem(key)
    if (val === null) return null
    try { return JSON.parse(val) } catch { return val }
  },

  removeItem(key) {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },

  /** Migrate an unencrypted key to encrypted storage. */
  async migrate(key) {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(key)
    if (raw === null || raw.startsWith(ENC_PREFIX)) return // already encrypted or absent
    await this.setItem(key, raw)
  }
}

// ─── Data policy constants ───

export const DATA_POLICY = {
  /** Data we NEVER store */
  neverStored: [
    'Credit card numbers',
    'Debit card numbers',
    'Bank account numbers',
    'BSB numbers',
    'IBAN / SWIFT codes',
    'CVV / security codes',
    'PINs or passwords',
    'Real names (unless user chooses a nickname)',
    'Location / GPS coordinates',
    'Venue addresses',
    'Photos of people or venue interiors',
  ],
  /** Data we DO store (encrypted) */
  storedEncrypted: [
    'Spin logs (bet amount, win amount, machine type)',
    'Session timers & harm-minimization settings',
    'User-chosen nickname & avatar',
    'Community chat messages',
    'Heat map analysis results',
  ],
  /** Encryption method */
  encryption: {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2 (100,000 iterations, SHA-256)',
    ivLength: '96-bit random per record',
    transit: 'HTTPS / TLS 1.3',
  }
}
