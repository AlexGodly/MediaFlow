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

## Not complete / release blockers
1. Confirm chronology and progress semantics for nonconsecutive episodes (e.g. Episode 12 and Episode 14), rewatches, earlier seasons and edits. Quantity and Library progress must not silently imply Episode 13 happened.
2. Verify the complete wrapped submit chain, including XP, stage changes, v252 season metadata, History and cloud persistence; add idempotency and partial-save recovery.
3. Confirm per-unit timestamp rendering in Consumption History, statistics, exported History, and backups (including legacy rows).
4. Verify cloud merge conflicts using multiple devices; existing v285 newest-modifiedAt selection is not a conflict-free editor.
5. Confirm restoring a draft after cold start and that Settings reset and presets round-trip the new preference.
6. Add browser-based tests for Quick Logging, itemized entries, Seasons View, reload/reconnect, and History exactness.
7. Profile 30k and 50k Library titles; compare Personal Order v368 benchmarks with v369.
8. Verify CSS theme variables and mobile styles at 320, 390, 820, 1280 and 1920 px.
9. Verify correct module parse, inherited duration rendering, and XP-minute aggregation in the compiled browser runtime (not yet run).
10. Validate automatic and manual exports, backup/restore, Settings presets, Sync Now, and PWA update behavior end-to-end.
11. Build full JS bundle, regenerate PWA cache and version references, and package a full v369 ZIP.

## Preservation policy
- Do not overwrite v368 or change the production/default branch until all blockers are addressed.
- No Supabase SQL migration is asserted until persistence compatibility is verified.
- These are untested initial changes, not a finished v369 release.
