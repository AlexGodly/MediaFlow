# MediaFlow v314 — Extended Media Sources, Library Community Shortcut & Rankings Polish

Built from **v313 Community Beta**. All existing private Workspace features, previously deployed public features, guest vs signed-in themes, and privacy controls are preserved.

**New:** Community Browse, Ratings and the global catalog title counter now support all **eight stable external-ID keys recognized by MediaFlow's importer**: `mal`, `simkl`, `anilist`, `tmdb`, `imdb`, `trakt`, `kitsu`, `isbn`. Browse and Ratings offer all eight in their provider filters. When the owner opts in to publishing their Library, entries with these IDs can contribute to the public catalog. Distinct provider IDs are kept separate until verified cross-source matching exists; IDs are never guessed from titles.

**New:** Library has a theme-aware **Explore Community** shortcut to Community → Browse Titles, analogous to the Collections discovery action.

**Redesigned:** User Rankings podium is now a clean, Ratings-style medal layout with profile images, #1/#2/#3 ranks, badges, metric values and clearly contained profile actions. Subsequent users use organized rows. Fixes the overlapping and undersized profile/rank elements reported in v313 on narrow screens.

**Deployment:** Replace all GitHub Pages assets, including `index.html`, `404.html`, `sw.js`, bundled JS and new CSS. PWA cache is `mediaflow-pwa-v314-shell-v1`. Apply `docs/SQL_v314_expand_community_media_sources.sql` to separately hosted Supabase instances; this migration is already applied to the connected project.

**No unrequested publishing:** Existing private entries remain private. Owners must explicitly republish their Libraries to expose additional service IDs. No cross-provider deduplication by title alone.

**Compatibility:** Cloud Sync v201, Full Backup v29, Settings Preset v1. Logging Intensity remains excluded. Full details in `docs/CHANGELOG_v314.md`.

**Testing:** browser and regression suites are in `scripts/`; browser tests use simulated accounts and Supabase responses, with real connected database queries verified separately. Real deployed user-account validation remains recommended.
