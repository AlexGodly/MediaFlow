-- MediaFlow v311: globally ranked, opt-in Community Ratings leaderboard.
-- Rank is computed BEFORE search/pagination so it never resets on page two
-- and a title found through search retains its true overall position.
-- Only verified MAL/SIMKL titles with at least one valid published rating rank.
CREATE OR REPLACE FUNCTION public.mf_ratings_leaderboard_v311(
    p_search text DEFAULT '',
    p_limit integer DEFAULT 60,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    rank bigint,
    provider text,
    provider_id text,
    title text,
    users_count bigint,
    ratings_count bigint,
    average_rating numeric,
    covers text[],
    total numeric,
    metadata jsonb,
    total_ranked bigint,
    match_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $function$
WITH eligible AS (
    SELECT DISTINCT ON (l.user_id, l.provider, l.provider_id)
        l.user_id, l.provider, l.provider_id, l.title, l.rating,
        l.cover_url, l.total, l.metadata
    FROM public.mf_public_library l
    JOIN public.mf_public_profiles p ON p.user_id = l.user_id
    WHERE p.is_public AND p.show_library
      AND l.provider IN ('mal', 'simkl') AND l.provider_id <> ''
    ORDER BY l.user_id, l.provider, l.provider_id, l.updated_at DESC NULLS LAST, l.entry_id
), grouped AS (
    SELECT e.provider, e.provider_id, min(e.title) AS title,
        count(*)::bigint AS users_count,
        count(*) FILTER (WHERE e.rating BETWEEN 0 AND 10)::bigint AS ratings_count,
        round(avg(e.rating) FILTER (WHERE e.rating BETWEEN 0 AND 10), 2) AS average_rating,
        coalesce((array_agg(DISTINCT e.cover_url) FILTER (WHERE e.cover_url ~ '^https://'))[1:30], ARRAY[]::text[]) AS covers,
        max(e.total) AS total,
        (array_agg(e.metadata) FILTER (WHERE e.metadata IS NOT NULL AND e.metadata <> '{}'::jsonb))[1] AS metadata
    FROM eligible e
    GROUP BY e.provider, e.provider_id
), ranked AS (
    SELECT row_number() OVER (
            ORDER BY g.average_rating DESC, g.ratings_count DESC,
                     g.users_count DESC, lower(g.title) ASC,
                     g.provider ASC, g.provider_id ASC
        ) AS rank,
        g.*, count(*) OVER ()::bigint AS total_ranked
    FROM grouped g
    WHERE g.ratings_count > 0
), matching AS (
    SELECT r.*, count(*) OVER ()::bigint AS match_count
    FROM ranked r
    WHERE coalesce(trim(p_search), '') = ''
       OR r.title ILIKE '%' || trim(p_search) || '%'
)
SELECT m.rank, m.provider, m.provider_id, m.title, m.users_count,
       m.ratings_count, m.average_rating, m.covers, m.total,
       coalesce(m.metadata, '{}'::jsonb), m.total_ranked, m.match_count
FROM matching m
ORDER BY m.rank ASC
LIMIT greatest(1, least(coalesce(p_limit, 60), 100))
OFFSET greatest(0, coalesce(p_offset, 0));
$function$;
REVOKE ALL ON FUNCTION public.mf_ratings_leaderboard_v311(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_ratings_leaderboard_v311(text, integer, integer) TO anon, authenticated;
