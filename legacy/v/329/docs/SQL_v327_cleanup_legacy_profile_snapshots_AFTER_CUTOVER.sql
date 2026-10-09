-- MANUAL / DEFERRED. DO NOT EXECUTE UNTIL v327 IS DEPLOYED, VERIFIED, AND BACKED UP.
-- This deletes *only* redundant public-profile snapshot sections. Not private Workspace data.
-- The old deployed v325/v326 frontend WILL BREAK if this runs too early.
BEGIN;
DELETE FROM public.mf_public_workspace_v325;
DELETE FROM public.mf_public_showcase_v323;
-- Intentionally leave mf_public_library, mf_public_collections, mf_public_history,
-- and mf_public_statistics intact while unrelated Community features may depend on them.
COMMIT;
