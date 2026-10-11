# MediaFlow v378 — Tenrai, External ID Imports, Logging 4.0 & Personal Order

**Release:** v378 Modular — Personal Edition  
**Baseline:** v377 Modular  
**Date:** 11 October 2026  
**Developer:** Alex Godly  
**Status:** Local development candidate; no GitHub commit/push/deployment performed.

## 1. Tenrai for MyAnimeList

- Migrated Jikan public API URL references from `https://api.jikan.moe/v4` to Tenrai's public `https://api.tenrai.org/v1`, including the Seasonal episode checker, MAL-ID verification in Add/Edit Title, MAL catalogue lookup, and metadata cover lookup paths.
- Existing MAL IDs remain unchanged. Preserved the v377 MAL-ID-first matching, title-search fallback, unmatched report, targeted retry, safe partial results, and last-verified-count safeguards.
- Retained compatible internal function/state identifiers so existing backups and preferences do not need schema changes. Updated visible provider wording to Tenrai/Automatic MAL Detection where applicable.
- Conservative client request scheduling (~700 ms minimum gap, ≤100 per rolling minute), cached responses, bounded retries and retry-after handling remain active. Tenrai's published unauthenticated limits are 4 requests/second and 120 requests/minute; other users sharing an IP can affect available quota.
- MAL Verify now shows the returned title and cover (where available), and chooses the anime or manga endpoint based on the title's selected category.
- External IDs other than MAL are **not** used for automated Tenrai lookups.

## 2. External Media IDs — Import Support

- Added provider-aware ID normalization for MyAnimeList, SIMKL, AniList, TMDB, IMDb, Trakt, Kitsu and ISBN in the common Exchange Hub import route.
- Recognizes flat and nested IDs (`ids.mal`, `mal_id`, `myanimelist_id`, MAL XML `series_animedb_id`, and recognized media objects), plus extractable MAL and IMDb URLs.
- Normalizes MAL to positive numeric identifiers suitable for Tenrai's exact ID endpoints.
- Prevents empty/invalid imported IDs from replacing existing identifiers. Preserves manually corrected values and leaves conflicting saved IDs unchanged by default.
- Tracks counts for IDs imported, preserved, conflicting and invalid; Exchange Hub imports present a summary when nonzero.
- Full Data import/export and existing Library backup paths retain their existing metadata contracts; no new Supabase tables or authentication configuration is required.

## 3. Logging Workspace 4.0

### Quick Logging and Per Unit

- Added **Collapse All** / **Expand All** for the added title list in both interfaces. Individual title collapse/expand is also available. The expanded state is carried in the current Logging draft.
- Direct **Add** from the Logging Library browser; no intermediate Use → Add step for those Library rows.
- Added five Logging Library presentation modes: **List, Compact, Cards, Covers, Covers + Titles**.
- Added **Clean Covers** to hide interaction overlays in cover browsing; multi-selection is disabled while it is enabled.
- Added **Select Visible, Deselect All, and Add Selected**, respecting the current filtered page and preventing duplicate draft entries.
- Empty-per-title draft entries start with **zero consumption**. Quick Amount Consumed provides an editable amount field. Quick Last Progress keeps its existing end-progress input. Per Unit adds empty per-title itemized draft rows; units must be recorded deliberately.
- Adding a title to the draft does not generate History, award XP, or update Library progress. Quick log submission blocks remaining zero-quantity placeholders to avoid accidental phantom consumption.
- Retained existing Per Unit season/episode/runtime/timestamp/repeat controls and Logging draft sorting, arrows, drag-and-drop, and numeric ordering.
- Large Library picker search continues using the existing indexed search. The new empty-query browser lists paginated Library titles without requiring a search term.

## 4. Personal Order

- Repaired ordinary title numeric input widths with a high-specificity scoped override (actual input ≥80 px, parent ≥94 px), including mobile and intermediate-width layouts; suppressed native number spinners.
- Verified 3+ digit labels/inputs with positions 1 through 1000; existing Collection positions continue working.
- In **Lists → All Titles**, assigned Collection blocks are shown in the main mixed list next to neighboring titles (e.g. after the preceding title) rather than only in the dedicated Collection Queue section.
- Retained Lists → By Category grouping, Tabs, standalone Collection Queue, category rules, Collection controls, pagination, and per-category canonical ordering. Rendering the mixed list does not create duplicate Collection assignments or change saved order.
- **No edits to existing title/Collection cover rendering or crop settings.**

## 5. Semantic UI Icons

- Replaced the generic icon for **View Unmatched Titles** with a filtered-list symbol.
- Replaced **Retry API Failures** with a retry/refresh symbol.
- Replaced the Add/Edit Title **Verify MAL ID** icon with a search/check symbol.
- Replaced the External Media IDs section's generic symbol with a link/identifier symbol.
- Kept theme-aware styling and existing controls.

## 6. Source & Release Artifacts

- New runtime extension: `src/js/components/274-v378-tenrai-import-logging-order.js`
- New scoped styling: `assets/css/195-v378-logging-order.css`
- Modified provider references in existing Jikan-origin fragments, while retaining compatibility function names.
- Registered the new runtime fragment in `src/js/runtime-order.json`.
- Regenerated `assets/js/mediaflow-v378.bundle.js`, service worker, manifest, version metadata, index entry point, and PWA application shell.
- Updated `VERSION`, `package.json`, `README.md`, `README2.md`, and `docs/CHANGELOG_v378.md`.

## 7. Validation & Limitations

### Passed (synthetic local Chromium fixtures)

- Build and JavaScript syntax validation.
- v377 MAL editor/save and mocked API-recovery regression at 390 and 1280 px.
- v378 external ID alias/URL normalization and Quick/Per Unit bulk draft behavior at 390 and 1280 px.
- v378 continuous and grouped queues, mixed Collection visibility, title positions and tab navigation at 320, 390, 820, 1280, 1920 px (during the targeted runs).
- PWA asset-manifest generation and ZIP file integrity checks.

### Not verified here

- Live Tenrai API requests from an unrestricted browser/network (network/DNS access to API is unavailable in this build environment).
- Authenticated Supabase cloud synchronization across devices.
- Physical Android/iOS/touchscreen behavior and actual personal Library stress tests.
- Every legacy importer variant outside the tested canonical Exchange Hub paths.

These should be checked with a local copy before replacing production. Tenrai itself is a third-party beta service; MediaFlow cannot guarantee its upstream uptime.

## 8. Local Testing & Deployment

Extract `MediaFlow_v378_Modular.zip`, then from the project directory run:

```bash
python -m http.server 8080
```

Open `http://localhost:8080`, preferably after exporting a Full Data backup from the existing release. Test Tenrai, External IDs, Logging 4.0 and Personal Order locally first.

**Repository management:** No GitHub actions were performed. If the owner later pushes this release manually, the intended commit message is exactly `378`.
