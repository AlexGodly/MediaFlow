# MediaFlow v363 — Personal Order Desktop & Mobile Workspace, Queue Tools and Navigation Performance

**Release:** v363  
**Baseline:** v362 Personal Edition Modular  
**Date:** October 10, 2026  
**Developer:** Alex Godly

---

## 1. One organized Personal Order workspace

- Reorganized the Personal Order navigation around a compact, shared desktop/mobile quick toolbar.
- **Lists**, **Tabs**, **Category Display**, and **Queue Tools** are accessible from the workspace instead of being separated across several oversized settings cards.
- Preserved the existing meaningful single-icon button system (no new generic action symbols).
- Moved live, already-wired controls into the redesigned workspace instead of creating alternate copies that could drift from saved settings.
- The old oversized Queue Layout panel is suppressed in favor of the functional quick toolbar.
- The actual ordered content can take the full width of the Personal Order workspace; the formerly narrow hidden picker sidebar no longer reserves a large desktop column.

## 2. Mobile: functional Queue Tools and missing options restored

- **Show queue tools / Hide queue tools** now expands and collapses a real Queue Tools section on mobile rather than pressing a button that reveals nothing.
- The panel contains the original working controls for:
  - first section: Category/title queues first or Collection queues first;
  - section visibility: Category/title queues and Collection queues;
  - show assigned Collections inside category queues;
  - Collection cover-size settings and covers for titles inside Collections;
  - ordered-title pagination on/off, page size, and ordered title cover size (when the tabbed controls apply).
- Controls are not duplicated. They still delegate to the same Personal Order settings/action handlers used on desktop.
- The panel is collapsed initially to keep real queues in view and works on phones and tablets.

## 3. Mobile Add Titles: advanced controls move inside Filters & Sorting

- On mobile/tablet (up to 1023 CSS px), moved the **actual** Add Titles text-size slider, cover-size slider, and Titles-per-page selector into the existing Filters & Sorting disclosure.
- When collapsed, the five display-mode buttons, Library search, results, pagination and add/selection footer remain accessible.
- When expanded, the original three controls appear alongside filters and sorting.
- Desktop controls retain their normal wider positions; changing browser width returns original controls without cloning them.
- Existing five Add Titles views, saved sizes, selected titles and 10/25/50/100/200/500 pagination remain unchanged.

## 4. Clean Personal Order filter show/hide behavior

- The Personal Order browse-filter toggle now explicitly reads **Show filters & sorting** or **Hide filters & sorting** depending on state.
- Removed the unrelated circular action icon from this toggle.
- Removed the standalone **Reset** button from the Personal Order filter toolbars on desktop and mobile.
- Excluded these controls from the legacy automatic button-icon injection path.
- Preserved the actual status, category, priority, search, direction and sorting operations.

## 5. Desktop Lists: full-width, configurable multi-column layout

- Added **Lists per row: 1, 2, 3, or 4** for the desktop **Lists → By Category** view.
- The chosen count is saved as `settings.v363PersonalOrder.listColumns` through the existing settings persistence system.
- Columns adapt to narrower desktop widths to protect readability and prevent horizontal overflow.
- Existing category sequence and saved title/Collection queue positions are not reordered by changing columns.
- Made category title rows more compact inside multi-column cards; moved actions onto their own line where needed so labels and covers do not collide.
- Kept **All Titles** in its canonical global sequence, not a multi-column queue reorder.
- Recovered the desktop **Category Display** button in both Lists and Tabs modes.

## 6. Desktop Lists and Tabs: compact Queue Tools

- Replaced the scattered large Queue Layout, Queue Display, and separated paging blocks with a single expandable **Queue Tools** section.
- Lists and Tabs have the same entry points while exposing only relevant live controls.
- Restored the original ordered-title pagination and cover controls within Lists Queue Tools, rather than accidentally losing them while hiding the old toolbar.
- Restored Tabs mode's first-section and visibility controls inside the new Queue Tools container, overriding a legacy rule that hid them.
- Kept **Category Titles** / **Collection Queues** immediately available in Tabs mode, with the category tab strip directly above the selected queue.
- Reduced redundant explanatory space and kept the real category/Collection content full width.

