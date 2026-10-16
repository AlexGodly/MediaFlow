# MediaFlow v439 Stable — Metadata Recovery Engine

Phase 3 of 6 in the metadata and recovery roadmap.

## Recovery behavior
- **Per-title Fix Metadata** entry points in Add/Edit Title and Title Details.
- **Metadata Recovery** in Settings under Library maintenance, with provider selection and a bounded batch control.
- Uses the existing Title Details / Imported Metadata **synopsis** field, not a duplicate.
- Live read-only metadata adapters: Jikan (anime + manga), AniList, Kitsu, TVmaze, Open Library (full-work synopsis on verified candidates), Gutendex, Apple iTunes, Steam Store, VNDB, and MusicBrainz, subject to access, regional CORS rules, quotas and provider restrictions.
- Authenticated gateway metadata action for eligible **TMDB, OMDb and MAL Official** using existing, already configured Supabase secrets. Existing v434 search and provider testing remain intact; gateway adds no user Library writes.
- Provider results are matched by normalized title/alternative titles, verified saved External IDs, and release year evidence. Mismatches are rejected; uncertain title-only or date-disagreement matches require manual review.
- **Field-by-field merging**: a synopsis can come from one source, studios from another, and ratings from others. Empty provider fields never remove Library values.
- Conflicting values from different sources remain unselected until the user explicitly chooses a source. No guessed winning value.
- Separate external ratings keep their original scales, provenance, source record identifiers, and last update time. They **never** replace personal ratings.
- Existing imported fields and v437 Universal Metadata envelope both supported; original title, release year/date, genres, studios, creators, metadata episode/chapter counts, album information, game metadata and similar fields when returned.
- Existing values are *not overwritten*, even in manual review, in v439. Manual and protected values always win. Intentional replacement modes are deferred to a later opt-in update.

## Batch & resilience
- Batch applies **only safe, previously missing fields** with corroborated high-confidence title+year or saved-ID evidence; no conflicting or protected updates.
- Explicit user-selected Library scope, manual confirmation, configurable limit (up to 250 titles per batch), progress counter, pause after current title, resumable account-scoped checkpoint and cross-tab lease.
- No automatic scanning of the full Library; 100k library data can coexist without mass mutation.
- Error isolation: failed provider requests do not erase previously returned fields. Requests have fixed public hosts, response size bounds, throttling, timeouts and bounded caching.
- Existing Cloud sync/Library persistence and full-backup pipeline preserved. Backup manifest upgraded with recovery provenance and history. No SQL changes required.

## Safety boundaries
- v439 enables the actual adapters enumerated above; **other providers listed in v438's 60-entry directory remain registered or pending, not falsely active**.
- No new Supabase credentials needed; no Podcast Index support.
- No changes to users' progress, total units, personal ratings, watch status, XP, history or existing covers.
- Support for all remaining eligible APIs, full recovery UI polish/floating integration, and extended performance work continue in v440–v442.

## Verification
- Deterministic conflicts, protection, ratings and safe-write tests, 100k synthetic Library dry-run.
- Previous v433–v438 cover/gateway/metadata tests.
- Supabase gateway Deno typecheck and browser smoke at desktop and 360px.
- GitHub Pages deployment and full archive at `legacy/v/439`.
