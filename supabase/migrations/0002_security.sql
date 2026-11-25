-- RIFQ security hardening (run after 0001_init.sql).
-- Defence in depth: even a user who bypasses the web app and calls the API directly with
-- their own JWT can only touch their own rows, and only with well-formed values.
-- All app queries go through supabase-js / PostgREST, which always sends values as bound
-- parameters (no string-built SQL anywhere), so SQL injection is not possible from the client.

-- ---------------------------------------------------------------------------
-- 1. Verse bounds: ayah must exist in its surah (Hafs counts, total 6236).
-- ---------------------------------------------------------------------------
create table if not exists public.surah_lengths (
  surah smallint primary key check (surah between 1 and 114),
  verses smallint not null check (verses between 3 and 286)
);
insert into public.surah_lengths (surah, verses) values (1,7),(2,286),(3,200),(4,176),(5,120),(6,165),(7,206),(8,75),(9,129),(10,109),(11,123),(12,111),(13,43),(14,52),(15,99),(16,128),(17,111),(18,110),(19,98),(20,135),(21,112),(22,78),(23,118),(24,64),(25,77),(26,227),(27,93),(28,88),(29,69),(30,60),(31,34),(32,30),(33,73),(34,54),(35,45),(36,83),(37,182),(38,88),(39,75),(40,85),(41,54),(42,53),(43,89),(44,59),(45,37),(46,35),(47,38),(48,29),(49,18),(50,45),(51,60),(52,49),(53,62),(54,55),(55,78),(56,96),(57,29),(58,22),(59,24),(60,13),(61,14),(62,11),(63,11),(64,18),(65,12),(66,12),(67,30),(68,52),(69,52),(70,44),(71,28),(72,28),(73,20),(74,56),(75,40),(76,31),(77,50),(78,40),(79,46),(80,42),(81,29),(82,19),(83,36),(84,25),(85,22),(86,17),(87,19),(88,26),(89,30),(90,20),(91,15),(92,21),(93,11),(94,8),(95,8),(96,19),(97,5),(98,8),(99,8),(100,11),(101,11),(102,8),(103,3),(104,9),(105,5),(106,4),(107,7),(108,3),(109,6),(110,3),(111,5),(112,4),(113,5),(114,6)
on conflict (surah) do update set verses = excluded.verses;

alter table public.surah_lengths enable row level security;
alter table public.surah_lengths force row level security;
drop policy if exists "surah lengths: read" on public.surah_lengths;
create policy "surah lengths: read" on public.surah_lengths for select to authenticated using (true);
revoke insert, update, delete, truncate on public.surah_lengths from authenticated, anon;

create or replace function public.check_verse_exists()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.surah_lengths l where l.surah = new.surah and new.ayah between 1 and l.verses) then
    raise exception using errcode = '23514', message = 'invalid verse reference';
  end if;
  return new;
end;
$$;

drop trigger if exists verse_progress_exists on public.verse_progress;
create trigger verse_progress_exists before insert or update on public.verse_progress
  for each row execute function public.check_verse_exists();
drop trigger if exists bookmarks_exists on public.bookmarks;
create trigger bookmarks_exists before insert or update on public.bookmarks
  for each row execute function public.check_verse_exists();

-- ---------------------------------------------------------------------------
-- 2. Value constraints (mirror src/lib/validation.ts + src/lib/state-guard.ts).
--    "not valid" skips checking legacy rows so the migration never fails; new writes are checked.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_name_clean check (display_name is null or display_name !~ '[<>`"\\{}[:cntrl:]]') not valid;

alter table public.children
  add constraint children_name_clean check (display_name !~ '[<>`"\\{}[:cntrl:]]' and btrim(display_name) <> '') not valid,
  add constraint children_avatar_object check (jsonb_typeof(avatar) = 'object' and pg_column_size(avatar) <= 512) not valid,
  add constraint children_active_days_len check (coalesce(array_length(active_days, 1), 0) <= 4000) not valid,
  add constraint children_stars_max check (stars <= 10000000) not valid;

alter table public.verse_progress
  add constraint vp_interval check (interval_days between 0 and 3650) not valid,
  add constraint vp_ease check (ease between 1.3 and 5) not valid,
  add constraint vp_reps check (reps between 0 and 100000 and lapses between 0 and 100000) not valid,
  add constraint vp_dates check (due between date '2000-01-01' and date '2200-01-01') not valid;

