{/* TEMPLATE NOTICE: This Terms of Service is a template prepared for PokieAnalyzer.com.au.
    It should be reviewed by a qualified Australian lawyer before being relied upon. */}
import Head from 'next/head'
import Link from 'next/link'
import s from '../styles/privacy.module.css'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — Pokie Analyzer</title>
        <meta name="description" content="Terms of Service for PokieAnalyzer.com.au. Please read before using the app." />
        <meta property="og:title" content="Terms of Service — Pokie Analyzer" />
        <meta property="og:description" content="Terms of Service for PokieAnalyzer.com.au." />
        <meta property="og:url" content="https://pokieanalyzer.com.au/terms" />
      </Head>

      <div className={s.page}>
        <nav className={s.nav}>
          <Link href="/landing" className={s.logo}>POKIE ANALYZER</Link>
          <Link href="/" className={s.backLink}>← Back to App</Link>
        </nav>

        <div className={s.container}>
          <h1 className={s.title}>Terms of Service</h1>
          <p className={s.updated}>Effective date: 19 April 2026</p>

          <div className={s.highlight}>
            <p>
              <strong>Important:</strong> By using PokieAnalyzer.com.au you accept these Terms of Service.
              This App is for harm-minimisation, education, tracking and entertainment purposes only.
              It does not predict or guarantee gambling outcomes.
            </p>
          </div>

          {/* 1 — Introduction & Acceptance */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>1. Introduction &amp; Acceptance</h2>
            <p className={s.text}>
              These Terms of Service (&quot;Terms&quot;) govern your use of PokieAnalyzer.com.au and any related
              services (collectively, &quot;the App&quot; or &quot;Pokie Analyzer&quot;). By accessing or using the App,
              you agree to be bound by these Terms. If you do not agree, do not use the App.
            </p>
          </div>

          {/* 2 — Operator Details */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>2. Operator Details</h2>
            <ul className={s.list}>
              <li><strong>Operator:</strong> Benjamin John Ryan trading as Pokie Analyzer</li>
              <li><strong>ABN:</strong> 82 879 317 580</li>
              <li><strong>Registered address:</strong> 3 Devitt St, Aspley QLD 4034, Australia</li>
              <li><strong>Contact email:</strong>{' '}
                <a className={s.link} href="mailto:Benjamin@pokieanalyzer.com.au">Benjamin@pokieanalyzer.com.au</a>
              </li>
            </ul>
          </div>

          {/* 3 — Eligibility */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>3. Eligibility</h2>
            <p className={s.text}>
              You must be at least <strong>18 years of age</strong> and legally permitted to gamble in your
              jurisdiction to use this App. By using the App you represent and warrant that you meet these
              requirements. The App is provided for harm-minimisation, education, session tracking and
              entertainment purposes only.
            </p>
          </div>

          {/* 4 — No Gambling Outcome Guarantees */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>4. No Gambling Outcome Guarantees</h2>
            <p className={s.text}>
              Pokie Analyzer <strong>does not predict, influence, or guarantee gambling outcomes</strong>.
              Electronic gaming machines (pokies) are games of chance regulated by certified random number
              generators (RNGs). All analytics, heat maps, statistics, and other information provided by
              the App are <strong>informational only</strong> and do not constitute advice or a system for
              winning. Past performance displayed in the App is not indicative of future results. You
              gamble at your own risk.
            </p>
          </div>

          {/* 5 — Responsible Gambling */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>5. Responsible Gambling</h2>
            <p className={s.text}>
              We are committed to responsible gambling. The App includes session limits, spend tracking,
              cool-down reminders, and direct links to support services. If gambling is causing you
              distress, please seek help:
            </p>
            <ul className={s.list}>
              <li>
                <a className={s.link} href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer">
                  Gambling Help Online
                </a>{' '}— www.gamblinghelponline.org.au
              </li>
              <li>Phone: <strong>1800 858 858</strong> (24/7, free &amp; confidential)</li>
            </ul>
          </div>

          {/* 6 — Account & Data */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>6. Account &amp; Data</h2>
            <p className={s.text}>
              Most App data (spins, sessions, venue preferences, community posts) is stored in your
              browser&apos;s localStorage on your device. We do not maintain user accounts on our servers.
              You are solely responsible for backing up your data. We cannot recover data that is lost
              through browser clearing, device loss, or other means.
            </p>
          </div>

          {/* 7 — Subscriptions & Payments */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>7. Subscriptions &amp; Payments</h2>
            <p className={s.text}>
              The Premium plan is available for <strong>A$9.00 per month</strong>, billed via Stripe.
            </p>
            <ul className={s.list}>
              <li>Subscriptions auto-renew monthly until cancelled.</li>
              <li>You may cancel at any time via the Stripe Customer Portal (accessible from within the App) or
                by emailing{' '}
                <a className={s.link} href="mailto:Benjamin@pokieanalyzer.com.au">Benjamin@pokieanalyzer.com.au</a>.
              </li>
              <li>No refunds are provided for partial billing periods, except where required by the
                Australian Consumer Law.</li>
              <li>All prices are in Australian dollars (AUD) and include GST where applicable.</li>
            </ul>
          </div>

          {/* 8 — Australian Consumer Law */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>8. Australian Consumer Law</h2>
            <p className={s.text}>
              Our goods and services come with guarantees that cannot be excluded under the Australian Consumer
              Law. For major failures with the service, you are entitled to:
            </p>
            <ul className={s.list}>
              <li>Cancel your service contract with us; and</li>
              <li>A refund for the unused portion, or to compensation for its reduced value.</li>
            </ul>
            <p className={s.text}>
              You are also entitled to be compensated for any other reasonably foreseeable loss or damage.
              If the failure does not amount to a major failure, you are entitled to have problems with the
              service rectified in a reasonable time and, if this is not done, to cancel your contract and
              obtain a refund for the unused portion of the contract.
            </p>
          </div>

          {/* 9 — Intellectual Property */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>9. Intellectual Property</h2>
            <p className={s.text}>
              All content, branding, code, design, and materials on the App are the intellectual property
              of Benjamin John Ryan / Pokie Analyzer, unless otherwise stated. You may not reproduce,
              distribute, or create derivative works without prior written consent.
            </p>
          </div>

          {/* 10 — Acceptable Use */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>10. Acceptable Use</h2>
            <p className={s.text}>You agree not to:</p>
            <ul className={s.list}>
              <li>Scrape, crawl, or harvest data from the App by automated means.</li>
              <li>Reverse engineer, decompile, or otherwise attempt to derive the source code of the App.</li>
              <li>Use the App for any unlawful gambling activity or to circumvent gaming regulations.</li>
              <li>Post abusive, harassing, or unlawful content in the Community Hub.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
            </ul>
          </div>

          {/* 11 — Disclaimer & Limitation of Liability */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>11. Disclaimer &amp; Limitation of Liability</h2>
            <p className={s.text}>
              To the maximum extent permitted by law (and subject to your rights under the Australian
              Consumer Law), the App is provided &quot;as is&quot; without warranty of any kind. We are not liable
              for any loss or damage arising from your use of the App, including gambling losses, data loss,
              or reliance on information provided by the App. Our total liability to you for any claim is
              limited to the amount you paid for the App in the 12 months preceding the claim.
            </p>
          </div>

          {/* 12 — Indemnity */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>12. Indemnity</h2>
            <p className={s.text}>
              You agree to indemnify, defend, and hold harmless Benjamin John Ryan / Pokie Analyzer and its
              officers, employees, and agents from and against any claims, liabilities, damages, losses, and
              expenses (including legal fees) arising out of or in connection with your use of the App or
              your violation of these Terms.
            </p>
          </div>

          {/* 13 — Modifications to the Service / Terms */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>13. Modifications to the Service &amp; Terms</h2>
            <p className={s.text}>
              We reserve the right to modify, suspend, or discontinue the App (or any part thereof) at any
              time with reasonable notice. We may also update these Terms from time to time. The updated
              Terms will be posted on this page with a new effective date. Continued use of the App after
              changes constitutes acceptance of the updated Terms.
            </p>
          </div>

          {/* 14 — Termination */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>14. Termination</h2>
            <p className={s.text}>
              We may terminate or suspend your access to the App immediately, without prior notice or
              liability, if you breach these Terms or if we reasonably believe your use of the App is
              harmful. Upon termination, your right to use the App ceases immediately. Provisions that by
              their nature should survive termination will do so.
            </p>
          </div>

          {/* 15 — Governing Law */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>15. Governing Law</h2>
            <p className={s.text}>
              These Terms are governed by the laws of Queensland, Australia. You agree to submit to the
              exclusive jurisdiction of the courts of Queensland for the resolution of any dispute arising
              out of or in connection with these Terms.
            </p>
          </div>

          {/* 16 — Contact */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>16. Contact</h2>
            <p className={s.text}>
              For any questions regarding these Terms, please contact:
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
          <Link href="/privacy" className={s.link}>Privacy Policy</Link> ·{' '}
          <Link href="/" className={s.link}>Open App</Link>
        </footer>
      </div>
    </>
  )
}
