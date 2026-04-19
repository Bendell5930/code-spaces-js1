# Pokie Analyzer

A Next.js app for tracking poker-machine spins with a Premium subscription tier powered by Stripe.

## Running locally

```bash
npm install
npm run dev
```

## Environment variables

Create a `.env.local` file (never commit it) with the following keys:

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` for test mode, `sk_live_…` for production) |
| `STRIPE_PRICE_ID` | The Stripe Price ID for the Premium monthly subscription (`price_…`) |
| `STRIPE_WEBHOOK_SECRET` | The signing secret for your Stripe webhook endpoint (`whsec_…`) |

Example `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Payment flow

1. User clicks **Upgrade to Premium** in the app.
2. The client calls `POST /api/create-checkout` which creates a Stripe Checkout Session.
3. The browser navigates to the Stripe-hosted checkout page (same window, not a new tab).
4. After a successful payment Stripe redirects to `/?checkout=success&session_id=SESSION_ID`.
5. The app calls `POST /api/verify-session` with the session ID to confirm the payment server-side.
6. The Stripe `customerId` and subscription expiry (`current_period_end`) are stored in `localStorage`.
7. On every subsequent app load `POST /api/check-subscription` is called with the stored `customerId` so the subscription state is always authoritative (renewals extend access, cancellations revoke it).

## Testing the payment flow locally with Stripe CLI

### 1. Forward webhook events to your local server

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the **webhook signing secret** that the CLI prints (`whsec_…`) and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### 2. Trigger a test checkout

Open `http://localhost:3000` in your browser, click **Upgrade to Premium**, and complete the Stripe test checkout using card number `4242 4242 4242 4242` (any future expiry, any CVC).

### 3. Verify the flow

- After completing the checkout you should be redirected back to the app.
- A success alert should appear and all locked features should be unlocked.
- Open DevTools → Application → Local Storage and verify `pokie-subscription` contains `"plan":"premium"` and a `subscriptionExpiresAt` timestamp.
- Refresh the page — the app should stay unlocked (server re-verification runs in the background).

### 4. Test cancellation / expiry

```bash
stripe subscriptions cancel <sub_...>
```

Reload the app. Because `verifySubscription()` calls `/api/check-subscription` on every load and Stripe now reports the subscription as inactive, the locks will reappear.

### 5. Test renewals (simulate invoice.paid)

```bash
stripe trigger invoice.paid
```

Reload the app — `verifySubscription()` will call Stripe and update the expiry date.

## Deploying to Vercel

1. Set the environment variables in the Vercel dashboard (Project → Settings → Environment Variables).
2. In the Stripe Dashboard add a webhook endpoint pointing to `https://your-app.vercel.app/api/webhook` and enable the following events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
3. Copy the webhook signing secret into the `STRIPE_WEBHOOK_SECRET` env var.
