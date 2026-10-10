-- MediaFlow v323: run after existing Community migrations in Supabase SQL editor.
-- This table contains ONLY the account owner's explicitly published read-only snapshots.
ALTER TABLE public.mf_public_profiles ADD COLUMN IF NOT EXISTS profile_v323 jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE TABLE IF NOT EXISTS public.mf_public_showcase_v323 (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 section text NOT NULL CHECK(section IN ('categories','order','old')),
 page integer NOT NULL CHECK(page >= 0),
 items jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(items)='array' AND jsonb_array_length(items)<=150),
 published_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,section,page)
);
ALTER TABLE public.mf_public_showcase_v323 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mf323_owner_read ON public.mf_public_showcase_v323;
CREATE POLICY mf323_owner_read ON public.mf_public_showcase_v323 FOR SELECT TO authenticated USING(auth.uid()=user_id);
DROP POLICY IF EXISTS mf323_guest_read ON public.mf_public_showcase_v323;
CREATE POLICY mf323_guest_read ON public.mf_public_showcase_v323 FOR SELECT TO anon,authenticated USING(
 EXISTS(SELECT 1 FROM public.mf_public_profiles p WHERE p.user_id=mf_public_showcase_v323.user_id AND p.is_public
 AND (mf_public_showcase_v323.section='categories' OR EXISTS(
 SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.profile_v323->'tabs')='array' THEN p.profile_v323->'tabs' ELSE '[]'::jsonb END) t
 WHERE t->>'id'=mf_public_showcase_v323.section AND t->>'visible'='true'))));
DROP POLICY IF EXISTS mf323_owner_insert ON public.mf_public_showcase_v323;
CREATE POLICY mf323_owner_insert ON public.mf_public_showcase_v323 FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS mf323_owner_update ON public.mf_public_showcase_v323;
CREATE POLICY mf323_owner_update ON public.mf_public_showcase_v323 FOR UPDATE TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS mf323_owner_delete ON public.mf_public_showcase_v323;
CREATE POLICY mf323_owner_delete ON public.mf_public_showcase_v323 FOR DELETE TO authenticated USING(auth.uid()=user_id);
GRANT SELECT ON public.mf_public_showcase_v323 TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.mf_public_showcase_v323 TO authenticated;
-- Respect the owner-controlled tab visibility at the database boundary. RESTRICTIVE
-- policies combine with earlier Community read policies rather than replacing them.
DROP POLICY IF EXISTS mf323_library_tab_visibility ON public.mf_public_library;
CREATE POLICY mf323_library_tab_visibility ON public.mf_public_library AS RESTRICTIVE
 FOR SELECT TO anon,authenticated USING (
 auth.uid()=user_id OR EXISTS(SELECT 1 FROM public.mf_public_profiles p WHERE p.user_id=mf_public_library.user_id AND p.is_public AND p.show_library AND (
 jsonb_typeof(p.profile_v323->'tabs') IS DISTINCT FROM 'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements(p.profile_v323->'tabs') t WHERE t->>'id'='library' AND t->>'visible'='true'))));
DROP POLICY IF EXISTS mf323_history_tab_visibility ON public.mf_public_history;
CREATE POLICY mf323_history_tab_visibility ON public.mf_public_history AS RESTRICTIVE
 FOR SELECT TO anon,authenticated USING (
 auth.uid()=user_id OR EXISTS(SELECT 1 FROM public.mf_public_profiles p WHERE p.user_id=mf_public_history.user_id AND p.is_public AND p.show_history AND (
 jsonb_typeof(p.profile_v323->'tabs') IS DISTINCT FROM 'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements(p.profile_v323->'tabs') t WHERE t->>'id'='history' AND t->>'visible'='true'))));
DROP POLICY IF EXISTS mf323_collections_tab_visibility ON public.mf_public_collections;
CREATE POLICY mf323_collections_tab_visibility ON public.mf_public_collections AS RESTRICTIVE
 FOR SELECT TO anon,authenticated USING (
 auth.uid()=user_id OR EXISTS(SELECT 1 FROM public.mf_public_profiles p WHERE p.user_id=mf_public_collections.user_id AND p.is_public AND (
 jsonb_typeof(p.profile_v323->'tabs') IS DISTINCT FROM 'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements(p.profile_v323->'tabs') t WHERE t->>'id'='collections' AND t->>'visible'='true'))));
DROP POLICY IF EXISTS mf323_statistics_tab_visibility ON public.mf_public_statistics;
CREATE POLICY mf323_statistics_tab_visibility ON public.mf_public_statistics AS RESTRICTIVE
 FOR SELECT TO anon,authenticated USING (
 auth.uid()=user_id OR EXISTS(SELECT 1 FROM public.mf_public_profiles p WHERE p.user_id=mf_public_statistics.user_id AND p.is_public AND p.show_statistics AND (
 jsonb_typeof(p.profile_v323->'tabs') IS DISTINCT FROM 'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements(p.profile_v323->'tabs') t WHERE t->>'id'='statistics' AND t->>'visible'='true'))));
