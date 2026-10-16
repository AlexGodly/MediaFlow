-- v434: count anonymous-free, authenticated calls only; no searched titles or secrets retained.
create table if not exists public.mediaflow_gateway_quota (
 day date not null,
 scope text not null,
 provider text not null,
 used integer not null default 0 check (used >= 0),
 primary key(day,scope,provider)
);
alter table public.mediaflow_gateway_quota enable row level security;
revoke all on public.mediaflow_gateway_quota from anon, authenticated;
create or replace function public.mediaflow_gateway_claim(
 p_user uuid,p_provider text,p_global_max integer,p_user_max integer)
returns boolean language plpgsql security definer set search_path=public
as $$
declare d date:=(now() at time zone 'UTC')::date; ok integer;
begin
 if auth.role() is distinct from 'service_role' then return false; end if;
 if p_user is null or p_provider !~ '^[a-z]{3,32}$' or p_global_max<1 or p_user_max<1
    or p_global_max>1000 or p_user_max>100 then return false; end if;
 perform pg_advisory_xact_lock(hashtext(d::text||p_provider));
 insert into mediaflow_gateway_quota(day,scope,provider,used)
 values(d,'global',p_provider,1)
 on conflict(day,scope,provider) do update set used=mediaflow_gateway_quota.used+1
 where mediaflow_gateway_quota.used < p_global_max
 returning used into ok;
 if ok is null then return false; end if;
 ok:=null;
 insert into mediaflow_gateway_quota(day,scope,provider,used)
 values(d,'user:'||p_user::text,p_provider,1)
 on conflict(day,scope,provider) do update set used=mediaflow_gateway_quota.used+1
 where mediaflow_gateway_quota.used < p_user_max
 returning used into ok;
 if ok is null then
  update mediaflow_gateway_quota set used=greatest(0,used-1)
   where day=d and scope='global' and provider=p_provider;
  return false;
 end if;
 return true;
end;
$$;
revoke all on function public.mediaflow_gateway_claim(uuid,text,integer,integer) from public, anon, authenticated;
grant execute on function public.mediaflow_gateway_claim(uuid,text,integer,integer) to service_role;
