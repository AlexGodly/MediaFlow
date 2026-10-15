# MediaFlow v429 — Recovery and Release Center
**Status: development preview — not merged or deployed.** Live personal MediaFlow remains v428 Beta.

## Implemented on the v429 development branch
- A premium, mobile-responsive, **bottom-left** floating **Recovery and Release Center** replaces the previous separate floating background-process panel. It uses current MediaFlow theme variables rather than fixed app-specific palette and respects reduced motion.
- Exactly four tabs: **Queue, Covers, Metadata, Fresh Episodes**. Expanded/minimized state, selected tab, and visibility (Hidden / Automatic / Always Show) persist in settings.
- **Queue** reads the existing v428 scheduler, shows running/queued/review states and percentages, and forwards reordering, cancel, pause, resume and review to the existing actions without introducing a second execution engine.
- **Covers** embeds the **original v424/v425 advanced cover configuration form**, retaining its recovery policies, matching, provider controls and original review behavior. No imitation form is created.
- **Metadata** embeds the real v428 Metadata Recovery form, extended to every existing v178/MediaServices rich-import field: year, mediaFormat, durationMinutes, releaseDate, seasonLabel, ageRating, communityScore, mediaSource, demographic, studios, producers, genres, themes, and synopsis, plus safe official total recovery. It offers One-Go/Part-by-Part, manual/automatic continuation and selects eligible no-key public metadata providers.
- **Fresh Episodes** uses the actual existing seasonal Fresh Episodes settings HTML (preserving existing Individual/Automatic/automatic2 behavior), alongside the v428 universal scanner. The universal mode chooser now exposes an engine per supported media type and one combined mode; categories without verified providers remain Unknown.
- **Critical v428 correction:** An anime-only selected or category scan no longer runs the original global seasonal refresh outside its requested scope. It can display pre-existing cached anime evidence without silently touching unrelated titles.
- **Critical v428 correction:** Setup-required / unverified Cover Recovery providers are not displayed as working choices or as a collapsible provider list; future-setup documentation stays in source/docs.
- All v428 background jobs/checkpoints, Library/Settings shortcuts, data protection, and existing MediaFlow features remain in place.
- Development-only regression checks, four-tab contract tests, Chromium desktop/mobile boot and actual launcher position checks.

## Deferred by user for a later update
- Creator credits, aliases, publication hierarchy, seasons, volumes, and extra custom imported metadata fields beyond the existing rich schema.
- Credential-dependent API integration, new provider setup, and a hypothetical single API shared across all media types. Each provider retains only its real supported capabilities.
- Full real-account provider CORS, rate-limit, error/undo and multi-tab validation, and full active-theme visual inspection on devices.
- Large-library full UI and Supabase sync benchmarks. Earlier 100,000-title test exercises synthetic indexing and checkpoints, not production network load.
- Final release archive, numeric tag `429`, ZIP and GitHub Pages deployment. These must be gated by follow-up verification.

## Safety
No production Supabase changes. Do not modify MediaFlow Plus or MediaFlowApp. Do not merge this preview until the remaining v429 requirements have been validated. Always preserve existing personal title records, progress, ratings, seasons, History, Collections and user data.

