# MediaFlow v345 — Collections & Personal Order: Lists / Tabs Queue Views

**Release:** MediaFlow v345  
**Base:** MediaFlow v344 Modular  
**Created by:** Alex Godly  
**Release Date:** October 9, 2026

---

## 1. Collections — Lists / Tabs View Switch Added

Collections now provides a **Lists / Tabs** layout toggle at the top of its browser page.

### Lists mode preserved

Lists mode keeps the existing Collections browser, including:

- Collection cards, covers, compact/list/showcase styles and their existing display options.
- Collection search and sorting.
- Creating, opening, editing, importing and exporting Collections.
- Collection selection and batch management.

**Lists remains the default** until the user changes the layout preference.

### Tabs mode added

Tabs mode changes the Collections browser's central content into an ordered-queue explorer. It exposes two main tabs:

1. **Category titles** — the user's existing Personal Order titles grouped by their category and maintained in their saved order.
2. **Collection queues** — the existing Personal Order Collection assignments, grouped into their category queues.

These tabs display canonical queue data already managed by Personal Order; they do **not** invent new title/Collection ordering or alter underlying Collections.

The existing **Add collection / Export / Import** header actions are retained above the tab workspace.

### Switching back to Lists

The user can return from Tabs to Lists using the same toggle without losing the selected Collection browser display style or their Collections data.

---

## 2. Personal Order — Lists / Tabs View Switch Added

The Personal Order queue workspace also now contains a **Lists / Tabs** layout switch under Queue Display.

### Lists mode unchanged

The previous complete Personal Order layout is preserved, including:

- Category/title queues and Collection queue blocks.
- Existing visibility settings and section-order settings.
- Collection assignments and rule controls.
- Title ordering, reorder actions, queue positions and direct-title tools.
- Collection covers, expanded Collection title lists and cover-size settings.
- Existing picker and category-management functionality.

### Tabs mode added

Tabs mode replaces the long list of queue sections with a focused two-level interface:

- Top-level tab: **Category titles** or **Collection queues**.
- Nested tabs: one tab for each populated category in that queue section.

This allows the user to inspect or work on one category at a time without scrolling past every other category.

---

## 3. Main Tab — Category Titles

### Dedicated Category Titles main tab

The first main tab shows the direct Personal Order title sequence for the selected category.

### Individual category tabs

Each category appears as a selectable nested tab with:

- The category's configured MediaFlow icon.
- The category name.
- The number of ordered titles belonging to the category.

### Canonical title order preserved

Within each category, titles use the same saved Personal Order sequence used by the existing Lists view.

The tab layout is a different presentation of the same ordering, not a new or separate copy.

### Title ordering actions preserved

Existing title row actions, including position changes and removal from Personal Order, remain available.

### Optional Collection mirrors preserved

If **Also show assigned Collections inside category queues** is enabled, Collection blocks are shown in Category Titles tabs at their existing mixed queue positions.

### Existing ordered-title pagination preserved

When Personal Order's ordered-title pagination preference is enabled, its existing category paging controls continue to apply.

---

## 4. Main Tab — Collection Queues

### Dedicated Collection Queues main tab

The second main tab displays existing Personal Order Collection queue assignments.

### Category-specific Collection queue tabs

Each populated Collection queue category has a nested tab displaying:

- Category icon and name.
- Assignment count.
- Current queue positions.
- Assigned Collection blocks and direct titles in their original mixed order.

### Existing Collection queue controls preserved

The following remain available in Collection Queues tabs:

- Open assigned Collection.
- Show/hide its ordered titles.
- Category matching vs Force Queue rule.
- Skip completed vs Include completed rule.
- Move Collection position earlier/later.
- Reset assignment traversal progress when applicable.
- Remove assignment from the queue.

### Inner Collection title order preserved

Expanded title lists continue reading titles from the Collection's canonical ordered title IDs, including existing pagination and cover sizing.

---

## 5. Category Tab Order & Visibility

### Category order respected

Nested category tabs follow the same category sequence as Personal Order's existing category layout:

- **Settings category order** when the standard/default category-order mode is active.
- **Custom Personal Order category order** when custom ordering is active.

### Hidden categories respected

Categories hidden using Personal Order's category-visibility controls remain hidden from the tab strips.

### Populated category tabs

The Category Titles strip shows categories with ordered title content (or mirrored Collection assignments, when that option is enabled).

The Collection Queues strip shows categories containing assigned Collection queue blocks.

### Separate category selection per main tab

The current selected Category Titles tab and Collection Queues tab are maintained independently while navigating.

---

## 6. Navigation & UI

### Theme-aware design

The new tabs and layout switches follow MediaFlow's existing colors, surfaces, borders and typography, including dynamic themes.

### Responsive tabs

