# MediaFlow v270 — History Performance, Whole-App Optimization & Permanent Version-Chip Removal

MediaFlow v270 is built from v269 and focuses on eliminating the History-page freeze while preserving the full v269 Consumption History redesign.

## History performance

- Fixed severe lag / browser "Page Unresponsive" behavior when opening History.
- Replaced per-history-event full Library `.find()` scans with indexed O(1)-style ID/title/category lookups.
- Reuses the existing large-Library index and adds a normalized title index.
- Week groups are created cheaply first; only visible History weeks are hydrated into detailed event cards and weekly analytics.
- Consumption History is paginated by week while retaining the same v269 layout inside each page.
- Default: 6 weeks per History page; configurable from View Options.
- Latest Consumed stops processing once the visible latest-title quota is satisfied.
- Removed an unnecessary second chronological sort in the v269 renderer.
- Added a shared sorted History cache so the complete session array is not cloned/sorted on every History render.
- History sort cache is invalidated whenever session persistence changes.
- Added off-screen rendering containment for weekly summaries and daily grids.

## Whole-app optimization

- Large-Library title and category-title indexes are warmed during browser idle time.
- Shared session-to-Library resolution uses the fast index outside Consumption History too.
- Large-Library cache invalidation is tied into MediaFlow's existing Library cache invalidation flow.
- Mobile/reduced-motion History avoids unnecessary backdrop-filter composition.

## Top-right version chip permanently removed

- Removed the `v###` chip beside Sync Now.
- The fallback top bar no longer creates a version chip.
- The prebuilt React top bar no longer renders a version chip.
- Previous runtime version-updater hooks are redirected to removal rather than rewriting the chip.
- A MutationObserver removes a stale legacy version chip if an older path attempts to recreate it.
- CSS provides an additional permanent safeguard.
- This is intended to remain absent in future releases as well.

## Preserved

- v269 Consumption History design.
- Latest Consumed rail.
- Weekly summaries and daily history cards.
- MediaFlow category breakdowns.
- Cover URL + category artwork fallback behavior.
- Episode/chapter/issue/volume/Seen all progress presentation.
- Year, Month, Period, category and type filters.
- Select, batch delete, edit/delete log and CSV export workflows.
- Recently Viewed, Ratings and Library History tabs.
- Dynamic themes.
- Cloud Sync v201.
- Full Backup Schema v29.
- Settings Preset Schema v1.
- Personal Order Export v4.

No data migration is required.
