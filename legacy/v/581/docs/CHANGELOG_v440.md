# MediaFlow v440 Stable — Universal Cover Recovery Expansion

Phase 4 of the v437–v442 metadata and recovery roadmap.

## Seven working public cover adapters
The existing v424/v425 Cover Recovery queue and manual Find Cover picker now accept real records from:

- **Steam Store** — video-game portrait cover candidates based on actual Steam app IDs; unavailable art rejected by the existing image validator.
- **Apple iTunes Search** — album artwork and Apple Music collection IDs.
- **MusicBrainz + Cover Art Archive** — music/album front images from real release-group MBIDs and curated artwork endpoints.
- **VNDB Kana** — visual novel covers from verified VNDB records. Images flagged as sexually explicit or strongly violent are omitted.
- **IFDB** — interactive fiction cover images from documented public IFDB JSON game search.
- **Gutendex** — Project Gutenberg book cover artwork from live bibliographic book results.
- **Google Books** — book and comic imagery from the public Books endpoint without a new API key, with conservative rate limits.

All seven adapters are explicitly connected to the *existing* Cover Recovery framework and have actual search/lookup logic. Their results are never assumed to be available simply because a provider is listed in the unified registry.

## User-facing integrations
- **Cover Recovery Settings** includes new sources for fresh installs; existing accounts retain their chosen enabled providers and ordering. They can enable/reorder additional public providers in Cover Recovery.
- **API Providers & Testing** includes read-only manual tests for Steam, VNDB, IFDB, Gutendex public, and Google Books. Existing iTunes and MusicBrainz tests remain shared.
- User-customized Library categories never prevent searching any provider.
- Verified external provider IDs can be offered when saving a chosen cover. Existing IDs and manually protected/cleared fields cannot be overwritten by bulk recovery.

## Safety and compatibility
- Original v424 queue, image validation, retries, cooldowns, persistence, XP crediting, on-cover picker and selection protections are reused, not replaced.
- New sources use conservative API gaps, bounds, HTTPS image URLs, and exact title/year/ID candidate evidence. Title-only matches require manual confirmation; only an exact already-saved ID plus title is eligible for automatic saving.
- Real cover images still undergo browser image loading and size verification; broken thumbnail URLs never get automatically saved.
- Existing v439 Metadata Recovery, its backend gateway and Supabase secret storage remain unchanged. No migration, new paid service or API credentials required.
- Restricted/keyed providers (IGDB, RAWG, Discogs, Comic Vine, etc.) remain pending; a catalog capability is not proof of operational access. Third-party browser CORS, service terms and availability can affect individual searches.
- The automatic Metadata Recovery integration of new artwork *into metadata fields* is not part of this release.

## Verification
- Mocked real-provider-shaped API responses for all seven adapters and title/ID selection checks.
- Regression tests for protected external IDs, existing covers, the cover-validation pipeline, provider health, Library metadata and 100K synthetic titles.
- Desktop and 360px Chromium UI smoke tests; Supabase gateway TypeScript compilation.
- Full project archive in `legacy/v/440`, GitHub release tag `440`, ZIP and SHA-256 checksum.