## 7. Navigation and queue-settings responsiveness

- Category Titles / Collection Queues navigation now updates only the relevant tab strip and active queue panel rather than completely rebuilding Personal Order, all pickers and the advanced settings.
- Choosing a category tab replaces only the active category's visible content instead of invoking an entire application render.
- Lists/Tabs, All Titles/By Category, and queue visibility/section controls now update the visual state **before** scheduling persistence rather than waiting for cloud/storage saves first.
- First-section switching in Lists can reorder the existing DOM sections in place without rebuilding their title rows.
- Display-state writes are debounced and serialized to avoid rapid older writes completing after newer settings.
- No modification to MediaFlow's canonical title/Collection ordering or XP award algorithms.

### Synthetic large-library timing measurements

Chromium tests with **30,000** and **50,000** Library entries, a 100-item Personal Order, two categories and one Collection assignment measured:

| Synthetic Library size | Initial Personal Order HTML generation | 10 Category/Collection tab switches |
|---|---:|---:|
| 30,000 | ~241 ms | ~18 ms |
| 50,000 | ~350 ms | ~19 ms |

These are **single-run local measurements**, not guarantees for deployed accounts or phones. Full initial rendering still has nonzero work; the strongest optimization applies to switching between the two tab families.

## 8. Files changed

- New runtime module: `src/js/components/261-v363-personal-order-workspace-performance.js`
- New theme-aware stylesheet: `assets/css/189-v363-personal-order-workspace-performance.css`
- New compiled bundle: `assets/js/mediaflow-v363.bundle.js`
- New browser regression: `tests/test-v363-workspace.py`
- New large-Library benchmark: `tests/test-v363-performance.py`
- Updated multi-page and XP regression tests: `tests/test-v363-all-pages.py`, `tests/test-v363-xp-regression.py`
- Updated `src/js/runtime-order.json`, `index.html`, `VERSION`, `package.json`, `version.json`, `sw.js`, and `README.md`.
- PWA cache: **`mediaflow-pwa-v363-shell-v1`**.

## 9. Verification

- Compiled JavaScript syntax and release consistency checks passed.
- Actual compiled UI tests passed at **320, 390, 820, 1280 and 1920 CSS px**: Queue Tools visibility, category-tab switching, Category Display access, Add Titles mobile control relocation, desktop Lists-per-row and absence of horizontal overflow.
- Synthetic 30k/50k title benchmark completed with no reported page errors.
- Ten application page families passed responsive checks across **twelve viewport widths** from 320–1440px.
- XP award / streak breakdown regression passed with existing totals unchanged.
- ZIP archive integrity is checked during packaging.

**Not independently tested:** live authenticated Supabase synchronization, GitHub Pages production deployment, actual Android/iPhone devices, and installed PWA update behavior. Test those with a Full Backup after deployment.

## 10. Data and backend compatibility

| Component | Compatibility |
|---|---|
| Cloud Sync | v201, unchanged |
| Full Backup | Schema 29, unchanged |
| Settings Presets | Schema 1, unchanged |
| Personal Order imports/exports | Format 5, unchanged |
| Collections imports/exports | Format 2, unchanged |
| XP and universal streak multipliers | Preserved |
| Supabase SQL migration | **Not required** |

---

**v362:** Add Collections mobile card/gallery and collapsible controls.  
**v363:** Organized desktop and mobile Personal Order workspace, working mobile Queue Tools, desktop multi-column category lists, searchable/visible Category Display access, collapsible Add Titles advanced controls, and faster queue switching.

**Deployment:** Upload the whole v363 modular release, refresh the PWA, confirm the version, and verify Sync Now using an up-to-date Full Backup.
