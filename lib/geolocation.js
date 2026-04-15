/**
 * Geolocation helper — requests user location and reverse-geocodes
 * to a venue-level label (suburb + state) for leaderboard display.
 * No precise addresses stored — privacy first.
 */

const GEO_CACHE_KEY = 'pokie-geo-cache'

/** Check if geolocation is available */
export function isGeoAvailable() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

/**
 * Request current position. Returns { lat, lng } or null.
 * Timeout: 10 seconds.
 */
export function requestPosition() {
  return new Promise((resolve) => {
    if (!isGeoAvailable()) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  })
}

/**
 * Reverse-geocode lat/lng to a suburb-level label.
 * Uses OpenStreetMap Nominatim (free, no API key).
 * Falls back to "Unknown Location" on failure.
 * Caches the result per session.
 */
export async function reverseGeocode(lat, lng) {
  // Check cache first
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw)
      if (cached.lat === lat && cached.lng === lng && cached.label) {
        return cached.label
      }
    }
  } catch { /* ignore */ }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=14&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    })
    if (!res.ok) return 'Unknown Location'
    const data = await res.json()
    const addr = data.address || {}
    // Build suburb + state label (privacy: no street/number)
    const suburb = addr.suburb || addr.town || addr.city || addr.village || addr.county || ''
    const state = addr.state || ''
    const label = [suburb, state].filter(Boolean).join(', ') || 'Australia'

    // Cache it
    try {
      sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ lat, lng, label }))
    } catch { /* ignore */ }

    return label
  } catch {
    return 'Unknown Location'
  }
}

/**
 * One-shot: get location label. Returns string like "Parramatta, NSW".
 * Returns null if user denies or unavailable.
 */
export async function getLocationLabel() {
  const pos = await requestPosition()
  if (!pos) return null
  return reverseGeocode(pos.lat, pos.lng)
}
