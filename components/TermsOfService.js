/**
 * TermsOfService — Full click-through legal agreement.
 *
 * Shown once (persisted in localStorage). User must scroll through the full ToS
 * and check the acknowledgment box before the "I Agree" button activates.
 * Satisfies Australian Consumer Law (ACL) requirements.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './TermsOfService.module.css'

const TOS_ACCEPTED_KEY = 'pokie-tos-accepted'
const TOS_VERSION = '1.0'
const LAST_UPDATED = 'March 31, 2026'

export default function TermsOfService({ children }) {
  const [accepted, setAccepted] = useState(true) // true to avoid flash
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [checked, setChecked] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem(TOS_ACCEPTED_KEY)
    if (!stored) {
      setAccepted(false)
      return
    }
    try {
      const data = JSON.parse(stored)
      if (data.version !== TOS_VERSION) {
        setAccepted(false) // new version — re-accept
      }
    } catch {
      setAccepted(false)
    }
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // Consider "scrolled to bottom" if within 40px of the end
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setScrolledToBottom(true)
    }
  }, [])

  function handleAccept() {
    if (!checked || !scrolledToBottom) return
    localStorage.setItem(
      TOS_ACCEPTED_KEY,
      JSON.stringify({
        version: TOS_VERSION,
        acceptedAt: new Date().toISOString(),
        timestamp: Date.now(),
      })
    )
    setAccepted(true)
  }

  if (accepted) return children

  const canAccept = scrolledToBottom && checked

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.icon}>⚖️</div>
          <h2 className={styles.title}>Terms of Service &amp; User Agreement</h2>
          <p className={styles.subtitle}>
            Please read carefully before continuing
          </p>
        </div>

        {/* Scrollable ToS body */}
        <div
          className={styles.scrollArea}
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <p className={styles.updated}>Last Updated: {LAST_UPDATED}</p>

          {/* Section 1 */}
          <div className={styles.section}>
            <h3 className={styles.sectionNum}>1. BINDING AGREEMENT</h3>
            <p className={styles.sectionText}>
              By downloading, accessing, or using Slot Analizer (the &quot;App&quot;),
              you (&quot;The User&quot;) agree to be bound by these Terms of Service.
              If you do not agree to these terms, you must immediately cease use of
              the App and delete it from your device.
            </p>
          </div>

          {/* Section 2 */}
          <div className={styles.section}>
            <h3 className={styles.sectionNum}>
              2. NATURE OF SERVICE: &quot;HISTORICAL DATA ONLY&quot;
            </h3>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>No Predictive Capability</h4>
              <p className={styles.sectionText}>
                You acknowledge and agree that the App is a <strong>data collection
                and visualization tool only</strong>.
              </p>
            </div>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>Randomness Acknowledgment</h4>
              <p className={styles.sectionText}>
                You understand that Electronic Gaming Machines (EGMs) operate using
                Random Number Generators (RNG). Past outcomes (represented in this
                App as &quot;Trends&quot; or &quot;Historical Variance&quot;) have{' '}
                <strong>zero influence on future results</strong>.
              </p>
            </div>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>Entertainment Purposes</h4>
              <p className={styles.sectionText}>
                All graphs, &quot;Hot/Cold&quot; indicators, and win/loss data are
                provided strictly for entertainment and personal record-keeping
                purposes. The App does not, and cannot, &quot;read,&quot;
                &quot;hack,&quot; or &quot;predict&quot; the internal state of any
                gaming machine.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className={styles.section}>
            <h3 className={styles.sectionNum}>
              3. LIMITATION OF LIABILITY &amp; NO FINANCIAL GUARANTEE
            </h3>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>Total Loss Responsibility</h4>
              <p className={styles.sectionText}>
                You agree that <strong>you are solely responsible for your gambling
                decisions</strong>. Slot Analizer and its developers are not liable
                for any financial losses, damages, or emotional distress resulting
                from your use of the App or your gambling activities.
              </p>
            </div>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>&quot;As Is&quot; Basis</h4>
              <p className={styles.sectionText}>
                The App is provided &quot;as is.&quot; While we strive for accuracy
                in user-submitted data, we do not warrant that the information
                provided (including &quot;Live Chat&quot; or &quot;Leaderboards&quot;)
                is accurate, reliable, or real-time.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className={styles.section}>
            <h3 className={styles.sectionNum}>
              4. RESPONSIBLE GAMBLING &amp; HARM MINIMISATION
            </h3>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>Personal Limits</h4>
              <p className={styles.sectionText}>
                You agree to use the App&apos;s built-in &quot;Loss Limit&quot; and
                &quot;Session Timer&quot; tools as a guide for responsible play.
              </p>
            </div>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>Self-Exclusion</h4>
              <p className={styles.sectionText}>
                If you are currently self-excluded from any gaming venue,{' '}
                <strong>you must not use this App</strong>.
              </p>
            </div>
            <div className={styles.helpBox}>
              <p>
                If you feel your gambling is becoming a problem, please contact{' '}
                <strong>Gambling Help Online</strong> on{' '}
                <strong>1800 858 858</strong> or visit{' '}
                <a
                  href="https://www.gamblinghelponline.org.au"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  gamblinghelponline.org.au
                </a>
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className={styles.section}>
            <h3 className={styles.sectionNum}>
              5. USER CONDUCT &amp; VENUE COMPLIANCE
            </h3>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>Venue Rules</h4>
              <p className={styles.sectionText}>
                You agree to comply with all rules and privacy policies of the
                physical gaming venue you are in. This includes respecting &quot;No
                Photography&quot; zones and the privacy of other patrons.
              </p>
            </div>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>Community Standards</h4>
              <p className={styles.sectionText}>
                You will not use the &quot;Live Chat&quot; to harass, solicit loans,
                or share illegal content. We reserve the right to ban any user for
                anti-social behavior without notice.
              </p>
            </div>
            <div className={styles.clause}>
              <h4 className={styles.clauseTitle}>Illegal Activity</h4>
              <p className={styles.sectionText}>
                Any attempt to use this App to facilitate money laundering, fraud, or
                machine tampering will result in an <strong>immediate permanent
                ban</strong> and reporting to the relevant authorities.
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className={styles.section}>
            <h3 className={styles.sectionNum}>6. DATA PRIVACY</h3>
            <p className={styles.sectionText}>
              We value your privacy. Your win/loss data is aggregated anonymously for
              the community. We do not sell your personal identifying information to
              third parties. Please refer to our Privacy Policy for full details on
              data encryption.
            </p>
          </div>

          {/* Section 7 */}
          <div className={styles.section}>
            <h3 className={styles.sectionNum}>
              7. ACKNOWLEDGMENT OF INDEPENDENCE
            </h3>
            <p className={styles.sectionText}>
              Slot Analizer is an <strong>independent third-party application</strong>.
              It is not endorsed by, affiliated with, or sponsored by the Office of
              Liquor and Gaming Regulation (OLGR), any gaming machine manufacturer,
              or any specific gaming venue.
            </p>
          </div>

          {/* Scroll indicator */}
          {!scrolledToBottom && (
            <div className={styles.scrollHint}>
              ↓ Scroll down to read all terms ↓
            </div>
          )}
        </div>

        {/* Checkbox + Accept */}
        <div className={styles.footer}>
          {!scrolledToBottom && (
            <p className={styles.scrollWarning}>
              Please scroll through the entire agreement to continue
            </p>
          )}

          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={!scrolledToBottom}
              className={styles.checkbox}
            />
            <span className={scrolledToBottom ? '' : styles.dimmed}>
              I understand that Slot Analizer is for <strong>entertainment only</strong> and
              cannot predict wins. I accept <strong>full responsibility</strong> for my
              financial decisions.
            </span>
          </label>

          <button
            className={`${styles.acceptBtn} ${canAccept ? styles.acceptActive : ''}`}
            onClick={handleAccept}
            disabled={!canAccept}
          >
            {canAccept
              ? '✓ I Agree to the Terms of Service'
              : !scrolledToBottom
                ? 'Read the full agreement first'
                : 'Tick the checkbox above'}
          </button>
        </div>
      </div>
    </div>
  )
}
