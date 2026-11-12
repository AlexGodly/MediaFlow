# MediaFlow v350 — Mobile & Tablet UI/UX Redesign

**Base:** MediaFlow v349 Modular  
**Release date:** October 10, 2026  
**Creator:** Alex Godly  
**Edition:** Personal Edition

---

## 1. Dedicated narrow-screen presentation

MediaFlow v350 adds an adaptive mobile/tablet presentation layer based on **210 user-provided phone screenshots covering 12 page folders**. Those screenshots have a 1080 × 2400 pixel image size; this is *not* assumed to be the browser's CSS viewport width.

- New mobile/tablet CSS applies **only below 1024 CSS pixels**. Desktop layouts at and above 1024 CSS pixels are intentionally left unchanged.
- New presentation logic activates only in the same mobile/tablet width range. It manages temporary toolbar disclosure states without modifying data or the desktop settings.
- The user’s dynamic MediaFlow themes remain the source of surface, border, foreground, and accent colors.
- Mobile touch controls, padding, button wrapping, navigation strips, dialog sizes and input sizing have been revised.
- Native phone and tablet sizes are handled by viewport constraints rather than specific device models or user-agent strings. This supports Android browsers/PWAs, iPhones and narrower tablets.

## 2. Library: title-first mobile layout

- Added a mobile-only **Library tools** Show/Hide control.
- Advanced display, selection and layout options can be folded away, saving vertical space before the Library entries.
- The original desktop Library Tools preference is not modified when using the mobile disclosure.
- The user’s existing category and status controls remain available above titles when advanced tools are closed.
- The compact category/status strips can scroll horizontally on narrow screens rather than shrinking every category label.
- On small screens the duplicate overview bulk-action bar can be hidden while the advanced Library Tools panel is closed, and restored by reopening it.
- Improved the Library search row, filter chips, title view controls, pagination and cover-setting labels to resist layout overflow.
- Normal and Dynamic Library modes, title actions, drag ordering, selection, status, priority, categories, sorting, overlays and existing cover sizes are preserved.

## 3. Personal Order: compact queue navigation

- The Lists/Tabs selector stays visible while advanced queue layout tools can fold under **View & queue options** on mobile.
- Existing **Category Titles** and **Collection Queues** main tabs are preserved.
- Category sub-tabs can scroll horizontally without clipping the page.
- Reduced whitespace around queue navigation, names, counters, category tabs, and queue displays.
- Improved available space for reorder buttons, title/Collection queue actions, pagination and cover-size controls.
- The seven action XP rewards introduced in v348 remain intact; no ordering records or assigned Collection positions are changed by the mobile disclosure.

## 4. Collections: compact browser controls

- **Collections remains a dedicated Collections browser**; the misplaced v345 Collections Lists/Tabs selector does not return.
- Search remains accessible while secondary Collection sort/view controls move under a mobile **Filters & views** disclosure.
- Existing controls are moved in the DOM only while the narrow layout is active; their event handlers and values are retained.
- Returning to desktop width restores the original Collections toolbar elements to their original layout.
- Collection detail tool groups gain a compact **Collection tools** disclosure.
- Improved Collection search, selection, cover view switch, hero actions, list rows, and dialog sizes.
- Creating, editing, adding/removing titles, importing/exporting, and opening Collections remain available.

## 5. History: mobile content area recovered

- On phone/tablet widths, History’s tab navigation is **not sticky**; it scrolls with the rest of the page.
- History tabs use a horizontally scrollable row, retaining readable names rather than clipping labels.
- Added mobile **History filters & tools** Show/Hide disclosure.
- Reduced spacing for consumption records, Recently Viewed entries, Library History, and v348 XP History.
- Improved History pagination and filter wrapping at narrow widths.
- The v349 initial History scroll-to-top navigation fix remains in place.
- Desktop sticky History controls remain unchanged.

## 6. Settings: readable, discoverable controls

- The Settings search/action toolbar uses one narrow-screen column.
- Settings section navigation changes to a horizontal, naturally scrolling tab row for phones and tablets.
- Settings groups/cards get tighter spacing, without removing sections.
- **Reset** actions resist shrinking into vertical one-letter-wide text.
- Field labels, input rows, switches, selectors, button groups, numeric XP settings and supporting descriptions wrap at sensible word boundaries.
- All v348 Leveling & XP settings and the universal streak multiplier remain present in the actual Settings renderer.
- No settings-export or settings-import schema changes are needed: v350 adds presentation state, not new account preferences.

## 7. Dashboard, Statistics and Batch Log

### Dashboard
- Tightened mobile Today summary, recommendation, Stopwatch, Runtime Calculator, Rate Your Library, Missing Covers and related cards.
- Balanced Today summary rows on supported narrow widths, preserving the underlying values and controls.
- Improved mobile action-row wrapping and interactive numeric inputs.

