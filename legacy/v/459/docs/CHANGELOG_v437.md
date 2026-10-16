# MediaFlow v437 Stable — Universal Title Metadata & External Ratings

Phase 1 of the Metadata & Recovery Expansion roadmap (v437–v442). Based on v436.

## Additive metadata foundation
- Introduce per-title `universalMetadata` with `schemaVersion: 1`, optional explicit media type, media-specific fields, external ratings, per-field provenance, timestamps and protect/unprotect controls.
- Support common media metadata plus anime, manga, movies, TV/series, books/audiobooks, comics, video games, visual novels, music/albums and interactive fiction.
- Category names **never infer or restrict** a title's media type; unset remains valid and all provider searches will stay available.
- Expand the editable external ID catalog for games, VNDB, MusicBrainz, Discogs, Steam, IFDB and additional records without discarding unknown/existing identifiers.

## External rating architecture
- Independently store scores and original scales for IMDb, Trakt, Rotten Tomatoes critics/audience, MAL, AniList, Kitsu, TMDB, SIMKL, AniDB, TVmaze, Metacritic, Letterboxd, Goodreads, StoryGraph, Hardcover, IGDB, OpenCritic, Steam, Backloggd, VNDB, MangaUpdates, Rate Your Music, Discogs and IFDB.
- Preserve score, original scale, vote count, source/provenance and last-update time. Ratings are manually editable in v437; no claim of automatic provider retrieval yet.
- Never overwrite MediaFlow personal ratings, tracking progress or the existing community score.

## Editor, details and data safety
- Add responsive, theme-aware editor sections and Title Details displays.
- Track which fields were manually edited and protect them from verified provider updates. Providers can only supply evidence-verified values using a strict non-destructive internal adapter contract.
- Merge the versioned envelope field-by-field during cloud conflict resolution, preserving independent updates, locks and intentional clears across devices.
- Full backups and cloud snapshots carry the new envelope as part of the existing Library objects; historic records are not mass-rewritten, and no live Supabase SQL migration is needed.
- Retain current History, XP, Collections, Logging, Personal Order, imports, themes and category behavior.

## Quality gates
- New unit contracts for schema, IDs, media coverage, original rating scales, provider verification, lock enforcement, merge preservation, personal-rating isolation and full backup markers.
- Updated desktop/360px Chromium smoke checks plus prior cover-recovery regressions, gateway typecheck and PWA regeneration.
- Verified build is archived under `legacy/v/437`; numeric release `437` packages the archive.

## Roadmap boundary
- v438: Unified Provider Registry.
- v439: Metadata Recovery Engine.
- v440: Cover Recovery Expansion.
- v441: Complete Recovery Interfaces.
- v442: Integration/performance hardening.

No new API credential is required by v437 and no automated Metadata Recovery is activated in this version.
