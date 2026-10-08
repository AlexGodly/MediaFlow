-- MediaFlow v309: read-only, opt-in community catalog with global filters/sorts.
-- No private workspace data is used. The function only reads titles from
-- profiles explicitly public and with show_library enabled.
ALTER TABLE public.mf_public_library ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.mf_browse_titles_v309(
 p_search text DEFAULT '', p_sort text DEFAULT 'libraries', p_desc boolean DEFAULT true,
 p_provider text DEFAULT '', p_status text DEFAULT '', p_min_users integer DEFAULT 0,
 p_min_rating numeric DEFAULT 0, p_limit integer DEFAULT 60, p_offset integer DEFAULT 0
)
RETURNS TABLE(provider text, provider_id text, title text, users_count bigint,
 ratings_count bigint, average_rating numeric, statuses jsonb, covers text[],
 total numeric, metadata jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
WITH eligible AS (
 SELECT DISTINCT ON (l.user_id,l.provider,l.provider_id)
   l.user_id,l.provider,l.provider_id,l.title,l.status,l.rating,l.cover_url,l.total,l.metadata
 FROM public.mf_public_library l
 JOIN public.mf_public_profiles p ON p.user_id=l.user_id
 WHERE p.is_public AND p.show_library AND l.provider IN ('mal','simkl') AND l.provider_id<>''
   AND (coalesce(trim(p_search),'')='' OR l.title ILIKE '%'||trim(p_search)||'%')
   AND (coalesce(p_provider,'')='' OR l.provider=p_provider)
 ORDER BY l.user_id,l.provider,l.provider_id,l.updated_at DESC,l.entry_id
), grouped AS (
 SELECT e.provider,e.provider_id,min(e.title) AS title,
  count(*)::bigint AS users_count, count(e.rating)::bigint AS ratings_count,
  round(avg(e.rating),2) AS average_rating,
  (array_agg(DISTINCT e.cover_url) FILTER(WHERE e.cover_url ~ '^https://'))[1:30] AS covers,
  max(e.total) AS total,
  (array_agg(e.metadata) FILTER(WHERE e.metadata <> '{}'::jsonb))[1] AS metadata,
  bool_or(e.status=coalesce(p_status,'')) AS matched_status
 FROM eligible e GROUP BY e.provider,e.provider_id
), status_counts AS (
 SELECT e.provider,e.provider_id,e.status,count(*)::bigint AS n FROM eligible e
 GROUP BY e.provider,e.provider_id,e.status
), status_json AS (
 SELECT s.provider,s.provider_id,jsonb_object_agg(s.status,s.n) AS statuses
 FROM status_counts s GROUP BY s.provider,s.provider_id
), filtered AS (
 SELECT g.*,coalesce(s.statuses,'{}'::jsonb) AS statuses
 FROM grouped g LEFT JOIN status_json s USING(provider,provider_id)
 WHERE g.users_count >= greatest(coalesce(p_min_users,0),0)
 AND (coalesce(p_min_rating,0)<=0 OR g.average_rating>=p_min_rating)
 AND (coalesce(p_status,'')='' OR g.matched_status)
)
SELECT f.provider,f.provider_id,f.title,f.users_count,f.ratings_count,f.average_rating,
 f.statuses,coalesce(f.covers,ARRAY[]::text[]),f.total,coalesce(f.metadata,'{}'::jsonb)
FROM filtered f
ORDER BY
 CASE WHEN p_sort='title' AND NOT p_desc THEN lower(f.title) END ASC NULLS LAST,
 CASE WHEN p_sort='title' AND p_desc THEN lower(f.title) END DESC NULLS LAST,
 CASE WHEN p_sort='ratings' AND NOT p_desc THEN f.average_rating END ASC NULLS LAST,
 CASE WHEN p_sort='ratings' AND p_desc THEN f.average_rating END DESC NULLS LAST,
 CASE WHEN p_sort='rating_count' AND NOT p_desc THEN f.ratings_count END ASC NULLS LAST,
 CASE WHEN p_sort='rating_count' AND p_desc THEN f.ratings_count END DESC NULLS LAST,
 CASE WHEN p_sort='libraries' AND NOT p_desc THEN f.users_count END ASC NULLS LAST,
 CASE WHEN p_sort='libraries' AND p_desc THEN f.users_count END DESC NULLS LAST,
 f.title ASC,f.provider ASC,f.provider_id ASC
LIMIT greatest(1,least(coalesce(p_limit,60),100))
OFFSET greatest(0,coalesce(p_offset,0));
$$;
REVOKE ALL ON FUNCTION public.mf_browse_titles_v309(text,text,boolean,text,text,integer,numeric,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_browse_titles_v309(text,text,boolean,text,text,integer,numeric,integer,integer) TO anon,authenticated;
