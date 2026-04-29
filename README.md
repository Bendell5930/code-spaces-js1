# Pokie Analyzer

**Your harm-reduction companion for Australian pokie players.**

Pokie Analyzer is a free, open-source tool that helps Australian pokie (EGM) players track their play, set personal spending limits, and make better-informed decisions. Its primary purpose is to reduce gambling-related harm — not to improve odds or encourage gambling.

---

## Purpose & Mission

Millions of Australians visit pokie venues every year. Many do so without a clear sense of how long they have been playing, how much they have spent, or where to turn if gambling starts to feel out of control.

Pokie Analyzer exists to change that. By giving players a simple, transparent record of their own play — and by building harm-minimisation prompts directly into the experience — the app aims to:

- Help players **make more informed decisions** before and during a session.
- Provide **clear, honest data** about time and money spent (not glamourised or encouraging).
- Surface **Australian help resources** at every point of the app.
- Give players the tools to set — and stick to — personal limits.

This is a community tool, built for the public good. It does not guarantee outcomes, does not predict wins, and does not encourage anyone to gamble.

---

## Key Features

### Harm Minimisation
- **Session Timer & Reality Check** — Tracks how long you've had the app open. A non-dismissable reminder appears every 30 minutes (configurable) showing your session duration and net position.
- **Spend Tracker** — Log money spent in a session; see running totals for today, this week, and this month.
- **Personal Limits Panel** — Set daily spend limit, weekly spend limit, session time limit, and session loss limit. All stored on your device.
- **Session Loss Limit Alert** — An alert fires when your net loss reaches the limit you set before playing.
- **Rapid-Play (Dissociation) Alert** — Detects unusually fast logging as a potential sign of dissociation and prompts a check-in.
- **BetStop Self-Exclusion Link** — Clearly visible link to [BetStop](https://www.betstop.gov.au) — Australia's National Self-Exclusion Register — throughout the app.
- **Persistent Help Footer** — Every page shows Gambling Help Online (1800 858 858) and Lifeline (13 11 14).
- **18+ Age Verification** — On first visit a modal confirms the user is 18 or older.
- **Harm Minimisation Info Page** — `/harm-minimisation` explains all features and links to help services.

### Analytics & Tracking
- Manual spin data entry (denomination, bet, lines, win amount, bonus hits)
- AI-assisted machine recognition via device camera
- Win/loss heat maps per machine
- Session history with net position display
- Venue analytics (QLD EGM data via OLGR)

### Community (on-device)
- Community wins feed and leaderboard
- Venue check-in and tracking
- Referral programme

### Subscriptions
- Free (Basic) tier with core tracking
- Premium tier (Stripe subscription) with AI scan, full history, heat maps, and community features

---

## Harm Minimisation Statement

Pokie machines are designed to return less than you put in over time. No app, strategy, or tracking tool changes that mathematical reality. Pokie Analyzer records your play and surfaces that data clearly so you can make informed decisions — nothing more.

**If gambling is a problem for you or someone you know, please reach out:**

| Service | Contact | Hours |
|---------|---------|-------|
| [Gambling Help Online](https://www.gamblinghelponline.org.au) | 1800 858 858 | 24/7 |
| Lifeline Australia | 13 11 14 | 24/7 |
| National Debt Helpline | 1800 007 007 | Mon–Fri 9:30 am–4:30 pm AEST |
| [BetStop — National Self-Exclusion Register](https://www.betstop.gov.au) | betstop.gov.au | Online |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org) (React 18) |
| Language | JavaScript (ES Modules) |
| Styling | CSS Modules |
| Charts | [Recharts](https://recharts.org) |
| Payments | [Stripe](https://stripe.com) (subscriptions + webhooks) |
| Storage | `localStorage` / `sessionStorage` (all user data stays on-device) |
| Testing | Jest 30 (Node environment, `@jest/globals`) |
| Hosting | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install & run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm test` | Run the test suite |

### Environment variables

For the Stripe subscription features to work, set these in a local `.env.local` file (never commit this file):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
APP_URL=http://localhost:3000
```

The app runs fully without Stripe credentials — subscription-gated features will simply remain locked.

---

## Project Structure

```
/
├── pages/              Next.js pages (routes)
│   ├── index.js        Main app (calculator, history, AI scan, community)
│   ├── limits.js       Personal limits settings panel
│   ├── harm-minimisation.js  Harm reduction info & help links
│   ├── landing.js      Marketing landing page
│   ├── privacy.js      Privacy policy
│   ├── terms.js        Terms of service
│   └── api/            Server-side API routes (Stripe webhooks etc.)
├── components/         Reusable React components
│   ├── HarmMinimization.js   Session timer, cool-off overlays, budget guard
│   ├── AgeVerification.js    18+ first-visit modal
│   ├── HelpFooter.js         Site-wide help footer
│   └── ...
├── lib/                Pure JavaScript utilities
│   ├── sessionManager.js     Session tracking & cool-off logic
│   ├── spendTracker.js       Daily/weekly/monthly spend persistence
│   ├── featureGates.js       Free vs Premium feature access
│   └── ...
├── data/               Static data (QLD venues, machine profiles, OLGR data)
├── styles/             CSS Modules (one per page / component)
├── public/             Static assets (icons, PWA manifest, service worker)
└── __tests__/          Jest unit tests
```

---

## Contributing

We welcome contributions that align with the project's harm-reduction mission. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## Licence

MIT — see [LICENSE](LICENSE) for details.
Copyright (c) 2026 Bendell5930.

---

## Disclaimer

Pokie Analyzer is an independent, third-party tool. It is **not** affiliated with, endorsed by, or sponsored by any gaming venue, machine manufacturer, or the Office of Liquor and Gaming Regulation (OLGR).

This application **does not**:
- Improve your odds of winning
- Predict future outcomes on any gaming machine
- Guarantee financial results of any kind
- Encourage you to gamble

Use of this app does not constitute gambling advice. You are solely responsible for your own financial decisions. If you are self-excluded from any gaming venue or wagering service, **you must not use this app**.

This application is intended for adults aged **18 years and over** only.
