import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PokieAI" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />

        {/* Primary Meta Tags */}
        <meta name="description" content="AI-powered Australian pokie machine analyzer — scan, track, and analyze your sessions with real-time heat maps, community insights, and responsible gambling tools." />
        <meta name="keywords" content="pokie analyzer, pokies, australian pokies, slot machine tracker, pokie heat map, gambling tracker, AI pokie scanner, dragon link, lightning link" />
        <meta name="author" content="Pokie Analyzer" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Pokie Analyzer" />
        <meta property="og:title" content="Pokie Analyzer — AI-Powered Pokie Machine Tracker" />
        <meta property="og:description" content="Track, scan, and analyze Australian pokie machines with AI. Real-time heat maps, session stats, and community insights." />
        <meta property="og:url" content="https://pokieanalyzer.com.au" />
        <meta property="og:image" content="https://pokieanalyzer.com.au/icons/icon-512.png" />
        <meta property="og:locale" content="en_AU" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pokie Analyzer — AI-Powered Pokie Machine Tracker" />
        <meta name="twitter:description" content="Track, scan, and analyze Australian pokie machines with AI. Real-time heat maps, session stats, and community insights." />
        <meta name="twitter:image" content="https://pokieanalyzer.com.au/icons/icon-512.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
