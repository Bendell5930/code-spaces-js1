# Pokie Analyzer — Business Plan

**Prepared:** April 2026
**Version:** 1.0
**Classification:** Confidential

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Overview](#2-company-overview)
3. [Problem Statement](#3-problem-statement)
4. [Solution — The Product](#4-solution--the-product)
5. [Market Analysis](#5-market-analysis)
6. [Target Audience](#6-target-audience)
7. [Competitive Landscape](#7-competitive-landscape)
8. [Revenue Model](#8-revenue-model)
9. [Marketing & Growth Strategy](#9-marketing--growth-strategy)
10. [Technology & Architecture](#10-technology--architecture)
11. [Legal & Regulatory Compliance](#11-legal--regulatory-compliance)
12. [Responsible Gambling Framework](#12-responsible-gambling-framework)
13. [Operations & Team](#13-operations--team)
14. [Financial Projections](#14-financial-projections)
15. [Risk Analysis](#15-risk-analysis)
16. [Roadmap & Milestones](#16-roadmap--milestones)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

**Pokie Analyzer** is an AI-powered Progressive Web Application (PWA) designed for Australian pokie (electronic gaming machine) players. The app enables users to track, scan, and analyze their gaming sessions across pubs, clubs, and RSLs — all while promoting responsible gambling through built-in harm minimization tools.

Australia has the highest gambling spend per capita in the world, with over 190,000 electronic gaming machines (EGMs) operating outside casinos. Despite this, there is no mainstream consumer tool that helps players understand their own gambling patterns in real time. Pokie Analyzer fills this gap.

**Key Differentiators:**

- **AI Camera Scanning** — Point-and-scan machine detection using on-device computer vision (no server uploads, privacy-first).
- **Australian-Specific Design** — Built exclusively for Australian EGMs with support for 9 major machine brands and 30+ variants.
- **Harm Minimization by Design** — Session timers, budget alerts, loss limits, cool-down overlays, and direct links to Gambling Help Online (1800 858 858).
- **Privacy-First Architecture** — All user data stored locally on the device (localStorage). No accounts, no cloud databases, no tracking cookies.
- **Regulatory Compliance** — Designed to comply with the QLD Gaming Machine Act 1991 (s 233), Australian Privacy Act 1988, and ACL consumer protection standards.

**Business Model:** Freemium SaaS — Free basic tier with premium subscription at **$9 AUD/month** via Stripe.

**Year 1 Target:** 5,000 active users, 500 paying subscribers, $54,000 ARR.
**Year 3 Target:** 50,000 active users, 5,000 paying subscribers, $540,000 ARR.

---

## 2. Company Overview

| Detail | Value |
|---|---|
| **Product Name** | Pokie Analyzer |
| **Legal Entity** | TBD (recommended: Pty Ltd registered in Queensland, Australia) |
| **ABN** | To be registered |
| **Location** | Queensland, Australia |
| **Website** | pokieanalyzer.com.au |
| **Platform** | Progressive Web App (browser + installable on iOS/Android) |
| **Stage** | Pre-launch (MVP complete, deployment in progress) |

### Mission Statement

To empower Australian gaming machine players with transparent, data-driven insights into their own gambling activity — while promoting responsible gambling practices and full compliance with Australian gaming regulations.

### Vision

To become Australia's most trusted companion app for recreational pokie players, setting the standard for responsible gambling technology.

---

## 3. Problem Statement

### The Australian Pokies Landscape

- **$12.8 billion** in annual net EGM losses across Australia (2023–24).
- **190,000+** EGMs operating in pubs, clubs, and RSLs (excluding casinos).
- Australia has **~1 gaming machine for every 100 adults** — the highest density in the world.
- **80% of Australian adults** have gambled at least once; pokies are the most common form of gambling.

### The Gap in the Market

Despite this massive market, players have **no mainstream tools** to:

1. **Track their sessions** — Most players have no idea how much they've actually spent vs. won across sessions.
2. **Understand machine behaviour** — Players rely on gut feeling rather than data about bonus frequency, spin patterns, or session performance.
3. **Set and enforce personal limits** — Venue-imposed limits (pre-commitment) have limited adoption. There is no personal, portable tool that travels with the player.
4. **Share experiences safely** — Online gambling forums are unmoderated, often predatory, and not purpose-built for Australian pokie players.

### Who Suffers

- **Recreational players** who want to gamble responsibly but lack tools to track spending.
- **At-risk individuals** who would benefit from real-time budget alerts and cool-down interventions.
- **Regulators and advocacy groups** who want technology solutions to support responsible gambling.

---

## 4. Solution — The Product

Pokie Analyzer is a **mobile-first Progressive Web App** that works on any device with a browser. No app store download required — users can install it directly from the browser for an app-like experience with offline support.

### Core Features

#### 4.1 Pokie Calculator (Free)
A full Australian EGM simulator that mirrors the real machine interface:
- Credits-based display with CREDIT / WIN / BET meters
- Denomination stepper, 5 Bet-per-line buttons, 5 Play Lines buttons
- Bonus Feature tracking with free spins, retriggers, and progress bars
- Red/Black Gamble feature (capped at $5 per Australian gaming code)
- Note In system ($5/$10/$20/$50/$100)
- Real-time session statistics: Spins, Features, Net P&L, RTP estimate, Biggest Win

#### 4.2 AI Camera Scan (Premium)
Point your phone camera at any supported pokie machine:
- On-device AI detects the machine brand and model
- Automatic OCR reads balance, bet, and win amounts from the screen
- Auto-detects spins (balance drops), wins (win meter changes), bonus triggers
- Privacy-first: no audio, no images of people, no venue interiors, no server uploads
- Supports 9 machine brands with 30+ variants

#### 4.3 Heat Map Analysis (Premium)
Visual analytics showing which machines are running "hot" or "cold":
- Heat grid, bar charts, trend lines, bonus gap analysis
- HOT/NORMAL/COLD scoring (0-100) based on 4 statistical factors
- 6 recharts-powered visualizations

#### 4.4 Community Hub (Premium)
Social features for the Australian pokie community:
- **Chat Forum** — Moderated message board with emoji reactions
- **Recent Wins Feed** — Live win notifications with tier badges (Jackpot → Small Win)
- **Leaderboard** — Sortable by 5 metrics, rank system (Rookie → Diamond), 12 achievement badges
- **Referral Program** — PA-XXXXXX codes, 7-day free trial for friends, milestone rewards up to lifetime Premium
- Multi-layer chat moderation: keyword filtering, report system, anti-harassment

#### 4.5 Venue Insights (Premium)
Browse and track performance across Australian pubs, clubs, and RSLs:
- 90+ pre-loaded Queensland venues with search and regional filtering
- Custom venue support — add any venue in Australia
- Track up to 200 favourite venues
- Wet/Dry scoring with 5 win categories
- Activity feed and session-by-venue analytics
- Machine legend system for privacy (codes instead of machine names)

#### 4.6 Harm Minimization (Free — Always Active)
Built-in responsible gambling tools that cannot be disabled:
- Session timer with configurable cool-off intervals
- Budget guard with progressive alerts (Green → Amber → Red → Exceeded)
- Net position display (real-time profit/loss)
- Dissociation alerts (periodic check-ins)
- Loss limit prompts
- Direct links to Gambling Help Online and 1800 858 858

#### 4.7 Spin History & Graphs (Free — Limited / Premium — Unlimited)
- Full spin history with sortable, searchable records
- Free tier: last 20 spins. Premium: unlimited.
- Visual charts powered by recharts

### User Experience Flow

```
App Open → Terms of Service (one-time) → Venue Privacy Disclaimer (each session) →
Launch Reminder ("Machines are random") → Main App with 6 Tabs
```

---

## 5. Market Analysis

### 5.1 Total Addressable Market (TAM)

| Metric | Value | Source |
|---|---|---|
| Australian adults who gamble | 11.5 million | AIHW 2023 |
| Regular EGM players | ~4 million | AGRC estimates |
| EGMs in pubs/clubs/RSLs | 190,000+ | State regulators |
| Annual net EGM losses | $12.8 billion | QLD/NSW/VIC treasury data |
| Smartphone penetration (AU) | 91% | Statista 2025 |

### 5.2 Serviceable Addressable Market (SAM)

- **Technology-comfortable pokie players aged 25–55**: ~2.5 million
- **Players who actively visit pubs/clubs weekly or more**: ~1.5 million
- **Players open to using a tracking app**: estimated 10–15% = **150,000–225,000**

### 5.3 Serviceable Obtainable Market (SOM) — Year 1

- **Realistic Year 1 target**: 5,000 active users (0.2–0.3% of SAM)
- **Premium conversion rate**: 10% = 500 paying subscribers

### 5.4 Market Trends

1. **Regulatory push for pre-commitment tools** — NSW and VIC are mandating cashless gaming and player tracking. A voluntary personal tracking tool aligns with regulatory direction.
2. **Growing responsible gambling awareness** — Government campaigns and self-exclusion programs are normalizing the idea of "gambling with tools."
3. **PWA adoption** — Progressive Web Apps remove the App Store barrier, critical for a niche tool.
4. **Community-driven apps** — The success of apps like Strava (fitness), MyFitnessPal (diet), and YNAB (budgeting) shows people will pay for self-tracking tools.

---

## 6. Target Audience

### Primary Persona: "The Tracker" (60% of users)

| Attribute | Detail |
|---|---|
| **Age** | 30–55 |
| **Profile** | Regular recreational pokie player (1–3 visits/week) |
| **Motivation** | Wants to know how much they're really spending, curious about patterns |
| **Tech comfort** | Moderate (uses smartphone, mobile banking, social media) |
| **Spending** | $50–$300 per session |
| **Location** | Queensland, NSW, Victoria — suburban pubs and clubs |
| **Pain point** | "I feel like I always leave with less than I came in with, but I don't really know" |

### Secondary Persona: "The Enthusiast" (25% of users)

| Attribute | Detail |
|---|---|
| **Age** | 25–40 |
| **Profile** | Data-driven player who enjoys the strategy/analysis aspect |
| **Motivation** | Wants heat maps, bonus frequency stats, machine comparison |
| **Tech comfort** | High (uses data apps, spreadsheets, forums) |
| **Spending** | $100–$500 per session |
| **Pain point** | "I wish I could see which machines are paying out at this venue" |

### Tertiary Persona: "The Cautious Player" (15% of users)

| Attribute | Detail |
|---|---|
| **Age** | 35–65 |
| **Profile** | Aware they may be spending too much, looking for guardrails |
| **Motivation** | Wants budget limits, session timers, spending alerts |
| **Tech comfort** | Low–moderate |
| **Spending** | $100–$1,000 per session |
| **Pain point** | "I need something to tell me when to stop" |

---

## 7. Competitive Landscape

### Direct Competitors

There are **no direct competitors** offering this specific combination of features (AI scanning + calculator + heat maps + community + harm minimization) for Australian pokies.

### Indirect Competitors / Adjacent Products

| Product | Description | Weakness vs. Pokie Analyzer |
|---|---|---|
| **Venue self-exclusion programs** | Voluntary bans from specific venues | Static, no tracking, no insights |
| **Generic gambling trackers** | Budget apps that track gambling spend | Not designed for EGMs, no machine data |
| **Slot forums (Reddit, Facebook groups)** | Community discussion | Unmoderated, no data tools, no AU focus |
| **Casino companion apps** (US-focused) | Slot machine databases | US centric, no AU machines, no AI scanning |
| **Gambling Help apps** | Self-help tools from support organizations | Focus on problem gambling only, not recreational players |
| **Pre-commitment systems** (venue-operated) | Government-mandated spend limits | Clunky, venue-locked, not portable |

### Competitive Advantage

1. **First mover** — No tool exists that combines AI scanning with session tracking for Australian pokies.
2. **Privacy-first** — localStorage only, no accounts, no cloud data, no tracking. This is a major trust differentiator in the gambling space.
3. **Regulatory alignment** — Built with legal compliance in mind (s 233, Privacy Act, ACL).
4. **Harm minimization built-in** — Not an afterthought but a core feature. This builds goodwill with regulators and advocacy groups.
5. **PWA delivery** — No App Store gatekeeping risk (Apple/Google have policies around gambling apps).

---

## 8. Revenue Model

### 8.1 Freemium SaaS Subscription

| Tier | Price | Features |
|---|---|---|
| **Basic (Free)** | $0 | Calculator, Spin History (20), Session Stats, Harm Minimization |
| **Premium** | **$9 AUD/month** | Everything in Basic + AI Scan, Full History, Heat Map, Community, Venues, All Machines, AI Detection |

### 8.2 Payment Processing

- **Processor:** Stripe (PCI-DSS Level 1 certified)
- **Stripe fee:** 1.75% + $0.30 AUD per transaction
- **Net revenue per subscriber/month:** ~$8.54 AUD
- **Billing:** Monthly recurring via Stripe Checkout
- **Management:** Self-service via Stripe Customer Portal

### 8.3 Revenue Projections

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Active users | 5,000 | 20,000 | 50,000 |
| Premium subscribers | 500 | 2,000 | 5,000 |
| Conversion rate | 10% | 10% | 10% |
| Gross monthly revenue | $4,500 | $18,000 | $45,000 |
| Stripe fees (~4%) | -$180 | -$720 | -$1,800 |
| **Net monthly revenue** | **$4,320** | **$17,280** | **$43,200** |
| **Net ARR** | **$51,840** | **$207,360** | **$518,400** |

### 8.4 Referral Program Impact

The built-in referral system (PA-XXXXXX codes) offers:
- **Friend receives:** 7-day free Premium trial
- **Referrer earns:** Free months, badges, up to lifetime Premium at 25 referrals
- **Expected viral coefficient:** 1.2–1.5x (each user brings 0.2–0.5 new users)
- **Estimated referral-driven growth:** 15–25% of new users from referrals

### 8.5 Future Revenue Opportunities (Not Yet Implemented)

| Opportunity | Description | Timeline |
|---|---|---|
| **Annual subscription** | $79/year (save 27%) | Q3 2026 |
| **Venue partnerships** | Anonymized, aggregated analytics sold to venue operators | 2027 |
| **Premium tiers** | "Pro" tier with advanced analytics at $19/mo | 2027 |
| **Affiliate partnerships** | Gambling help organizations, financial counselling referral programs | 2027 |

---

## 9. Marketing & Growth Strategy

### 9.1 Phase 1: Pre-Launch (Current)

- **Landing page** at pokieanalyzer.com.au/landing with SEO-optimized meta tags
- **Privacy policy** and legal compliance documentation publicly available
- **Social proof preparation** — Screenshots, feature highlights, demo content

### 9.2 Phase 2: Soft Launch (Month 1–3)

| Channel | Strategy | Budget |
|---|---|---|
| **Reddit** (r/australia, r/gambling, r/pokies) | Value-add posts, responsible gambling framing | $0 |
| **Facebook Groups** | Australian pokies communities, RSL/club groups | $0 |
| **YouTube** | 2–3 demo videos showing the app in action | $0–$200 |
| **Google Ads** | Target "pokie tracker", "pokies app", "slot machine tracker australia" | $500/mo |
| **SEO** | Blog content: "How to track your pokies spending", "Best pokie machines 2026" | $0 |

### 9.3 Phase 3: Growth (Month 4–12)

| Channel | Strategy | Budget |
|---|---|---|
| **Facebook/Instagram Ads** | Targeting Australians 25–55 interested in pubs/clubs, gambling | $1,000/mo |
| **Referral program** | Organic viral growth via PA-XXXXXX codes | $0 (built-in) |
| **Partnerships** | Approach Gambling Help Online, GambleAware about co-promotion | $0 |
| **PR** | Pitch to Australian tech/lifestyle media (Gizmodo AU, news.com.au, The Australian) framing it as a harm-reduction tool | $0–$500 |
| **App review sites** | Submit to ProductHunt, AlternativeTo, SaaS directories | $0 |

### 9.4 Phase 4: Scale (Year 2+)

- **State-by-state expansion** — Add venue databases for NSW, VIC, SA, WA, TAS
- **Influencer partnerships** — Australian gambling content creators (responsible framing)
- **Venue partnerships** — Approach progressive clubs/RSLs about promoting the app as a harm-min tool
- **Government engagement** — Position as a voluntary pre-commitment technology provider

### 9.5 Customer Acquisition Cost (CAC) Targets

| Phase | Target CAC |
|---|---|
| Organic/referral | $0 |
| Paid (Year 1) | < $15 per Premium subscriber |
| Paid (Year 2) | < $10 per Premium subscriber |

### 9.6 Key Metrics

- **Monthly Active Users (MAU)**
- **Premium conversion rate** (target: 10%)
- **Monthly churn rate** (target: < 5%)
- **Customer Lifetime Value (LTV)** — At 5% churn, avg. tenure = 20 months → LTV = $170
- **LTV:CAC ratio** (target: > 10:1)

---

## 10. Technology & Architecture

### 10.1 Technology Stack

| Component | Technology |
|---|---|
| **Framework** | Next.js 14.2 (React 18.2, Pages Router) |
| **Styling** | CSS Modules (component-scoped) |
| **Charts** | recharts 3.8.1 |
| **Payments** | Stripe (stripe + @stripe/stripe-js) |
| **Hosting** | Vercel (serverless, auto-scaling) |
| **Domain** | VentraIP (.com.au registration) |
| **PWA** | Custom service worker + web manifest |
| **Data Storage** | Browser localStorage (no backend database) |
| **AI/OCR** | Custom on-device: built-in OCR (3×5 digit templates), pixel-based screen detection, colour-cluster symbol matching |
| **Encryption** | AES-256-GCM via Web Crypto API |

### 10.2 Architecture Principles

1. **No backend database** — All user data lives in the browser. This eliminates data breach risk, hosting costs, and privacy concerns.
2. **Serverless API routes** — Only 5 API routes exist, all for Stripe payment processing. No user data ever reaches the server.
3. **On-device AI** — All camera processing, OCR, and symbol recognition runs in the browser. No images are uploaded.
4. **Progressive enhancement** — Works as a website, installable as a PWA, functions offline for core features.

### 10.3 Infrastructure Costs

| Service | Monthly Cost |
|---|---|
| **Vercel** (Hobby → Pro) | $0–$20/mo |
| **VentraIP** domain | ~$3/mo ($35/year) |
| **Stripe** | 1.75% + $0.30/txn (variable) |
| **Total infrastructure** | **< $25/month** |

The localStorage-only architecture means **near-zero infrastructure costs** regardless of user count, since there's no database, no storage, and no compute for user data.

### 10.4 Scalability

- Vercel auto-scales serverless functions globally.
- Static pages are served from CDN edge nodes.
- No database bottleneck — each user's data is self-contained in their browser.
- Only scaling concern is Stripe webhook volume (handled by Vercel's serverless auto-scaling).

---

## 11. Legal & Regulatory Compliance

### 11.1 Gaming Machine Act 1991 (QLD) — Section 233

**Section 233** makes it an offence to possess a device designed or adapted to interfere with the proper operation of a gaming machine's computer.

**Pokie Analyzer compliance:**
- The app is a **passive observation and record-keeping tool**.
- It does NOT connect to, communicate with, or send signals to any gaming machine.
- It does NOT read, intercept, or modify data from a machine's internal systems.
- It does NOT influence or predict the outcome of any spin.
- It only records information **visually displayed** on the machine's external screen.
- Full compliance statement included in the published Privacy Policy (Section 9).

### 11.2 Australian Privacy Act 1988

- No personal information is collected or stored on servers.
- All data resides in the user's browser localStorage.
- Camera data is processed on-device only — nothing is uploaded.
- No cookies, analytics trackers, or third-party advertising scripts.
- Privacy Policy published in compliance with APP 1 (Australian Privacy Principles).

### 11.3 Australian Consumer Law (ACL)

- The app does not make misleading claims about winning or machine behaviour.
- Heat map analysis is presented as historical pattern data, not predictive.
- Launch Reminder explicitly states: "Machines are random — past results do not predict future outcomes."
- Terms of Service include clear disclaimers and ACL-compliant clauses.

### 11.4 Venue Recording Policies

The app's AI scanning feature includes automated privacy safeguards:
- No audio recording (microphone never activated)
- No venue interior photography (masked and discarded)
- No recording of people (person detection pauses scanning immediately)
- Single machine focus (auto-stop on camera drift)
- No images stored — only extracted numeric data

### 11.5 Recommended Legal Steps

| Action | Estimated Cost | Priority |
|---|---|---|
| Focused QLD legal opinion (s 233, ACL, recording) | $2,000–$4,000 | High |
| Full regulatory sign-off (all states) | $5,000–$15,000 | Medium |
| ABN + Pty Ltd registration | $500–$1,000 | High |
| Terms of Service legal review | $500–$1,500 | High |

---

## 12. Responsible Gambling Framework

Pokie Analyzer is designed with **Responsible Gambling by Design** principles. These features are always active and cannot be disabled by the user.

### 12.1 Built-In Safeguards

| Feature | Description |
|---|---|
| **Session Timer** | Tracks continuous play time with configurable reminders |
| **Budget Guard** | Visual progress bar — Green → Amber (60%) → Red (80%) → Exceeded (100%) |
| **Net Position Display** | Real-time profit/loss so users always know where they stand |
| **Cool-Off Overlay** | Full-screen break enforcement at set intervals |
| **Dissociation Alert** | Periodic check-in prompts to prevent zone-out gambling |
| **Loss Limit Prompt** | Configurable trigger when losses exceed a set threshold |
| **Budget Exceeded Alert** | Hard notification when spending exceeds the session budget |
| **Launch Reminder** | "Machines are random" popup on every app open |
| **Gambling Help Links** | Persistent footer link to Gambling Help Online + 1800 858 858 |
| **Venue Privacy Disclaimer** | Session acknowledgment of responsible gambling principles |

### 12.2 Community Safeguards

- **Chat moderation** — Multi-layer keyword filtering (harassment, loan-sharking, predatory behaviour)
- **Report system** — Users can report others with 5 preset categories
- **Anonymized leaderboard** — Auto-generated nicknames and avatars, no real names or location data
- **No gambling encouragement** — Community features celebrate tracking, not spending

### 12.3 Regulatory Alignment

The harm minimization framework aligns with:
- **National Consumer Protection Framework** for Online Wagering
- **QLD Responsible Gambling Code of Practice**
- **NSW Responsible Conduct of Gambling** guidelines
- **Victorian Responsible Gambling Foundation** principles

---

## 13. Operations & Team

### 13.1 Current Team

| Role | Status |
|---|---|
| Founder / Product Owner | Active |
| Development | AI-assisted development (GitHub Copilot + manual oversight) |
| Legal | External (Queensland-based firm, to be engaged) |
| Design | In-house (founder) |

### 13.2 Planned Hiring (Revenue-Dependent)

| Role | Trigger | Est. Cost |
|---|---|---|
| Part-time community moderator | 1,000+ community users | $1,500/mo |
| Marketing contractor | $5,000+ MRR | $2,000/mo |
| Legal retainer | Post-launch | $500/mo |
| Customer support (outsourced) | 5,000+ users | $1,000/mo |

### 13.3 Operational Processes

- **Deployment:** Vercel CI/CD (push to main → auto-deploy)
- **Payment management:** Stripe Dashboard + Customer Portal (self-service)
- **Support:** Community Hub chat + email (to be set up)
- **Monitoring:** Vercel analytics + Stripe dashboard
- **Content updates:** Machine database and venue database updated periodically

---

## 14. Financial Projections

### 14.1 Startup Costs

| Item | Cost (AUD) |
|---|---|
| Domain registration (.com.au) | $35 |
| VentraIP hosting (annual) | $0 (Vercel free tier) |
| Legal opinion (QLD focus) | $3,000 |
| ABN + Pty Ltd registration | $800 |
| Google Ads (Month 1–3 pre-launch) | $1,500 |
| Miscellaneous | $500 |
| **Total startup investment** | **~$5,835** |

### 14.2 Monthly Operating Costs

| Item | Year 1/mo | Year 2/mo | Year 3/mo |
|---|---|---|---|
| Vercel hosting | $0–$20 | $20 | $20 |
| Domain | $3 | $3 | $3 |
| Stripe fees (~4%) | $180 | $720 | $1,800 |
| Google Ads | $500 | $1,000 | $2,000 |
| Social media ads | $0 | $1,000 | $2,000 |
| Community moderator | $0 | $1,500 | $1,500 |
| Legal retainer | $0 | $500 | $500 |
| Customer support | $0 | $0 | $1,000 |
| **Total monthly costs** | **~$703** | **~$4,743** | **~$8,823** |

### 14.3 Profit & Loss Summary

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Gross revenue | $54,000 | $216,000 | $540,000 |
| Stripe fees | -$2,160 | -$8,640 | -$21,600 |
| Operating costs | -$8,436 | -$56,916 | -$105,876 |
| Startup costs | -$5,835 | $0 | $0 |
| **Net profit** | **$37,569** | **$150,444** | **$412,524** |
| **Net margin** | **69.6%** | **69.6%** | **76.4%** |

> **Note:** The high margins are driven by the near-zero infrastructure costs of the localStorage-only architecture. No database servers, no cloud storage, no compute costs for user data processing.

### 14.4 Break-Even Analysis

- **Monthly fixed costs:** ~$523 (Year 1 average excl. variable Stripe fees)
- **Net revenue per subscriber:** ~$8.54/mo
- **Break-even point:** **62 paying subscribers**
- At a 10% conversion rate, this requires ~620 active users — achievable within the first 2–3 months.

### 14.5 Unit Economics

| Metric | Value |
|---|---|
| Average Revenue Per User (ARPU) | $0.90/mo (blended free + paid) |
| Average Revenue Per Paying User (ARPPU) | $9/mo |
| Customer Acquisition Cost (CAC) | $10–$15 (Year 1 target) |
| Customer Lifetime Value (LTV) | $170 (at 5% monthly churn) |
| LTV:CAC Ratio | 11:1 – 17:1 |
| Payback Period | 1.1–1.7 months |

---

## 15. Risk Analysis

### 15.1 Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Regulatory challenge** (s 233 interpretation) | Low–Medium | High | Obtain legal opinion pre-launch; app is passive, no machine interaction |
| **App Store rejection** (if published) | Medium | Medium | Using PWA — no App Store dependency. No gatekeeping risk. |
| **Venue pushback** on camera use | Medium | Low | Manual Calculator mode as fallback; camera safeguards; user advised to check venue policy |
| **Low conversion rate** (< 5%) | Medium | Medium | Iterate on free features to demonstrate value; A/B test paywall triggers |
| **Negative media** ("gambling encouragement") | Low–Medium | Medium | Lead with harm minimization story; partner with gambling help orgs |
| **Browser API changes** (camera, localStorage) | Low | Medium | Monitor Chrome/Safari release notes; service worker provides resilience |
| **Stripe account suspension** | Low | High | Maintain clean Stripe practices; implement webhooks correctly; have backup processor researched |
| **Technical debt** (scaling community features) | Medium | Low | Community data is localStorage-based; future migration to backend if needed |
| **Competitor entry** | Low (Year 1), Medium (Year 2+) | Medium | First-mover advantage; build community lock-in; continuous feature development |
| **Data loss** (localStorage cleared) | Medium | Low | Users warned in ToS; potential future cloud backup as premium feature |

### 15.2 Key Assumptions

1. Australian regulations will continue to permit passive observation/tracking tools for gaming machines.
2. The 10% free-to-premium conversion rate is sustained (industry benchmark for niche tools is 5–15%).
3. Monthly churn remains below 5% (supported by community engagement and data lock-in).
4. No major competitor emerges within 12 months of launch.
5. Browser localStorage remains stable and sufficient for the use case.

---

## 16. Roadmap & Milestones

### 16.1 Completed (Pre-Launch)

| Phase | Feature | Status |
|---|---|---|
| 1 | AI Video Capture with privacy guard | ✅ |
| 2 | Visual enhancements, audio, animations | ✅ |
| 3 | Detection engines (OCR, screen detect, symbol recognition) | ✅ |
| 4 | Heat Map system (6 visualizations) | ✅ |
| 5 | Community Hub (Chat, Wins, Ranks, Refer) | ✅ |
| 6 | Stripe subscription billing | ✅ |
| 7 | Harm minimization ("Safety by Design") | ✅ |
| 8 | Terms of Service, venue privacy, launch flow | ✅ |
| 9 | Australian Pokie Calculator | ✅ |
| 10 | AI auto-feed, geolocation, seamless sync | ✅ |
| 11 | Venue insights rebuild (wet/dry, QLD venues) | ✅ |
| 12 | PWA, landing page, privacy policy, meta tags, production config | ✅ |

### 16.2 Launch Phase (Q2 2026)

| Task | Target |
|---|---|
| Stripe live keys + webhook configuration | Week 1 |
| VentraIP domain + DNS setup | Week 1 |
| Vercel production deployment | Week 1 |
| QLD legal opinion obtained | Week 2–4 |
| ABN + Pty Ltd registration | Week 2–4 |
| Soft launch (Reddit, Facebook, personal network) | Week 2 |
| Google Ads campaign start | Week 4 |

### 16.3 Post-Launch Roadmap

| Quarter | Features |
|---|---|
| **Q3 2026** | Annual subscription option ($79/yr), NSW + VIC venue databases, push notifications, cloud session backup (optional) |
| **Q4 2026** | Machine database expansion (20+ brands), enhanced AI detection accuracy, user analytics dashboard |
| **Q1 2027** | Pro tier ($19/mo) with advanced analytics, venue API partnerships, export-to-CSV |
| **Q2 2027** | Real-time community (WebSocket chat), moderated community events, partnership with responsible gambling organizations |
| **Q3 2027** | Anonymized aggregated insights for venue operators (opt-in), B2B revenue stream |
| **Q4 2027** | Multi-language support, NZ market entry (similar machine landscape) |

---

## 17. Appendix

### A. Machine Brands Supported at Launch

| Brand | Variants |
|---|---|
| Dragon Link | 8 (Golden Century, Autumn Moon, Spring Festival, Peacock Princess, Happy & Prosperous, Genghis Khan, Panda Magic, Eyes Of Fortune) |
| Lightning Link | 6 (Happy Lantern, Eyes Of Fortune, Best Bet, Dragon's Riches, Sahara Gold, High Stakes) |
| Dragon Train Link | 1 |
| Super Grand Star Link | 1 |
| Bull Rush Link | 1 |
| Monopoly Huff n Puff | 1 |
| Piggy Bankin | 1 |
| Thunder Link | 4 |
| Royal Spark | 1 |
| **Total** | **25+ variants** |

### B. Subscription Tier Comparison

| Feature | Basic (Free) | Premium ($9/mo) |
|---|---|---|
| Pokie Calculator | ✅ | ✅ |
| Spin History | Last 20 | Unlimited |
| Session Stats | ✅ | ✅ |
| Harm Minimization | ✅ | ✅ |
| AI Camera Scan | ❌ | ✅ |
| Heat Map Analysis | ❌ | ✅ |
| Community Hub | ❌ | ✅ |
| Venue Insights | ❌ | ✅ |
| All Machine Brands | ❌ | ✅ |
| AI Auto-Detection | ❌ | ✅ |

### C. Key Contacts & Resources

| Resource | Detail |
|---|---|
| Gambling Help Online | www.gamblinghelponline.org.au |
| National Gambling Helpline | 1800 858 858 (24/7, free) |
| QLD Office of Liquor & Gaming | www.business.qld.gov.au/liquor-gaming |
| Stripe Dashboard | dashboard.stripe.com |
| Vercel Dashboard | vercel.com/dashboard |

### D. Glossary

| Term | Definition |
|---|---|
| **EGM** | Electronic Gaming Machine (pokie/slot machine) |
| **RTP** | Return to Player — theoretical percentage of bets returned as wins over time |
| **PWA** | Progressive Web App — installable web application with offline support |
| **ARR** | Annual Recurring Revenue |
| **MRR** | Monthly Recurring Revenue |
| **LTV** | Customer Lifetime Value |
| **CAC** | Customer Acquisition Cost |
| **ACL** | Australian Consumer Law |
| **s 233** | Section 233 of the QLD Gaming Machine Act 1991 |

---

*This document is confidential and intended for internal planning purposes. Financial projections are estimates based on market research and should not be considered guaranteed. This document does not constitute financial, legal, or investment advice.*

---

**Pokie Analyzer** — Smart Machine Tracker
*Built in Australia, for Australian players.*
