# MediaFlow v437 — Recovery Systems Expansion (development candidate)

**Status: Draft PR #19, not released, not merged, live website remains v436.** The secure Supabase metadata gateway is deployed as v3 (backward compatible with v436 search).

## Recovery & UI

- Metadata Recovery workspace with all/selected/category/single-title scope, grouped field selection, missing-only and explicitly approved review modes, Smart Metadata Recovery coordination, custom provider selections, independent metadata API tests and durable verification results.
- New METADATA RECOVERY native Settings section below Cover Recovery, floating quick action, Library Fix Metadata, Title Details Fix Metadata, Add/Edit Fix Metadata, per-job progress and recovery controls.
- Queue and checkpoint controls: pause, resume, skip current title, stop after current title or part, cancel remaining, retry failed titles, review selected field changes, eligible undo and history.
- Combined account-scoped Web Lock prevents Metadata and Cover Recovery running at the same time across tabs in supported browsers; v424 retains its original lease mechanism. Metadata fails closed when browser locks are unavailable.
- Metadata writes preserve personal rating, progress, user history, XP, manually protected fields, and existing conflicting provider IDs. Provider IDs require strong evidence; differing existing fields need explicit approval.
- Existing MediaFlow title editor extended with universal/media-specific optional details, grouped by creators/production, counts, games, music, books, interactive fiction. Canonical title undo snapshot updated for these edits.

## Ratings

Independent externalRatings field with source, scale, vote count, verification time. Adapters support ratings from MAL/Jikan, AniList, Kitsu, TVmaze, VNDB, IFDB, MusicBrainz, and configured gateway metadata responses from OMDb (IMDb, Rotten Tomatoes if supplied, Metacritic), TMDB, Trakt, MAL Official and applicable SIMKL responses. Missing scores are never silently treated as zero. No third-party rating overwrites personal MediaFlow rating.

## Provider code included

- Direct public metadata adapter implementations: Jikan, AniList, Kitsu, TVmaze, Open Library, iTunes, VNDB, Gutendex, LibriVox, Open Opus, Tenrai, BookBrainz, Inventaire, Library of Congress, MangaUpdates, IFDB, MusicBrainz, TheAudioDB, Wikidata, Crossref, OpenAlex, MangaDex, Shikimori, SteamSpy, Steam Storefront.
- Existing Supabase gateway extended with a strictly authenticated `metadata` action for TMDB, OMDb, MAL Official, Trakt, SIMKL, Watchmode, AnimeSchedule, Metron, EpisoDate and Gutendex, with independent metadata authorization and rate quotas.
- Twelve additional Cover Recovery sources have code paths / registry entries: Steam Storefront, Libretro Thumbnails, GameTDB, Wikidata, Wikimedia Commons, PCGamingWiki, VNDB, Cover Art Archive, TheAudioDB, Apple iTunes Search, Deezer, IFDB.
- GameTDB and Deezer remain disabled pending applicable site/API authorization. Other registry-only or credential-restricted sources remain disabled until legitimate access and functional verification. **Adapter code does not mean a provider endpoint is already verified live.**

## Verification performed

- Node syntax and deterministic metadata/protection contracts, field selection, review/undo and final-title review regression.
- Deno static gateway check; existing Cover Recovery regression tests.
- Synthetic 100k-title Library safety run.
- Headless Chromium app-shell smoke at desktop 1440px, tablet 768px and mobile 360px. These tests do **not** prove end-to-end authenticated recovery or every provider's real-world availability.
- Source compatibility review against existing MediaFlow core persistence/undo, existing provider gateway and Cover Recovery architecture.

## Release blockers

1. Confirm external API functionality, CORS, attribution, quotas and image rights per provider in a real browser, including restricted/approval services; disable sources that fail.
2. **Deployed:** personal Supabase `mediaflow-api-gateway` v3 is ACTIVE with JWT verification and was checked byte-for-byte against this PR's gateway source. Authenticated live metadata responses and configured secret/provider permission checks still require end-to-end testing; deployment alone does not verify every source.
3. Audit export/import/backup/sync recovery of `mediaMetadata`, `externalRatings`, provenance and new IDs across all supported formats and providers.
4. Complete working acceptance tests for full popup, selected-title scopes, provider tests, settings persistence, review/undo and background reconnect/resume (including multiple tabs).
5. Verify themes and cross-device styling against user's existing Cover Recovery interface, run final regression, compile site assets, and only then merge/deploy/archive/tag/release v437 with full ZIP.

This plan requires **no additional user-supplied keys**. Podcast Index excluded. Restricted providers are visible but fail closed. Do not misrepresent unverified sources as working.
