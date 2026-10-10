# MediaFlow v369 — Work-in-progress Implementation & Acceptance Checklist

Base: MediaFlow v368. Development branch only. Do not deploy or merge as a finished release.

## Implemented in initial branch
- New independent default interface preference (itemized by default, Quick available) inside existing Library & Titles → Logging Method.
- Legacy Amount Consumed / Last Progress setting retained.
- A new per-title itemized entry panel in Dashboard Logging.
- Unit timestamp captured at the moment the unit is added, with editable timestamp and optional minutes.
- Unit add/remove and season selection.
- Draft fields stored in the existing v285 resumable logging state; v368 runtime changes left unchanged.
- Captured unit metadata attached to new History session title rows in an initial commit path.

## Additional work on October 10, 2026
- Corrected the v369 title lookup so it no longer references an optional runtime symbol before checking it.
- New itemized units now inherit their category's existing minutes-per-unit runtime, stored as integer seconds with an optional seconds-per-unit fallback.
- Added per-item Hours / Minutes / Seconds controls; total duration is calculated from units and shown per title and session.
- Timestamp editor now includes seconds; captures still occur when a unit is added.
- Attached exact unit-duration totals to itemized title rows in newly committed sessions.
- **This is a development-only code change; there is no completed build, browser regression result, or new release ZIP.**

## Additional integration work
- Improved v369 submit metadata: saved per-title and grouped session duration now comes from actual itemized HH:MM:SS runtimes, and category consumption XP is recalculated from those totals.
- Added a season-specific post-submit correction for units spanning multiple seasons, restoring the correct individual season progress and aggregate title progress.
- Added validation for unknown season references and a protective rejection of already-consumed units in partially completed titles until repeat handling can be implemented safely.
- Consumption History cards now include expandable per-unit timestamps and exact durations; per-title minutes are no longer inferred from quantity where itemized duration exists.
- Validated JavaScript parse and a focused synthetic three-episode/two-season commit harness (3 units, 4340 seconds, correct per-season progress and mock XP calculation).
- Remaining issue: the canonical submit chain still runs before v369's final metadata corrections. Its intermediate persistence, XP ledger side effects, cloud retries, and idempotency need full integration tests; this is NOT a verified production-safe save pipeline.

## Continued v369 work — October 10, 2026

### Canonical save integration
- The legacy native Dashboard submit pathway now receives actual per-category itemized runtime **before** building saved History and XP entries.
- New sessions store a stable itemized commit identifier plus per-title unit data and exact duration seconds at the original persistence point.
- Library progress only advances through contiguous explicitly logged episode/chapter numbers; logging episodes 12 and 14 does **not** fabricate progress for episode 13.
- Existing Seasons View progress is corrected per season after the legacy season-distribution wrapper.
- An already-committed session ID is rejected on repeat submission, preventing duplicate local consumption and XP.
- Existing Quick Logging uses the original code path.

### Editor, categories, History and data compatibility
- Title panels can expand/collapse; existing unit numbers and seasons can be edited with duplicate and completed-progress validation.
- Removing a title recalculates draft runtime; unit nouns include movies, chapters, issues, pages, books and other category types.
- Category add/edit exposes Hours, Minutes and Seconds, storing `secondsPerUnit` alongside compatible fractional `minutesPerUnit`.
- Consumption History has expandable per-unit timestamps/runtimes; Consumption/Logs CSV exports gain additive v369 itemized and duration columns while keeping session JSON.
- Sync Now verification now compares individual unit IDs, timestamps and durations rather than entry counts alone.
- Full Backup exposes itemized-data manifest counts; Settings Presets explicitly include the interface preference and category runtime metadata.
- `App.v369DataAudit()` provides an on-demand local snapshot/backup and preference parity report.

### Repeatable verification
- Added `tests/test-v369-itemized-contract.cjs`.
- The test passed against the branch: episode gaps, two-season crossing, mixed-category seconds and XP inputs, double-submit blocking, cloud timestamp/runtime mismatch detection, and legacy Quick Logging.
- JavaScript syntax checks passed for the six affected feature/core/modal/History files.
- These are synthetic execution tests, **not** authenticated cloud tests, real-browser rendering tests, automatic-update checks or production release verification.

## Not complete / release blockers
1. Confirm chronology and progress semantics for nonconsecutive episodes (e.g. Episode 12 and Episode 14), rewatches, earlier seasons and edits. Quantity and Library progress must not silently imply Episode 13 happened.
2. Verify the complete wrapped submit chain, including XP, stage changes, v252 season metadata, History and cloud persistence; add idempotency and partial-save recovery.
3. Confirm per-unit timestamp rendering in Consumption History, statistics, exported History, and backups (including legacy rows).
4. Verify cloud merge conflicts using multiple devices; existing v285 newest-modifiedAt selection is not a conflict-free editor.
5. Confirm restoring a draft after cold start and that Settings reset and presets round-trip the new preference.
6. Add browser-based tests for Quick Logging, itemized entries, Seasons View, reload/reconnect, and History exactness.
7. Profile 30k and 50k Library titles; compare Personal Order v368 benchmarks with v369.
8. Verify CSS theme variables and mobile styles at 320, 390, 820, 1280 and 1920 px.
9. Run the full compiled-browser regression matrix, including real DOM/category runtime controls, XP-minute aggregation and resume behavior; focused synthetic tests have passed.
10. Validate automatic and manual exports, backup/restore, Settings presets, Sync Now, and PWA update behavior end-to-end.
11. Build full JS bundle, regenerate PWA cache and version references, and package a full v369 ZIP.

## Preservation policy
- Do not overwrite v368 or change the production/default branch until all blockers are addressed.
- No Supabase SQL migration is asserted until persistence compatibility is verified.
- These are untested initial changes, not a finished v369 release.
