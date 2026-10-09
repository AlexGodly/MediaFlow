-- MediaFlow v314: include every stable external-ID field recognized by the importer.
-- No new publication consent: only already explicitly shared Libraries qualify.
-- Keep cross-provider identities separate until a verified crosswalk exists.
DO $migration$
DECLARE target regprocedure; ddl text;
  old_predicate text := 'l.provider IN (''mal'',''simkl'')';
  new_predicate text := 'l.provider IN (''mal'',''simkl'',''anilist'',''tmdb'',''imdb'',''trakt'',''kitsu'',''isbn'')';
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'public.mf_browse_titles_v309(text,text,boolean,text,text,integer,numeric,integer,integer)'::regprocedure,
    'public.mf_ratings_leaderboard_v312(text,text,boolean,text,integer,integer,numeric,integer,integer)'::regprocedure,
    'public.mf_ratings_leaderboard_v311(text,integer,integer)'::regprocedure,
    'public.mf_community_title_count_v313()'::regprocedure
  ] LOOP
    ddl := pg_get_functiondef(target::oid);
    IF position(old_predicate in ddl)=0 THEN
      RAISE EXCEPTION 'Expected eligibility predicate missing in %',target::text;
    END IF;
    EXECUTE replace(ddl,old_predicate,new_predicate);
  END LOOP;
END $migration$;
