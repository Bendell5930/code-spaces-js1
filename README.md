# Pokie Analyzer

A Next.js app for tracking poker-machine spins with a Premium subscription tier powered by Stripe.

---

## Setup — complete checklist

### 1. Install dependencies and run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### 2. Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview + Development), and in a local `.env.local` file for development (never commit `.env.local`).

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…` or `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) |
| `STRIPE_PRICE_MONTHLY` | Stripe Price ID for the monthly plan (`price_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_…`) — for future client-side use |
| `APP_URL` | Your deployed URL, e.g. `https://your-app.vercel.app` |

Example `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
APP_URL=http://localhost:3000
```

### 3. Create the Stripe product and price

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/).
2. Go to **Products → Add product**.
3. Name it (e.g. "Pokie Analyzer Premium").
4. Under **Pricing**, choose **Recurring → Monthly**, enter your price (e.g. $9.00 AUD).
5. Click **Save product**.
6. Copy the **Price ID** (`price_…`) → paste it as `STRIPE_PRICE_MONTHLY`.

### 4. Add a Stripe webhook endpoint (production)

1. In Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL**: `https://<your-app>.vercel.app/api/stripe/webhook`
3. **Events to subscribe to**:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint**.
5. Copy the **Signing secret** (`whsec_…`) → paste it as `STRIPE_WEBHOOK_SECRET` in Vercel.
6. **Redeploy** the app in Vercel after setting env vars.

### 5. Local webhook testing with Stripe CLI

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_…` secret — add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### 6. Test the payment flow

Use the test card `4242 4242 4242 4242`, any future expiry date, any CVC, any ZIP.

1. Open `http://localhost:3000`, click any locked feature.
2. The paywall appears — click **Upgrade to Premium**.
3. Complete checkout with the test card.
4. You are redirected back. Locks should disappear within ~10 seconds.
5. Refresh the page — the app should remain unlocked.
6. Open DevTools → Application → Local Storage → verify `pokie-subscription` has `"plan":"premium"`.

### 7. Test subscription cancellation

```bash
stripe subscriptions cancel sub_xxx
```

Reload the app. The server will re-check Stripe on every load, so locks reappear automatically.

---

## Payment flow (architecture)

1. User clicks **Upgrade to Premium** → `POST /api/checkout` creates a Stripe Checkout Session (`mode: "subscription"`, `client_reference_id` set to the user identifier, `allow_promotion_codes: true`).
2. Browser navigates to the Stripe-hosted checkout page.
3. After payment, Stripe fires webhooks (`checkout.session.completed`, `invoice.paid`) → `/api/stripe/webhook` persists subscription state in the server-side store and logs everything.
4. Stripe redirects to `/?checkout=success&session_id=SESSION_ID`.
5. The app calls `POST /api/verify-session` to confirm the session and retrieve `customerId` + subscription data.
6. `customerId` is stored in `localStorage`; the plan state is set to Premium.
7. If the webhook is still in-flight, the client polls `/api/me/subscription` for up to 10 seconds.
8. On every subsequent app load, `GET /api/me/subscription?customerId=cus_xxx` is called — this checks the server-side cache first, then falls back to querying Stripe directly. The result is always authoritative.
9. **Manage billing** button (visible when subscribed) → `POST /api/billing-portal` → Stripe Customer Portal for cancellations/upgrades.

## Running tests

```bash
npm test
```

Tests cover: webhook payload → subscription store updated, invalid signature rejected, `/api/me/subscription` returns correct active state.

