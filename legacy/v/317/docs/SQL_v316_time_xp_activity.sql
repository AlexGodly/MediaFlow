-- MediaFlow v316: server-owned uncapped time-based XP ledger.
-- Apply once in Supabase SQL editor. Existing private Library state is untouched.
CREATE TABLE IF NOT EXISTS public.mf_time_xp_v316 (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 credited_seconds bigint NOT NULL DEFAULT 0 CHECK (credited_seconds >= 0),
 xp_total bigint NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
 remainder_seconds integer NOT NULL DEFAULT 0 CHECK (remainder_seconds >= 0),
 last_seen timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mf_time_xp_days_v316 (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 day date NOT NULL,
 active_seconds bigint NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
 xp_earned bigint NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
 PRIMARY KEY(user_id,day)
);
ALTER TABLE public.mf_time_xp_v316 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mf_time_xp_days_v316 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mf_time_xp_read_v316 ON public.mf_time_xp_v316;
CREATE POLICY mf_time_xp_read_v316 ON public.mf_time_xp_v316 FOR SELECT TO authenticated USING(auth.uid()=user_id);
DROP POLICY IF EXISTS mf_time_xp_days_read_v316 ON public.mf_time_xp_days_v316;
CREATE POLICY mf_time_xp_days_read_v316 ON public.mf_time_xp_days_v316 FOR SELECT TO authenticated USING(auth.uid()=user_id);
REVOKE ALL ON public.mf_time_xp_v316 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.mf_time_xp_days_v316 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.mf_time_xp_v316 TO authenticated;
GRANT SELECT ON public.mf_time_xp_days_v316 TO authenticated;

CREATE OR REPLACE FUNCTION public.mf_time_xp_tick_v316(
 p_active boolean DEFAULT true,p_enabled boolean DEFAULT true,
 p_interval_seconds integer DEFAULT 600,p_reward_xp integer DEFAULT 5,
 p_multiplier numeric DEFAULT 1
)
RETURNS TABLE(xp_total bigint,lifetime_seconds bigint,remainder_seconds integer,
 today_seconds bigint,today_xp bigint,granted_xp bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $fn$
DECLARE
 uid uuid:=auth.uid(); tick_time timestamptz:=clock_timestamp();
 old public.mf_time_xp_v316%ROWTYPE; elapsed_seconds bigint:=0;
 intervals bigint:=0; granted bigint:=0; new_remainder integer;
 reward integer; period integer; mult numeric; publish_usage boolean:=false;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 period:=greatest(60,least(3600,coalesce(p_interval_seconds,600)));
 reward:=greatest(0,least(500,coalesce(p_reward_xp,5)));
 mult:=greatest(1,least(3,coalesce(p_multiplier,1)));
 INSERT INTO public.mf_time_xp_v316(user_id,last_seen) VALUES(uid,NULL)
 ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO old FROM public.mf_time_xp_v316 WHERE user_id=uid FOR UPDATE;
 IF p_active IS TRUE AND old.last_seen IS NOT NULL
    AND tick_time-old.last_seen BETWEEN interval '0 seconds' AND interval '150 seconds' THEN
   elapsed_seconds:=least(120,greatest(0,floor(extract(epoch FROM tick_time-old.last_seen))::bigint));
 END IF;
 new_remainder:=old.remainder_seconds;
 IF p_enabled IS TRUE AND elapsed_seconds>0 THEN
   intervals:=(old.remainder_seconds+elapsed_seconds)/period;
   new_remainder:=(old.remainder_seconds+elapsed_seconds)%period;
   granted:=round(intervals*reward*mult)::bigint;
 END IF;
 UPDATE public.mf_time_xp_v316 t SET
 credited_seconds=t.credited_seconds+elapsed_seconds,
 xp_total=t.xp_total+granted,
 remainder_seconds=new_remainder,
 last_seen=CASE WHEN p_active THEN tick_time ELSE NULL END,
 updated_at=tick_time WHERE t.user_id=uid;
 IF elapsed_seconds>0 OR granted>0 THEN
   INSERT INTO public.mf_time_xp_days_v316(user_id,day,active_seconds,xp_earned)
   VALUES(uid,(tick_time AT TIME ZONE 'UTC')::date,elapsed_seconds,granted)
   ON CONFLICT(user_id,day) DO UPDATE SET
    active_seconds=public.mf_time_xp_days_v316.active_seconds+excluded.active_seconds,
    xp_earned=public.mf_time_xp_days_v316.xp_earned+excluded.xp_earned;
   SELECT EXISTS(SELECT 1 FROM public.mf_public_profiles
     WHERE user_id=uid AND is_public AND show_usage_time) INTO publish_usage;
   IF publish_usage THEN
     INSERT INTO public.mf_app_usage(user_id,seconds,last_seen,updated_at)
     VALUES(uid,elapsed_seconds,tick_time,tick_time)
     ON CONFLICT(user_id) DO UPDATE SET
      seconds=public.mf_app_usage.seconds+excluded.seconds,
      last_seen=tick_time,updated_at=tick_time;
   END IF;
 END IF;
 RETURN QUERY SELECT t.xp_total,t.credited_seconds,t.remainder_seconds,
 COALESCE(d.active_seconds,0)::bigint,COALESCE(d.xp_earned,0)::bigint,granted
 FROM public.mf_time_xp_v316 t
 LEFT JOIN public.mf_time_xp_days_v316 d ON d.user_id=t.user_id
 AND d.day=(tick_time AT TIME ZONE 'UTC')::date
 WHERE t.user_id=uid;
END $fn$;
REVOKE ALL ON FUNCTION public.mf_time_xp_tick_v316(boolean,boolean,integer,integer,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mf_time_xp_tick_v316(boolean,boolean,integer,integer,numeric) TO authenticated;

CREATE INDEX IF NOT EXISTS mf_usage_updated_v316_idx ON public.mf_app_usage(updated_at DESC);
CREATE OR REPLACE FUNCTION public.mf_users_revision_v316()
RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
SELECT greatest(public.mf_catalog_revision_v312(),
 COALESCE((SELECT u.updated_at FROM public.mf_app_usage u
  JOIN public.mf_public_profiles p ON p.user_id=u.user_id
  WHERE p.is_public AND p.show_usage_time
  ORDER BY u.updated_at DESC LIMIT 1),'epoch'::timestamptz))
$fn$;
REVOKE ALL ON FUNCTION public.mf_users_revision_v316() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_users_revision_v316() TO anon,authenticated;
