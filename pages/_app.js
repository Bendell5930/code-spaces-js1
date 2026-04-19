import { useEffect } from 'react'
import '../global.css'
import TermsOfService from '../components/TermsOfService'
import VenuePrivacyMode from '../components/VenuePrivacyMode'
import LaunchReminder from '../components/LaunchReminder'
import { Analytics } from '@vercel/analytics/next'

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    // Unregister stale service workers in development
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      })
    }
  }, [])

  return (
    <>
      <TermsOfService>
        <VenuePrivacyMode>
          <LaunchReminder>
            <Component {...pageProps} />
          </LaunchReminder>
        </VenuePrivacyMode>
      </TermsOfService>
      <Analytics />
    </>
  )
}
