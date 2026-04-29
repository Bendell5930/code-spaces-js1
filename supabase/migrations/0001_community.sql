-- 0001_community.sql
--
-- Tables backing `lib/communityStore.js` — anonymous community profiles,
-- chat messages, and the recent-wins feed.
--
-- Auth model: the app does NOT use Supabase Auth for community features.
-- Each browser generates its own opaque UUID via `crypto.randomUUID()` and
-- stores it in localStorage (`pokie-community-profile`). That same UUID is
-- written to `community_profiles.id` and used as the `user_id` foreign key
-- on every chat message and win. There is no server-enforced identity, so
-- the RLS policies below are intentionally permissive for the `anon` role
-- (public read + public insert) and rely on application-side moderation
-- (`lib/chatModeration.js`) plus rate limiting at the network layer.
--
-- If you later move to Supabase Auth, tighten the policies to
-- `auth.uid() = user_id` for INSERT / UPDATE / DELETE.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- community_profiles
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.community_profiles (
  id uuid primary key,
  name text not null,
  avatar text not null,
  joined timestamptz not null default now()
);

alter table public.community_profiles enable row level security;

drop policy if exists "community_profiles_select_all" on public.community_profiles;
create policy "community_profiles_select_all"
  on public.community_profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "community_profiles_insert_all" on public.community_profiles;
create policy "community_profiles_insert_all"
  on public.community_profiles for insert
  to anon, authenticated
  with check (true);

-- Profile owners can update their own row. The browser supplies the id;
-- without Supabase Auth we cannot strictly verify it, but RLS still bounds
-- the WHERE clause so an attacker has to guess UUIDs rather than scan.
drop policy if exists "community_profiles_update_self" on public.community_profiles;
create policy "community_profiles_update_self"
  on public.community_profiles for update
  to anon, authenticated
  using (true)
  with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- community_chat
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.community_chat (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  avatar text not null,
  text text not null,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists community_chat_created_at_idx
  on public.community_chat (created_at desc);

alter table public.community_chat enable row level security;

drop policy if exists "community_chat_select_all" on public.community_chat;
create policy "community_chat_select_all"
  on public.community_chat for select
  to anon, authenticated
  using (true);

drop policy if exists "community_chat_insert_all" on public.community_chat;
create policy "community_chat_insert_all"
  on public.community_chat for insert
  to anon, authenticated
  with check (
    char_length(text) between 1 and 500
    and char_length(name) between 1 and 40
  );

-- Reactions are merged in by anyone (public reactions); other columns are
-- not editable from the client.
drop policy if exists "community_chat_update_reactions" on public.community_chat;
create policy "community_chat_update_reactions"
  on public.community_chat for update
  to anon, authenticated
  using (true)
  with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- community_wins
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.community_wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  avatar text not null,
  machine text not null default 'Unknown',
  amount numeric not null default 0,
  bet_amount numeric not null default 0,
  multiplier numeric not null default 0,
  bonus_hit boolean not null default false,
  location text,
  cheers integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists community_wins_created_at_idx
  on public.community_wins (created_at desc);

alter table public.community_wins enable row level security;

drop policy if exists "community_wins_select_all" on public.community_wins;
create policy "community_wins_select_all"
  on public.community_wins for select
  to anon, authenticated
  using (true);

drop policy if exists "community_wins_insert_all" on public.community_wins;
create policy "community_wins_insert_all"
  on public.community_wins for insert
  to anon, authenticated
  with check (
    amount >= 0
    and bet_amount >= 0
    and char_length(machine) between 1 and 80
  );

-- Anyone can bump the cheers counter on any win.
drop policy if exists "community_wins_update_cheers" on public.community_wins;
create policy "community_wins_update_cheers"
  on public.community_wins for update
  to anon, authenticated
  using (true)
  with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime
-- ─────────────────────────────────────────────────────────────────────────
-- Add the chat + wins tables to the supabase_realtime publication so the
-- browser can subscribe to inserts/updates via Realtime.
alter publication supabase_realtime add table public.community_chat;
alter publication supabase_realtime add table public.community_wins;
