-- In-app account deletion (required by Google Play and the App Store for apps with sign-up).
-- A signed-in user can delete ONLY their own account. Deleting the auth user cascades to
-- profiles -> children -> every progress table (see 0001_init.sql), so nothing is left behind.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception using errcode = '42501', message = 'not signed in';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
