# MediaFlow v268 — Today's Balance Initial Dashboard Load Fix

MediaFlow v268 is a focused Dashboard lifecycle reliability release built on v267.

## Fixed

- Fixed **Today's Balance not appearing on the initial Dashboard load**.
- Today’s Balance no longer requires switching to another page and returning to Dashboard before it appears.
- Removed the startup dependency on older Balance card classes being applied first.
- The pristine Dashboard Balance card is now detected directly from the **Today’s Balance** section heading.
- The final v265 Balance design is applied synchronously to Dashboard HTML before it is painted.
- If the Dashboard was already rendered before the v268 runtime extension initialized, it is repaired immediately in place.
- Added idempotent hydration passes for startup, microtask, animation-frame, page enhancer, and normal rerender paths.
- Legacy v261/v264/v265 Balance enhancement hooks now resolve to the same robust final renderer.

## Preserved

- v267 Today’s Balance latest-result cleanup.
- Today’s Balance visibility setting.
- Today’s Balance calculations, guidance, statuses, progress, summary metrics, and dynamic-theme styling.
- All v267 Cloud Sync verification and self-repair improvements.
- Dynamic Library cover filtering fixes.
- Personal Order Category portal and viewport clamping.
- Cloud Sync v201.
- Full Backup Schema v29.
- Settings Preset Schema v1.
- Personal Order Export v4.
- Existing MediaFlow data; no migration required.

## Expected behavior

**Open MediaFlow → Dashboard loads → Today’s Balance is already visible and fully rendered.**

Page navigation is no longer required to initialize the section.
