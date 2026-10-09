-- MediaFlow v326: native read-only Statistics source publication.
-- Requires v325's mf_public_workspace_v325 table; does not alter private data.
BEGIN;
ALTER TABLE public.mf_public_workspace_v325 DROP CONSTRAINT IF EXISTS mf_public_workspace_v325_section_check;
ALTER TABLE public.mf_public_workspace_v325 ADD CONSTRAINT mf_public_workspace_v325_section_check CHECK (
 section IN ('meta','library','history','collections','collection_titles','order','order_titles','order_collections','old','old_transactions',
             'statistics','statistics_titles','statistics_sessions','statistics_timeline','statistics_activity')
);
DROP POLICY IF EXISTS mf325_public_select ON public.mf_public_workspace_v325;
CREATE POLICY mf325_public_select ON public.mf_public_workspace_v325
 FOR SELECT TO anon, authenticated USING (
 EXISTS (SELECT 1 FROM public.mf_public_profiles p WHERE p.user_id=mf_public_workspace_v325.user_id AND p.is_public
  AND (mf_public_workspace_v325.section = 'meta'
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(
       CASE WHEN jsonb_typeof(p.profile_v323->'tabs')='array' THEN p.profile_v323->'tabs' ELSE '[]'::jsonb END
     ) t WHERE t->>'id' = (
        CASE
          WHEN mf_public_workspace_v325.section='collection_titles' THEN 'collections'
          WHEN mf_public_workspace_v325.section IN ('order_titles','order_collections') THEN 'order'
          WHEN mf_public_workspace_v325.section='old_transactions' THEN 'old'
          WHEN mf_public_workspace_v325.section LIKE 'statistics_%' THEN 'statistics'
          ELSE mf_public_workspace_v325.section
        END
      ) AND t->>'visible'='true'
    )
  )
  AND (mf_public_workspace_v325.section <> 'library' OR p.show_library)
  AND (mf_public_workspace_v325.section <> 'history' OR p.show_history)
  AND (mf_public_workspace_v325.section NOT IN ('order','order_titles','order_collections') OR p.show_order)
  AND (mf_public_workspace_v325.section NOT IN ('statistics','statistics_titles','statistics_sessions','statistics_timeline','statistics_activity') OR p.show_statistics)
 )
);
COMMIT;
