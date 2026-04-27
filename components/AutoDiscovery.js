/**
 * AutoDiscovery — AI Learning wizard component.
 *
 * Walks the user through auto-detecting a new venue (via GPS + camera OCR)
 * and a new machine name/variant (via camera OCR), then hands off to the
 * existing AI scan flow.
 *
 * Usage:
 *   <AutoDiscovery
 *     onComplete={(venue, machineName) => { ... }}
 *     onStartScan={(machineName, machineVariant) => { ... }}
 *     onClose={() => { ... }}
 *   />
 *
 * Tesseract.js is loaded lazily from CDN the first time OCR is needed.
 * Falls back gracefully when camera / GPS / OCR permissions are denied.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { addCustomVenue, getAllVenues } from '../data/qldVenues'
import { trackVenue } from '../lib/venueAnalytics'
import { checkIn } from '../lib/viralStore'
import { requestPosition, reverseGeocode } from '../lib/geolocation'
import { bumpCount, findNearbyVenue, findNearDuplicate,
         parseOcrText, toTitleCase, addCustomMachine,
         getMergedMachines } from '../lib/aiLearning'
import styles from './AutoDiscovery.module.css'

// ─── Wizard step constants ───────────────────────────────────────────────────
const STEP = {
  IDLE:                  'IDLE',
  GPS_LOOKUP:            'GPS_LOOKUP',
  VENUE_CAPTURE_CHOICE:  'VENUE_CAPTURE_CHOICE',
  VENUE_CAMERA:          'VENUE_CAMERA',
  VENUE_OCR:             'VENUE_OCR',
  VENUE_CONFIRM:         'VENUE_CONFIRM',
  MACHINE_CAMERA:        'MACHINE_CAMERA',
  MACHINE_OCR:           'MACHINE_OCR',
  MACHINE_CONFIRM:       'MACHINE_CONFIRM',
  DONE:                  'DONE',
}

// ─── Constants ────────────────────────────────────────────────────────────────
/** GPS radius in metres within which a venue is considered "nearby" */
const DEFAULT_VENUE_RADIUS_METERS = 75

/** Maximum time (ms) to wait for Tesseract to become available after injection */
const TESSERACT_LOAD_TIMEOUT_MS = 30_000

/** Min/max character lengths for a plausible venue name line (interior OCR) */
const MIN_VENUE_NAME_LENGTH = 3
const MAX_VENUE_NAME_LENGTH = 60

// ─── Lazy Tesseract loader ───────────────────────────────────────────────────
let tesseractLoading = false
let tesseractReady   = false

function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (tesseractReady && typeof window !== 'undefined' && window.Tesseract) {
      return resolve(window.Tesseract)
    }
    if (tesseractLoading) {
      // Poll until ready or timeout
      const deadline = Date.now() + TESSERACT_LOAD_TIMEOUT_MS
      const iv = setInterval(() => {
        if (window.Tesseract) {
          clearInterval(iv)
          tesseractReady = true
          resolve(window.Tesseract)
        } else if (Date.now() > deadline) {
          clearInterval(iv)
          reject(new Error('Tesseract.js did not load within the timeout'))
        }
      }, 200)
      return
    }
    tesseractLoading = true
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
    script.onload = () => { tesseractReady = true; resolve(window.Tesseract) }
    script.onerror = () => reject(new Error('Failed to load Tesseract.js'))
    document.head.appendChild(script)
  })
}

// ─── OCR helper ─────────────────────────────────────────────────────────────
async function runOcr(imageBlob) {
  const Tesseract = await loadTesseract()
  const { data: { text } } = await Tesseract.recognize(imageBlob, 'eng', {
    logger: () => {},
  })
  return text || ''
}

// ─── Camera helpers ──────────────────────────────────────────────────────────
async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
    audio: false,
  })
  videoEl.srcObject = stream
  await videoEl.play()
  return stream
}

function stopCamera(stream) {
  if (!stream) return
  stream.getTracks().forEach((t) => t.stop())
}

/** Capture current video frame → Blob */
function captureFrame(videoEl) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width  = videoEl.videoWidth  || 640
    canvas.height = videoEl.videoHeight || 480
    canvas.getContext('2d').drawImage(videoEl, 0, 0)
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * AutoDiscovery wizard.
 *
 * @param {object}   props
 * @param {function} props.onComplete  - Called with (venue, machineName) after full flow
 * @param {function} props.onStartScan - Called when user taps "Start AI Scan"
 * @param {function} props.onClose     - Called when user dismisses/skips the wizard
 */
