import Head from 'next/head'
import Link from 'next/link'
import s from '../styles/landing.module.css'
import { STRIPE_PREMIUM_LINK } from '../lib/stripeLinks'

export default function Landing() {
  return (
    <>
      <Head>
        <title>Pokie Analyzer — AI-Powered Australian Pokie Machine Tracker</title>
        <meta name="description" content="Track, scan, and analyze Australian pokie machines with AI. Real-time heat maps, session stats, community insights, and responsible gambling tools." />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Pokie Analyzer — AI-Powered Pokie Machine Tracker" />
        <meta property="og:description" content="Track, scan, and analyze Australian pokie machines with AI. Real-time heat maps, session stats, and community insights." />
        <meta property="og:url" content="https://pokieanalyzer.com.au/landing" />
        <meta property="og:image" content="https://pokieanalyzer.com.au/icons/icon-512.png" />
        <meta property="og:site_name" content="Pokie Analyzer" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pokie Analyzer — AI-Powered Pokie Machine Tracker" />
        <meta name="twitter:description" content="Track, scan, and analyze Australian pokie machines with AI. Real-time heat maps, session stats, and community insights." />
        <meta name="twitter:image" content="https://pokieanalyzer.com.au/icons/icon-512.png" />
      </Head>

      <div className={s.page}>
        {/* ─── Nav ─── */}
        <nav className={s.nav}>
          <span className={s.logo}>POKIE ANALYZER</span>
          <div className={s.navLinks}>
            <a href="#features" className={s.navLink}>Features</a>
            <a href="#pricing" className={s.navLink}>Pricing</a>
            <Link href="/privacy" className={s.navLink}>Privacy</Link>
            <Link href="/" className={s.navCta}>Open App</Link>
          </div>
        </nav>

        {/* ─── Hero ─── */}
        <section className={s.hero}>
          <span className={s.heroLabel}>🇦🇺 Built for Australian Players</span>
          <h1 className={s.heroTitle}>
            Track Your Pokies
            <br />
            <span className={s.heroHighlight}>Smarter with AI</span>
          </h1>
          <p className={s.heroSub}>
            Scan machines with your camera, log every spin, view real-time heat maps, and join a
            community of smart players — all in one app.
          </p>
          <div className={s.heroCtas}>
            <Link href="/" className={s.primaryBtn}>Start Free →</Link>
            <a href="#features" className={s.secondaryBtn}>See Features</a>
          </div>

          <div className={s.heroTrust}>
            <span className={s.trustItem}>🔒 Privacy-first design</span>
            <span className={s.trustItem}>📱 Works on any device</span>
            <span className={s.trustItem}>🎰 9 machine brands supported</span>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="features" className={s.features}>
          <p className={s.sectionLabel}>Features</p>
          <h2 className={s.sectionTitle}>Everything You Need</h2>
          <p className={s.sectionSub}>
            From AI scanning to community leaderboards, Pokie Analyzer gives you the full picture.
          </p>

          <div className={s.featureGrid}>
            <div className={s.featureCard}>
              <span className={s.featureIcon}>📷</span>
              <h3 className={s.featureName}>AI Camera Scan</h3>
              <p className={s.featureDesc}>
                Point your phone at any supported machine. Our AI detects the brand, reads the screen,
                and logs data automatically.
              </p>
            </div>

            <div className={s.featureCard}>
              <span className={s.featureIcon}>🎰</span>
              <h3 className={s.featureName}>Pokie Calculator</h3>
              <p className={s.featureDesc}>
                Full machine simulation with denomination, bet-per-line, play lines, bonus tracking,
                and gamble feature — just like the real thing.
              </p>
            </div>

            <div className={s.featureCard}>
              <span className={s.featureIcon}>🔥</span>
              <h3 className={s.featureName}>Heat Map</h3>
              <p className={s.featureDesc}>
                See which machines are running hot or cold with visual heat grids, trend charts,
                and bonus gap analysis.
              </p>
            </div>

            <div className={s.featureCard}>
              <span className={s.featureIcon}>💬</span>
              <h3 className={s.featureName}>Community Hub</h3>
              <p className={s.featureDesc}>
                Chat with other players, share wins, climb the leaderboard, and earn badges as
                you track more sessions.
              </p>
            </div>

            <div className={s.featureCard}>
              <span className={s.featureIcon}>📍</span>
              <h3 className={s.featureName}>Venue Insights</h3>
              <p className={s.featureDesc}>
                Browse pubs and clubs across Australia. Track your favourite venues and compare
                performance across locations.
              </p>
            </div>

            <div className={s.featureCard}>
              <span className={s.featureIcon}>🛡️</span>
              <h3 className={s.featureName}>Harm Minimization</h3>
              <p className={s.featureDesc}>
                Built-in session limits, spend tracking, cool-down reminders, and direct links to
                Gambling Help Online.
              </p>
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className={s.howItWorks}>
          <p className={s.sectionLabel}>How It Works</p>
          <h2 className={s.sectionTitle}>Get Started in 3 Steps</h2>
          <p className={s.sectionSub}>No sign-up required. Open the app and start tracking.</p>

          <div className={s.steps}>
            <div className={s.step}>
              <div className={s.stepNum}>1</div>
              <div className={s.stepContent}>
                <h3 className={s.stepTitle}>Open the App</h3>
                <p className={s.stepDesc}>
                  Works instantly in your browser or install as a PWA on your phone for offline access.
                </p>
              </div>
            </div>
            <div className={s.step}>
              <div className={s.stepNum}>2</div>
              <div className={s.stepContent}>
                <h3 className={s.stepTitle}>Select Your Machine</h3>
                <p className={s.stepDesc}>
                  Pick from 9 supported brands including Dragon Link, Lightning Link, Piggy Bankin, and more. Or scan with AI.
                </p>
              </div>
            </div>
            <div className={s.step}>
              <div className={s.stepNum}>3</div>
              <div className={s.stepContent}>
                <h3 className={s.stepTitle}>Track &amp; Analyze</h3>
                <p className={s.stepDesc}>
                  Log spins, view your session stats, check the heat map, and share your results with the community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section id="pricing" className={s.pricing}>
          <p className={s.sectionLabel}>Pricing</p>
          <h2 className={s.sectionTitle}>Simple, Fair Pricing</h2>
          <p className={s.sectionSub}>Start free. Upgrade when you want the full experience.</p>

          <div className={s.pricingGrid}>
            <div className={s.priceCard}>
              <h3 className={s.priceName}>Basic</h3>
              <div className={`${s.priceAmount} ${s.priceFree}`}>Free</div>
              <ul className={s.priceFeatures}>
                <li>Pokie Calculator</li>
                <li>Spin History (last 20)</li>
                <li>Session Stats</li>
                <li>Harm Minimization Tools</li>
              </ul>
              <Link href="/" className={`${s.priceBtn} ${s.priceBtnFree}`}>Get Started</Link>
            </div>

            <div className={`${s.priceCard} ${s.priceCardPremium}`}>
              <span className={s.priceBadge}>Most Popular</span>
              <h3 className={s.priceName}>Premium</h3>
              <div className={s.priceAmount}>$9<span>/month</span></div>
              <ul className={s.priceFeatures}>
                <li>Everything in Basic</li>
                <li>AI Camera Scan</li>
                <li>Full Spin History</li>
                <li>Heat Map Analysis</li>
                <li>Community Hub</li>
                <li>Venue Insights</li>
                <li>All Machine Brands</li>
                <li>AI Auto-Detection</li>
              </ul>
              <Link href="/?upgrade=1" className={`${s.priceBtn} ${s.priceBtnPremium}`}>Start Premium →</Link>
            </div>
          </div>
        </section>

        {/* ─── Responsible Gambling ─── */}
        <section className={s.responsible}>
          <div className={s.responsibleCard}>
            <h3 className={s.responsibleTitle}>🛡️ Committed to Responsible Gambling</h3>
            <p className={s.responsibleText}>
              Pokie Analyzer includes built-in session limits, spend alerts, and cool-down reminders.
              We encourage all players to set personal limits and seek help if gambling stops being fun.
            </p>
            <p className={s.responsibleText}>
              <a
                className={s.responsibleLink}
                href="https://www.gamblinghelponline.org.au"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gambling Help Online
              </a>
              {' '}| Call 1800 858 858 (24/7, free &amp; confidential)
            </p>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className={s.footer}>
          <span className={s.footerLeft}>© {new Date().getFullYear()} Pokie Analyzer</span>
          <div className={s.footerLinks}>
            <Link href="/privacy" className={s.footerLink}>Privacy Policy</Link>
            <Link href="/terms" className={s.footerLink}>Terms of Service</Link>
            <Link href="/" className={s.footerLink}>Open App</Link>
            <a
              className={s.footerLink}
              href="https://www.gamblinghelponline.org.au"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gambling Help
            </a>
          </div>
        </footer>
      </div>
    </>
  )
}
