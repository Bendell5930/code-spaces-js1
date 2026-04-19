import Head from 'next/head'
import Link from 'next/link'
import s from '../styles/privacy.module.css'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Pokie Analyzer</title>
        <meta name="description" content="Privacy policy for Pokie Analyzer (PokieAnalyzer.com.au). Learn how we handle your data, what we collect, and how we protect your privacy under the Australian Privacy Principles." />
        <meta property="og:title" content="Privacy Policy — Pokie Analyzer" />
        <meta property="og:description" content="Privacy policy for Pokie Analyzer. Australian Privacy Principles compliant." />
        <meta property="og:url" content="https://pokieanalyzer.com.au/privacy" />
      </Head>

      <div className={s.page}>
        <nav className={s.nav}>
          <Link href="/landing" className={s.logo}>POKIE ANALYZER</Link>
          <Link href="/" className={s.backLink}>← Back to App</Link>
        </nav>

        <div className={s.container}>
          <h1 className={s.title}>Privacy Policy</h1>
          <p className={s.updated}>Effective date: 19 April 2026</p>

          <div className={s.highlight}>
            <p>
              <strong>TL;DR:</strong> Your spin, session, venue and community data stays on your device in localStorage
              and is never transmitted to us. The only data that leaves your device is Stripe subscription data
              (handled by Stripe, PCI-DSS Level 1 certified). We do not use analytics trackers, advertising pixels,
              or third-party data sharing.
            </p>
          </div>

          {/* 1 — Who We Are */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>1. Who We Are</h2>
            <p className={s.text}>
              PokieAnalyzer.com.au (&quot;the App&quot; or &quot;Pokie Analyzer&quot;) is operated by:
            </p>
            <ul className={s.list}>
              <li><strong>Operator:</strong> Benjamin John Ryan trading as Pokie Analyzer</li>
              <li><strong>ABN:</strong> 82 879 317 580</li>
              <li><strong>Registered address:</strong> 3 Devitt St, Aspley QLD 4034, Australia</li>
              <li><strong>Contact email:</strong>{' '}
                <a className={s.link} href="mailto:Benjamin@pokieanalyzer.com.au">Benjamin@pokieanalyzer.com.au</a>
              </li>
            </ul>
            <p className={s.text}>
              This Privacy Policy explains how we handle personal information in accordance with the
              <em> Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
            </p>
          </div>

          {/* 2 — What Information We Collect */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>2. What Information We Collect</h2>
            <p className={s.text}>
              <strong>We collect minimal data.</strong> The App operates primarily on your device using browser
              localStorage. Here is what we process:
            </p>
            <ul className={s.list}>
              <li><strong>Spin &amp; session data</strong> — Bet amounts, win amounts, machine names, and session
                stats. Stored locally on your device only. <em>Never transmitted to us.</em></li>
              <li><strong>Venue preferences</strong> — Venues you choose to track. Stored locally on your device only. <em>Never transmitted to us.</em></li>
              <li><strong>Community data</strong> — Nicknames and messages you post in the Community Hub. Stored locally. <em>Never transmitted to us.</em></li>
              <li><strong>Subscription data</strong> — If you subscribe to Premium, Stripe processes your payment.
                We retain only your Stripe customer ID and subscription status (locally) to verify your plan.
                We never see your card details.</li>
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
              <li>No audio is recorded at any time. The microphone is never activated.</li>
              <li>Venue interiors are not photographed or transmitted.</li>
              <li>Raw video frames are never saved to your device or uploaded — only extracted numeric data (balance, bet, win amounts) is retained in localStorage.</li>
            </ul>
          </div>

          {/* 4 — Local Storage */}
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
              <li>We retain only your Stripe customer ID and subscription status (stored locally) to verify your plan.</li>
              <li>You can manage or cancel your subscription at any time via the Stripe Customer Portal.</li>
              <li>Stripe&apos;s privacy practices are governed by the{' '}
                <a className={s.link} href="https://stripe.com/au/privacy" target="_blank" rel="noopener noreferrer">
                  Stripe Privacy Policy
                </a>.
              </li>
            </ul>
          </div>

          {/* 6 — Cookies & Tracking */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>6. Cookies &amp; Tracking</h2>
            <p className={s.text}>
              Pokie Analyzer <strong>does not use Google Analytics, Facebook Pixel, advertising trackers, or any
              third-party analytics scripts</strong>. We do not set tracking cookies. The only browser storage
              used is localStorage for your App data as described above.
            </p>
          </div>

          {/* 7 — Disclosure to Third Parties */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>7. Disclosure to Third Parties</h2>
            <p className={s.text}>
              We do <strong>not</strong> sell, rent, or share your personal information with any third party,
              except for Stripe (solely for payment processing as described above). No other third parties
              receive your data.
            </p>
          </div>

          {/* 8 — Data Security */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>8. Data Security</h2>
            <p className={s.text}>
              Because almost all data is stored on your own device, you control its security. For the limited
              subscription data handled by Stripe, Stripe maintains industry-standard PCI-DSS Level 1
              compliance. We recommend keeping your device and browser up to date and using a secure
              network when making payments.
            </p>
          </div>

          {/* 9 — Your Rights (APPs) */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>9. Your Rights Under the Australian Privacy Principles</h2>
            <p className={s.text}>
              Under the Australian Privacy Principles (APPs) you have the right to:
            </p>
            <ul className={s.list}>
              <li><strong>Access</strong> — request access to any personal information we hold about you.</li>
              <li><strong>Correction</strong> — request correction of inaccurate or out-of-date information.</li>
              <li><strong>Complaint</strong> — make a complaint if you believe we have breached your privacy rights.</li>
            </ul>
            <p className={s.text}>
              To exercise these rights, contact us at{' '}
              <a className={s.link} href="mailto:Benjamin@pokieanalyzer.com.au">Benjamin@pokieanalyzer.com.au</a>.
              If you are not satisfied with our response, you may lodge a complaint with the Office of the
              Australian Information Commissioner (OAIC) at{' '}
              <a className={s.link} href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">
                www.oaic.gov.au
              </a>.
            </p>
          </div>

          {/* 10 — Gaming Machine Compliance */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>10. Gaming Machine Compliance &amp; QLD Gambling Code s 233</h2>
            <p className={s.text}>
              Pokie Analyzer is a <strong>passive observation and record-keeping tool</strong>. It is designed to
              comply with all Australian state and territory gaming legislation, including the{' '}
              <em>Gaming Machine Act 1991</em> (Qld) and the Queensland Gambling Code of Practice.
            </p>
            <div className={s.highlight}>
              <p>
                <strong>Section 233 Compliance:</strong> Pokie Analyzer does not and cannot
                interlock with, connect to, modify, influence, or interfere with any gaming machine hardware,
                software, random number generator, or internal computer system in any way.
              </p>
            </div>
            <p className={s.text}>
              The App operates entirely on your personal device and only records information that is
              visually displayed on the machine&apos;s external screen or voluntarily entered by the user.
            </p>
          </div>

          {/* 11 — Children */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>11. Children</h2>
            <p className={s.text}>
              Pokie Analyzer is intended for adults aged 18 and over. We do not knowingly collect data from
              anyone under the age of 18. If you believe a minor has used the App, please contact us at{' '}
              <a className={s.link} href="mailto:Benjamin@pokieanalyzer.com.au">Benjamin@pokieanalyzer.com.au</a>.
            </p>
          </div>

          {/* 12 — Changes */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>12. Changes to This Policy</h2>
            <p className={s.text}>
              We may update this Privacy Policy from time to time. Any changes will be reflected on this page
              with an updated effective date. Continued use of the App after changes constitutes
              acceptance of the updated policy.
            </p>
          </div>

          {/* 13 — Contact */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>13. Contact Us</h2>
            <p className={s.text}>
              If you have questions about this Privacy Policy or how the App handles your data, please contact:
            </p>
            <ul className={s.list}>
              <li><strong>Email:</strong>{' '}
                <a className={s.link} href="mailto:Benjamin@pokieanalyzer.com.au">Benjamin@pokieanalyzer.com.au</a>
              </li>
              <li><strong>Postal address:</strong> 3 Devitt St, Aspley QLD 4034, Australia</li>
            </ul>
          </div>
        </div>

        <footer className={s.footer}>
          © {new Date().getFullYear()} Benjamin John Ryan trading as Pokie Analyzer (ABN 82 879 317 580) ·{' '}
          <Link href="/landing" className={s.link}>Home</Link> ·{' '}
          <Link href="/terms" className={s.link}>Terms of Service</Link> ·{' '}
          <Link href="/" className={s.link}>Open App</Link>
        </footer>
      </div>
    </>
  )
}
