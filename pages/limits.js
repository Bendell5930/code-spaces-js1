/**
 * /limits — User-set limits panel.
 *
 * Lets users configure daily spend limit, weekly spend limit, and
 * session time limit. Also surfaces cool-off interval and other
 * safety settings from sessionManager. All stored in localStorage.
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { loadSpendLimits, saveSpendLimits } from '../lib/spendTracker'
import { loadSettings, saveSettings } from '../lib/sessionManager'
import styles from '../styles/limits.module.css'

export default function LimitsPage() {
  const [spendLimits, setSpendLimits] = useState(null)
  const [safetySettings, setSafetySettings] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSpendLimits(loadSpendLimits())
    setSafetySettings(loadSettings())
  }, [])

  function handleSave() {
    if (spendLimits) saveSpendLimits(spendLimits)
    if (safetySettings) saveSettings(safetySettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function updateSpend(key, value) {
    setSpendLimits((prev) => ({ ...prev, [key]: value }))
  }

  function updateSafety(key, value) {
    setSafetySettings((prev) => ({ ...prev, [key]: value }))
  }

  if (!spendLimits || !safetySettings) return null

  return (
    <>
      <Head>
        <title>My Limits — Pokie Analyzer</title>
        <meta
          name="description"
          content="Set your personal spend limits and session time limits to stay in control."
        />
      </Head>

      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <Link href="/" className={styles.back} aria-label="Back to home">
              ← Back
            </Link>
            <div className={styles.headerIcon} aria-hidden="true">🛡️</div>
            <h1 className={styles.title}>My Limits</h1>
            <p className={styles.subtitle}>
              Set your personal spending and session limits. These limits help you
              stay in control of your play before you start.
            </p>
          </div>

          {/* Spend Limits */}
          <section className={styles.section} aria-labelledby="spend-limits-heading">
            <h2 id="spend-limits-heading" className={styles.sectionTitle}>
              💰 Spend Limits
            </h2>
            <p className={styles.sectionDesc}>
              The app will warn you with a colour change when you approach or
              exceed these amounts. Limits are checked against your recorded spend
              for the day and week.
            </p>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="daily-limit">
                Daily spend limit (AUD)
              </label>
              <div className={styles.inputRow}>
                <span className={styles.currency} aria-hidden="true">$</span>
                <input
                  id="daily-limit"
                  type="number"
                  min="0"
                  step="10"
                  className={styles.input}
                  value={spendLimits.dailyLimit || ''}
                  placeholder="0 = not set"
                  onChange={(e) =>
                    updateSpend('dailyLimit', Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  aria-describedby="daily-limit-desc"
                />
              </div>
              <span id="daily-limit-desc" className={styles.fieldHint}>
                Enter 0 to disable this limit.
              </span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="weekly-limit">
                Weekly spend limit (AUD)
              </label>
              <div className={styles.inputRow}>
                <span className={styles.currency} aria-hidden="true">$</span>
                <input
                  id="weekly-limit"
                  type="number"
                  min="0"
                  step="10"
                  className={styles.input}
                  value={spendLimits.weeklyLimit || ''}
                  placeholder="0 = not set"
                  onChange={(e) =>
                    updateSpend('weeklyLimit', Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  aria-describedby="weekly-limit-desc"
                />
              </div>
              <span id="weekly-limit-desc" className={styles.fieldHint}>
                Tracks Monday to Sunday. Enter 0 to disable.
              </span>
            </div>
          </section>

          {/* Session Time Limit */}
          <section className={styles.section} aria-labelledby="session-time-heading">
            <h2 id="session-time-heading" className={styles.sectionTitle}>
              ⏱️ Session Time Limit
            </h2>
            <p className={styles.sectionDesc}>
              Receive a reminder when your session reaches this length. Set to 0
              to rely only on the cool-off interval below.
            </p>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="session-time">
                Session time limit (minutes)
              </label>
              <input
                id="session-time"
                type="number"
                min="0"
                step="5"
                className={styles.input}
                value={spendLimits.sessionTimeLimit || ''}
                placeholder="0 = not set"
                onChange={(e) =>
                  updateSpend('sessionTimeLimit', Math.max(0, parseInt(e.target.value) || 0))
                }
                aria-describedby="session-time-desc"
              />
              <span id="session-time-desc" className={styles.fieldHint}>
                Example: 60 = warn after 1 hour.
              </span>
            </div>
          </section>

          {/* Cool-Off Settings */}
          <section className={styles.section} aria-labelledby="cooloff-heading">
            <h2 id="cooloff-heading" className={styles.sectionTitle}>
              ☕ Reality Check Interval
            </h2>
            <p className={styles.sectionDesc}>
              A reality-check reminder will appear every set number of minutes
              while you have an active session, prompting you to review how long
              you&apos;ve been playing.
            </p>

            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>Enable reality-check reminders</div>
              </div>
              <button
                role="switch"
                aria-checked={safetySettings.enableCoolOff}
                className={`${styles.toggle} ${safetySettings.enableCoolOff ? styles.toggleOn : ''}`}
                onClick={() => updateSafety('enableCoolOff', !safetySettings.enableCoolOff)}
                aria-label="Toggle reality-check reminders"
              />
            </div>

            {safetySettings.enableCoolOff && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="cooloff-interval">
                  Reminder interval (minutes)
                </label>
                <input
                  id="cooloff-interval"
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  className={styles.input}
                  value={safetySettings.coolOffIntervalMin}
                  onChange={(e) =>
                    updateSafety('coolOffIntervalMin', Math.max(5, parseInt(e.target.value) || 30))
                  }
                />
              </div>
            )}
          </section>

          {/* Session Loss Limit */}
          <section className={styles.section} aria-labelledby="loss-limit-heading">
            <h2 id="loss-limit-heading" className={styles.sectionTitle}>
              🚦 Session Loss Limit
            </h2>
            <p className={styles.sectionDesc}>
              When your net loss in a single session reaches this amount, you
              will receive an alert prompting you to end the session. Set to 0
              to disable.
            </p>

            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>Enable session loss limit</div>
              </div>
              <button
                role="switch"
                aria-checked={safetySettings.enableBudgetGuard}
                className={`${styles.toggle} ${safetySettings.enableBudgetGuard ? styles.toggleOn : ''}`}
                onClick={() => updateSafety('enableBudgetGuard', !safetySettings.enableBudgetGuard)}
                aria-label="Toggle session loss limit"
              />
            </div>

            {safetySettings.enableBudgetGuard && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="loss-limit">
                  Session loss limit (AUD)
                </label>
                <div className={styles.inputRow}>
                  <span className={styles.currency} aria-hidden="true">$</span>
                  <input
                    id="loss-limit"
                    type="number"
                    min="0"
                    step="10"
                    className={styles.input}
                    value={safetySettings.lossLimit || ''}
                    placeholder="0 = not set"
                    onChange={(e) =>
                      updateSafety('lossLimit', Math.max(0, parseFloat(e.target.value) || 0))
                    }
                  />
                </div>
              </div>
            )}
          </section>

          {/* Save Button */}
          <div className={styles.saveRow}>
            <button className={styles.saveBtn} onClick={handleSave}>
              {saved ? '✅ Saved!' : '💾 Save My Limits'}
            </button>
          </div>

          {/* BetStop & Help Links */}
          <section className={styles.helpBox} aria-label="Help and self-exclusion links">
            <h3 className={styles.helpTitle}>Need more support?</h3>
            <ul className={styles.helpList}>
              <li>
                <a
                  href="https://www.betstop.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.helpLink}
                >
                  🚫 BetStop — National Self-Exclusion Register
                </a>
                <br />
                <span className={styles.helpDesc}>
                  Exclude yourself from all Australian licensed online wagering services for free.
                </span>
              </li>
              <li>
                <a
                  href="https://www.gamblinghelponline.org.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.helpLink}
                >
                  Gambling Help Online — 1800 858 858
                </a>
                <br />
                <span className={styles.helpDesc}>Free, confidential counselling 24/7.</span>
              </li>
              <li>
                <span className={styles.helpLink}>Lifeline Australia — 13 11 14</span>
                <br />
                <span className={styles.helpDesc}>Crisis support, 24/7.</span>
              </li>
            </ul>
            <p className={styles.helpNote}>
              <Link href="/harm-minimisation" className={styles.infoLink}>
                Learn more about all our harm-minimisation features →
              </Link>
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
