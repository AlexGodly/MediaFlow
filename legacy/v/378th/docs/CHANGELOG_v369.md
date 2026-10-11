# MediaFlow v369 — Itemized Logging, Exact Runtime & Compatibility Release

**Project:** MediaFlow by Alex Godly  
**Version:** v369 Modular, Personal Edition  
**Baseline:** v368  
**Built:** 2026-10-10  
**Package:** `MediaFlow_v369_Modular.zip`  
**Deployment:** Production GitHub Pages intentionally remains on v368 until the owner deploys the v369 build.

## New functionality

- New **Per Episode / Chapter / Issue** logging interface, recommended by default; original **Quick Logging** and its **Amount Consumed / Last Progress** setting are retained.
- Multiple selected Library titles can be managed inside a Dashboard logging session. Titles have collapsible panels and individual numbered units.
- Each unit records a timestamp as soon as it is added; dates/times remain editable with seconds precision. The final session-save timestamp does not overwrite the original unit timestamps.
- Every unit inherits the category's current default runtime. Category editor now supports Hours, Minutes and Seconds, with backward-compatible minutes-per-unit values.
- Individual runtimes can be edited independently; exact integer-second totals are calculated for a title and for the session.
- Season-aware recording, season/episode editing, contiguous progress protection (logging episode 12 and 14 does not imply episode 13), and automatic progress calculation across seasons.
- Itemized rewatch/reread units can be marked independently and coexist with first-time consumption. Existing repeat XP rules are extended to count such units, including the optimized XP recalculation path.
- Per-unit details are visible in expandable Consumption History rows. Consumption History and Logs CSV exports add individual-unit JSON, duration-in-seconds and itemized flags without removing the original session JSON.

## Persistence, XP and compatibility

- Reuses the existing v285 local/cloud draft resume state. The rejected-save resume bug is corrected; declined submission should retain the draft instead of marking it closed.
- Adds stable itemized commit identifiers to reduce duplicate final submissions, more precise Sync Now verification of each draft's unit timestamps/runtimes, revision-aware draft merge logic, deletion tombstones and recovery access for competing device drafts.
- Integrates the new itemized data before the canonical History/XP persistence operation; the legacy Quick Logging submission path remains intact.
- Full Backup includes itemized session records and resumable drafts through its canonical snapshot, with a new v369 manifest section. Settings Presets include the interface default and preserve category runtime configuration.
- Retains Personal Order Format 5 and Collections Format 2, existing media importers and other transfer workflows. No unnecessary export-format or database schema bump.
- No Supabase schema migration was performed. The connected `mediaflowcloud` database has a JSONB `state_data` column and enabled row-level security; this was inspected read-only.
- PWA manifest, service-worker app-shell cache and version metadata regenerated for v369 by `scripts/build.py` and `scripts/pwa.py`. Automatic-update behavior retains the existing system; installation/automatic update across real devices requires owner-side verification after deployment.
- Existing v368 ID lookup / Personal Order / Collection Queue optimizations remain in the bundled source.

## Release checks completed

- `node tests/test-v369-itemized-contract.cjs` — passed: episode gaps, two-season consumption, multiple category durations, XP inputs, duplicate-save suppression, cloud mismatch detection and legacy Quick Logging.
- `python tests/test-v369-browser-smoke.py` — passed in headless Chromium against compiled v369: Itemized Logging UI, per-unit timestamp and runtime editing, final Category editor controls, and saving HH:MM:SS defaults.
- `python tests/test-v369-repeat-browser.py` — passed in headless Chromium against compiled v369: mixed new/repeated episode, repeat-unit XP award and correct Library progress.
- `python scripts/build.py` — passed. The bundle was compiled from **266** JavaScript fragments including **123** runtime extension modules.
- `python scripts/check.py` — passed; JavaScript syntax, release/PWA consistency and repository structural invariants.
- ZIP archive integrity validated after packaging.

## Verification limitations and release cautions

- **Authenticated two-device synchronization, concurrent offline conflict resolution under real network conditions, and cloud restore after production deployment have not been exercised end-to-end.** The code includes conflict recovery and deep Sync Now comparison, but these mechanisms require an authenticated staged rollout.
- **Automatic update on already-installed Android/iOS/desktop PWAs has not been exercised on physical devices.** PWA assets and cache were regenerated and checked statically.
- **30k–50k-title real-device latency was not benchmarked as part of this v369 build.** Existing v368 performance improvements remain present, but zero-lag operation cannot be guaranteed.
- The complete matrix of every historical import/export variant has not been executed with owner data. Existing formats were preserved and the modified fields have dedicated checks.
- Production/main branch was not modified. Back up the existing account before replacing production, and validate Sync Now, a restore round trip, and a PWA upgrade in a staging deployment first.

**This package is an up-to-date, successfully compiled and tested v369 development release candidate, not a claim that all external production verification has been completed.**
