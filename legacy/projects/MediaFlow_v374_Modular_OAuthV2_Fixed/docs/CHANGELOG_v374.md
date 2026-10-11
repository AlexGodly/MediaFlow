# MediaFlow v374 — MAL & SIMKL Tracking 1.0

**Release:** v374 Modular — Personal Edition  
**Baseline:** MediaFlow v373 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Complete local development candidate, **not live-certified**.

## 1. Opt-in external tracking
- Account integration begins with MyAnimeList and SIMKL only.
- The entire Library is **never** automatically linked or uploaded.
- Associations belong to exact Library title IDs or individual Season View IDs.
- Newly assigned links start disabled to prevent accidental overwriting of existing external account data.

## 2. Three title surfaces
- Add Title: choose a provider match before saving; the association is created after the title enters the Library.
- Edit Title: view, link, change, configure and unlink tracking.
- Anime Details: the same Tracking controls without requiring Edit Title.
- Connected providers only appear after account connections load.

## 3. Search and assignment
- Debounced MAL anime/manga and SIMKL anime/TV/movie search from their catalogs.
- Search results include title, year, media type, available count, and artwork where returned.
- Confirmation keeps both local and external progress unchanged until tracking is intentionally enabled.
- Duplicate MAL remote associations are rejected; reassignment resets auto-tracking to paused and drops obsolete jobs.

## 4. Account authorization and protection
- OAuth login started through the app and completed on a dedicated `tracking-callback.html` page.
- One-time short-lived state enables external-browser/mobile callback completion.
- Tokens are encrypted with AES-256-GCM on the Edge Function; token plaintext never appears in the frontend, export or Library.
- Supabase auth is checked independently for every user operation.
- RLS and explicit grants limit database access; no anonymous write access to tracking tables.

## 5. Outbound synchronization
- Hooks are attached after the canonical title-save and Logging pipelines, preserving History, XP, seasons and v373 ordering.
- MAL uses absolute anime episode/manga chapter progress and optional status/rating.
- SIMKL uses precise episode-history events where safe, or supported status/rating writes.
- Quick Logging may infer a contiguous watched-episode range only from a validated positive progress delta, never a random list of episodes.
- Aggregate progress is not sent as a substitute for one season's progress when Seasons View is active.
- Rewatch-history duplication is intentionally disabled for SIMKL in this initial candidate.

## 6. Queue, offline and cleanup
- Authenticated event queue stores only explicitly linked title changes.
- Jobs use stable event keys, retry backoff and deletion on success or unlink.
- User-local offline events are kept until delivered while app storage remains available.
- Unlink removes pending jobs through cascade, without changing MediaFlow History, XP or the external entry.
- Disconnect clears encrypted local credentials and owned links; remote authorization can also be revoked from the provider's Connected Apps page.
- No always-on polling and no whole-Library database replication.

## 7. Responsive design
- Uses theme-native styles, compact action groupings and responsive assignment dialogs.
- Local Chromium browser checks at 320, 390, 820, 1280px passed with no document-level horizontal overflow.
- Tracking card interactions and all three title modal insertion contracts passed in a mocked environment.

## 8. Source changes
- Added `src/js/components/272-v374-media-service-tracking.js`.
- Added `assets/css/194-v374-media-services.css`.
- Added `tracking-callback.html`.
- Added `supabase/functions/mediaflow-tracking-v374/index.ts`, `supabase/config.toml` and tracking SQL migration.
- Updated runtime module registration, build metadata, HTML entrypoint, PWA cache and compiled app bundle.
- Added v374 contract, browser and Logging regression tests.

## 9. Test results

| Check | Result |
|---|---|
| JavaScript bundle syntax and build | Passed |
| v369 itemized Logging contract | Passed |
| v372 Settings/Collections regression | Passed |
| v373 ordering regression run against v374 bundle | Passed |
| New title search, link, options mocked Chromium workflow | Passed |
| v374 UI at 320 / 390 / 820 / 1280px | Passed |
| SQL applied to user's live Supabase | **Not performed** |
| OAuth accounts tested against live MAL/SIMKL | **Not performed** |
| Live external progress update | **Not performed** |
| Low-end Android/iOS/Windows PWA validation | **Not performed** |

## 10. Scope limits
- Live account authorization and production setup must be completed by the account owner.
- External-to-MediaFlow automatic reverse sync is not included.
- The initial compare/import-from-provider wizard is not implemented; linking keeps both unchanged until tracking is intentionally enabled.
- SIMKL per-title count-only progress cannot be converted reliably to episode watch events without exact episode identity.
- Retry processing is client-triggered while the app is active, not a guaranteed always-on background service.
- Production credential and schema setup must be verified before real tracking can operate.

## 11. Deployment
- Back up MediaFlow data first, and verify the live project's ID against the v373 source.
- Apply the included SQL migration, configure protected Edge secrets, and deploy the Edge Function.
- Register provider application callback URLs and deploy the static OAuth callback page.
- Test on a disposable provider account before activating tracking for valuable Library titles.
- See `docs/SETUP_v374_MAL_SIMKL.md` for the exact steps.

**MediaFlow v374 — developed by Alex Godly.**
