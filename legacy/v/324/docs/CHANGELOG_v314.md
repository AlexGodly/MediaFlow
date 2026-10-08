# MediaFlow v314 — Extended Verified Media Sources, Library Discovery & Rankings Podium UI

**Based on v313 Community Beta · October 8, 2026 · Alex Godly**

## Community provider expansion

- Previously the shared Browse/Ratings catalog only accepted MyAnimeList and SIMKL IDs. v314 extends the eligibility checks and Browse/Ratings provider filters to **all eight normalized stable external-ID fields implemented by MediaFlow's v158 Exchange Hub importer**: **MAL, SIMKL, AniList, TMDB, IMDb, Trakt, Kitsu, and ISBN (books)**.
- An explicitly public Library now publishes the first recognized available identifier using a deterministic order (MAL, SIMKL, AniList, TMDB, IMDb, Trakt, Kitsu, ISBN). Public data continues to contain title metadata, chosen cover, status and rating only as consented to by Library publication.
- Quick Add continues preserving the chosen service's provider ID in `externalIds`, selected artwork, media metadata, category, status and priority. Provider-specific duplicate protection is preserved.
- Catalog aggregation, Ratings ranking and the public Community title total accept the expanded eight-source list. Database changes are included in `SQL_v314_expand_community_media_sources.sql` and were applied to the connected Supabase instance.
- **Important:** IDs from *different services are not guaranteed to refer to unique media*. The same media with separate MAL/TMDB/etc. identities may appear as separate entries until verified cross-service ID reconciliation is implemented. Source formats without a stable normalized ID are not included; titles are never grouped based only on potentially ambiguous names.
- Existing private records are never automatically published. Previously published MAL/SIMKL records are preserved. To publish additional provider identities already held in private Workspace, the owner explicitly republishes their Library; there is no private-data backfill.

## Library → Explore Community

- Adds a dedicated **Explore Community** action near the top of Workspace Library, styled consistently with the existing Collections shortcut.
- The action navigates to **Community → Browse Titles** without requiring the user to use sidebar navigation first.
- Includes descriptive discovery text, semantic iconography, keyboard accessibility, theme-aware colors and mobile layout support.
- The action is reapplied safely after Library rerenders without accumulating duplicates.

## User Rankings and visual repairs

- Replaces v313's fragile podium markup with a purpose-built, **Ratings-inspired gold/silver/bronze three-card layout**.
- Silver #2, Gold #1 and Bronze #3 appear in order on wider screens; on narrow phones they become well-spaced vertical cards.
- Medal headers, consistent profile portraits, clear rank numbers, display names, usernames, metric values and existing MediaFlow XP-configuration badges remain distinct rather than overlapping.
- Full-width **View profile** buttons are integrated into each podium card; fourth place onward uses structured leaderboard rows with rank/portrait/identity/metric/profile action columns.
- Uses actual public profile links and the existing Community router. Profile actions are clearly button-styled rather than unexpectedly underlined.
- Ranking numbers remain those supplied by the public Users ranking query; filters, sorting, privacy requirements, XP ties, and pagination are unchanged.
- Respects the original Community theme for guests and the saved Workspace theme for authenticated members.

## Version, deployment and compatibility

- Application **v314**; bundle `assets/js/mediaflow-v314.bundle.js`.
- New runtime `src/js/components/239-v314-provider-directory-rankings-library.js` and stylesheet `assets/css/171-v314-provider-rankings-polish.css`.
- PWA shell `mediaflow-pwa-v314-shell-v1`. Regenerated identical `index.html` / `404.html` for deep links.
- Existing v309 Browse modes and Quick Add, v310 saved Collections, v311 Ratings podium, v312 Ratings auto-refresh, v313 Workspace Collections fix, public profiles, messaging, XP settings and privacy remain intact.
- **Cloud Sync v201, Full Backup schema v29, Settings Preset schema v1**, without destructive private-data migration. Logging Intensity remains removed.

## Validation

- v314 full runtime browser checks at **1440px, 390px and 320px**, including ID selection, all eight publication provider mappings, new podium, profile navigation, source filter options, and Library→Browse.
- v313 Community, Workspace Collections, Public Collections and Browse regression suites also executed using mock accounts/data.
- JS syntax and MediaFlow project integrity checks passed.
- Supabase queries and the provider-expansion migration were verified against the connected project.
- Live GitHub Pages + real multi-account testing remains recommended after deployment. Current catalog counts do not automatically rise merely because new eligibility rules are deployed; eligible public records must exist.
