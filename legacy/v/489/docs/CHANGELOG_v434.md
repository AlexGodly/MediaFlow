# MediaFlow v434 Beta — Secure Gateway & Provider Connection Tests

This release prepares and deploys an authenticated single-gateway provider architecture, introducing real title-search integration routes with strict safety and user-controlled API tests. **An API credential being stored does not prove that provider integration works; individual sources must pass a signed-in test.**

## New
- Secure Supabase Edge Function with fail-closed authentication, exact permitted provider API destinations, strict response normalization and metadata-only output.
- Authenticated PostgreSQL global/per-user daily request allowances, with a stricter Watchmode credit budget and no user title data in the quota table.
- Conditional search adapters for TMDB, OMDb, Fanart.tv, MyAnimeList Official, AnimeSchedule, EpisoDate and Gutendex in Find Cover and Cover Recovery, available after explicit testing and opt-in.
- ID-only lookups for Trakt, Watchmode and Metron, without unsupported image links. Manual 'Find IDs' in Add/Edit Title; never overwrite existing IDs.
- Themed provider connection status and test controls in the existing Cover Recovery Settings.
- Search all providers without relying on MediaFlow user-defined categories. Protect image validation, explicit manual selection and strict automatic matching.
- Preserve long-running Library performance. No bulk automatic use of newly tested sources until user enables them.
- Remove Podcast Index from the provider catalog and External IDs editor, as explicitly requested.

## Deferred pending permissions/contract validation
Comic Vine (non-commercial restrictions), Hardcover (verify GraphQL access/terms), TheTVDB, SIMKL, AniDB, Marvel, MangaDex, Grand Comics Database, LiveChart. Public mapping/bibliographic providers not yet implemented remain nonfunctional, not misrepresented as live.

## Testing
- No secrets stored in GitHub or browser code.
- Deterministic gateway / frontend tests plus existing v424-v433 suites.
- 100k synthetic title test and desktop + 360px mobile Chromium boot.
- Live signed-in provider tests are deliberately performed manually from within MediaFlow; absence of a request from GitHub CI is not proof of a working credential.
