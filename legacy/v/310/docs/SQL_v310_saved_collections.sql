-- MediaFlow v310: private subscriptions to already-public community Collections.
-- A saved Collection is a reference, NOT a copy of another user's content.
CREATE TABLE IF NOT EXISTS public.mf_saved_collections (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id text NOT NULL CHECK (length(collection_id) BETWEEN 1 AND 255),
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, owner_id, collection_id),
  CONSTRAINT mf_saved_not_self CHECK (user_id <> owner_id)
);
CREATE INDEX IF NOT EXISTS mf_saved_collections_owner_index ON public.mf_saved_collections(owner_id,collection_id);
ALTER TABLE public.mf_saved_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mf_saved_collections_read ON public.mf_saved_collections;
CREATE POLICY mf_saved_collections_read ON public.mf_saved_collections
 FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS mf_saved_collections_add ON public.mf_saved_collections;
CREATE POLICY mf_saved_collections_add ON public.mf_saved_collections
 FOR INSERT TO authenticated WITH CHECK (
   auth.uid() = user_id AND user_id <> owner_id AND EXISTS (
     SELECT 1 FROM public.mf_public_collections c
     JOIN public.mf_public_profiles p ON p.user_id = c.user_id
     WHERE c.user_id = owner_id AND c.id = collection_id
       AND c.is_public AND p.is_public
   )
 );
DROP POLICY IF EXISTS mf_saved_collections_remove ON public.mf_saved_collections;
CREATE POLICY mf_saved_collections_remove ON public.mf_saved_collections
 FOR DELETE TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.mf_saved_collections FROM anon;
GRANT SELECT, INSERT, DELETE ON public.mf_saved_collections TO authenticated;

-- PUBLIC directory: SECURITY INVOKER obeys RLS on both sources.
CREATE OR REPLACE FUNCTION public.mf_public_collections_v310(
 p_search text DEFAULT '', p_sort text DEFAULT 'updated', p_desc boolean DEFAULT true,
 p_min_items integer DEFAULT 0, p_with_cover boolean DEFAULT false,
 p_limit integer DEFAULT 40, p_offset integer DEFAULT 0
)
RETURNS TABLE(id text, user_id uuid, title text, description text, cover_url text,
 items jsonb, is_public boolean, updated_at timestamptz,
 username text, display_name text, avatar_url text, item_count integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT c.id,c.user_id,c.title,c.description,c.cover_url,c.items,c.is_public,c.updated_at,
 p.username,p.display_name,p.avatar_url,
 CASE WHEN jsonb_typeof(c.items)='array' THEN jsonb_array_length(c.items) ELSE 0 END AS item_count
 FROM public.mf_public_collections c
 JOIN public.mf_public_profiles p ON p.user_id=c.user_id
 WHERE c.is_public AND p.is_public
 AND (coalesce(trim(p_search),'')='' OR c.title ILIKE '%'||trim(p_search)||'%' OR
    c.description ILIKE '%'||trim(p_search)||'%' OR p.username ILIKE '%'||trim(p_search)||'%')
 AND (CASE WHEN jsonb_typeof(c.items)='array' THEN jsonb_array_length(c.items) ELSE 0 END) >= greatest(0,coalesce(p_min_items,0))
 AND (NOT p_with_cover OR c.cover_url ~ '^https://' OR (c.items::text LIKE '%https://%'))
 ORDER BY
 CASE WHEN p_sort='title' AND NOT p_desc THEN lower(c.title) END ASC NULLS LAST,
 CASE WHEN p_sort='title' AND p_desc THEN lower(c.title) END DESC NULLS LAST,
 CASE WHEN p_sort='creator' AND NOT p_desc THEN lower(coalesce(p.display_name,p.username)) END ASC NULLS LAST,
 CASE WHEN p_sort='creator' AND p_desc THEN lower(coalesce(p.display_name,p.username)) END DESC NULLS LAST,
 CASE WHEN p_sort='count' AND NOT p_desc THEN (CASE WHEN jsonb_typeof(c.items)='array' THEN jsonb_array_length(c.items) ELSE 0 END) END ASC NULLS LAST,
 CASE WHEN p_sort='count' AND p_desc THEN (CASE WHEN jsonb_typeof(c.items)='array' THEN jsonb_array_length(c.items) ELSE 0 END) END DESC NULLS LAST,
 CASE WHEN p_sort='updated' AND NOT p_desc THEN c.updated_at END ASC NULLS LAST,
 CASE WHEN p_sort='updated' AND p_desc THEN c.updated_at END DESC NULLS LAST,
 c.id ASC,c.user_id ASC
 LIMIT least(100,greatest(1,coalesce(p_limit,40))) OFFSET greatest(0,coalesce(p_offset,0));
$$;
REVOKE ALL ON FUNCTION public.mf_public_collections_v310(text,text,boolean,integer,boolean,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mf_public_collections_v310(text,text,boolean,integer,boolean,integer,integer) TO anon,authenticated;
