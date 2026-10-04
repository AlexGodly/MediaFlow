-- MediaFlow cloud accounts
-- Run this once in Supabase SQL Editor.
-- IMPORTANT: use only the browser-safe publishable/anon key in MediaFlow.
-- Never put a service_role or secret key into the HTML.

create table if not exists public.mediaflow_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mediaflow_states enable row level security;

revoke all on table public.mediaflow_states from anon;
grant select, insert, update, delete on table public.mediaflow_states to authenticated;

drop policy if exists "Users can read their own MediaFlow state" on public.mediaflow_states;
create policy "Users can read their own MediaFlow state"
on public.mediaflow_states
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own MediaFlow state" on public.mediaflow_states;
create policy "Users can create their own MediaFlow state"
on public.mediaflow_states
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own MediaFlow state" on public.mediaflow_states;
create policy "Users can update their own MediaFlow state"
on public.mediaflow_states
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own MediaFlow state" on public.mediaflow_states;
create policy "Users can delete their own MediaFlow state"
on public.mediaflow_states
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Keep updated_at accurate for future server-side writes too.
create or replace function public.mediaflow_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mediaflow_states_touch_updated_at on public.mediaflow_states;
create trigger mediaflow_states_touch_updated_at
before update on public.mediaflow_states
for each row execute function public.mediaflow_touch_updated_at();


-- V17: allow an authenticated user to permanently delete their own account.
-- Run this once in the Supabase SQL editor. The function is intentionally restricted
-- to the currently authenticated user and deletes the auth user, which cascades to
-- mediaflow_states because user_id references auth.users ON DELETE CASCADE.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
