-- Subscriptions table: one row per user
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none',           -- 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
  plan text not null default 'basic',            -- 'basic' | 'premium'
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- RLS: user can read their own row; only service role can write
alter table public.subscriptions enable row level security;

drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- (writes are done from server with the service role key, which bypasses RLS)
