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

## Not complete / release blockers
1. Confirm chronology and progress semantics for nonconsecutive episodes (e.g. Episode 12 and Episode 14), rewatches, earlier seasons and edits. Quantity and Library progress must not silently imply Episode 13 happened.
2. Verify the complete wrapped submit chain, including XP, stage changes, v252 season metadata, History and cloud persistence; add idempotency and partial-save recovery.
3. Confirm per-unit timestamp rendering in Consumption History, statistics, exported History, and backups (including legacy rows).
4. Verify cloud merge conflicts using multiple devices; existing v285 newest-modifiedAt selection is not a conflict-free editor.
5. Confirm restoring a draft after cold start and that Settings reset and presets round-trip the new preference.
6. Add browser-based tests for Quick Logging, itemized entries, Seasons View, reload/reconnect, and History exactness.
7. Profile 30k and 50k Library titles; compare Personal Order v368 benchmarks with v369.
8. Verify CSS theme variables and mobile styles at 320, 390, 820, 1280 and 1920 px.
9. Build full JS bundle, regenerate PWA cache and version references, and package a full v369 ZIP.

## Preservation policy
- Do not overwrite v368 or change the production/default branch until all blockers are addressed.
- No Supabase SQL migration is asserted until persistence compatibility is verified.
- These are untested initial changes, not a finished v369 release.
