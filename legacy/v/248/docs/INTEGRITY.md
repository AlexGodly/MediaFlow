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

## v243 integrity additions
- Logged titles with a valid cover render one visible artwork source; category artwork is hidden until an image-load failure/no-cover case.
- Logged artwork remains a Title Details button and is excluded from neutral button icons.
- Batch Log Category Filter popovers escape the browser-card clipping/stacking context while open.
- Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1 and Personal Order Export v4 remain unchanged.

## v244 PWA integrity additions
- `manifest.json` must keep project-relative `start_url` and `scope` so GitHub Pages `/MediaFlow/` hosting remains valid.
- 192×192, 512×512, maskable 512×512 and Apple touch icons must be local project assets.
- `sw.js` cache name must advance with `VERSION` and current local entry assets must be generated by `scripts/pwa.py`.
- Page navigation must remain network-first so installed clients do not become permanently pinned to an old cached `index.html`; cached `index.html` is the offline fallback only.
- `version.json` and `manifest.json` must remain network-first.
- Cross-origin Supabase/API/font/cover traffic must not be indiscriminately cached by the PWA app-shell worker.
- A new worker must not force an unexpected mid-session reload; explicit `SKIP_WAITING` / Reload update owns the handoff.
- `scripts/build.py` must continue invoking `scripts/pwa.py` so every future MediaFlow release updates the PWA cache and current asset list automatically.
- PWA install/update state is browser infrastructure only and must not create a new Library/cloud/full-backup/settings-preset schema.
- Compatibility remains Cloud Sync v201 / Full Backup Schema v29 / Settings Preset Schema v1 / Personal Order Export v4.


## v245 icon-branding integrity additions
- `favicon.ico` and `assets/icons/mediaflow.ico` must remain byte-identical canonical copies of the supplied Alex Godly ICO.
- Website favicon markup must reference root `favicon.ico` with a 32px PNG fallback.
- PWA manifest icons must remain local 192×192 / 512×512 / maskable 512×512 assets derived from the same logo.
- Apple touch icon must remain local and derived from the same supplied artwork.
- The versioned PWA app shell must cache the website favicon and PWA icon assets.
- v244 install/update/network-first behavior must remain unchanged.
- Compatibility remains Cloud Sync v201 / Full Backup Schema v29 / Settings Preset Schema v1 / Personal Order Export v4.

## v246 integrity
- PWA remains GitHub Pages-relative and version-generated through `scripts/pwa.py`.
- v245 icon assets remain canonical.
- No persistent-data schema changes.
- Responsive changes are CSS/runtime presentation only and do not alter Library/cloud/user data.

## v247 PWA reliability integrity additions
- PWA worker installation must not use an all-or-nothing `cache.addAll(APP_SHELL)` path that can reject the complete worker because one optional asset fails.
- Current app-shell misses must remain inspectable through the worker diagnostics API and retryable through cache repair.
- PWA diagnostics are operational/runtime metadata only and must never enter Library/cloud/full-backup/settings-preset user-data schemas.
- Diagnostics may fetch local generated app-shell URLs for validation but must not indiscriminately cache or probe unrelated cross-origin API/user content.
- Existing controlled update activation, GitHub Pages-relative scope, v245 icon identity and v246 responsive PWA behavior remain preserved.
