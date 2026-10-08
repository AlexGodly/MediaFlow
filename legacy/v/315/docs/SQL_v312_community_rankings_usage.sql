-- MediaFlow v312: ranking views, optional usage tracking, visibility-aware user metrics.
ALTER TABLE public.mf_public_profiles ADD COLUMN IF NOT EXISTS xp_default_verified boolean DEFAULT NULL;
ALTER TABLE public.mf_public_profiles ADD COLUMN IF NOT EXISTS show_usage_time boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.mf_app_usage (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 seconds bigint NOT NULL DEFAULT 0 CHECK (seconds >= 0),
 last_seen timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mf_app_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mf_app_usage FROM anon,authenticated;
-- Server-timed heartbeat, credits at most 120 seconds per call after a previous
-- recent heartbeat; clients cannot submit arbitrary duration totals.
CREATE OR REPLACE FUNCTION public.mf_heartbeat_usage_v312(p_active boolean DEFAULT true)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_user uuid:=auth.uid(); v_row public.mf_app_usage%ROWTYPE; v_now timestamptz:=clock_timestamp(); v_increment integer:=0;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 INSERT INTO public.mf_app_usage(user_id,last_seen) VALUES(v_user,CASE WHEN p_active THEN v_now ELSE NULL END)
 ON CONFLICT (user_id) DO NOTHING;
 SELECT * INTO v_row FROM public.mf_app_usage WHERE user_id=v_user FOR UPDATE;
 IF v_row.last_seen IS NOT NULL THEN
  IF v_now-v_row.last_seen <= interval '3 minutes' THEN
   v_increment:=least(120,greatest(0,floor(extract(epoch from v_now-v_row.last_seen))::integer));
  END IF;
 END IF;
 UPDATE public.mf_app_usage SET seconds=seconds+v_increment,
 last_seen=CASE WHEN p_active THEN v_now ELSE NULL END,updated_at=v_now
 WHERE user_id=v_user RETURNING seconds INTO v_row.seconds;
 RETURN v_row.seconds;
END $$;
REVOKE ALL ON FUNCTION public.mf_heartbeat_usage_v312(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_heartbeat_usage_v312(boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.mf_users_directory_v312(
 p_search text DEFAULT '',p_tab text DEFAULT 'discover',p_sort text DEFAULT 'name',
 p_desc boolean DEFAULT false,p_verified text DEFAULT 'all',p_min_level integer DEFAULT 0,
 p_min_titles integer DEFAULT 0,p_limit integer DEFAULT 40,p_offset integer DEFAULT 0)
RETURNS TABLE(rank bigint,user_id uuid,username text,display_name text,bio text,avatar_url text,
 xp_level integer,xp_total bigint,xp_default_verified boolean,show_xp boolean,
 library_titles bigint,usage_seconds bigint,show_usage_time boolean,
 total_matches bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
WITH counts AS (
 SELECT l.user_id,count(*)::bigint AS titles FROM public.mf_public_library l
 JOIN public.mf_public_profiles p ON p.user_id=l.user_id
 WHERE p.is_public AND p.show_library GROUP BY l.user_id
), pool AS (
 SELECT p.user_id,p.username,p.display_name,p.bio,p.avatar_url,p.show_xp,p.show_usage_time,
 CASE WHEN p.show_xp THEN p.xp_level ELSE NULL END AS xp_level,
 CASE WHEN p.show_xp THEN p.xp_total ELSE NULL END AS xp_total,
 CASE WHEN p.show_xp THEN p.xp_default_verified ELSE NULL END AS xp_default_verified,
 CASE WHEN p.show_library THEN coalesce(c.titles,0) ELSE NULL END AS library_titles,
 CASE WHEN p.show_usage_time THEN coalesce(u.seconds,0) ELSE NULL END AS usage_seconds
 FROM public.mf_public_profiles p LEFT JOIN counts c ON c.user_id=p.user_id
 LEFT JOIN public.mf_app_usage u ON u.user_id=p.user_id WHERE p.is_public
), filtered AS (
 SELECT * FROM pool x
 WHERE (coalesce(trim(p_search),'')='' OR x.username ILIKE '%'||trim(p_search)||'%'
  OR x.display_name ILIKE '%'||trim(p_search)||'%')
 AND (p_verified='all' OR (p_verified='verified' AND x.xp_default_verified=true)
  OR (p_verified='unverified' AND x.xp_default_verified=false))
 AND (coalesce(p_min_level,0)<=0 OR coalesce(x.xp_level,-1)>=p_min_level)
 AND (coalesce(p_min_titles,0)<=0 OR coalesce(x.library_titles,-1)>=p_min_titles)
 AND (p_tab<>'ranking' OR
  CASE WHEN p_sort IN ('level','xp') THEN x.show_xp AND x.xp_total IS NOT NULL
       WHEN p_sort='library' THEN x.library_titles IS NOT NULL
       WHEN p_sort='usage' THEN x.show_usage_time AND x.usage_seconds IS NOT NULL
       ELSE true END)
), numbered AS (
 SELECT row_number() OVER(ORDER BY
 CASE WHEN p_sort='level' AND NOT p_desc THEN f.xp_level END ASC NULLS LAST,
 CASE WHEN p_sort='level' AND p_desc THEN f.xp_level END DESC NULLS LAST,
 CASE WHEN p_sort='level' AND NOT p_desc THEN f.xp_total END ASC NULLS LAST,
 CASE WHEN p_sort='level' AND p_desc THEN f.xp_total END DESC NULLS LAST,
 CASE WHEN p_sort='xp' AND NOT p_desc THEN f.xp_total END ASC NULLS LAST,
 CASE WHEN p_sort='xp' AND p_desc THEN f.xp_total END DESC NULLS LAST,
 CASE WHEN p_sort='library' AND NOT p_desc THEN f.library_titles END ASC NULLS LAST,
 CASE WHEN p_sort='library' AND p_desc THEN f.library_titles END DESC NULLS LAST,
 CASE WHEN p_sort='usage' AND NOT p_desc THEN f.usage_seconds END ASC NULLS LAST,
 CASE WHEN p_sort='usage' AND p_desc THEN f.usage_seconds END DESC NULLS LAST,
 CASE WHEN p_sort='name' AND NOT p_desc THEN lower(coalesce(f.display_name,f.username)) END ASC NULLS LAST,
 CASE WHEN p_sort='name' AND p_desc THEN lower(coalesce(f.display_name,f.username)) END DESC NULLS LAST,
 lower(f.username) ASC,f.user_id ASC) AS rank,
 f.*,count(*) OVER() AS total_matches FROM filtered f
)
SELECT n.rank,n.user_id,n.username,n.display_name,n.bio,n.avatar_url,n.xp_level,n.xp_total,
 n.xp_default_verified,n.show_xp,n.library_titles,n.usage_seconds,n.show_usage_time,n.total_matches
FROM numbered n ORDER BY n.rank
LIMIT least(100,greatest(1,coalesce(p_limit,40))) OFFSET greatest(0,coalesce(p_offset,0));
$$;
REVOKE ALL ON FUNCTION public.mf_users_directory_v312(text,text,text,boolean,text,integer,integer,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_users_directory_v312(text,text,text,boolean,text,integer,integer,integer,integer) TO anon,authenticated;
-- Lightweight, index-aware catalog leaderboard for filter/sort modes; ranks are
-- computed after metric filters but before text search and pagination.
CREATE OR REPLACE FUNCTION public.mf_ratings_leaderboard_v312(
 p_search text DEFAULT '',p_sort text DEFAULT 'rating',p_desc boolean DEFAULT true,
 p_provider text DEFAULT '',p_min_votes integer DEFAULT 1,p_min_libraries integer DEFAULT 0,
 p_min_rating numeric DEFAULT 0,p_limit integer DEFAULT 60,p_offset integer DEFAULT 0)
RETURNS TABLE(rank bigint,provider text,provider_id text,title text,users_count bigint,
 ratings_count bigint,average_rating numeric,covers text[],total numeric,metadata jsonb,
 total_ranked bigint,match_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
WITH eligible AS (
 SELECT DISTINCT ON (l.user_id,l.provider,l.provider_id)
 l.user_id,l.provider,l.provider_id,l.title,l.rating,l.cover_url,l.total,l.metadata
 FROM public.mf_public_library l JOIN public.mf_public_profiles p ON p.user_id=l.user_id
 WHERE p.is_public AND p.show_library AND l.provider IN ('mal','simkl') AND l.provider_id<>''
 AND (coalesce(p_provider,'')='' OR l.provider=p_provider)
 ORDER BY l.user_id,l.provider,l.provider_id,l.updated_at DESC NULLS LAST,l.entry_id
), grouped AS (
 SELECT e.provider,e.provider_id,min(e.title) title,count(*)::bigint users_count,
 count(*) FILTER(WHERE e.rating BETWEEN 0 AND 10)::bigint ratings_count,
 round(avg(e.rating) FILTER(WHERE e.rating BETWEEN 0 AND 10),2) average_rating,
 coalesce((array_agg(DISTINCT e.cover_url) FILTER(WHERE e.cover_url ~ '^https://'))[1:30],ARRAY[]::text[]) covers,
 max(e.total) total,(array_agg(e.metadata) FILTER(WHERE e.metadata<>'{}'::jsonb))[1] metadata
 FROM eligible e GROUP BY e.provider,e.provider_id
), filtered AS (
 SELECT * FROM grouped g WHERE g.ratings_count>=greatest(1,coalesce(p_min_votes,1))
 AND g.users_count>=greatest(0,coalesce(p_min_libraries,0))
 AND g.average_rating>=greatest(0,coalesce(p_min_rating,0))
), ranked AS (
 SELECT row_number() OVER(ORDER BY
 CASE WHEN p_sort='rating' AND p_desc THEN f.average_rating END DESC NULLS LAST,
 CASE WHEN p_sort='rating' AND NOT p_desc THEN f.average_rating END ASC NULLS LAST,
 CASE WHEN p_sort='votes' AND p_desc THEN f.ratings_count END DESC NULLS LAST,
 CASE WHEN p_sort='votes' AND NOT p_desc THEN f.ratings_count END ASC NULLS LAST,
 CASE WHEN p_sort='libraries' AND p_desc THEN f.users_count END DESC NULLS LAST,
 CASE WHEN p_sort='libraries' AND NOT p_desc THEN f.users_count END ASC NULLS LAST,
 CASE WHEN p_sort='title' AND p_desc THEN lower(f.title) END DESC NULLS LAST,
 CASE WHEN p_sort='title' AND NOT p_desc THEN lower(f.title) END ASC NULLS LAST,
 f.average_rating DESC,f.ratings_count DESC,f.users_count DESC,lower(f.title),f.provider,f.provider_id
 ) AS rank,f.*,count(*) OVER()::bigint total_ranked FROM filtered f
), matching AS (
 SELECT r.*,count(*) OVER()::bigint match_count FROM ranked r
 WHERE coalesce(trim(p_search),'')='' OR r.title ILIKE '%'||trim(p_search)||'%'
)
SELECT m.rank,m.provider,m.provider_id,m.title,m.users_count,m.ratings_count,m.average_rating,
 m.covers,m.total,coalesce(m.metadata,'{}'::jsonb),m.total_ranked,m.match_count
FROM matching m ORDER BY m.rank
LIMIT least(100,greatest(1,coalesce(p_limit,60))) OFFSET greatest(0,coalesce(p_offset,0));
$$;
REVOKE ALL ON FUNCTION public.mf_ratings_leaderboard_v312(text,text,boolean,text,integer,integer,numeric,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_ratings_leaderboard_v312(text,text,boolean,text,integer,integer,numeric,integer,integer) TO anon,authenticated;
-- Tiny indexed freshness probe, no full leaderboard computation per poll.
CREATE INDEX IF NOT EXISTS mf_public_library_updated_v312_idx ON public.mf_public_library(updated_at DESC);
CREATE INDEX IF NOT EXISTS mf_public_profiles_updated_v312_idx ON public.mf_public_profiles(updated_at DESC);
CREATE OR REPLACE FUNCTION public.mf_catalog_revision_v312() RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT greatest(
 coalesce((SELECT updated_at FROM public.mf_public_library ORDER BY updated_at DESC NULLS LAST LIMIT 1),'epoch'::timestamptz),
 coalesce((SELECT updated_at FROM public.mf_public_profiles ORDER BY updated_at DESC NULLS LAST LIMIT 1),'epoch'::timestamptz))
$$;
REVOKE ALL ON FUNCTION public.mf_catalog_revision_v312() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_catalog_revision_v312() TO anon,authenticated;
-- Supabase may add direct anon EXECUTE through default function grants.
REVOKE ALL ON FUNCTION public.mf_heartbeat_usage_v312(boolean) FROM anon;
