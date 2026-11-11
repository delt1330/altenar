-- Review comments for the Altenar preview site (src/review/).
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- Anyone with the review link can read comments and add comments or replies.
-- Only users listed in review_admins can resolve or delete them. Add yourself
-- after creating your user in Authentication → Users:
--   insert into public.review_admins (user_id)
--   select id from auth.users where email = '<your email>';

create table if not exists public.review_comments (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,                      -- '/' or '/Sportsbook/'
  parent_id   uuid references public.review_comments(id) on delete cascade,
  anchor      text,                               -- CSS path of the commented block
  rx real, ry real, rw real, rh real,             -- area inside the anchor, 0..1 of its box
  px real, py real, pw real, ph real,             -- fallback: area in page pixels
  vw integer,                                     -- viewport width when it was left
  author      text not null check (char_length(author) between 1 and 60),
  body        text not null check (char_length(body) between 1 and 4000),
  resolved    boolean not null default false,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists review_comments_page_idx on public.review_comments (page, created_at);

create table if not exists public.review_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_review_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.review_admins where user_id = auth.uid());
$$;

alter table public.review_comments enable row level security;
alter table public.review_admins enable row level security;

drop policy if exists "read comments" on public.review_comments;
create policy "read comments" on public.review_comments
  for select using (true);

drop policy if exists "add comments" on public.review_comments;
create policy "add comments" on public.review_comments
  for insert with check (resolved = false and resolved_at is null);

drop policy if exists "admins resolve" on public.review_comments;
create policy "admins resolve" on public.review_comments
  for update using (public.is_review_admin()) with check (public.is_review_admin());

drop policy if exists "admins delete" on public.review_comments;
create policy "admins delete" on public.review_comments
  for delete using (public.is_review_admin());

drop policy if exists "admins see themselves" on public.review_admins;
create policy "admins see themselves" on public.review_admins
  for select using (user_id = auth.uid());

-- Live updates for everyone looking at the page.
do $$ begin
  alter publication supabase_realtime add table public.review_comments;
exception when duplicate_object then null; end $$;
