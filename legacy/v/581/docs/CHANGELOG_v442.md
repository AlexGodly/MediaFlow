# MediaFlow v442 Stable — Recovery Integration & Performance Hardening

Final phase (6 of 6) in the v437–v442 cover/metadata provider-recovery roadmap.

## Durable and safe recovery
- **Account-scoped cross-tab coordination** serializes Cover Recovery and Metadata Recovery within the *same browser profile*. A second recovery is safely paused until manually resumed, rather than silently competing for Library writes.
- Existing v424 cover lease is now checked for both **matching ownership and a nonexpired deadline**, including after slow image checks and before committing the cursor.
- Cover Recovery now **flushes the Library save before advancing the durable cursor**. Saving, locks, image validation, XP and existing cover/ID protections remain with the original engine.
- Metadata Recovery renews its own tab lease during lengthy provider searches and verifies **both the metadata lease and the shared process lease** before field application and before checkpointing.
- If the account, tab ownership, underlying Library title, release year, External IDs, or last-modified signature changes during lookup, stale results are rejected safely.
- Metadata Library writes use **awaited `saveState()` before marking the batch title complete**. A failed save leaves the cursor at that title; the saved checkpoint allows an idempotent retry instead of silently dropping it.
- Existing manual field locks, filled synopses, personal ratings, progress, statuses, XP and cover image URLs remain protected.

## Performance, resumption and diagnostics
- Metadata Recovery precomputes a bounded title-ID index for only the user-selected batch, reducing repeated lookups from repeated full scans to one Library pass plus O(1) title retrieval.
- Account and Library-hydration checks prevent recovering a partially loaded account on app startup.
- Recovery checkpoints are normalized and validated (schema, account, bounded unique IDs, cursor, status and error-history size) before being resumed. Previous v439 saved checkpoints are preserved and remain compatible.
- The Recovery Workspace in Settings gains **Recovery Integrity & Diagnostics**: cover and metadata progress, current browser process owner, checkpoint status, warnings, refresh and sanitized JSON diagnostic export.
- Diagnostics export **no account ID, title IDs, raw provider responses, API secrets or token values**.
- Existing v441 floating Background Processes widget, five quick actions, field-level previews, metadata filters and public provider access remain intact.

## Important boundary
- The shared process lock coordinates **tabs in one local browser profile**. It is *not a cross-device Supabase/cloud lock* and cannot guarantee global device-level exclusivity. Every save still uses the underlying data validation/protection checks.
- This update has no new Supabase deployment, paid service, provider credential, SQL migration, or change to current metadata/cover API endpoints.

## Quality gates
- Failure-injection tests for interrupted saves, retries, stale title changes, cross-tab locks and lost leases, and synthetic 100K-title Library.
- Existing v430–v441 cover, provider, metadata, gateway, Settings Center and floating UI regression tests.
- Authenticated Supabase gateway source Deno typecheck, desktop and 360px Chromium browser smoke for Recovery Integrity.
- Full source archive `legacy/v/442`, numeric stable release `442`, GitHub Pages deployment, ZIP and SHA-256 checksum.
