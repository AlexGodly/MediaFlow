-- MediaFlow v374 tracking: independent, opt-in associations only.
-- Apply to the SAME Supabase project used by the deployed MediaFlow client.
create table if not exists public.mf_tracking_accounts_v374 (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('mal','simkl')),
  token_ciphertext text not null,
  refresh_ciphertext text,
  expires_at timestamptz,
  connected_at timestamptz not null default now(),
  primary key (user_id, provider)
);
create table if not exists public.mf_tracking_oauth_v374 (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('mal','simkl')),
  verifier_ciphertext text,
  created_at timestamptz not null default now()
);
create table if not exists public.mf_tracking_links_v374 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_id text not null,
  season_id text not null default '',
  provider text not null check (provider in ('mal','simkl')),
  remote_id text not null,
  remote_type text not null check (remote_type in ('anime','manga','tv','movie')),
  remote_title text not null,
  enabled boolean not null default false,
  sync_progress boolean not null default true,
  sync_status boolean not null default false,
  sync_rating boolean not null default false,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (user_id, library_id, season_id, provider),
  unique (user_id, provider, remote_type, remote_id, season_id)
);
create index if not exists mf_tracking_links_v374_owner_library on public.mf_tracking_links_v374(user_id,library_id);
create table if not exists public.mf_tracking_jobs_v374 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  link_id uuid not null references public.mf_tracking_links_v374(id) on delete cascade,
  event_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check(status in ('pending','processing','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id,link_id,event_key)
);
create index if not exists mf_tracking_jobs_v374_due on public.mf_tracking_jobs_v374(user_id,status,next_attempt_at);
-- No direct client DML on credentials, OAuth state or retry queue.
alter table public.mf_tracking_accounts_v374 enable row level security;
alter table public.mf_tracking_oauth_v374 enable row level security;
alter table public.mf_tracking_links_v374 enable row level security;
alter table public.mf_tracking_jobs_v374 enable row level security;
revoke all on public.mf_tracking_accounts_v374 from anon,authenticated;
revoke all on public.mf_tracking_oauth_v374 from anon,authenticated;
revoke all on public.mf_tracking_jobs_v374 from anon,authenticated;
revoke all on public.mf_tracking_links_v374 from anon;
revoke all on public.mf_tracking_links_v374 from authenticated;
-- Read-only associations for signed in owner; all writes through verified Edge Function.
grant select on public.mf_tracking_links_v374 to authenticated;
drop policy if exists mf_tracking_links_v374_owner_read on public.mf_tracking_links_v374;
create policy mf_tracking_links_v374_owner_read on public.mf_tracking_links_v374 for select to authenticated
using ((select auth.uid())=user_id);
