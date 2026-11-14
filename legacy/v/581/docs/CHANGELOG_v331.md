# MediaFlow v331 — Per-title logging timestamps

**Release:** 2026-10-09  
**Base:** v330 Personal Edition (the preserved v301 feature line)  
**Scope:** Dashboard Logging, Batch Log, History and grouped session counters  
**Database/Cloud Sync format:** unchanged (v201)  
**Full Backup:** unchanged (v29)  
**Community:** still on hold; no Community modules or backend migrations

## What changes

- When an actual title enters the **Dashboard Logging** queue, it receives its own `loggedAt` Unix-millisecond timestamp. Adding another title later captures a separate timestamp. Changing quantity, progress, season or notes does not rewrite the original addition time.
- In **Batch Log**, a timestamp is captured when a title is selected in a row, not when an empty row is created. Selecting a different title resets that row's time. Removing the selection clears the previous title's timestamp. Re-selecting the same title keeps its original addition time.
- When the user explicitly changes the **Batch Log consumption date**, that date overrides the calendar day of each title at submission, while preserving the local clock time at which each title was selected.
- On save, the original History session continues to hold its regular `timestamp`, `date`, `sessionGroupId` / `batchGroupId`, XP, minutes, note and category information. Each `session.titles[]` entry additionally stores `loggedAt`.
- **Dashboard Logging** and **Batch Log** show a small "Added" date/time label beside each selected title.
- **History → Consumption history** uses the title-level time when displaying the individual title's card. **History → Logs** also shows an individual time beside each logged title. Older History rows without `loggedAt` continue showing their original session time.
- The History list's filtered session total, and the **Statistics** session counts and average/session divisor, use the existing `sessionGroupId` or `batchGroupId` to count a multi-title submission once. Underlying category-specific History records are preserved, and their XP, minutes, scheduler and progress are not combined or recalculated.
- The existing title event date is represented in the Consumption History title row; the enclosing week is still organized by the overall session's date, preserving session-centric grouping across midnight.
- New `loggedAt` values are regular nested History fields and are included in existing Cloud Sync, backups and History JSON/CSV export data without changing data schema versions.
- In-progress Dashboard Logging drafts already saved by the v285 resume system retain the per-title timestamp, because the draft is cloned as regular JSON.

## Compatibility and caveats

- A timestamp indicates **when the title was added to the logging queue**; it is not automatically the start of the actual watching/reading activity.
- No record is committed to consumption History until the existing **Save** / **Log batch** action is used. Cancelling or clearing the draft leaves no new consumption session.
- Title events spanning midnight retain their unique date/time, while the parent History group remains anchored to the session's original date. This avoids splitting XP, session totals and scheduler events into multiple independent sessions.
- All previous History entries remain readable. No backfill is attempted for pre-v331 title entries.
- No Supabase migration, new API, Community integration or new third-party service is required.

## Files and implementation

- `src/js/core/app/021-app-public-actions-bound-to-window.js`: Dashboard title addition timestamp.
- `src/js/features/logging/008-session-flow.js`: carry per-title timestamps into History entries.
- `src/js/pages/batch-log/014-view-batch-log-v61.js`: Batch selection, reset and persistence.
- `src/js/pages/batch-log/100-batch-log-state-ui.js`: explicit manual date flag.
- `src/js/components/203-v269-consumption-history-redesign.js`: per-title History event time and logical session counter.
- `src/js/components/206-v272-logs-covers-edit-title-fix.js`: per-title time in Logs title rails.
- `src/js/pages/statistics/023-v16-features-backups-themes-stopwatch-mal-link-stats.js`: logical session count.
- `src/js/components/231-v331-per-title-logging-timestamps.js`: timestamp formatting, manual date handling and queue UI integration.
- `assets/css/160-v331-per-title-logging-timestamps.css`: theme-aware labels.
- `scripts/test-v331-title-timestamps.py`: browser regression for actual app JavaScript.
- VERSION/package/version manifest/index/service worker and v331 bundle versioning updated.

## Testing

- `node --check assets/js/mediaflow-v331.bundle.js`.
- `node --check sw.js`.
- `python scripts/test-v331-title-timestamps.py`: actual app functions exercised in headless Chromium using an in-memory fixture (no Supabase writes).
- `python scripts/test-v301-rerolls.py`: inherited original modal responsive layout tests.
- PWA asset existence and ZIP integrity checked.

**v331 is a personal-project release built on v330; v302–v329 Community features remain archived.**
