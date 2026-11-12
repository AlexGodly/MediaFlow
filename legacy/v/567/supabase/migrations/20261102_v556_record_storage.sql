-- v556: per-record cloud storage. One row per title, History log, activity
-- entry, collection and settings/XP section, so a save sends only what changed
-- and another device fetches only rows changed since its last sync.
-- The v434 single-row mediaflow_states table is kept and still written (in the
-- background) as a full fallback copy during the transition.
create table if not exists public.mediaflow_records (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  kind       text        not null check (kind in ('library','sessions','activityLog','collections','doc','meta')),
  record_id  text        not null check (length(record_id) between 1 and 300),
  pos        double precision,
  data       text,        -- exact JSON text: read back byte-for-byte as saved
  deleted    boolean     not null default false,
  device_id  text,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, kind, record_id)
);
create index if not exists mediaflow_records_user_updated
  on public.mediaflow_records (user_id, updated_at);

-- Server time decides "changed since": clients never set updated_at.
create or replace function public.mediaflow_records_touch()
returns trigger language plpgsql set search_path=public as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
drop trigger if exists mediaflow_records_touch on public.mediaflow_records;
create trigger mediaflow_records_touch
  before insert or update on public.mediaflow_records
  for each row execute function public.mediaflow_records_touch();

alter table public.mediaflow_records enable row level security;
drop policy if exists mediaflow_records_select on public.mediaflow_records;
drop policy if exists mediaflow_records_insert on public.mediaflow_records;
drop policy if exists mediaflow_records_update on public.mediaflow_records;
drop policy if exists mediaflow_records_delete on public.mediaflow_records;
create policy mediaflow_records_select on public.mediaflow_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy mediaflow_records_insert on public.mediaflow_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy mediaflow_records_update on public.mediaflow_records
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy mediaflow_records_delete on public.mediaflow_records
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.mediaflow_records from anon;
grant select, insert, update, delete on public.mediaflow_records to authenticated;

-- Bulk reads: one call returns up to 10,000 rows in (updated_at, kind,
-- record_id) order, so a new device downloads a 100,000-title account in about
-- 20 calls instead of 200 (the API returns at most 1,000 rows per plain read).
create index if not exists mediaflow_records_user_sync
  on public.mediaflow_records (user_id, updated_at, kind, record_id);
drop index if exists public.mediaflow_records_user_updated;
create or replace function public.mediaflow_records_page(
  p_after_at timestamptz default null,
  p_after_kind text default '',
  p_after_id text default '',
  p_limit integer default 10000)
returns json
language sql stable security invoker set search_path = public as $$
  select coalesce(json_agg(json_build_object(
           'kind',t.kind,'record_id',t.record_id,'pos',t.pos,'data',t.data,
           'deleted',t.deleted,'device_id',t.device_id,'updated_at',t.updated_at)
         order by t.updated_at,t.kind,t.record_id),'[]'::json)
  from (
    select r.* from public.mediaflow_records r
    where r.user_id = (select auth.uid())
      and (p_after_at is null
           or (r.updated_at,r.kind,r.record_id) > (p_after_at,coalesce(p_after_kind,''),coalesce(p_after_id,'')))
    order by r.updated_at,r.kind,r.record_id
    limit least(greatest(coalesce(p_limit,10000),1),10000)
  ) t;
$$;
revoke all on function public.mediaflow_records_page(timestamptz,text,text,integer) from public, anon;
grant execute on function public.mediaflow_records_page(timestamptz,text,text,integer) to authenticated;