export default function AutoDiscovery({ onComplete, onStartScan, onClose }) {
  const [step, setStep]                     = useState(STEP.GPS_LOOKUP)
  const [error, setError]                   = useState(null)

  // Venue state
  const [detectedVenue, setDetectedVenue]   = useState(null) // GPS-matched existing venue
  const [confirmedVenue, setConfirmedVenue] = useState(null) // final resolved venue
  const [venueName, setVenueName]           = useState('')
  const [venueSuburb, setVenueSuburb]       = useState('')
  const [venueRegion, setVenueRegion]       = useState('')
  const [gpsCoords, setGpsCoords]           = useState(null)
  const [venueDupe, setVenueDupe]           = useState(null)

  // Capture source for venue: 'exterior' (front sign) or 'interior' (inside signage)
  const [captureSource, setCaptureSource]   = useState('exterior')

  // Machine state
  const [machineName, setMachineName]       = useState('')
  const [machineVariant, setMachineVariant] = useState('')
  const [machineDupe, setMachineDupe]       = useState(null)

  // Camera
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)

  // ── Clean up camera on unmount ──
  useEffect(() => {
    return () => stopCamera(streamRef.current)
  }, [])

  // ── Step: GPS lookup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== STEP.GPS_LOOKUP) return

    let cancelled = false
    ;(async () => {
      try {
        const pos = await requestPosition()
        if (cancelled) return

        if (!pos) {
          // No GPS — go to venue capture choice
          setStep(STEP.VENUE_CAPTURE_CHOICE)
          return
        }

        setGpsCoords(pos)
        const venues  = getAllVenues()
        const nearby  = findNearbyVenue(pos.lat, pos.lng, venues, DEFAULT_VENUE_RADIUS_METERS)

        if (nearby) {
          // We already know this venue — skip venue capture
          setDetectedVenue(nearby)
          setConfirmedVenue(nearby)
          setVenueName(nearby.name)
          setVenueSuburb(nearby.suburb || '')
          setVenueRegion(nearby.region || '')
          bumpCount('venue', nearby.name)

          // Track + check in straight away
          trackVenue(nearby)
          checkIn(nearby, 'casual', null)

          if (onComplete) onComplete(nearby, null)
          setStep(STEP.MACHINE_CAMERA)
        } else {
          setStep(STEP.VENUE_CAPTURE_CHOICE)
        }
      } catch {
        if (!cancelled) setStep(STEP.VENUE_CAPTURE_CHOICE)
      }
    })()

    return () => { cancelled = true }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start camera when entering a camera step ────────────────────────────────
  const stepNeedsCamera = step === STEP.VENUE_CAMERA || step === STEP.MACHINE_CAMERA

  useEffect(() => {
    if (!stepNeedsCamera) return
    let cancelled = false

    ;(async () => {
      try {
        if (!videoRef.current) return
        const stream = await startCamera(videoRef.current)
        if (cancelled) { stopCamera(stream); return }
        streamRef.current = stream
      } catch {
        if (!cancelled) setError('Camera access denied — use manual entry below.')
      }
    })()

    return () => {
      cancelled = true
      stopCamera(streamRef.current)
      streamRef.current = null
    }
  }, [stepNeedsCamera])

  // ── Capture & OCR for venue ─────────────────────────────────────────────────
  const handleVenueCapture = useCallback(async () => {
    setError(null)
    setStep(STEP.VENUE_OCR)
    stopCamera(streamRef.current)
    streamRef.current = null

    try {
      const blob = await captureFrame(videoRef.current)
      const text = await runOcr(blob)

      let name
      if (captureSource === 'interior') {
        // Interior captures (menus, posters, etc.) may have more text noise.
        // Pick the longest meaningful line as the most likely venue name.
        const lines = text
          .split(/[\n\r]+/)
          .map((l) => l.trim())
          .filter((l) => l.length >= MIN_VENUE_NAME_LENGTH && l.length <= MAX_VENUE_NAME_LENGTH)
        const best = lines.length > 0
          ? lines.slice().sort((a, b) => b.length - a.length)[0]
          : ''
        name = toTitleCase(best)
      } else {
        // Exterior sign: first non-trivial line is the venue name
        name = toTitleCase(
          text.split(/[\n\r]+/).find((l) => l.trim().length > 2)?.trim() || ''
        )
      }

      // Reverse-geocode to get suburb label
      let suburb = ''
      let region = 'Custom'
      if (gpsCoords) {
        try {
          const label = await reverseGeocode(gpsCoords.lat, gpsCoords.lng)
          suburb = label?.split(',')[0]?.trim() || ''
          region = label || 'Custom'
        } catch { /* ignore */ }
      }

      // Near-duplicate check
      const allNames = getAllVenues().map((v) => v.name)
      const dupe = name ? findNearDuplicate(name, allNames) : null
      setVenueDupe(dupe)
      setVenueName(dupe || name)
      setVenueSuburb(suburb)
      setVenueRegion(region)
      setStep(STEP.VENUE_CONFIRM)
    } catch (e) {
      setError('OCR failed — please enter venue details manually.')
      setVenueName('')
      setStep(STEP.VENUE_CONFIRM)
    }
  }, [gpsCoords, captureSource])

  // ── Confirm venue ───────────────────────────────────────────────────────────
  function handleVenueConfirm() {
    if (!venueName.trim()) return
    setError(null)

    // Check if it already exists as a tracked venue
    const allVenues = getAllVenues()
    const exact = allVenues.find(
      (v) => v.name.toLowerCase() === venueName.trim().toLowerCase()
    )

    let venue
    if (exact) {
      venue = exact
    } else {
      venue = addCustomVenue({
        name:   venueName.trim(),
        suburb: venueSuburb.trim(),
        region: venueRegion.trim() || 'Custom',
        type:   'custom',
      })
    }

    trackVenue(venue)
    checkIn(venue, 'casual', null)
    bumpCount('venue', venue.name)

    setConfirmedVenue(venue)
    if (onComplete) onComplete(venue, null)
    setStep(STEP.MACHINE_CAMERA)
  }

  // ── Capture & OCR for machine ───────────────────────────────────────────────
  const handleMachineCapture = useCallback(async () => {
    setError(null)
    setStep(STEP.MACHINE_OCR)
    stopCamera(streamRef.current)
    streamRef.current = null

    try {
      const blob = await captureFrame(videoRef.current)
      const text = await runOcr(blob)
      const { machineName: mn, variant: v } = parseOcrText(text)

      // Near-duplicate check against all known machine brands
      const allBrands = Object.keys(getMergedMachines())
      const dupe = mn ? findNearDuplicate(mn, allBrands) : null
      setMachineDupe(dupe)
      setMachineName(dupe || mn)
      setMachineVariant(v)
      setStep(STEP.MACHINE_CONFIRM)
    } catch {
      setError('OCR failed — please enter machine details manually.')
      setMachineName('')
      setMachineVariant('')
      setStep(STEP.MACHINE_CONFIRM)
    }
  }, [])

  // ── Confirm machine ─────────────────────────────────────────────────────────
  function handleMachineConfirm() {
    if (!machineName.trim()) return
    setError(null)
    addCustomMachine(machineName.trim(), machineVariant.trim() || undefined)
    if (onComplete) onComplete(confirmedVenue, machineName.trim())
    setStep(STEP.DONE)
  }

  // ── Venue capture source selection ──────────────────────────────────────────
  function chooseExterior() {
    setCaptureSource('exterior')
    setStep(STEP.VENUE_CAMERA)
  }

  function chooseInterior() {
    setCaptureSource('interior')
    setStep(STEP.VENUE_CAMERA)
  }

  // ── Skip helpers ────────────────────────────────────────────────────────────
  function skipVenueCamera() {
    stopCamera(streamRef.current)
    streamRef.current = null
    setStep(STEP.VENUE_CONFIRM)
  }

  function skipMachineCamera() {
    stopCamera(streamRef.current)
    streamRef.current = null
    setStep(STEP.MACHINE_CONFIRM)
  }

  function skipMachine() {
    setStep(STEP.DONE)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal} role="dialog" aria-modal="true"
           aria-label="Auto-discover venue and machine">

        {/* ── GPS lookup ── */}
        {step === STEP.GPS_LOOKUP && (
          <>
            <span className={styles.stepBadge}>Step 1 of 4 — Detecting Location</span>
            <h2 className={styles.heading}>📡 Checking your GPS…</h2>
            <p className={styles.subheading}>
              Looking for venues near your current location.
            </p>
            <div className={styles.spinner}>
              <div className={styles.spinnerRing} />
              <span className={styles.spinnerText}>Requesting GPS…</span>
            </div>
          </>
        )}

        {/* ── Venue capture choice ── */}
        {step === STEP.VENUE_CAPTURE_CHOICE && (
          <>
            <span className={styles.stepBadge}>Step 2 of 4 — Venue Name</span>
            <h2 className={styles.heading}>🏨 How would you like to capture the venue name?</h2>
            <p className={styles.subheading}>
              Choose the option that best describes where you are right now.
            </p>

            <div className={styles.captureChoiceGrid}>
              <button className={styles.captureChoiceCard} onClick={chooseExterior}>
                <span className={styles.captureChoiceIcon}>🚪</span>
                <span className={styles.captureChoiceBody}>
                  <span className={styles.captureChoiceTitle}>Front / Exterior Sign</span>
                  <span className={styles.captureChoiceDesc}>
                    Point your camera at the sign on the outside of the venue (e.g. building facade, entrance sign).
                  </span>
                </span>
              </button>

              <button className={styles.captureChoiceCard} onClick={chooseInterior}>
                <span className={styles.captureChoiceIcon}>🪧</span>
                <span className={styles.captureChoiceBody}>
                  <span className={styles.captureChoiceTitle}>Inside the Venue</span>
                  <span className={styles.captureChoiceDesc}>
                    Point your camera at interior signage, a menu, a receipt, wall art, or any branded item that shows the venue name.
                  </span>
                </span>
              </button>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btnSecondary} onClick={skipVenueCamera}>
                ✏️ Enter Manually
              </button>
              <button className={styles.btnDanger} onClick={onClose}>✕ Cancel</button>
            </div>
          </>
        )}

        {/* ── Venue camera ── */}
        {step === STEP.VENUE_CAMERA && (
          <>
            <span className={styles.stepBadge}>Step 2 of 4 — Venue Sign</span>
            {captureSource === 'interior' ? (
              <>
                <h2 className={styles.heading}>
                  🪧 Point your camera at <strong style={{ color: '#fbbf24' }}>interior signage, a menu, or a branded item</strong>
                </h2>
                <p className={styles.subheading}>
                  Align the item inside the golden frame so the venue name is visible, then tap Capture.
                </p>
              </>
            ) : (
              <>
                <h2 className={styles.heading}>
                  🏨 Point your camera at the <strong style={{ color: '#fbbf24' }}>front venue sign</strong>
                </h2>
                <p className={styles.subheading}>
                  Align the sign inside the golden frame, then tap Capture.
                </p>
              </>
            )}

            {error && <div className={styles.infoMsg}>{error}</div>}

            <div className={styles.cameraWrap}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} className={styles.cameraVideo} playsInline muted />
              <div className={styles.guideFrame} aria-hidden="true">
                <div className={`${styles.guideCorner} ${styles.tl}`} />
                <div className={`${styles.guideCorner} ${styles.tr}`} />
                <div className={`${styles.guideCorner} ${styles.bl}`} />
                <div className={`${styles.guideCorner} ${styles.br}`} />
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btnPrimary} onClick={handleVenueCapture}>
                {captureSource === 'interior' ? '📸 Capture Item' : '📸 Capture Sign'}
              </button>
              <button className={styles.btnSecondary} onClick={skipVenueCamera}>
                ✏️ Enter Manually
              </button>
            </div>
            <button className={styles.btnDanger} onClick={() => setStep(STEP.VENUE_CAPTURE_CHOICE)}
              aria-label="Go back to capture choice">← Back</button>
          </>
        )}

        {/* ── Venue OCR processing ── */}
        {step === STEP.VENUE_OCR && (
          <>
            <span className={styles.stepBadge}>Step 2 of 4 — Reading Sign…</span>
            <h2 className={styles.heading}>Hold steady…</h2>
            <div className={styles.spinner}>
              <div className={styles.spinnerRing} />
              <span className={styles.spinnerText}>Capturing &amp; reading text…</span>
            </div>
          </>
        )}

        {/* ── Venue confirm ── */}
        {step === STEP.VENUE_CONFIRM && (
          <>
            <span className={styles.stepBadge}>Step 2 of 4 — Confirm Venue</span>
            <h2 className={styles.heading}>🏨 Confirm Venue Details</h2>
            <p className={styles.subheading}>
              Edit any field if needed, then tap Confirm.
            </p>

            {venueDupe && (
              <div className={styles.dupeWarning}>
                ⚠️ Looks similar to an existing entry: <strong>{venueDupe}</strong><br />
                We've pre-filled that name — change it below if different.
              </div>
            )}

            {error && <div className={styles.infoMsg}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Venue Name *</label>
              <input
                className={styles.fieldInput}
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Southport RSL"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Suburb</label>
              <input
                className={styles.fieldInput}
                value={venueSuburb}
                onChange={(e) => setVenueSuburb(e.target.value)}
                placeholder="e.g. Southport"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Region</label>
              <input
                className={styles.fieldInput}
                value={venueRegion}
                onChange={(e) => setVenueRegion(e.target.value)}
                placeholder="e.g. Gold Coast North"
              />
            </div>

            <div className={styles.btnRow}>
              <button
                className={styles.btnPrimary}
                onClick={handleVenueConfirm}
                disabled={!venueName.trim()}
              >
                ✅ Confirm &amp; Check In
              </button>
              <button className={styles.btnSecondary} onClick={onClose}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* ── Machine camera ── */}
        {step === STEP.MACHINE_CAMERA && (
          <>
            <span className={styles.stepBadge}>Step 3 of 4 — Machine Name Plate</span>
            <h2 className={styles.heading}>
              🎰 Point camera at the <strong style={{ color: '#fbbf24' }}>machine name plate</strong>
            </h2>
            <p className={styles.subheading}>
              Aim at the top sign or name plate on the machine, then tap Capture.
            </p>

            {error && <div className={styles.infoMsg}>{error}</div>}

            <div className={styles.cameraWrap}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} className={styles.cameraVideo} playsInline muted />
              <div className={styles.guideFrame} aria-hidden="true">
                <div className={`${styles.guideCorner} ${styles.tl}`} />
                <div className={`${styles.guideCorner} ${styles.tr}`} />
                <div className={`${styles.guideCorner} ${styles.bl}`} />
                <div className={`${styles.guideCorner} ${styles.br}`} />
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btnPrimary} onClick={handleMachineCapture}>
                📸 Capture Name Plate
              </button>
              <button className={styles.btnSecondary} onClick={skipMachineCamera}>
                ✏️ Enter Manually
              </button>
            </div>
            <div className={styles.btnRow}>
              <button className={styles.btnDanger} onClick={skipMachine}>
                Skip Machine Step
              </button>
            </div>
          </>
        )}

        {/* ── Machine OCR processing ── */}
        {step === STEP.MACHINE_OCR && (
          <>
            <span className={styles.stepBadge}>Step 3 of 4 — Reading Name Plate…</span>
            <h2 className={styles.heading}>Hold steady…</h2>
            <div className={styles.spinner}>
              <div className={styles.spinnerRing} />
              <span className={styles.spinnerText}>Reading machine name plate…</span>
            </div>
          </>
        )}

        {/* ── Machine confirm ── */}
        {step === STEP.MACHINE_CONFIRM && (
          <>
            <span className={styles.stepBadge}>Step 3 of 4 — Confirm Machine</span>
            <h2 className={styles.heading}>🎰 Confirm Machine Details</h2>
            <p className={styles.subheading}>
              Edit if needed — largest text is the machine name, smaller text is the variant.
            </p>

            {machineDupe && (
              <div className={styles.dupeWarning}>
                ⚠️ Looks similar to: <strong>{machineDupe}</strong><br />
                We've pre-filled that — change below if different.
              </div>
            )}

            {error && <div className={styles.infoMsg}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Machine Name *</label>
              <input
                className={styles.fieldInput}
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                placeholder="e.g. Dragon Link"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Variant (optional)</label>
              <input
                className={styles.fieldInput}
                value={machineVariant}
                onChange={(e) => setMachineVariant(e.target.value)}
                placeholder="e.g. Autumn Moon"
              />
            </div>

            <div className={styles.btnRow}>
              <button
                className={styles.btnPrimary}
                onClick={handleMachineConfirm}
                disabled={!machineName.trim()}
              >
                ✅ Confirm Machine
              </button>
              <button className={styles.btnSecondary} onClick={skipMachine}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* ── Done / success ── */}
        {step === STEP.DONE && (
          <>
            <span className={styles.stepBadge}>Step 4 of 4 — All Set!</span>

            <div className={styles.successBanner}>
              <span className={styles.successIcon}>🎉</span>
              <h2 className={styles.successHeading}>All set!</h2>
              <p className={styles.successSub}>
                You can start your AI scan now.
              </p>
            </div>

            {confirmedVenue && (
              <div className={styles.detectedBox}>
                📍 Venue: <strong>{confirmedVenue.name}</strong>
                {confirmedVenue.suburb ? ` · ${confirmedVenue.suburb}` : ''}
              </div>
            )}

            {machineName && (
              <div className={styles.detectedBox}>
                🎰 Machine: <strong>{machineName}</strong>
                {machineVariant ? ` – ${machineVariant}` : ''}
              </div>
            )}

            <button
              className={styles.btnScan}
              onClick={() => {
                if (onStartScan) onStartScan(machineName.trim(), machineVariant.trim())
                if (onClose) onClose()
              }}
            >
              🤖 Start AI Scan Now
            </button>

            <button className={styles.btnSecondary} onClick={onClose}
              style={{ width: '100%', marginTop: '0.25rem' }}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}
