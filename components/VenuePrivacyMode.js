/**
 * VenuePrivacyMode — Launch disclaimer reminding users of venue privacy obligations.
 *
 * Displayed on first launch and once per session (or when settings are cleared).
 * Users must accept before using the app. Covers:
 * - Legal obligation to respect venue privacy policies
 * - Prohibition on photographing patrons or staff
 * - Data encryption & storage transparency
 * - Links to responsible gambling resources
 */

import { useState, useEffect } from 'react'
import { DATA_POLICY } from '../lib/dataEncryption'
import styles from './VenuePrivacyMode.module.css'

const VENUE_ACCEPTED_KEY = 'pokie-venue-privacy-accepted'
const SESSION_DISMISSED_KEY = 'pokie-venue-session-dismissed'

export default function VenuePrivacyMode({ children }) {
  const [accepted, setAccepted] = useState(true) // default true to avoid flash
  const [showDataInfo, setShowDataInfo] = useState(false)
  const [checkPrivacy, setCheckPrivacy] = useState(false)
  const [checkNoPhoto, setCheckNoPhoto] = useState(false)
  const [checkData, setCheckData] = useState(false)

  useEffect(() => {
    // Check if user has previously accepted AND this session hasn't been dismissed
    const hasAccepted = localStorage.getItem(VENUE_ACCEPTED_KEY)
    const sessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY)

    if (!hasAccepted || !sessionDismissed) {
      setAccepted(false)
    }
  }, [])

  function handleAccept() {
    if (!checkPrivacy || !checkNoPhoto || !checkData) return
    localStorage.setItem(VENUE_ACCEPTED_KEY, Date.now().toString())
    sessionStorage.setItem(SESSION_DISMISSED_KEY, '1')
    setAccepted(true)
  }

  if (accepted) return children

  const allChecked = checkPrivacy && checkNoPhoto && checkData

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.shieldIcon}>🛡️</div>
          <h2 className={styles.title}>Venue Privacy Mode</h2>
          <p className={styles.subtitle}>
            Please read and acknowledge before continuing
          </p>
        </div>

        {/* Policy sections */}
        <div className={styles.content}>
          {/* Section 1: Venue Privacy */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🏛️</span>
              <h3 className={styles.sectionTitle}>Venue Privacy Obligations</h3>
            </div>
            <p className={styles.sectionText}>
              You are <strong>legally obligated</strong> to respect the privacy policies of
              any gaming venue you visit. Venues may restrict or prohibit the use of
              recording devices. Always check with venue staff before using any camera
              or scanning features.
            </p>
          </div>

          {/* Section 2: No Photography */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📵</span>
              <h3 className={styles.sectionTitle}>No Photography of People</h3>
            </div>
            <p className={styles.sectionText}>
              <strong>Do not photograph, record, or capture</strong> other patrons,
              venue staff, or any individuals. This app&apos;s AI scanning feature is
              designed to focus exclusively on machine screens. The app will
              automatically stop if people are detected in the camera frame.
            </p>
            <ul className={styles.bulletList}>
              <li>No photos/videos of other patrons</li>
              <li>No photos/videos of venue staff</li>
              <li>No wide-angle shots of the gaming floor</li>
              <li>No recording of conversations (audio is always disabled)</li>
            </ul>
          </div>

          {/* Section 3: Data Privacy */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔒</span>
              <h3 className={styles.sectionTitle}>Your Data Is Protected</h3>
            </div>
            <p className={styles.sectionText}>
              All data stored by this app is <strong>encrypted using {DATA_POLICY.encryption.algorithm}</strong>.
              We employ a &quot;Safety by Design&quot; approach — no sensitive financial
              information is ever stored.
            </p>
            <button
              className={styles.dataToggle}
              onClick={() => setShowDataInfo(!showDataInfo)}
            >
              {showDataInfo ? 'Hide' : 'View'} Data Policy Details {showDataInfo ? '▲' : '▼'}
            </button>

            {showDataInfo && (
              <div className={styles.dataDetails}>
                <div className={styles.dataColumn}>
                  <h4 className={styles.dataHeading}>
                    <span className={styles.redDot}></span> Never Stored
                  </h4>
                  <ul className={styles.dataList}>
                    {DATA_POLICY.neverStored.map((item, i) => (
                      <li key={i} className={styles.neverItem}>✕ {item}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.dataColumn}>
                  <h4 className={styles.dataHeading}>
                    <span className={styles.greenDot}></span> Stored (Encrypted)
                  </h4>
                  <ul className={styles.dataList}>
                    {DATA_POLICY.storedEncrypted.map((item, i) => (
                      <li key={i} className={styles.storedItem}>🔐 {item}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.encInfo}>
                  <p><strong>Algorithm:</strong> {DATA_POLICY.encryption.algorithm}</p>
                  <p><strong>Key Derivation:</strong> {DATA_POLICY.encryption.keyDerivation}</p>
                  <p><strong>Transit:</strong> {DATA_POLICY.encryption.transit}</p>
                </div>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className={styles.checkboxes}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={checkPrivacy}
                onChange={(e) => setCheckPrivacy(e.target.checked)}
                className={styles.checkbox}
              />
              <span>I understand my obligation to respect venue privacy policies</span>
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={checkNoPhoto}
                onChange={(e) => setCheckNoPhoto(e.target.checked)}
                className={styles.checkbox}
              />
              <span>I will not photograph or record other patrons or staff</span>
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={checkData}
                onChange={(e) => setCheckData(e.target.checked)}
                className={styles.checkbox}
              />
              <span>I acknowledge how my data is stored and protected</span>
            </label>
          </div>

          {/* Responsible gambling reminder */}
          <div className={styles.helpBanner}>
            <p>
              If gambling is affecting you or someone you know, call{' '}
              <strong>1800 858 858</strong> or visit{' '}
              <a
                href="https://www.gamblinghelponline.org.au"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gambling Help Online
              </a>
            </p>
          </div>
        </div>

        {/* Accept button */}
        <div className={styles.footer}>
          <button
            className={`${styles.acceptBtn} ${allChecked ? styles.acceptActive : ''}`}
            onClick={handleAccept}
            disabled={!allChecked}
          >
            {allChecked ? '✓ I Agree — Enter App' : 'Please tick all boxes above'}
          </button>
        </div>
      </div>
    </div>
  )
}
