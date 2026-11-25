-- RIFQ initial schema
-- Accounts belong to adults (parents / adult learners). Children are profiles owned by a
-- parent account: they have no email, no password and no direct login.
-- Every child-related row is protected by Row Level Security so that only the owning
-- parent can read or write it.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  created_at timestamptz not null default now()
);

-- Learner profiles (children, or the adult's own learning profile)
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  avatar jsonb not null default '{}'::jsonb,
  weekly_days_goal smallint not null default 5 check (weekly_days_goal between 1 and 7),
  daily_verses smallint not null default 3 check (daily_verses between 1 and 50),
  stars integer not null default 0 check (stars >= 0),
  active_days date[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists children_parent_idx on public.children (parent_id);

create table if not exists public.verse_progress (
  child_id uuid not null references public.children (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  ayah smallint not null check (ayah between 1 and 286),
  state text not null check (state in ('not_started', 'learning', 'needs_revision', 'good', 'mastered')),
  interval_days integer not null default 0,
  ease real not null default 2.3,
  reps integer not null default 0,
  lapses integer not null default 0,
  due date not null,
  last_reviewed date,
  first_learned date,
  updated_at timestamptz not null default now(),
  primary key (child_id, surah, ayah)
);
create index if not exists verse_progress_due_idx on public.verse_progress (child_id, due);

create table if not exists public.lesson_progress (
  child_id uuid not null references public.children (id) on delete cascade,
  lesson_id text not null,
  completed_on date not null,
  quiz_score smallint not null default 0,
  primary key (child_id, lesson_id)
);

create table if not exists public.achievements (
  child_id uuid not null references public.children (id) on delete cascade,
  badge_id text not null,
  earned_on date not null,
  primary key (child_id, badge_id)
);

create table if not exists public.bookmarks (
  child_id uuid not null references public.children (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  ayah smallint not null check (ayah between 1 and 286),
  created_at timestamptz not null default now(),
  primary key (child_id, surah, ayah)
);

create table if not exists public.game_scores (
  child_id uuid not null references public.children (id) on delete cascade,
  game_id text not null,
  best smallint not null default 0,
  plays integer not null default 0,
  primary key (child_id, game_id)
);

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  child_id uuid not null references public.children (id) on delete cascade,
  kind text not null check (kind in ('memorize', 'revise', 'lesson', 'game', 'read')),
  label text not null check (char_length(label) <= 120),
  stars smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (child_id, created_at, kind)
);
create index if not exists activity_child_idx on public.activity_log (child_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Ownership helper
-- ---------------------------------------------------------------------------
create or replace function public.is_parent_of(p_child uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.children c where c.id = p_child and c.parent_id = auth.uid());
$$;
revoke all on function public.is_parent_of(uuid) from public;
grant execute on function public.is_parent_of(uuid) to authenticated;

-- Create a profile automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.verse_progress enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.bookmarks enable row level security;
alter table public.game_scores enable row level security;
alter table public.activity_log enable row level security;

create policy "own profile: read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile: update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own children: read" on public.children for select to authenticated using (parent_id = auth.uid());
create policy "own children: insert" on public.children for insert to authenticated with check (parent_id = auth.uid());
create policy "own children: update" on public.children for update to authenticated using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy "own children: delete" on public.children for delete to authenticated using (parent_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['verse_progress', 'lesson_progress', 'achievements', 'bookmarks', 'game_scores', 'activity_log'] loop
    execute format('create policy "parent access: select" on public.%I for select to authenticated using (public.is_parent_of(child_id));', t);
    execute format('create policy "parent access: insert" on public.%I for insert to authenticated with check (public.is_parent_of(child_id));', t);
    execute format('create policy "parent access: update" on public.%I for update to authenticated using (public.is_parent_of(child_id)) with check (public.is_parent_of(child_id));', t);
    execute format('create policy "parent access: delete" on public.%I for delete to authenticated using (public.is_parent_of(child_id));', t);
  end loop;
end $$;

-- No access for anonymous users to any table.
revoke all on all tables in schema public from anon;
