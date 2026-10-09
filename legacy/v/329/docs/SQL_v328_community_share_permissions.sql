-- MediaFlow v328: retain only social permission metadata, not Collections' media.
BEGIN;
CREATE TABLE IF NOT EXISTS public.mf_collection_shares_v328 (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 collection_id text NOT NULL CHECK(length(collection_id) BETWEEN 1 AND 255),
 shared_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,collection_id)
);
ALTER TABLE public.mf_collection_shares_v328 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mf328_collection_owner_select ON public.mf_collection_shares_v328;
CREATE POLICY mf328_collection_owner_select ON public.mf_collection_shares_v328 FOR SELECT TO authenticated USING(auth.uid()=user_id);
DROP POLICY IF EXISTS mf328_collection_guest_select ON public.mf_collection_shares_v328;
CREATE POLICY mf328_collection_guest_select ON public.mf_collection_shares_v328 FOR SELECT TO anon,authenticated
 USING(EXISTS(SELECT 1 FROM public.mf_public_profiles p WHERE p.user_id=mf_collection_shares_v328.user_id AND p.is_public));
DROP POLICY IF EXISTS mf328_collection_owner_insert ON public.mf_collection_shares_v328;
CREATE POLICY mf328_collection_owner_insert ON public.mf_collection_shares_v328 FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS mf328_collection_owner_delete ON public.mf_collection_shares_v328;
CREATE POLICY mf328_collection_owner_delete ON public.mf_collection_shares_v328 FOR DELETE TO authenticated USING(auth.uid()=user_id);
REVOKE ALL ON public.mf_collection_shares_v328 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.mf_collection_shares_v328 TO anon;
GRANT SELECT,INSERT,DELETE ON public.mf_collection_shares_v328 TO authenticated;
-- Migrate existing sharing intent, never the Collection contents.
INSERT INTO public.mf_collection_shares_v328 (user_id,collection_id)
 SELECT user_id,id FROM public.mf_public_collections WHERE is_public
ON CONFLICT(user_id,collection_id) DO NOTHING;
COMMIT;
