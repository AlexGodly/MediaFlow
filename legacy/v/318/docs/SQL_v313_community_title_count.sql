-- MediaFlow v313: exact count of distinct eligible community title identities.
-- Public ONLY: owner profile is public and public Library visibility is enabled.
-- Count verified provider identities, including unrated titles.
CREATE OR REPLACE FUNCTION public.mf_community_title_count_v313()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=public,auth
AS $function$
 SELECT count(*)::bigint
 FROM (
   SELECT l.provider,l.provider_id
   FROM public.mf_public_library l
   JOIN public.mf_public_profiles p ON p.user_id=l.user_id
   WHERE p.is_public AND p.show_library
     AND l.provider IN ('mal','simkl')
     AND l.provider_id<>''
   GROUP BY l.provider,l.provider_id
 ) eligible;
$function$;
REVOKE ALL ON FUNCTION public.mf_community_title_count_v313() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_community_title_count_v313() TO anon,authenticated;
