/**
 * LaunchReminder — "Machines are random" pop-up shown every time the app is opened.
 *
 * Displays after ToS and Venue Privacy are accepted. Shown once per page load.
 * A brief, regulator-friendly reminder that reinforces responsible play.
 */

import { useState, useEffect } from 'react'
import styles from './LaunchReminder.module.css'

const SESSION_REMINDER_KEY = 'pokie-launch-reminder-seen'

export default function LaunchReminder({ children }) {
  const [dismissed, setDismissed] = useState(true) // true to avoid flash
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_REMINDER_KEY)
    if (!seen) {
      setDismissed(false)
    }
  }, [])

  function handleDismiss() {
    setFadeOut(true)
    setTimeout(() => {
      sessionStorage.setItem(SESSION_REMINDER_KEY, '1')
      setDismissed(true)
    }, 300)
  }

  if (dismissed) return children

  return (
    <>
      {children}
      <div className={`${styles.overlay} ${fadeOut ? styles.fadeOut : ''}`}>
        <div className={`${styles.card} ${fadeOut ? styles.cardOut : ''}`}>
          <div className={styles.iconRow}>
            <span className={styles.dice}>🎰</span>
          </div>
          <h3 className={styles.heading}>Quick Reminder</h3>
          <p className={styles.message}>
            Machines are <strong>random</strong>. Past results do not influence
            future spins. Play for <strong>fun</strong>, not for profit.
          </p>
          <div className={styles.divider}></div>
          <p className={styles.sub}>
            Set your limits, take breaks, and enjoy responsibly.
          </p>
          <button className={styles.dismissBtn} onClick={handleDismiss}>
            Got it — Let&apos;s Go
          </button>
          <p className={styles.helpLine}>
            Need help? Call <strong>1800 858 858</strong>
          </p>
        </div>
      </div>
    </>
  )
}
