-- ============================================================
-- PokieAnalyzer subscriptions table
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- subscriptions table
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',  -- 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  plan text not null default 'basic',        -- 'basic' | 'premium'
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can only read their own row; only the service role can write.
alter table public.subscriptions enable row level security;

create policy "users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);
