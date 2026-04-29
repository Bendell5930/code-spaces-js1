/** @type {import('next').NextConfig} */

// ─── Security headers ─────────────────────────────────────────────────────
//
// A Content Security Policy is the most effective defence against XSS in
// the community chat / spin-log UI. The policy below is restrictive by
// default and only opens up the third-party origins this app actually
// needs:
//
//   • Stripe   — checkout.js, hosted checkout iframe, billing portal
//   • Vercel   — Vercel Analytics script + beacon endpoint
//   • Supabase — REST/Auth/Storage over HTTPS + Realtime over WebSockets
//   • Self     — everything else, no inline scripts
//
// `unsafe-inline` is permitted for styles only because Next.js / CSS
// Modules ship critical CSS inline at runtime. Scripts must be served
// from a trusted origin (or be Stripe's signed scripts).
//
// `frame-src` allows Stripe Checkout to render in an iframe.
// `connect-src` allows fetches to Stripe / Vercel / Supabase from the
// browser; `wss://*.supabase.co` is required for Supabase Realtime.
//
// If you use a custom Supabase domain, add it to `connect-src` and
// `img-src` below.

const supabaseHttp = 'https://*.supabase.co'
const supabaseWs = 'wss://*.supabase.co'

const ContentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' is required for scripts because Next.js injects
  // small inline bootstrap scripts for hydration/routing. Removing it
  // would break the app. The proper hardening is to issue a per-request
  // nonce from middleware and use 'strict-dynamic' — see
  // https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  // Track this as a follow-up before any production launch.
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https: ${supabaseHttp}`,
  "font-src 'self' data:",
  `connect-src 'self' https://api.stripe.com https://*.vercel-insights.com https://*.vercel-scripts.com ${supabaseHttp} ${supabaseWs}`,
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://billing.stripe.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  // Lock down browser features the app does not use. Camera and
  // geolocation are granted to self for the AI Scan and venue check-in
  // features. Microphone is denied — the AI Scan explicitly disables
  // audio capture (see lib/privacyGuard.js).
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(self), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  // HSTS — only honoured over HTTPS. Production-only via Vercel.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
