# MediaFlow v241 — Edit Title Clarity, History Filtering & 50K Performance

MediaFlow v241 focuses on larger/clearer Edit Title controls, logging-cover behavior, History usability and another large-Library optimization pass designed around 50,000-title libraries.

## Edit Title
- Increased Edit Title label, field and textarea sizing for easier reading.
- Increased desktop modal width and spacing while preserving tablet/mobile fallbacks.
- Rewatch / Reread summary cards now use the entire available row instead of leaving the right half empty.
- Preserved safe modal scrolling, sticky actions, rich metadata editing and Synopsis access.

## Logging artwork
- Logged titles without a title cover now show their category icon instead of a letter placeholder.
- Batch Log selected titles use the same category-icon fallback.
- Clicking any logged/batch title artwork — real cover or fallback — opens that title's Title Details popup.
- Existing Logged / Batch selected cover-size setting remains supported.

## History
- Replaced History's basic category select with the same searchable, paginated, multi-select Category Filter language used by Library.
- History Category Filter respects Choice & Filter Layout category order and visibility.
- Reuses the shared Categories-per-page setting.
- Added custom From / To date filtering in addition to All Time, Today, This Week and This Month.
- Existing media-type filtering, editing/deleting sessions and CSV export remain available.

## Library History
- Library History change log is now paginated at 50 entries per page.
- Previous / Next controls appear only when required.
- Restore deleted title / Restore all controls remain functional on paginated entries.
- Undo / Redo remains unchanged.

## 50K performance pass
- Added a reusable single-pass Library index with ID lookup, category/status buckets, rich search text, unrated titles and missing-cover titles.
- Dynamic Library now reads its active category/status bucket instead of rescanning the full Library on every status click.
- Dashboard Rating and Missing Covers queues share the cached Library index instead of independently rescanning the whole Library.
- Personal Order picker results are cached for identical filter/sort state and reuse indexed search text.
- Added render containment/content visibility for repeated off-screen rows and settings surfaces where supported.
- Added a dedicated 50,000-title Chromium performance regression.

## Persistence / export audit
Re-audited:
- Cloud state / Sync Now
- Full Data Export / Import
- Full Backup / Automatic Backup
- Settings Preset Export / Import
- Personal Order Export / Import
- History CSV export

No persistent schema bump is required because new History filter/pagination state is transient UI state.

## Compatibility
- Cloud Sync: **v201**
- Full Backup Schema: **v29**
- Settings Preset Schema: **v1**
- Personal Order Export: **v4**

## Version progression
**v238** → Status Filter repair, logging redesign & responsive optimization  
**v239** → Batch Log UI redesign, Edit Title overhaul & responsive cleanup  
**v240** → Edit Title layout redesign, Logged Cover Size control & profile cleanup  
**v241** → **Edit Title clarity, History filtering & 50K performance**
