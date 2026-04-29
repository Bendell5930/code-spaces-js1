-- 0002_subscriptions.sql
--
-- Server-side tables backing `lib/subscriptionDb.js`.
-- These store Stripe subscription state keyed by Stripe customer id, and a
-- mapping from app user id to Stripe customer id (set by the Checkout
-- webhook).
--
-- Auth model: writes go through the Stripe webhook handler using the
-- service-role key (`SUPABASE_SERVICE_ROLE_KEY`) which bypasses RLS.
-- The browser never reads these tables directly — `/api/me/subscription`
-- reads them server-side and returns a sanitised response. RLS is therefore
-- locked down: anon and authenticated roles get NO access. Only
-- service-role bypass can read or write.

-- ─────────────────────────────────────────────────────────────────────────
-- stripe_subscriptions
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.stripe_subscriptions (
  customer_id text primary key,
  subscription_id text,
  status text,
  current_period_end bigint,
  updated_at timestamptz not null default now()
);

create index if not exists stripe_subscriptions_status_idx
  on public.stripe_subscriptions (status);

alter table public.stripe_subscriptions enable row level security;

-- No anon / authenticated policies — service role bypasses RLS for all
-- reads and writes from server-side API routes.

-- ─────────────────────────────────────────────────────────────────────────
-- user_customers
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.user_customers (
  user_id text primary key,
  customer_id text not null,
  updated_at timestamptz not null default now()
);

create index if not exists user_customers_customer_id_idx
  on public.user_customers (customer_id);

alter table public.user_customers enable row level security;

-- No anon / authenticated policies — service role only.
