/**
 * AgeVerification — 18+ acknowledgement modal.
 *
 * Shown once on first visit (stored in localStorage).
 * The user must confirm they are 18 years or older before continuing.
 * Includes links to help services for vulnerable visitors.
 */

import { useState, useEffect } from 'react'
import styles from './AgeVerification.module.css'

const AGE_KEY = 'pokie-age-verified'

export default function AgeVerification({ children }) {
  // Start as verified to avoid a flash; updated in useEffect
  const [verified, setVerified] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AGE_KEY)
      if (!stored) setVerified(false)
    } catch {
      setVerified(false)
    }
  }, [])

  function handleConfirm() {
    try {
      localStorage.setItem(AGE_KEY, JSON.stringify({ verifiedAt: Date.now() }))
    } catch { /* storage unavailable */ }
    setVerified(true)
  }

  if (verified) return children

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="age-title">
      <div className={styles.modal}>
        <div className={styles.icon} aria-hidden="true">🔞</div>
        <h2 id="age-title" className={styles.title}>Adults Only — 18+</h2>
        <p className={styles.body}>
          Pokie Analyzer is designed for adults aged <strong>18 years and over</strong>{' '}
          in Australia. You must be of legal gambling age in your state or territory
          to use this application.
        </p>
        <p className={styles.body}>
          This tool is intended to help you track and understand your play — it does{' '}
          <strong>not</strong> improve your odds or guarantee any outcome. Gambling
          should always be kept within your personal means.
        </p>

        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          aria-label="Confirm I am 18 years or older and enter the app"
        >
          ✔ I am 18 or older — Enter
        </button>

        <div className={styles.helpSection} aria-label="Gambling help resources">
          <p className={styles.helpHeading}>
            If gambling is a problem for you or someone you know:
          </p>
          <ul className={styles.helpList}>
            <li>
              <a
                href="https://www.gamblinghelponline.org.au"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gambling Help Online
              </a>{' '}
              — <strong>1800 858 858</strong> (free, 24/7)
            </li>
            <li>
              Lifeline Australia — <strong>13 11 14</strong> (free, 24/7)
            </li>
            <li>
              <a
                href="https://www.betstop.gov.au"
                target="_blank"
                rel="noopener noreferrer"
              >
                BetStop National Self-Exclusion Register
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
