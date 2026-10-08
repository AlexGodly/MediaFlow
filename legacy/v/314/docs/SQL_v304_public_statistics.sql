-- MediaFlow v304; applied on connected Supabase project.
ALTER TABLE public.mf_public_profiles ADD COLUMN IF NOT EXISTS show_statistics boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.mf_public_statistics (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, snapshot_html text NOT NULL, captured_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT mf_statistics_snapshot_size CHECK (octet_length(snapshot_html) <= 2097152));
ALTER TABLE public.mf_public_statistics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mf_stats_read ON public.mf_public_statistics;
CREATE POLICY mf_stats_read ON public.mf_public_statistics FOR SELECT USING (auth.uid()=user_id OR EXISTS (SELECT 1 FROM public.mf_public_profiles p WHERE p.user_id=mf_public_statistics.user_id AND p.is_public AND p.show_statistics));
DROP POLICY IF EXISTS mf_stats_insert ON public.mf_public_statistics;
CREATE POLICY mf_stats_insert ON public.mf_public_statistics FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS mf_stats_update ON public.mf_public_statistics;
CREATE POLICY mf_stats_update ON public.mf_public_statistics FOR UPDATE TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS mf_stats_delete ON public.mf_public_statistics;
CREATE POLICY mf_stats_delete ON public.mf_public_statistics FOR DELETE TO authenticated USING(auth.uid()=user_id);
