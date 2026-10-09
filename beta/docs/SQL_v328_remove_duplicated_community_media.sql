-- MediaFlow v328: remove active media copies after installing share permissions.
-- This corresponds to the five successful cleanup migrations in mediaflowcloud.
-- REQUIREMENT: Deploy the live Edge Function and install SQL_v328_community_share_permissions.sql first.
-- The authoritative account data in public.mediaflow_states is never modified.
-- Truncation is transactional within PostgreSQL. Leave old empty tables in place for compatibility.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.mf_collection_shares_v328') IS NULL THEN RAISE EXCEPTION 'Install v328 share table first'; END IF;
  IF (SELECT count(*) FROM public.mf_collection_shares_v328)<(SELECT count(*) FROM public.mf_public_collections WHERE is_public)
    THEN RAISE EXCEPTION 'Public share metadata has not been migrated'; END IF;
  IF (SELECT count(*) FROM public.mediaflow_states)<1 THEN RAISE EXCEPTION 'No original Workspace data found'; END IF;
END $$;
TRUNCATE TABLE public.mf_public_library;
TRUNCATE TABLE public.mf_public_collections;
TRUNCATE TABLE public.mf_public_statistics;
TRUNCATE TABLE public.mf_public_history;
TRUNCATE TABLE public.mf_public_workspace_v325;
TRUNCATE TABLE public.mf_public_showcase_v323;
UPDATE public.mf_public_profiles p SET
  favorites=COALESCE((SELECT jsonb_agg(jsonb_build_object('id',e->>'id')) FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p.profile_v323->'favorites')='array' THEN p.profile_v323->'favorites' ELSE '[]'::jsonb END
  ) e WHERE coalesce(e->>'id','')<>''),'[]'::jsonb),
  profile_v323=jsonb_set(coalesce(p.profile_v323,'{}'::jsonb),'{favorites}',
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',e->>'id')) FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(p.profile_v323->'favorites')='array' THEN p.profile_v323->'favorites' ELSE '[]'::jsonb END
    ) e WHERE coalesce(e->>'id','')<>''),'[]'::jsonb),true),
  personal_order='[]'::jsonb,
  xp_total=0,xp_level=1,xp_default_verified=NULL;
COMMIT;
