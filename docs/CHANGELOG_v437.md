# MediaFlow v437 — Recovery Systems Expansion (development draft)

**Status:** Work in progress on \`feature/v437-recovery-metadata-foundation\`. **Do not call this a published Beta or merge into the live website until all gates pass.**

## Implemented in this development branch

- New independent Metadata Recovery state, conservative per-field merges, separate \`externalRatings\`, manual-edit protection and preservation of the personal rating.
- Metadata recovery scopes: All Library, checked/selected titles, by category, and a single saved title.
- New Metadata Recovery configuration dialog, Settings Center section immediately following Cover Recovery, independent metadata provider verification, floating quick action and Library / Add/Edit / Title Details actions.
- IndexedDB job checkpoints, per-part processing, pause/resume, stop-after-title, stop-after-part and cross-tab Web Locks guard. A browser lacking a global process lock fails closed rather than running unsafe bulk writes.
- Original source-specific ratings and scales, persisted per title. Existing \`rating\` and \`communityScore\` are not reinterpreted.
- Media-specific metadata stored additively under \`mediaMetadata\`; currently populated for supported fields including episodes, chapters, volumes, authors, artists, languages, ISBNs and visual novel lengths.
- Public metadata adapters currently implemented: **Jikan, AniList, Kitsu, TVmaze, Open Library, Apple iTunes Search, VNDB, Gutendex, LibriVox**.
- Credential-free cover adapters currently implemented: **VNDB, Apple iTunes Search, Cover Art Archive (known release MBID), TheAudioDB (known artist + album), Steam Storefront CDN (known Steam app ID)**. They continue to use the existing Cover Recovery candidate review and image validation.
- All 12 newly requested cover providers cataloged; restricted/untested sources remain disabled.
- New headless contracts, syntax checks and existing recovery regressions in dedicated v437 GitHub Actions workflow.

## Not yet finished / release blockers

- Implement and test the remaining public metadata adapters from the approved inventory, subject to each provider's usage policy and actual endpoint availability.
- Extend the existing authenticated Supabase gateway with properly authorized *metadata* responses and independent metadata verification for configured sources, including MyAnimeList Official, TMDB, OMDb, Trakt and eligible others. A working cover or ID test is not equivalent to a verified metadata adapter.
- Implement missing permitted cover adapters (GameTDB, PCGamingWiki, Wikidata/Commons, Deezer, IFDB, Libretro and any remaining ones). Do not falsely activate blocked or restricted APIs.
- Add broad media-specific field editing, import/export audits, independent provider IDs and complete schema migration coverage.
- Add conflict preview/approval, per-field recovery history/undo, advanced recovery cancellation and cross-recovery deduplication.
- Browser test on phone/tablet/desktop including live public-provider CORS and API-policy checks; offline/reconnect, cross-tab, 100k synthetic title and Supabase sync checks.
- Verify data protection for existing Library, History, personal ratings, cover URLs, Collections, XP and Personal Order.
- Create the real \`legacy/v/437\` archive, merged tested bundle, numeric \`437\` release tag, full ZIP and GitHub Pages deployment **only after** the above is complete.

No new user-supplied API credentials. Podcast Index excluded. Never overwrite personal ratings/progress, existing manual metadata, or conflicting external IDs automatically.
