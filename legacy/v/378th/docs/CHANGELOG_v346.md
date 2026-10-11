# MediaFlow v346 — Queue Tab Icons & Tabs Mode Display Controls

**Release:** MediaFlow v346  
**Base:** MediaFlow v345 Modular  
**Created by:** Alex Godly  
**Release Date:** October 9, 2026

---

## 1. Category tabs — unwanted duplicate icons removed

### Extra generic circular icons removed
Removed the unrelated circular arrow/action icon that appeared immediately before the actual category icon in the **Category Titles** and **Collection Queues** category tabs.

Each category tab now shows **only its own MediaFlow category icon**, followed by the category name and entry count.

### Underlying cause fixed
The extra icon was being inserted by the app-wide v225/v226 button-icon enhancement passes. v346 exempts the new queue tab controls from those decorators instead of only hiding the resulting icon through CSS.

### Existing category icons preserved
Custom and built-in category icons are still displayed from the existing category-icon system.

### Category names, counts and ordering preserved
Category names, tab counts and both configured category-ordering modes remain unchanged.

---

## 2. Main tab icons improved

### Category Titles icon updated
Replaced the generic circular action icon in the **Category Titles** main tab with a book/list icon that represents individually ordered media titles.

### Collection Queues icon updated
Replaced the generic circular action icon in the **Collection Queues** main tab with a folder/queue icon that represents assigned Collections.

### Duplicate decoration prevented
The main tab buttons no longer receive an unrelated extra icon from the global button decorators.

### Existing two-tab structure preserved
The tabs still switch between Category Titles and Collection Queues, each with its own category sub-tabs and ordered content.

---

## 3. Tabs Mode — Paginate Ordered Titles added

### Pagination toggle now available in Tabs mode
The **Paginate ordered titles** toggle is now visible in the Tabs view, both in **Personal Order** and in the queue workspace of **Collections**.

### Canonical pagination setting reused
The new control operates on the existing `orderPlan.paginateOrderedTitles` setting. It does not create a separate pagination preference for Tabs.

### Immediate interface updates
Switching pagination on or off updates the rendered tab queue and uses the current saved page size.

### Existing Lists mode preserved
The normal Lists interface retains its original pagination controls and behavior.

---

## 4. Tabs Mode — Ordered Titles Per Page added

### Page-size field now available
Added an **Ordered titles per page** numerical setting directly inside the Tabs workspace.

### Same setting across Lists and Tabs
The field reads and updates the existing `orderPlan.orderedPageSize` value.

### Existing validation reused
Page-size changes use MediaFlow's existing validation and page-size limits.

### Pagination position reset handled
Changing the page-size setting uses the normal Personal Order page reset behavior.

---

## 5. Tabs Mode — Cover Size added

### Cover-size slider added
Added the existing **Cover size** control to the tabbed queue workspace.

### Cover-size numeric input added
The cover-size slider is paired with the existing numerical size field, matching the established Personal Order control.

### Shared cover-size setting preserved
The control reads and updates MediaFlow's existing order-cover sizing setting. A separate Tabs-only cover preference is not introduced.

### Live cover-size changes preserved
Moving the size control updates the order-cover scale through the existing cover-size preview system.

### Collections Tabs support added
The Collections tabbed workspace now has an explicit order-cover sizing scope, allowing its queue cover sizes to follow the same control.

### Dynamic themes preserved
The controls follow existing theme colors and surface variables.

---

## 6. Mixed Category Queues — Pagination fixed

### Mixed queues now respect pagination
When **Show assigned Collections in regular category queues** is enabled, Tabs mode now respects the pagination toggle and page-size value.

Previously, this mixed-queue branch rendered every title and Collection assignment even when pagination was on.

### Saved mixed order preserved
Titles and Collection assignments are paged in their existing mixed order, without changing canonical queue positions.

### Original position labels preserved
Moving between pages does not restart the underlying queue position indexes at 1 for every page.

### Previous / Next page navigation added
Mixed Category Titles tab views now show page navigation when more than one page is present.

---

## 7. Collection Queues — Pagination added

### Collection Queue tabs now respect the toggle
When pagination is on, category-specific Collection Queue tabs display only the configured number of queue entries per page.

### Direct titles and Collection assignments handled together
Collection Queue pages respect the existing mixed sequence of directly queued titles and Collection assignment blocks.

### Independent queue page state
Collection Queue tabs maintain view-local page positions, preventing collisions with Category Titles pagination state.

### Existing Collection actions preserved
The queue row renderer continues to provide existing actions for opening, moving and managing Collection assignments.

### Unpaginated behavior preserved
When ordered-title pagination is off, Collection Queues continue displaying the full queue.

