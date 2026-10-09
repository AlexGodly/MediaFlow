-- MediaFlow v325: owner-published, read-only Workspace state for native renderers.
-- Apply only after SQL_v323_public_showcase.sql. No existing rows are changed.
create table if not exists public.mf_public_workspace_v325 (
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('meta','library','history','collections','collection_titles','order','order_titles','order_collections','old','old_transactions')),
  page integer not null check (page >= 0),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 150),
  published_at timestamptz not null default now(),
  primary key(user_id, section, page)
);
create index if not exists mf_public_workspace_v325_owner_section on public.mf_public_workspace_v325(user_id, section, page);
alter table public.mf_public_workspace_v325 enable row level security;
drop policy if exists mf325_owner_select on public.mf_public_workspace_v325;
create policy mf325_owner_select on public.mf_public_workspace_v325 for select to authenticated using (auth.uid() = user_id);
drop policy if exists mf325_public_select on public.mf_public_workspace_v325;
create policy mf325_public_select on public.mf_public_workspace_v325 for select to anon,authenticated using (
  exists (select 1 from public.mf_public_profiles p
    where p.user_id = mf_public_workspace_v325.user_id and p.is_public
      and (
        mf_public_workspace_v325.section = 'meta'
        or exists (
          select 1 from jsonb_array_elements(case when jsonb_typeof(p.profile_v323->'tabs')='array' then p.profile_v323->'tabs' else '[]'::jsonb end) t
          where t->>'id' = (case when mf_public_workspace_v325.section in ('collection_titles') then 'collections' when mf_public_workspace_v325.section in ('order_titles','order_collections') then 'order' when mf_public_workspace_v325.section='old_transactions' then 'old' else mf_public_workspace_v325.section end) and t->>'visible' = 'true'
        )
      )
      and (mf_public_workspace_v325.section <> 'library' or p.show_library)
      and (mf_public_workspace_v325.section <> 'history' or p.show_history)
      and (mf_public_workspace_v325.section not in ('order','order_titles','order_collections') or p.show_order)
  )
);
drop policy if exists mf325_owner_insert on public.mf_public_workspace_v325;
create policy mf325_owner_insert on public.mf_public_workspace_v325 for insert to authenticated with check(auth.uid() = user_id);
drop policy if exists mf325_owner_update on public.mf_public_workspace_v325;
create policy mf325_owner_update on public.mf_public_workspace_v325 for update to authenticated using(auth.uid() = user_id) with check(auth.uid() = user_id);
drop policy if exists mf325_owner_delete on public.mf_public_workspace_v325;
create policy mf325_owner_delete on public.mf_public_workspace_v325 for delete to authenticated using(auth.uid() = user_id);
revoke all on table public.mf_public_workspace_v325 from PUBLIC,anon,authenticated;
grant select on table public.mf_public_workspace_v325 to anon;
grant select,insert,update,delete on table public.mf_public_workspace_v325 to authenticated;
