# MediaFlow v233 Integrity Notes

- The modular build continues using the stable MediaFlow v201-compatible feature/data base.
- Runtime extensions remain inside the active application scope before `999-close-app.js`.
- `mediaflow-v233.bundle.js` must exactly match `build-order.json` plus `runtime-order.json`.
- No inline JavaScript or inline style blocks are reintroduced into `index.html`.
- Cloud Sync remains **v201**.
- Full Backup remains **Schema v29**.
- Settings Preset remains **Schema v1**.
- Personal Order dedicated export remains **format v4**.
- Settings → Library order must begin **Library Mode → Dynamic Settings → Categories**.
- Dynamic Settings must appear in both the Settings page and Settings sidebar.
- Dynamic Settings must contain the Dynamic category-row icon selector, Dynamic category-row order controls, and Dynamic status order controls.
- Library Mode must remain independently resettable from Dynamic Settings.
- The v231 active Settings highlight behavior must work for Dynamic Settings.
- Cover Size Adjustment must expose **Title Details popup cover**.
- `settings.v181CoverSizes.titleDetails` must default to 100 and persist through current Settings pipelines.
- Changing Title Details cover size must update `--v233-cover-title-details` immediately.
- At 100%, the v232 Title Details default cover dimensions must remain unchanged.
- v232 Library performance and Dynamic Status ownership protections must remain active.
- `scripts/smoke-ui.py` must pass v221–v233 compatibility behavior.
- `scripts/perf-v232.py` must continue passing the synthetic 30,000-title Library regression.

## v234 integrity note

The v234 release is presentation-only for Dashboard quick-entry fields. Rating data, rating XP, Missing Covers queues, title cover persistence, Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1 and Personal Order Export v4 remain unchanged.

## v235 integrity note

The Missing Covers live preview must never mutate a title's `coverUrl` before explicit confirmation. **Save Cover & Next** must remain disabled until the exact current input successfully loads as an `http(s)` image. Invalid/non-image URLs must show a warning and remain unsavable. Successful previewing is temporary DOM state only; confirmed saving continues through the existing MediaFlow cover-save/XP/persistence pipeline. Cloud Sync remains v201, Full Backup remains Schema v29, Settings Preset remains Schema v1, and Personal Order Export remains v4.

## v236 integrity note

The new Category Filter page-size value lives inside the existing `v230ChoiceLayout` settings object, so existing snapshot/cloud/full-backup/settings-preset pipelines include it without a schema bump. No Library/title/category content schema changes were introduced.

## v237 integrity additions

- Category Filter order/visibility continues to come from the canonical v230 settings resolver.
- v236 `Categories per page` remains the single persisted page-size preference and is reused across Library, Personal Order, Batch Log, and Dashboard logging.
- Search/pagination state for the three new dropdowns is transient UI state only.
- No schema bump: Cloud Sync v201, Full Backup v29, Settings Preset v1, Personal Order Export v4.

## v238 integrity additions

- Shared native status filters must preserve the selected value when Choice & Filter Layout reorders `<option>` nodes; they must not become visually stuck on Plan to Watch.
- Dashboard logging must open with its Library browser collapsed/lazy and the browser must sit below the What You Logged section.
- Opening Log & Complete must not eagerly sort/render the whole Library.
- Desktop Edit Title must use the v238 wide/dense layout; at a normal 1440×1000 desktop viewport it must fit without internal modal scrolling/clipping.
- Mobile/tablet auto layouts must avoid horizontal page overflow on Dashboard, Library, Personal Order, Batch Log, Settings and Statistics.
- `settings.v238DeviceLayout` must default to `auto` and persist through local Settings, cloud merge/verification, Full Backup/Automatic Backup, Settings Presets and Sync Now.
- Full Backup remains Schema v29, Settings Preset remains Schema v1, Cloud Sync remains v201 and Personal Order dedicated export remains format v4.
- `scripts/smoke-v238.py` and the existing 30,000-title `scripts/perf-v232.py` must pass.

## v239 audit
- Device & Layout override removed from current settings, cloud merge output, Full Backup and Settings Presets.
- Cloud Sync remains v201.
- Full Backup remains Schema v29.
- Settings Preset remains Schema v1.
- Personal Order dedicated export remains v4.
- History CSV remains the richer v232 exporter.
- No Library/user-data migration required.

## v240 audit
- Edit Title retains all existing field IDs and save/delete behavior while changing layout only.
- Logged-title cover size is stored at `settings.v181CoverSizes.loggedTitles` and is normalized by the existing v181 cover-size pipeline.
- Full Backup Schema remains 29, Settings Preset Schema remains 1, Cloud Sync remains v201, Personal Order export remains v4.
- Full Data Export/Import and Automatic Backup continue through the current full-backup pipeline; History CSV remains the richer v232 exporter.

## v241 integrity additions
- History view filters are transient UI state and do not mutate account/history records.
- Library History pagination changes rendering only; activityLog remains part of canonical cloud/full-backup state.
- Logged cover fallback is presentation-only and never writes the category icon into a title's `coverUrl`.
- v241 Library indexes are derived caches and are rebuilt after Library cache invalidation; they are not exported/synced.

## v242 integrity additions
- Logged-title artwork buttons must remain free of the generic v225/v226 action icon while preserving Title Details click-through.
- **Last progress** and contextual **Last watched/read** labels must remain at least 11px in the focused UI regression.
- Logging candidate search caches/indexes are derived runtime data only and must never be exported or synchronized.
- Opening the collapsible Dashboard logging Library pre-warms the logging index during idle time; it must not block the initial logging render.
- History toolbar reorganization is presentation-only; History records, custom date filters, category filters, pagination, and CSV export semantics remain unchanged.
- Full Backup remains Schema v29, Settings Preset remains Schema v1, Cloud Sync remains v201, and Personal Order export remains format v4.
