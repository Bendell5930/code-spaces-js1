# PokieAnalyzer.com.au — Backend Setup Guide

This guide walks you through configuring Supabase, Stripe, and Vercel so that Premium subscriptions work end-to-end.

---

## Overview

When a user upgrades:

1. They tap an Upgrade lock → a sign-in modal appears.
2. They enter their email → Supabase sends a magic link.
3. They click the link → Supabase authenticates them and redirects back to the app.
4. The app detects the pending upgrade intent and redirects to Stripe Checkout.
5. After payment, Stripe calls our webhook → subscription status is written to Supabase.
6. The app calls `/api/me` → reads the authoritative status → locks disappear.

---

## Step 1 — Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in / create an account.
2. Click **New project**.
3. Choose **Sydney (ap-southeast-2)** as the region (closest to your Australian users).
4. Set a project name (e.g. `pokieanalyzer`) and a strong database password. Save the password somewhere safe.
5. Click **Create new project** and wait ~2 minutes for it to provision.

---

## Step 2 — Run the database schema

1. In your Supabase project, go to **SQL Editor** (left sidebar).
2. Click **+ New query**.
3. Copy and paste the entire contents of `supabase/schema.sql` from this repo.
4. Click **Run** (or press Ctrl+Enter).
5. You should see `Success. No rows returned`. This creates the `subscriptions` table with Row Level Security enabled.

---

## Step 3 — Enable Email authentication (magic links)

1. In Supabase → **Authentication** → **Providers**.
2. Confirm **Email** is enabled (it is by default). No changes needed.

---

## Step 4 — Configure Auth redirect URLs

1. In Supabase → **Authentication** → **URL Configuration**.
2. Set **Site URL** to: `https://pokieanalyzer.com.au`
3. Under **Redirect URLs**, click **Add URL** and add:
   - `https://pokieanalyzer.com.au/*`
4. Click **Save**.

> Without this, magic link emails will be blocked by Supabase's URL allowlist.

---

## Step 5 — Get your Stripe Price ID

1. Log in to [https://dashboard.stripe.com](https://dashboard.stripe.com).
2. Go to **Product catalogue** (left sidebar).
3. Click your **Premium** product (the A$9/mo one).
4. Click the price row — you'll see the **Price ID** starting with `price_…`.
5. Copy it — you'll need it in Step 7.

> If you don't have a product yet:
> - Click **+ Add product** → name it "Premium" → set price to A$9 → Recurring → Monthly → Save.
> - Then copy the `price_…` ID.

---

## Step 6 — Create the Stripe webhook

1. In Stripe → **Developers** → **Webhooks**.
2. Click **+ Add endpoint**.
3. **Endpoint URL**:
   - For **TEST mode**: `https://pokieanalyzer.com.au/api/stripe-webhook` (or use a local tunnel like `ngrok` for local testing — see note below)
   - For **LIVE mode**: `https://pokieanalyzer.com.au/api/stripe-webhook`
4. **Listen to events** — click **+ Select events** and add:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**.
6. On the webhook details page, click **Reveal** next to **Signing secret**.
7. Copy the value starting with `whsec_…` — you'll need it in Step 7.

> **Note on TEST mode webhooks:** Stripe TEST mode webhooks can point to the same production URL. Test events use your `sk_test_…` secret key and test payment methods, so they won't affect real customer data. Create a separate webhook endpoint in TEST mode (using your test secret key) and a separate one in LIVE mode (using your live key), each with their own `whsec_…` signing secret.

---

## Step 7 — Add environment variables in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**.
2. Add each variable below to **All environments** (Production, Preview, Development):

| Variable name | Where to find the value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Project Settings** → **API** → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → **API** → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **API** → `service_role` key (**⚠️ keep this secret — never expose in browser code**) |
| `STRIPE_SECRET_KEY` | Stripe → **Developers** → **API keys** → **Secret key** (`sk_live_…` for production, `sk_test_…` for testing) |
| `STRIPE_PRICE_ID` | Copied in Step 5 (`price_…`) |
| `STRIPE_WEBHOOK_SECRET` | Copied in Step 6 (`whsec_…`) |

3. After adding all variables, click **Save**.
4. Go to **Deployments** → click the three dots next to the latest deployment → **Redeploy**.
5. Wait for the deployment to go green (🟢 Ready).

---

## Step 8 — Test the full flow

> Use Stripe **TEST mode** first — switch to TEST mode in the Stripe dashboard (toggle in the top-left). Use test API keys (`sk_test_…`) and a test webhook.

1. Open `https://pokieanalyzer.com.au` in an **incognito / private window**.
2. Tap a locked tab (e.g. **Heat Map 🔒**).
3. The paywall modal appears → tap **🚀 Upgrade to Premium**.
4. The sign-in modal appears → enter your email address → tap **Send magic link**.
5. Check your inbox for a Supabase email with a sign-in link.
6. Click the link → you're redirected back to the app.
7. The app detects the pending upgrade and redirects you to Stripe Checkout.
8. On Stripe Checkout, use the test card: `4242 4242 4242 4242` (any future expiry, any CVC, any postal code).
9. Complete the payment → you're redirected back to the app with `?upgrade=success`.
10. After ~2–3 seconds, the locks disappear and you see "🎉 Welcome to Premium!" toast.
11. Open the same email address on a different device → the app shows you as Premium (locks gone).

---

## Step 9 — Go live

When you're ready to accept real payments:

1. In Stripe, switch to **LIVE mode**.
2. Repeat Steps 5–6 in LIVE mode to get your live `price_…` ID and a new `whsec_…`.
3. In Vercel, update `STRIPE_SECRET_KEY` to your live `sk_live_…` key, and update `STRIPE_PRICE_ID` and `STRIPE_WEBHOOK_SECRET` with the live values.
4. Redeploy.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Authentication service unavailable" | `SUPABASE_SERVICE_ROLE_KEY` not set | Add the env var in Vercel and redeploy |
| "Payment configuration error" | `STRIPE_PRICE_ID` not set | Add the env var in Vercel and redeploy |
| Webhook returns 400 "Invalid signature" | `STRIPE_WEBHOOK_SECRET` wrong or missing | Copy the `whsec_…` from Stripe → Webhooks → your endpoint → Signing secret |
| Magic link not arriving | Supabase redirect URL not configured | Check Step 4 — add `https://pokieanalyzer.com.au/*` to allowlist |
| Premium doesn't unlock after payment | Webhook not reaching the server | Check Stripe → Webhooks → your endpoint → "Recent deliveries" for errors |
| Locks disappear then come back | Session expired | User needs to sign in again — tokens expire after 1 hour by default |

---

## Contact

Benjamin John Ryan trading as Pokie Analyzer  
ABN: 82 879 317 580  
Email: Benjamin@pokieanalyzer.com.au  
Address: 3 Devitt St, Aspley QLD 4034
