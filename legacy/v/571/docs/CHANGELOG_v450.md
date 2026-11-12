# MediaFlow v450 — Universal Metadata & External Ratings Expansion

Based on v449 Stable. This is the next numbered planned update; the later
MediaFlow Recommends ratings update moves to v451.

## Additive media metadata
- Add 60+ optional, editable metadata fields to the existing v437 universalMetadata
  model, covering shared media, anime, manga, movies, television, books/audiobooks,
  comics, games, visual novels, music/albums, interactive fiction, and other media.
- Preserve media-type independence from custom Library categories. Do not infer media
  type from category names or restrict provider searches.
- New field groups inherit the existing editor protection controls, list/numeric/URL
  validation, and field-by-field merge and backup behavior. Records need no migration.
- Add optional external identifiers for Google Books, Open Library works/editions,
  Audible, RAWG, Comic Book Roundup, StoryGraph, Hardcover, and Goodreads.
- Extend the independent rating catalog with RAWG, Google Books and Audible. These
  entries are manual or eligible for recovery only when an actually enabled provider
  returns evidence; catalog registration does NOT claim live retrieval.

## External rating presentation and safety
- Show each available external rating in Title Details with a recognizable
  offline-rendered provider mark, original numerical scale, optional vote count,
  and manually entered / verified provider source attribution.
- Add matching marks to Add/Edit Title rating controls; clarify that verified
  metadata recovery already exists instead of showing stale "manual until integration".
- Preserve legacy 0–10 VNDB scores already saved; new VNDB rating defaults use
  the official v439 API's 0–100 scale. Never silently rescale stored values.
- Normalize known upstream rating aliases (such as Rotten Tomatoes critics,
  audience, MyAnimeList and TMDB), reject invalid/over-scale/nonfinite ratings,
  impossible vote totals, unknown providers and conflicting alias values.
- Carry verified source record identifiers into new recovered rating provenance.
  Always retain v439 identity/year/evidence checks, manual locks, non-destructive
  missing-only writes, conflict review and provider restrictions.
- Map eligible trusted gateway metadata fields to media-specific v450 fields where
  applicable, without bypassing gateway authentication, quotas or verification.

## Data integrity and boundaries
- No changes to personal ratings, Library tracking progress, statuses, covers,
  History, XP, collections, Personal Order, cloud credentials, or live Supabase
  database schema. Versioned metadata envelope remains backward-compatible.
- Old data remains untouched until the user edits fields or recovers verified
  missing metadata. Full backups include a v450 capability marker and preserve
  earlier manifests.
- A recognizable text/emoji provider mark is an offline UI identifier rather than
  a claim to an official vendor logo.
- v451 remains responsible for surfacing ratings in MediaFlow Recommends; v452+
  retains the planned Fresh Episodes provider and universal-engine roadmap.

## Verification and delivery
- v450 source-level deterministic coverage for media fields, rating scales,
  aliases/conflict refusal, gateway trust, provenance, protection, backups and
  personal-data isolation.
- Existing v424–v449 contracts and desktop/360px Chromium smoke via the versioned
  GitHub Actions quality gate, plus PWA build and Deno gateway typecheck.
- Full source archive in legacy/v/450, numeric GitHub release 450 and SHA256 ZIP.