## Reliability and public-provider improvements in this development round
- Center now preserves the **original native Cover Recovery and Metadata Recovery form DOM** (not copied HTML) when switching tabs or minimizing. Unsaved scope, provider priorities and fields are restored unless the user explicitly opens a new scoped recovery request.
- The old `App.mf424OpenConfig` shortcut routes into the Covers tab, in addition to the existing `App.mf425OpenConfig`, Library, Settings and Title Details shortcuts. Automatic visibility does not hide a Center the user has already opened to configure work.
- The existing v377 seasonal anime checker already accepts an explicit `ids` argument. Universal/selected/category Fresh Episodes jobs now pass **only the selected anime title IDs** to the original engine, retaining v401/`automatic2` evidence logic while preventing unrelated seasonal refreshes. An unavailable scan returns Unknown rather than silently promoting old results.
- Added **AniList** as a no-key anime/manga metadata source using official GraphQL records and strict title/ID verification. Source mapping can fill already-supported rich fields including synopsis, genres, themes, studios, release date, format, duration, official total (when safe), media source and external community score. Existing personal ratings remain untouched.
- Added **MangaDex** title-UUID metadata lookups (synopsis, official taxonomy, demographics and year) and **Open Library** exact ISBN/Work/Edition-ID lookups for books and comics. Incomplete feeds never imply official chapter counts.
- All imported v178 rich metadata fields remain selectable; unsupported creator credits, aliases, publishing hierarchy and unknown custom imported fields are **still not silently fabricated**.
- New browser regressions cover real form-value persistence across tab changes/minimization and the original Cover Recovery settings entry point. Offline source tests verify AniList/MangaDex/Open Library identity evidence and manual/progress protection.
- No production Supabase writes, schema changes, Provider secrets, paid services, or deployment in this development round.

**Revised release gate:** Only Cover Recovery, Metadata Recovery, Fresh Episodes & Releases, and their existing usable public APIs need verified compatibility, safe fallbacks, UI/browser integration and regression checks. Expanded metadata schemas and credential-dependent providers are **explicitly deferred** and must not block v429. `v429` remains a draft until the narrowed release gates pass.

## Development hardening follow-up (October 15, 2026)
- Fixed cooldown countdown math: show **remaining** cooldown seconds, never an epoch-sized duration.
- The native Fresh Episodes settings now remain the **same DOM node** across Queue/Covers/Metadata tab switches, preserving in-progress selections; the universal fresh-release configuration modal is also restored on return.
- **Hidden** widget visibility hides the passive launcher without disabling explicit Library, Title Details or Settings recovery shortcuts. Minimizing an explicitly opened Center returns it to hidden. Automatic/Always Show modes retain their intended behavior.
- Metadata retries are now **provider-isolated** for Jikan, AniList, MangaDex, TVmaze and Open Library. A rate-limit/network/HTTP failure in one selected source does not prevent a different selected source from returning independently verified evidence.
- Public TVmaze metadata now supports exact TheTVDB lookup IDs in addition to its own IDs and IMDb lookups; community ratings are mapped to the separately stored community score rather than overwriting personal ratings. Unresolved supplied IDs are never replaced with a guessed title-only result.
- Added offline provider fallback, TheTVDB identity, failed-ID protection and desktop/360px Chromium preservation/shortcut regressions to the existing v429 development workflow.
- These changes are **development-only**. Automated checks and production-like tests must pass before release. Provider capability verification, imported custom fields, legacy archive and numeric GitHub Release remain incomplete.

## Revised no-configuration API audit (October 15, 2026)
- **Covers** (browser-enabled): Tenrai, Jikan, AniList, Kitsu (JSON:API Accept header fixed), TVmaze, Open Library. Matching and manual review remain conservative.
- **Metadata** (existing rich fields only): Tenrai and Jikan (Jikan-compatible catalogue mapping), AniList, Kitsu, TVmaze (including verified TheTVDB/IMDb ID lookups), Open Library. Individual failures fall through to other allowed providers.
- **Fresh Releases**: Original anime seasonal verification, TVmaze, EpisoDate, and existing per-title HTTPS RSS/Atom. A negative TV result is not accepted prematurely when another public TV source has not been checked. Media without verified accessible sources explicitly reports Unknown.
- **MangaDex**: Public read requests require no key, but the tested public API response currently lacks browser CORS permission. Direct GitHub Pages use cannot be treated as working. The future adapter remains in source, and Cover/Metadata/Fresh automatic choices do not enable it until a CORS-safe, user-approved integration exists.
- **Google Books**: Official public API requests require an API key or access token. Corrected the no-setup classification; the adapter is dormant until the user chooses to configure it.
- The development pipeline includes an observational CORS/network probe for each existing no-key service and documents successes and failures without claiming that a single provider observation guarantees future uptime.
- No additional secrets or Supabase migration required for this narrowed v429 scope.
