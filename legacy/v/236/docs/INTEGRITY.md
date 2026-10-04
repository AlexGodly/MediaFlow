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
