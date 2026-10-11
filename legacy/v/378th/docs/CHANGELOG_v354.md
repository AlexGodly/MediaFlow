# MediaFlow v354 — Personal Order Quick Workspace, Filters & Collection Assignment

**Release:** 354  
**Base:** MediaFlow v353 Modular  
**Date:** October 10, 2026  
**Created by:** Alex Godly  
**Edition:** Personal Edition

---

## 1. Personal Order — Immediate Actions & Navigation

- Added a **Personal Order quick workspace** near the top of the page, based on the accepted interactive mobile prototype.
- Added direct **Add title** and **Add Collection** actions that open the existing, functional Personal Order pickers in an accessible popup/bottom sheet.
- Added direct **Lists / Tabs**, **Category display**, and **Queue tools** navigation.
- **Mobile:** the existing Personal Order note, distant add-title sidebar, and duplicate queue switches are no longer allowed to push the actionable content far down the page.
- **Desktop:** existing Personal Order page structure remains available, with compact additional quick actions and advanced browsing tools. Desktop is intentionally included in this release's improvements.
- The quick-add sheets reuse existing title selection and Collection assignment handlers, including their normal persistence and XP paths, rather than duplicating data operations.

## 2. Category Titles — Search, Filters & Sorting

Added browsing controls to Personal Order for both **Lists** and **Tabs** layouts:

- Live title search.
- **Searchable category filter** with the existing MediaFlow category icons.
- Status filter.
- Priority filter.
- Sort by saved queue position, title name, priority, status, rating, or progress.
- Ascending/descending presentation order.
- Reset browsing filters.
- Existing category tabs and Personal Order visibility remain respected.
- Search and filters affect only the displayed items; neither search nor sorting writes a new Personal Order sequence.
- When viewing a sorted representation rather than the saved queue order, move/reorder controls are visually disabled to avoid implying that the display sort is the underlying saved order.

## 3. Collection Queues — Independent Filters & Sorting

The **Collection Queues** tab now has its own browsing controls, independent from Category Titles:

- Search Collection names/descriptions and direct-title entries.
- Searchable category selection.
- Status and priority filters.
- Sorting by saved queue order, name, Collection size, priority, status, or rating.
- Ascending/descending sorting.
- Original queue position labels are retained in sorted and filtered results.
- Paging applies to filtered results where pagination is enabled.
- Canonical queue tokens, assignment rules, progress, and save timestamps are not modified by browsing.

## 4. Settings-Based Category & Priority Ordering

- Category filter options now follow **Settings → Popup & Filtering Options → Category Filter**, including inherited ordering and visibility.
- Priority filter options follow **Priority Filter**, including inheritance from Set Priority when configured.
- Status filter options follow the configured Status Filter ordering.
- Category tabs continue following MediaFlow's existing Personal Order category-order setting; the new filter dropdowns use their matching **filter** configuration.
- The Add Titles picker category options are now searchable and ordered by MediaFlow's configured Category Filter arrangement.
- Priority choices in the Add Titles picker use the app's configured priority-filter order.
- Built-in and custom category icons are retained.

## 5. Add Collection — Searchable Assignment Category & Collection Browser

- Added a **searchable Assign Collection to category** selector using the configured **Set Category** order.
- Users can assign a Collection directly to the selected task category, including categories reached through search.
- Added filters over Collection contents by title category and priority.
- Added Collection sorting by name, number of titles, and last edited timestamp, with ascending/descending choice.
- The existing Collection search remains available.
- Mobile Collection filters/sorting can be expanded when needed; assignment category and search remain visible.
- Assignment addition still uses `App.v287AddCollectionAssignment` and existing duplicate-assignment safeguards.

## 6. Mobile & Tablet UI

- The main quick actions appear before the title/Collection queue content.
- Category navigation, search, and the category picker remain near the top.
- Advanced status/priority/sort controls collapse beneath a **Filters & sort** action on narrower screens.
- Add Title, Add Collection, and Category Display open mobile-friendly bottom sheets.
- The existing mobile bottom navigation remains unchanged; the sheets account for mobile safe-area insets.
- Desktop quick actions use a compact inline layout rather than introducing duplicate page headings and Lists/Tabs controls.
- Existing dynamic themes, native category artwork, typography choices, and controls are reused.

## 7. Data Persistence & Compatibility

- Per-view browsing preferences are stored in the existing Settings JSON at `settings.v354OrderBrowse` and use the existing settings-save mechanism.
- Search typing uses responsive in-page updates rather than a complete page rebuild on every keystroke.
- Collection picker auxiliary filters remain temporary browsing controls.
- No new Supabase tables, policies, or SQL migrations are needed.
- **Cloud Sync:** 201 (unchanged).
- **Full Backup Schema:** 29 (unchanged).
- **Settings Preset Schema:** 1 (unchanged).
- **Personal Order Export Format:** 5 (unchanged).
- **Collections Export Format:** 2 (unchanged).
- Existing XP awards, streak multipliers, XP History, automatic backups, cloud data and import/export pipelines are not intentionally altered.

## 8. Release Files, PWA & Update Metadata

- New runtime: `src/js/components/252-v354-personal-order-quick-workspace.js`.
- New stylesheet: `assets/css/180-v354-personal-order-quick-workspace.css`.
- Compiled bundle: `assets/js/mediaflow-v354.bundle.js`.
- Added targeted browser tests: `tests/test-v354-personal-order.py` and `tests/test-v354-lists-sorting.py`.
- Added cross-page, XP and existing Add Titles picker regression tests targeting the v354 compiled bundle.
- Updated `VERSION`, `version.json`, `package.json`, `index.html`, and application documentation.
- Regenerated `sw.js` and the **`mediaflow-pwa-v354-shell-v1`** cache manifest.
- Existing automatic update checks and installed-PWA update workflow are preserved.

## 9. Local Verification

Passed with the compiled v354 bundle:

- Mobile quick actions and Add Title/Collection popup interaction.
- Category-filter search, option visibility and configured category order.
- Priority option ordering from Settings.
- Searchable Collection assignment category and configured Set Category ordering.
- Collection browser filtering and sorting.
- Category Titles and Collection Queues filtering on desktop and mobile.
- Lists-mode filtering/sorting and Category Display popup.
- Saved queue positions unchanged when viewing reordered results.
- Viewport-specific tests at 320, 390, 820 and 1280 CSS px.
- Cross-page smoke tests on ten page families across 12 widths (320–1440 CSS px).
- Existing Collection and Personal Order action-XP regression, including XP breakdown equality.
- v353 Collections Add Titles picker regression across eight widths.
- JavaScript syntax, PWA asset generation, release metadata and ZIP integrity checks.

**Verification limitations:** These are local browser/synthetic-state tests. Authenticated remote Supabase readback, GitHub Pages deployment, physical-device testing and real installed-PWA updating are not independently confirmed.

---

## Version Progression

**v351:** Mobile layout regression repairs.  
**v352:** Add Titles picker view modes, cover/text sizing and readability.  
**v353:** Collapsible mobile Collection Add Titles tools.  
**v354:** **Personal Order quick actions, mobile bottom sheets, desktop/mobile title and Collection queue filtering/sorting, searchable Settings-ordered category selectors, and Collection assignment improvements.**

**Deployment:** Retain a Full Backup, deploy all v354 assets together, allow the PWA cache to update, and run Sync Now on the deployed app to verify live cloud synchronization.
