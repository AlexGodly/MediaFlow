# MediaFlow v311 — Community Ratings Leaderboard & Visible Title Ranks

**Base:** v310 Community Beta  
**Released:** 2026-10-08  
**Created by:** Alex Godly

## Community Ratings redesign

- Added a prominent global rank for every rated media title on the public Community Ratings page.
- Added a premium **top-three podium**: gold first place, silver second place, bronze third place. The champion is elevated in the center, with cover artwork, community score, number of ratings, Library count, provider and Quick Add.
- Added a polished **leaderboard list** for the remaining titles, with large rank numbers, covers, titles, provider badges, ratings, Library counts, score out of 10 and Quick Add.
- Kept the podium exclusively for the unfiltered first page; searching or changing pages shows numbered rows, preserving actual positions rather than relabeling results as #1.
- Added compact, responsive layouts for desktop, tablets, mobiles and very narrow 320px devices, as well as keyboard focus indicators and reduced-motion support.
- Guest Community appearance remains the established dark palette; authenticated Community appearance follows the current Workspace theme, including its dynamic accent.
- Search remains available, with improved focus retention and debounce. The leaderboard indicates how many rated titles match a query.
- Supports database-backed pages of 60 titles. Ranking positions continue correctly from page to page.
- Existing v309 **Quick Add** continues to open its category/cover selection dialog from the Ratings podium and list.
- Added loading, empty, failure and Retry states.

## Ranking definition and privacy

- Introduced `public.mf_ratings_leaderboard_v311(p_search, p_limit, p_offset)`.
- Rankings use the **published Community average rating (descending)**, then **rating count (descending)**, then **participating Library count (descending)**, followed by stable alphabetical/provider tie-breaks. Positions are unique integers `#1`, `#2`, etc.
- Rankings are computed **before search and pagination**. Searching a title retains its real global rank.
- Titles must have a verified MAL/SIMKL ID and at least one valid published rating between 0 and 10 to enter the leaderboard. Unrated titles do not receive a misleading rank.
- Contributions come only from accounts whose profile and Library sharing settings allow public access; private Libraries remain excluded.
- A user can contribute at most once to a given provider/title identity. Different providers remain distinct identities rather than being incorrectly merged.
- The returned public metadata and covers support the existing Quick Add dialog without exposing personal progress or private account data.
- Supabase migration `docs/SQL_v311_ratings_leaderboard.sql` applied to the connected MediaFlow project. Other Supabase deployments require this migration.

## Files changed

- `src/js/components/236-v311-community-ratings-ranks.js` — new page renderer, podium, leaderboard, search, pagination, and Quick Add integration.
- `assets/css/168-v311-ratings-leaderboard.css` — complete responsive/theme-aware style system.
- `docs/SQL_v311_ratings_leaderboard.sql` — database-side ranking query and grants.
- `scripts/test-v311-ratings-leaderboard.py` — isolated browser regression.
- `scripts/test-v311-browse-regression.py` and `scripts/test-v311-collections-regression.py` — v311 compatibility regression checks.
- `src/js/runtime-order.json` — module registration.
- `VERSION`, `version.json`, `index.html`, `404.html`, `assets/js/mediaflow-v311.bundle.js`, `sw.js` — aligned to v311.

## Compatibility

- Community Browse's five views, advanced filters and Quick Add retained from v309.
- Public Collections' five views, saved live references, creator profile links, and Workspace source filter retained from v310.
- Authentication navigation, guest/authenticated theme behavior, Inbox, Friends, public profiles, public Statistics and private Workspace remain inherited.
- Cloud Sync v201 / Full Backup Schema v29 / Settings Preset Schema v1 preserved.
- Logging Intensity from v299/v300 remains removed. The canceled mobile History redesign remains excluded.
- **PWA shell:** `mediaflow-pwa-v311-shell-v1`.

## Validation

- **57 v311 Ratings browser checks passed** at 1440px, 390px and 320px, including podium, row ranks, second-page ranks, search with original rank, Quick Add and no uncaught browser errors.
- **39 Browse/Quick Add regression checks passed** against the v311 bundle.
- **93 Collections regression checks passed** against the v311 bundle.
- Supabase RPC deployed and verified: 60 titles on page two have ranks **61–120**, and a matching title retained its global rank when searched.
- JavaScript syntax, project integrity, synchronized 404/index entrypoints, PWA shell and ZIP integrity validated.

**Testing note:** Browser checks use mocked application data and accounts. Live account/session and community click-through verification should still be performed after deploying the new site/PWA assets.
