# Pokie Analyzer — Setup Guide

This guide walks you through setting up Supabase (auth + database) and Stripe (payments) so the full Premium subscription flow works end-to-end.

---

## 1. Supabase setup

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
   - Recommended region: **Sydney (ap-southeast-2)**
   - Note your project password somewhere safe.

2. In your project, go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` *(keep this secret — never expose it client-side)*

3. **Create the subscriptions table:**
   - Go to **SQL Editor → New query**.
   - Paste the entire contents of `supabase/schema.sql` from this repo.
   - Click **Run**.

4. **Configure Authentication URLs:**
   - Go to **Authentication → URL Configuration**.
   - Set **Site URL** to `https://pokieanalyzer.com.au`
   - Under **Redirect URLs**, add: `https://pokieanalyzer.com.au/auth/callback`

5. **Email provider settings:**
   - **Authentication → Providers → Email** is enabled by default.
   - For magic-link UX: ensure **"Confirm email"** is set to your preference.
     - OFF = user clicks link once and is signed in immediately.
     - ON = user must confirm first (extra security but more friction).

---

## 2. Stripe setup

### Test mode first (recommended)

1. In the Stripe Dashboard, make sure the **Test mode** toggle (top-right) is ON.

2. **Create the Premium product:**
   - Go to **Products → Add product**.
   - Name: `Pokie Analyzer Premium`
   - Pricing: **Recurring**, **A$9.00 / month**
   - Click **Save product** and copy the **Price ID** (starts with `price_`) → `STRIPE_PRICE_ID`

3. **Get your API secret key:**
   - Go to **Developers → API keys**.
   - Copy the **Secret key** (`sk_test_…`) → `STRIPE_SECRET_KEY`

4. **Set up the webhook:**
   - Go to **Developers → Webhooks → Add endpoint**.
   - **Endpoint URL:** `https://pokieanalyzer.com.au/api/stripe-webhook`
   - **Events to listen for:**
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Click **Add endpoint**, then copy the **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`

### Going live

When you're ready to accept real payments:

1. Toggle Stripe to **Live mode** (top-right).
2. Repeat steps 2–4 above in Live mode (new product, new key, new webhook).
3. Replace the test env vars in Vercel with the live equivalents and redeploy.

---

## 3. Vercel environment variables

In your Vercel project: **Settings → Environment Variables**.

Set all of the following on **Production**, **Preview**, and **Development**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, keep secret) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` or `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) |
| `STRIPE_PRICE_ID` | Stripe Price ID for the Premium plan (`price_…`) |

After adding all variables, trigger a new deployment (push a commit or click **Redeploy**).

---

## 4. Test the full flow

1. Open `https://pokieanalyzer.com.au` in your browser.
2. Tap a 🔒 locked tab (e.g. Heat Map) → tap **🚀 Upgrade to Premium**.
3. You should see a **Sign In** modal — enter your email and click **Send magic link**.
4. Check your email, click the magic link → you're redirected back to the app.
5. The checkout should start automatically. Use the Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. `12/34`)
   - CVC: any 3 digits (e.g. `123`)
   - Postcode: any (e.g. `4000`)
6. After payment, you're redirected to `/?upgrade=success`. The app polls `/api/me` and when the webhook lands (usually within a second or two) shows a **"Welcome to Premium! 🎉"** toast and removes all lock icons.

**Verifying the webhook fired:**
- Stripe Dashboard → **Developers → Webhooks** → click your endpoint → **Recent deliveries**.
- You should see a `checkout.session.completed` event with status **200**.

**Verifying Supabase was updated:**
- Supabase Dashboard → **Table Editor → subscriptions**.
- You should see a row with `plan = 'premium'` and `status = 'active'` for your user.

---

## 5. Cancellation flow

1. In the app, when signed in as a Premium user, tap **Manage** in the subscription badge.
2. You're redirected to the Stripe Customer Portal.
3. Click **Cancel plan**.
4. Stripe fires `customer.subscription.deleted` → webhook updates Supabase → `plan` flips to `'basic'`.
5. On next page load (or after refreshing), lock icons reappear.

---

## Notes

- **Anonymous users** can still use all Basic features without signing in. Login is only required when upgrading.
- **Secret keys** are never sent to the browser. The `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` are only used in API routes (server-side).
- The old Stripe Payment Link (`lib/stripeLinks.js`) is still present as a backup but is no longer used by the UI.