---

## 8. Layout & responsive improvements

### Compact tool panel added to Tabs
The three controls are now grouped in a theme-aware toolbar between the main tabs and the category-tab content.

### Desktop layout
On wider screens, pagination, page-size and cover-size controls share a compact row when space permits.

### Tablet and mobile layout
Controls wrap into readable rows on narrower screens without forcing horizontal overflow.

### Accessibility
The new pagination toggle exposes its checked state; number inputs and the cover slider have meaningful accessible labels. Main and category tabs retain their existing selected-state semantics.

---

## 9. Existing MediaFlow behavior preserved

v346 is focused on queue UI and controls. It does not intentionally change:

- Library data, Normal/Dynamic Library modes, or Library display modes.
- Saved Personal Order title ordering.
- Category order or custom category order.
- Hidden category preferences.
- Collection membership, assignment or editing.
- Consumption History and Recently Viewed.
- Library History.
- Statistics and XP calculations.
- Cloud Sync, Sync Now and existing Supabase configuration.
- Automatic Backup and full-data transfer formats.
- Personal Order and Collections import/export versions.
- Existing PWA update controls.

---

## 10. Cloud and import/export compatibility

### No database migration required
The Tabs controls reuse existing saved settings and application state. No new Supabase table or SQL migration is needed.

### Existing formats preserved

| System | Version |
|---|---:|
| Cloud Sync | 201 |
| Full Backup Schema | 29 |
| Settings Preset Schema | 1 |
| Personal Order Export | 5 |
| Collections Export | 2 |

The new Collection Queue page number is view-local; it does not alter Collection data or the export format.

---

## 11. Runtime files and release metadata

### New runtime component
`src/js/components/243-v346-queue-tab-icons-controls.js`

### New stylesheet
`assets/css/173-v346-queue-tab-icons-controls.css`

### New regression tests
- `tests/test-v346-base-regression.py`
- `tests/test-v346-queue-controls.py`
- `tests/test-v346-large-library.py`

### JavaScript bundle updated
`assets/js/mediaflow-v346.bundle.js`

### VERSION and package version
`VERSION`: **346**  
`package.json`: **346.0.0**

### Entry point and version manifest updated
`index.html` references the current v346 JavaScript bundle and stylesheet; `version.json` reports version/build 346.

---

## 12. PWA update

### Application-shell cache updated
`mediaflow-pwa-v346-shell-v1`

### Service worker regenerated
`sw.js` includes the current JavaScript bundle and v346 stylesheet in the release asset list.

### Existing automatic updates preserved
The update adds no new PWA installation requirements; browser-dependent installation behavior remains unchanged.

---

## 13. Release verification

The following local checks passed:

- JavaScript syntax checking.
- Existing v345 Lists/Tabs and ordering regression tests, using the compiled v346 bundle.
- v346 main tab semantic icons.
- v346 absence of duplicate global category-tab icons.
- Pagination toggle and page-size controls in Tabs mode.
- Order-cover size control in Tabs mode.
- Mixed Category Titles pagination and page navigation.
- Collection Queue pagination and next-page navigation.
- Both Personal Order and Collections Tabs layouts.
- Large-Library tab performance smoke test (30,000 Library titles, 8,000 ordered titles).
- v334 XP reward regression.
- v339 cloud/backup/export integrity regression.
- Generated PWA references.

**Limitations:** These are local tests; v346 has not been deployed to GitHub Pages or tested against an authenticated live Supabase session.

---

# v346 Release Summary

### Main changes

- Removed extra circular action icons from category tabs.
- Kept original category icons and names.
- Replaced main tab icons with a title/book icon and Collection folder icon.
- Prevented repeated auto-icon injection at the global decorator layer.
- Added Paginate ordered titles toggle inside Tabs mode.
- Added Ordered titles per page inside Tabs mode.
- Added Cover size slider/numeric input inside Tabs mode.
- Supported both Collections and Personal Order tabbed workspaces.
- Added pagination to mixed category title/Collection queues.
- Added pagination to Collection Queues tabs.
- Preserved saved queue order, Collection assignments and shared settings.
- Updated versioning, bundle, stylesheet and PWA shell to v346.

## Version progression

**v343** → Recently Viewed title spacing and daypart icons.

**v344** → Recently Viewed generic icon and daypart icon removal.

**v345** → Lists / Tabs queue views for Collections and Personal Order.

**v346** → **Purposeful queue-tab icons, removal of duplicate category icons, and functional pagination, page-size and cover-size tools in Tabs mode.**

---

**Release note:** No Supabase migration is required. The new controls reuse MediaFlow's existing Personal Order and cover-size preferences.
