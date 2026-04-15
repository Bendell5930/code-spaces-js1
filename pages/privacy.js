import Head from 'next/head'
import Link from 'next/link'
import s from '../styles/privacy.module.css'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Pokie Analyzer</title>
        <meta name="description" content="Privacy policy for Pokie Analyzer. Learn how we handle your data, what we collect, and how we protect your privacy." />
        <meta property="og:title" content="Privacy Policy — Pokie Analyzer" />
        <meta property="og:description" content="Privacy policy for Pokie Analyzer. Learn how we handle your data." />
        <meta property="og:url" content="https://pokieanalyzer.com.au/privacy" />
      </Head>

      <div className={s.page}>
        <nav className={s.nav}>
          <Link href="/landing" className={s.logo}>POKIE ANALYZER</Link>
          <Link href="/" className={s.backLink}>← Back to App</Link>
        </nav>

        <div className={s.container}>
          <h1 className={s.title}>Privacy Policy</h1>
          <p className={s.updated}>Last updated: 11 April 2026</p>

          <div className={s.highlight}>
            <p>
              <strong>TL;DR:</strong> Your data stays on your device. We do not collect, store, or sell personal
              information. Camera access is only used for machine scanning and never records people or venues.
            </p>
          </div>

          {/* 1 — Who We Are */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>1. Who We Are</h2>
            <p className={s.text}>
              Pokie Analyzer (&quot;the App&quot;) is an Australian-built web application that helps players track
              and analyze pokie machine sessions. The App is operated from Australia and is designed for use in
              Australian pubs and clubs.
            </p>
          </div>

          {/* 2 — Data We Collect */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>2. Data We Collect</h2>
            <p className={s.text}>
              <strong>We collect minimal data.</strong> The App operates primarily on your device using browser
              localStorage. Here is what we process:
            </p>
            <ul className={s.list}>
              <li><strong>Spin &amp; session data</strong> — Bet amounts, win amounts, machine names, and session
                stats. Stored locally on your device only.</li>
              <li><strong>Venue preferences</strong> — Venues you choose to track. Stored locally on your device only.</li>
              <li><strong>Community data</strong> — Nicknames and messages you post in the Community Hub. Stored locally.</li>
              <li><strong>Subscription data</strong> — If you subscribe to Premium, Stripe processes your payment.
                We receive your Stripe customer ID and subscription status but never see your card details.</li>
            </ul>
          </div>

          {/* 3 — Camera & AI Scanning */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>3. Camera &amp; AI Scanning</h2>
            <p className={s.text}>
              The AI Scan feature requests access to your device camera. Our privacy safeguards ensure:
            </p>
            <ul className={s.list}>
              <li>Camera frames are processed <strong>on your device only</strong> — nothing is uploaded to any server.</li>
              <li>The system is designed to detect machine screens only — it does not capture or store images of people.</li>
              <li>No audio is recorded at any time.</li>
              <li>Venue interiors are not photographed or transmitted.</li>
              <li>All scanning complies with Australian recording standards as set out in our recording policy.</li>
            </ul>
          </div>

          {/* 4 — localStorage */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>4. Local Storage</h2>
            <p className={s.text}>
              All user-generated data (spins, session stats, tracked venues, community posts, preferences)
              is stored in your browser&apos;s localStorage. This means:
            </p>
            <ul className={s.list}>
              <li>Data never leaves your device unless you explicitly share it.</li>
              <li>Clearing your browser data will permanently delete all App data.</li>
              <li>We cannot recover lost data because we never had access to it.</li>
            </ul>
          </div>

          {/* 5 — Payments & Stripe */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>5. Payments &amp; Stripe</h2>
            <p className={s.text}>
              Premium subscriptions are processed by{' '}
              <a className={s.link} href="https://stripe.com/au/privacy" target="_blank" rel="noopener noreferrer">
                Stripe
              </a>
              , a PCI-DSS Level 1 certified payment processor. When you subscribe:
            </p>
            <ul className={s.list}>
              <li>Stripe collects and secures your payment details directly — we never see your card number.</li>
              <li>We store your Stripe customer ID and subscription status locally to verify your plan.</li>
              <li>You can manage or cancel your subscription at any time via the Stripe Customer Portal.</li>
            </ul>
          </div>

          {/* 6 — Cookies & Tracking */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>6. Cookies &amp; Tracking</h2>
            <p className={s.text}>
              Pokie Analyzer <strong>does not use cookies, analytics trackers, or third-party advertising scripts</strong>.
              We do not use Google Analytics, Facebook Pixel, or any similar tracking tools. The only browser storage
              used is localStorage for your App data.
            </p>
          </div>

          {/* 7 — Third-Party Services */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>7. Third-Party Services</h2>
            <p className={s.text}>
              The App uses the following third-party services:
            </p>
            <ul className={s.list}>
              <li><strong>Stripe</strong> — Payment processing for Premium subscriptions.</li>
              <li><strong>Vercel</strong> — Hosting and deployment of the web application.</li>
            </ul>
            <p className={s.text}>
              No other third-party services receive your data.
            </p>
          </div>

          {/* 8 — Harm Minimization */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>8. Harm Minimization</h2>
            <p className={s.text}>
              The App includes responsible gambling features such as session time limits, spend alerts,
              and cool-down reminders. These features process data locally and are designed to help
              you stay in control of your gambling activity.
            </p>
            <p className={s.text}>
              If you or someone you know needs support:{' '}
              <a className={s.link} href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer">
                Gambling Help Online
              </a>{' '}
              | 1800 858 858 (24/7, free &amp; confidential).
            </p>
          </div>

          {/* 9 — Gaming Machine Compliance (QLD s 233) */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>9. Gaming Machine Compliance &amp; QLD Gambling Code s 233</h2>
            <p className={s.text}>
              Pokie Analyzer is a <strong>passive observation and record-keeping tool</strong>. It is designed to
              comply with all Australian state and territory gaming legislation, including the{' '}
              <em>Gaming Machine Act 1991</em> (Qld) and the Queensland Gambling Code of Practice.
            </p>
            <div className={s.highlight}>
              <p>
                <strong>Section 233 Compliance:</strong> Under section 233 of the Queensland Gaming Machine Act 1991,
                it is an offence to possess a device that is designed or adapted to interfere with the proper
                operation of a gaming machine&apos;s computer or equipment. Pokie Analyzer does not and cannot
                interlock with, connect to, modify, influence, or interfere with any gaming machine hardware,
                software, random number generator, or internal computer system in any way.
              </p>
            </div>
            <p className={s.text}>
              The App operates entirely on your personal device (phone, tablet, or computer). It:
            </p>
            <ul className={s.list}>
              <li>Does <strong>not</strong> connect to, communicate with, or send signals to any gaming machine.</li>
              <li>Does <strong>not</strong> attempt to read, intercept, or modify data from a machine&apos;s internal systems.</li>
              <li>Does <strong>not</strong> influence or predict the outcome of any spin — outcomes are determined solely by the machine&apos;s certified random number generator.</li>
              <li>Does <strong>not</strong> exploit, bypass, or interfere with any gaming machine security or audit mechanism.</li>
              <li>Only records information that is <strong>visually displayed</strong> on the machine&apos;s external screen and voluntarily entered by the user.</li>
            </ul>
            <p className={s.text}>
              Pokie Analyzer complies with equivalent provisions across all Australian jurisdictions, including
              the <em>Casino Control Act 1992</em> (NSW), <em>Gambling Regulation Act 2003</em> (Vic),
              and applicable regulations in SA, WA, TAS, NT, and the ACT.
            </p>
          </div>

          {/* 10 — Venue Recording Policy */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>10. Venue Recording Policy</h2>
            <p className={s.text}>
              Australian pubs, clubs, and RSLs typically have venue-specific policies regarding photography
              and recording on their premises. Pokie Analyzer is designed to respect these policies:
            </p>
            <ul className={s.list}>
              <li><strong>No audio recording</strong> — The microphone is never activated. No conversations, ambient sounds, or venue audio are captured at any time.</li>
              <li><strong>No venue interior photography</strong> — The AI scanning system uses pixel-level detection to focus exclusively on the machine screen. If the camera captures surrounding areas, those regions are masked and discarded.</li>
              <li><strong>No recording of people</strong> — Person detection is active during scanning. If a person is detected in the camera frame, scanning pauses immediately and no image data is stored.</li>
              <li><strong>Single machine focus</strong> — The scanner is designed to capture one machine at a time. Camera movement away from the target machine automatically stops the session.</li>
              <li><strong>No images stored</strong> — Raw video frames are never saved to your device or uploaded. Only extracted numeric data (balance, bet, win amounts) is retained.</li>
            </ul>
            <p className={s.text}>
              Users are responsible for complying with the individual recording and photography policies of the
              venue they are visiting. We recommend:
            </p>
            <ul className={s.list}>
              <li>Checking with venue staff before using the AI Scan feature if you are unsure of their policy.</li>
              <li>Using the manual Calculator mode (which requires no camera) if the venue prohibits recording devices.</li>
              <li>Being mindful of other patrons&apos; privacy at all times.</li>
            </ul>
            <p className={s.text}>
              The App&apos;s built-in recording policy enforces all of the above safeguards automatically via
              the privacy guard system. These protections cannot be disabled by the user.
            </p>
          </div>

          {/* 11 — Children */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>11. Children</h2>
            <p className={s.text}>
              Pokie Analyzer is intended for adults aged 18 and over. We do not knowingly collect data from
              anyone under the age of 18. If you believe a minor has used the App, please contact us.
            </p>
          </div>

          {/* 12 — Data Deletion */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>12. Your Rights &amp; Data Deletion</h2>
            <p className={s.text}>
              Since all data is stored on your device, you have full control:
            </p>
            <ul className={s.list}>
              <li><strong>View your data</strong> — All your data is visible within the App.</li>
              <li><strong>Delete your data</strong> — Clear your browser&apos;s localStorage or use the reset buttons within the App.</li>
              <li><strong>Cancel subscription</strong> — Use the Manage Subscription button in the App to access the Stripe Customer Portal.</li>
            </ul>
            <p className={s.text}>
              Under the Australian Privacy Act 1988, you have the right to access and correct personal information.
              Since we do not store your personal information on our servers, this right is inherently met through
              your device&apos;s browser controls.
            </p>
          </div>

          {/* 13 — Changes */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>13. Changes to This Policy</h2>
            <p className={s.text}>
              We may update this Privacy Policy from time to time. Any changes will be reflected on this page
              with an updated &quot;Last updated&quot; date. Continued use of the App after changes constitutes
              acceptance of the updated policy.
            </p>
          </div>

          {/* 14 — Contact */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>14. Contact</h2>
            <p className={s.text}>
              If you have questions about this Privacy Policy or how the App handles your data,
              please reach out via the App&apos;s Community Hub or contact us through our website.
            </p>
          </div>
        </div>

        <footer className={s.footer}>
          © {new Date().getFullYear()} Pokie Analyzer · <Link href="/landing" className={s.link}>Home</Link> · <Link href="/" className={s.link}>Open App</Link>
        </footer>
      </div>
    </>
  )
}
