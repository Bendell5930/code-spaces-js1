/**
 * HelpFooter — persistent site-wide footer with Australian gambling help lines
 * and a link to BetStop (National Self-Exclusion Register).
 *
 * Rendered on every page via pages/_app.js.
 */

import styles from './HelpFooter.module.css'

export default function HelpFooter() {
  return (
    <footer className={styles.footer} role="contentinfo" aria-label="Gambling help and support">
      <div className={styles.inner}>
        <p className={styles.message}>
          🧡 If gambling is a problem for you or someone you know, help is available 24/7.
        </p>
        <ul className={styles.links} aria-label="Help line numbers">
          <li>
            <a
              href="https://www.gamblinghelponline.org.au"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Gambling Help Online
            </a>
            {' — '}
            <strong>1800 858 858</strong>
          </li>
          <li>
            Lifeline Australia{' — '}
            <strong>13 11 14</strong>
          </li>
          <li>
            <a
              href="https://www.betstop.gov.au"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              🚫 BetStop — National Self-Exclusion Register
            </a>
            {' (free, confidential)'}
          </li>
        </ul>
        <p className={styles.disclaimer}>
          Pokie Analyzer is a harm-reduction tool. It does not improve your odds,
          guarantee winnings, or encourage gambling. For adults 18+ only.{' '}
          <a href="/harm-minimisation" className={styles.infoLink}>
            Learn about our harm-minimisation features →
          </a>
        </p>
      </div>
    </footer>
  )
}
