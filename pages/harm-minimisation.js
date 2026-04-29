/**
 * /harm-minimisation — Explains all harm-reduction features
 * and links to Australian gambling help services.
 */

import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/harm-minimisation.module.css'

const HELP_SERVICES = [
  {
    name: 'Gambling Help Online',
    detail: '1800 858 858 — free, confidential counselling, 24/7',
    url: 'https://www.gamblinghelponline.org.au',
    label: 'Visit Gambling Help Online',
  },
  {
    name: 'BetStop — National Self-Exclusion Register',
    detail: 'Self-exclude from all Australian licensed online wagering services for free.',
    url: 'https://www.betstop.gov.au',
    label: 'Visit BetStop',
  },
  {
    name: 'Lifeline Australia',
    detail: '13 11 14 — crisis support, 24/7',
    url: null,
    label: null,
  },
  {
    name: 'National Debt Helpline',
    detail: '1800 007 007 — free financial counselling',
    url: null,
    label: null,
  },
]

const FEATURES = [
  {
    icon: '⏱️',
    title: 'Session Timer & Reality Check',
    desc:
      'Pokie Analyzer tracks how long you have been using the app in a session. Every 30 minutes (configurable) a non-dismissable reality-check reminder appears, showing your session length and net position so you can make an informed decision about whether to continue or take a break.',
  },
  {
    icon: '💰',
    title: 'Spend Tracker',
    desc:
      'Log money you have spent in a session and see running totals for today, this week, and this month. When you approach or exceed your self-set daily or weekly limit, the tracker changes colour to give you a clear warning.',
  },
  {
    icon: '🛡️',
    title: 'Personal Limits',
    desc:
      'Visit the My Limits page to set your daily spend limit, weekly spend limit, session time limit, and session loss limit — all stored securely on your device. These limits are set while you are thinking clearly, before you start playing.',
    link: '/limits',
    linkLabel: 'Set my limits →',
  },
  {
    icon: '🚦',
    title: 'Session Loss Limit Alert',
    desc:
      'If your net loss in a single session reaches the limit you set, an alert will appear prompting you to end the session. This gives you a firm boundary decided in advance.',
  },
  {
    icon: '🧘',
    title: 'Rapid-Play (Dissociation) Alert',
    desc:
      'If the app detects you are logging spins very quickly (a potential sign of dissociation), it pauses to show your current net position and asks you to verify you are still within your planned budget.',
  },
  {
    icon: '🚫',
    title: 'BetStop Self-Exclusion Link',
    desc:
      'A clearly visible link to BetStop — Australia\'s National Self-Exclusion Register — is shown throughout the app. BetStop lets you self-exclude from all Australian licensed online wagering services, free and confidentially.',
    externalLink: 'https://www.betstop.gov.au',
    externalLabel: 'Visit BetStop →',
  },
  {
    icon: '🧡',
    title: 'Persistent Help Footer',
    desc:
      'Every page in Pokie Analyzer displays a footer with Australian gambling help-line numbers and a link to BetStop. If you or someone you know needs help, the numbers are always visible.',
  },
  {
    icon: '🔞',
    title: '18+ Age Verification',
    desc:
      'On your first visit, you are asked to confirm you are 18 years or older. The app is intended strictly for adults of legal gambling age.',
  },
  {
    icon: '⚖️',
    title: 'Terms of Service & Responsible Gambling Statement',
    desc:
      'Before using the app, you read and agree to terms that clearly state: Pokie Analyzer is a record-keeping tool only, it cannot predict outcomes, and you are solely responsible for your own decisions.',
  },
]

export default function HarmMinimisation() {
  return (
    <>
      <Head>
        <title>Harm Minimisation — Pokie Analyzer</title>
        <meta
          name="description"
          content="Learn about the harm-minimisation features in Pokie Analyzer and find Australian gambling help services."
        />
      </Head>

      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <Link href="/" className={styles.back}>
              ← Back to app
            </Link>
            <div className={styles.headerIcon} aria-hidden="true">🛡️</div>
            <h1 className={styles.title}>Harm Minimisation</h1>
            <p className={styles.subtitle}>
              Pokie Analyzer is built around one core belief: informed players
              make better decisions. Every feature in this app is designed to
              help you stay in control and reduce the risk of gambling-related harm.
            </p>
          </div>

          {/* Help services call-out */}
          <section className={styles.helpCallout} aria-label="Australian gambling help services">
            <h2 className={styles.helpCalloutTitle}>
              🧡 Help is always available — free, 24/7
            </h2>
            <ul className={styles.helpServiceList}>
              {HELP_SERVICES.map((s) => (
                <li key={s.name} className={styles.helpServiceItem}>
                  <strong>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.helpServiceLink}
                        aria-label={s.label}
                      >
                        {s.name}
                      </a>
                    ) : (
                      s.name
                    )}
                  </strong>
                  <br />
                  <span className={styles.helpServiceDetail}>{s.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Features list */}
          <section aria-labelledby="features-heading">
            <h2 id="features-heading" className={styles.featuresTitle}>
              What&apos;s built in
            </h2>
            <div className={styles.featureGrid}>
              {FEATURES.map((f) => (
                <div key={f.title} className={styles.featureCard}>
                  <div className={styles.featureIcon} aria-hidden="true">{f.icon}</div>
                  <div>
                    <h3 className={styles.featureName}>{f.title}</h3>
                    <p className={styles.featureDesc}>{f.desc}</p>
                    {f.link && (
                      <Link href={f.link} className={styles.featureLink}>
                        {f.linkLabel}
                      </Link>
                    )}
                    {f.externalLink && (
                      <a
                        href={f.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.featureLink}
                      >
                        {f.externalLabel}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mission statement */}
          <section className={styles.mission} aria-labelledby="mission-heading">
            <h2 id="mission-heading" className={styles.missionTitle}>Our stance</h2>
            <p className={styles.missionText}>
              Pokie Analyzer does not encourage gambling, does not suggest that
              tracking data improves your odds, and does not glamourise wins.
              Pokie machines are designed to return less than you put in over time.
              This app helps you see that clearly and set firm boundaries so that
              gambling remains — if you choose to engage — a finite, affordable
              form of entertainment rather than a financial risk.
            </p>
            <p className={styles.missionText}>
              If you are concerned about your gambling or that of someone you
              care about, please reach out to the free services listed above.
              Speaking to a counsellor costs nothing and could make a real
              difference.
            </p>
          </section>

          {/* Footer nav */}
          <div className={styles.footerNav}>
            <Link href="/limits" className={styles.cta}>
              🛡️ Set my personal limits
            </Link>
            <Link href="/" className={styles.ctaSecondary}>
              Return to app →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