### Statistics
- Reflowed common metric/card grids for limited width.
- Improved charts, record labels, category/timeline cards, profile summary, and Active Time Spent panels to prevent sideways document overflow.
- Kept Statistics XP, sessions, active-time calculations, category balance, and previously configured charts unchanged.

### Batch Log
- More usable title search and keyboard-safe form input sizing on mobile.
- Separate Amount and Minutes fields into a responsive two-column row when possible.
- Compact selected-title detail blocks and action rows.
- Log batch, Add title, Remove title, Notes, Date and existing XP rewards remain available.

## 8. Account, About, Old System and dialogs

- Account forms and long action labels gain mobile shrink/wrapping protection.
- About cards, update/diagnostic areas and links receive compact responsive spacing.
- Old System tabs can scroll horizontally; balance/category grids adapt to small widths.
- Modals and editing panels are constrained by available viewport height and safe areas, with internal scrolling.
- Input font size increases in mobile dialogs to reduce unintended iOS Safari zoom.
- Bottom navigation/dialog containers account for supported `safe-area-inset-bottom` behavior.

## 9. Desktop compatibility

- All v350 CSS selectors are within `@media screen and (max-width:1023px)` or narrower width constraints.
- The new mobile runtime checks that same breakpoint before inserting controls or rearranging a Collection toolbar.
- On transition back to desktop width, transient mobile buttons and layout classes are removed and the original Collection toolbar DOM ordering is restored.
- This release has **no intentional desktop visual changes**. Desktop tests are synthetic rendering/smoke checks rather than an exhaustive pixel-by-pixel comparison against the live v349 website.

## 10. Cloud, XP, backups and PWA

This release changes layout/presentation only. It does not alter the stored MediaFlow data model or any calculation algorithms.

| Component | Compatibility |
|---|---|
| Cloud Sync | Version 201, unchanged |
| Full Backup | Schema 29, unchanged |
| Settings Preset | Schema 1, unchanged |
| Personal Order | Export format 5, unchanged |
| Collections | Export format 2, unchanged |
| XP and streaks | v348 systems preserved |
| XP History | Preserved |
| Sync Now, automatic backups, all imports/exports | Existing workflow preserved |
| Supabase SQL migration | **Not required** |

The v350 application shell cache was regenerated as **`mediaflow-pwa-v350-shell-v1`**, and `sw.js` references the current v350 bundle, stylesheet and other current assets. Existing PWA update checks/automatic update flows are retained; live PWA deployment/update installation was not tested.

## 11. Release files

- `src/js/components/248-v350-mobile-adaptive-ui.js` — mobile disclosure and viewport restoration logic.
- `assets/css/176-v350-mobile-native-layout.css` — exclusively narrow/tablet responsive styles.
- `assets/js/mediaflow-v350.bundle.js` — compiled release bundle.
- `tests/test-v350-responsive.py` — mobile panel, history stickiness, desktop controls and overflow checks.
- `tests/test-v350-all-pages.py` — broader page-family/viewport smoke coverage.
- `docs/MOBILE_AUDIT_v350.md` — original screenshot review and requirements.
- `VERSION`, `version.json`, `package.json`, `index.html`, `README.md`, `sw.js` and the PWA manifest are updated for the release.

## 12. Verification

Local tests completed successfully:

- v350 mobile/adaptive UI interactions at 320, 390, 820, 1024 and 1280 CSS pixels.
- Multi-page browser smoke test at **320, 360, 375, 390, 412, 430, 600, 768, 820, 1024, 1280 and 1440** CSS pixels, exercising Dashboard, Library, Personal Order, Collections, History, Statistics, Settings, Batch Log, About and Old System renderers with synthetic state.
- No document-width overflow and no browser page exceptions in those smoke tests.
- Desktop-width smoke checks: no v350 mobile disclosure buttons added.
- v349 initial History scroll behavior regression.
- v348 XP History/settings regression.
- v348 action XP/account progression regression.
- v347 Collections/Personal Order separation regression.
- JavaScript syntax and PWA reference generation.
- ZIP file integrity test.

**Verification limits:** The user’s authenticated cloud data, Android/iOS physical devices, exact phone CSS viewport/DPR, and live deployed GitHub Pages/PWA behavior were not available to verify. Browser emulation does not replace testing on the user’s phone. Some complex screens may benefit from follow-up real-device feedback.

---

## Version progression

**v347** — Collections browser restored; queue tabs kept in Personal Order.  
**v348** — Universal streak-multiplied XP, seven action rewards and XP History.  
**v349** — History initial navigation scroll-to-top fix.  
**v350** — **Mobile and tablet-focused MediaFlow presentation overhaul, compact page tools, improved phone typography/layouts, naturally scrolling mobile History tools, and desktop preservation.**

**Release note:** No Supabase SQL migration is required. Preserve a backup of your live data before deploying a new web/PWA release.