alter table public.lesson_progress
  add constraint lp_id check (lesson_id ~ '^[a-z0-9_:-]{1,40}$') not valid,
  add constraint lp_score check (quiz_score between 0 and 100) not valid;

alter table public.achievements
  add constraint ach_id check (badge_id ~ '^[a-z0-9_:-]{1,40}$') not valid;

alter table public.game_scores
  add constraint gs_id check (game_id ~ '^[a-z0-9_:-]{1,40}$') not valid,
  add constraint gs_ranges check (best between 0 and 30000 and plays between 0 and 1000000) not valid;

alter table public.activity_log
  add constraint act_label_clean check (label !~ '[<>`"\\{}[:cntrl:]]') not valid,
  add constraint act_stars check (stars between 0 and 1000) not valid,
  add constraint act_time check (created_at <= now() + interval '1 day') not valid;

-- ---------------------------------------------------------------------------
-- 3. Ownership cannot be transferred, and quotas stop abuse of the free tier.
-- ---------------------------------------------------------------------------
create or replace function public.guard_children()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.parent_id <> old.parent_id then
    raise exception using errcode = '42501', message = 'parent_id is immutable';
  end if;
  if tg_op = 'UPDATE' and new.id <> old.id then
    raise exception using errcode = '42501', message = 'id is immutable';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.children where parent_id = new.parent_id) >= 10 then
    raise exception using errcode = '54000', message = 'too many learner profiles';
  end if;
  return new;
end;
$$;
drop trigger if exists children_guard on public.children;
create trigger children_guard before insert or update on public.children
  for each row execute function public.guard_children();

-- child_id of progress rows is immutable too (no moving rows into someone else's child).
create or replace function public.guard_child_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.child_id <> old.child_id then
    raise exception using errcode = '42501', message = 'child_id is immutable';
  end if;
  return new;
end;
$$;

-- Flood limit: at most 300 activity rows per child per hour, 2000 bookmarks per child.
create or replace function public.guard_activity_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.activity_log
      where child_id = new.child_id and created_at > now() - interval '1 hour') >= 300 then
    raise exception using errcode = '54000', message = 'rate limit';
  end if;
  return new;
end;
$$;
drop trigger if exists activity_rate on public.activity_log;
create trigger activity_rate before insert on public.activity_log
  for each row execute function public.guard_activity_rate();

create or replace function public.guard_bookmark_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.bookmarks where child_id = new.child_id) >= 2000 then
    raise exception using errcode = '54000', message = 'quota exceeded';
  end if;
  return new;
end;
$$;
drop trigger if exists bookmark_quota on public.bookmarks;
create trigger bookmark_quota before insert on public.bookmarks
  for each row execute function public.guard_bookmark_quota();

do $$
declare t text;
begin
  foreach t in array array['verse_progress', 'lesson_progress', 'achievements', 'bookmarks', 'game_scores', 'activity_log'] loop
    execute format('drop trigger if exists %I on public.%I;', t || '_child_immutable', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.guard_child_id();', t || '_child_immutable', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Safer sign-up trigger: clean the display name instead of trusting metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(btrim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'display_name', ''), '[<>`"\\{}[:cntrl:]]', '', 'g')), 60), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Lock down privileges.
-- ---------------------------------------------------------------------------
-- RLS applies even to the table owner (except superuser / service role).
alter table public.profiles force row level security;
alter table public.children force row level security;
alter table public.verse_progress force row level security;
alter table public.lesson_progress force row level security;
alter table public.achievements force row level security;
alter table public.bookmarks force row level security;
alter table public.game_scores force row level security;
alter table public.activity_log force row level security;

-- Internal functions are not callable through the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_children() from public, anon, authenticated;
revoke all on function public.guard_child_id() from public, anon, authenticated;
revoke all on function public.guard_activity_rate() from public, anon, authenticated;
revoke all on function public.guard_bookmark_quota() from public, anon, authenticated;
revoke all on function public.check_verse_exists() from public, anon, authenticated;
revoke all on function public.is_parent_of(uuid) from public, anon;

-- Nothing for anonymous visitors, now or for tables added later.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon, public;
alter default privileges in schema public revoke all on sequences from anon;

-- Profiles are created only by the trigger; users cannot insert or delete them directly
-- (account deletion goes through Supabase Auth, which cascades).
revoke insert, delete, truncate on public.profiles from authenticated;
-- (Changing profiles.id is already blocked by the RLS "with check (id = auth.uid())".)
revoke truncate on all tables in schema public from authenticated;