Nested category tabs scroll horizontally on narrower screens. They do not require the page itself to widen to fit all category names.

### Accessible tab state

Main and nested tab controls include selected-state metadata, and active tabs have clear visual styling.

### No unnecessary full-page render for tab selection

Changing the active main tab or category tab updates the active queue panel directly rather than rebuilding the entire MediaFlow page.

---

## 7. Performance: Large Libraries

### Single-category panel rendering

Tabs mode constructs and displays the selected category's queue content rather than rendering every category's full title list on screen at once.

### Reuse of indexed Personal Order state

The tab renderer reuses the existing indexed Personal Order title/category structure and holds a stable normalized plan during each synchronous tab draw.

### Avoid unnecessary hidden Lists rendering

When Personal Order is in Tabs mode, the original large Lists panels are not fully generated just to be thrown away when the tab UI replaces them.

### Synthetic large-data test

A local headless Chromium smoke test with **30,000 Library titles** and **8,000 ordered titles** recorded approximately:

- **0.19 seconds** to generate/render the tab layout.
- **0.06 seconds** to switch the selected category.

These are local synthetic timings, not guaranteed performance on every device or user dataset.

---

## 8. Saving, Cloud & Import/Export Compatibility

### View-mode preferences saved

The two layout preferences are stored with the existing Personal Order state under:

`orderPlan.v288QueueView.layoutMode` and `orderPlan.v288QueueView.collectionsBrowseMode`.

They are remembered by normal application state persistence, Cloud Sync and Full Backup.

### Existing Personal Order export/import updated automatically

The existing Personal Order export/import pathway includes both new preferences through the standard normalized `v288QueueView` data.

No new Personal Order export format is required.

### No data duplication or order migration

v345 reuses canonical Personal Order title sequences and existing Collection assignment queues.

Existing Collection records, title IDs and saved queue positions are preserved.

### Existing versions preserved

| Data system | Version |
|---|---:|
| Cloud Sync | 201 |
| Full Backup Schema | 29 |
| Settings Preset Schema | 1 |
| Personal Order Export | 5 |
| Collections Export | 2 |

### No Supabase migration required

The new preferences live in the existing cloud-synchronized JSON state. No SQL migration or new database table is required.

---

## 9. Release Files & PWA

### New runtime component

`src/js/components/242-v345-personal-order-list-tab-queues.js`

### New stylesheet

`assets/css/172-v345-personal-order-list-tab-queues.css`

### New browser regression tests

- `tests/test-v345-order-queue-tabs.py`
- `tests/test-v345-large-library.py`

### Active JavaScript bundle

`assets/js/mediaflow-v345.bundle.js`

### VERSION updated

**345**

### package.json updated

**345.0.0**

### version.json and index.html updated

The release identifiers, active bundle references and stylesheet links are aligned with v345.

### PWA cache updated

`mediaflow-pwa-v345-shell-v1`

The service worker was regenerated with the current v345 asset list.

---

## 10. Release Verification

The following checks passed locally:

- Compiled JavaScript bundle syntax.
- Existing Lists-mode section structure preserved.
- Personal Order two-level Tabs view.
- Collections browser Lists / Tabs switch.
- Correct Settings/custom category ordering.
- Title ordering maintained within Category Titles tabs.
- Collection assignment and mixed queue order maintained.
- Existing Collection queue action controls preserved in the tab panel.
- Main/category tab selection without a full page reload.
- View preference saving to canonical orderPlan state.
- View preference inclusion in Personal Order format-v5 export and normalization.
- Synthetic large-Library rendering and category switching.
- PWA shell generation for v345.

**Limitations:** Live GitHub Pages deployment, installed-PWA update behavior and authenticated Supabase synchronization were not independently tested during this local release.

---

# v345 Release Summary

- Added **Lists / Tabs** toggle to Collections browser.
- Added **Lists / Tabs** toggle to Personal Order queue workspace.
- Preserved the existing Lists interface.
- Added main tabs for Category Titles and Collection Queues.
- Added nested category tabs in canonical category order.
- Preserved direct-title order and mixed Collection queue positions.
- Preserved Collection actions and expanded title lists.
- Respected hidden categories and custom category ordering.
- Optimized tab rendering for large Libraries.
- Saved both layout preferences through the existing Personal Order state.
- Preserved Cloud Sync and export/import formats.
- Updated release metadata, active bundle and PWA cache to v345.

## Version progression

**v342** → Recently Viewed card and timeline polish.

**v343** → Recently Viewed spacing and daypart icons.

**v344** → Recently Viewed title and daypart icon cleanup.

**v345** → **Collections and Personal Order Lists/Tabs layouts, category-specific title/Collection queues and optimized tab navigation.**

---

**Migration note:** v345 requires no Supabase SQL migration. All existing ordered titles, Collection assignments and Collection data remain in their existing structures.
