# MediaFlow v399 — Picker Workspace Refinements

**Version:** v399 Modular  
**Baseline:** MediaFlow v398 Modular  
**Release Date:** October 13, 2026  
**Developer:** Alex Godly  
**Focus:** Personal Order and Collections picker UX, numeric pagination, distinct card display modes, compact responsive browsing  
**Database Migration:** None

## 1. Personal Order — Add Titles

### Mobile and tablet
- Reduced toolbar occupancy and kept the results scroll area usable with five independently styled display modes.
- **List:** spacious full-width rows with Library metadata and actions.
- **Compact:** substantially denser rows with smaller proportional covers, single-line title and metadata summaries, and short in-row Add/Added actions.
- **Cards:** actual adaptive multi-column tiles, rather than a reskinned single-column List, with a centered cover, readable clamped title and metadata, and a button footer.
- **Covers:** proportional image gallery rather than a tall row layout.
- **Covers+Titles:** gallery with readable clamped title labels and Add/Added controls.
- Moved the **existing** text-size slider and cover-size slider, plus new **numeric Titles per page**, inside the expandable Filters & Sorting section on phones and tablets. Native DOM nodes are moved and restored on viewport changes so the original handlers remain effective.
- Preserved **Direct Add and Multi-Select outside Filters & Sorting**.

### Desktop
- Existing popup screens, candidate rendering and actions remain unchanged beyond the approved new controls.
- The browsing area now has an editable **numeric Titles per page** field; the two existing **Text size** and **Cover size** controls remain in the display toolbar. The page-size control sits in the browsing header alongside the results summary.
- Numeric title page-size values accept whole numbers from 1 through 1000. Invalid entries are rejected rather than silently changing page length.

## 2. Personal Order — Add Collections

### Desktop sidebar correction
- Constrained the category, introduction, search field and filter area to content-sized grid tracks.
- Corrected the unexpectedly tall search input and empty vertical gaps that appeared on first opening before search/filter interaction.
- Preserved existing right-side collection results, view options, assignments, page sizes, and selection buttons.

### Mobile and tablet page size
- Provided minimum widths and internal padding for the existing native Collections per page selector.
- Kept complete selected values and all existing options (10, 25, 50, 100, 200, 500) legible while maintaining the responsive filter-panel placement.

## 3. Collections — Add Titles

### Mobile/tablet tools panel
- Search remains directly accessible above title results.
- Reorganized all other controls into one collapsible **Tools & Filters** disclosure: category/status/priority/rating filters, sorting, display mode, text/cover adjustments, the new editable numeric title page-size, and **Direct Add / Multi-Select**.
- Collapsed by default on narrower devices, yielding substantially more results space when browsing.
- These mode controls are inside the Tools disclosure **only for Collections → Add Titles**, not for the Personal Order title picker.

### Mobile Cards and Compact
- Cards displays true tiles with appropriately sized posters, clamped title/metadata and full-card Add/Added actions.
- Compact uses significantly shorter, denser rows with small art and inline actions.
- Other modes retain their own poster/row layouts.

### Desktop sidebar + results
- Added a two-region desktop arrangement: scrolling left-hand tool sidebar and right-hand title results with a separated footer.
- Search, filters, sorting, display modes, direct/multi switching, text/cover sliders and per-page numeric setting use the existing handlers.
- The right results pane preserves selection, Add/Added toggling, title filtering, scrolling and pagination.

### Numeric Collection title pagination
- Configurable `S.settings.v399CollectionAddPageSize` supports 1–1000 titles/page (default: 24).
- Uses `v274AddCandidates` for matching/sorted candidates and `v276AddData` for page slicing, retaining `v392` instant add and multi-selection semantics.
- Select Visible uses the currently visible page, including custom page length.
- Changing page size resets to page 1 but preserves selection state.

## 4. Preservation and compatibility

The update does not introduce new database tables or modify MediaFlow's Library, Logging, Advanced Logging, History, XP, task recommendation, personal queue or cloud synchronization formats. Existing direct-add and reversible Added operations are reused. Theme colors come from MediaFlow's active theme variables.

## 5. Technical files

| File | Change |
|---|---|
| `src/js/components/291-v399-picker-workspaces.js` | Numeric page controls, responsive tool placement, Collection picker composition |
| `src/js/runtime-order.json` | Registers v399 module last |
| `assets/css/212-v399-picker-workspaces.css` | Mobile/tablet modes, desktop sidebar, picker spacing and numeric form styling |
| `assets/js/mediaflow-v399.bundle.js` | Rebuilt application bundle |
| `index.html`, `sw.js`, `VERSION`, `version.json`, `package.json` | Release metadata, CSS and app-shell cache |
| `scripts/test-v399-picker-workspaces.py` | Targeted interactive browser assertions |
| `scripts/test-v399-*.py` | Regression entry points using the v399 bundle |
| `README.md`, `README2.md`, `docs/CHANGELOG_v399.md` | Release documentation |

## 6. Verification

| Check | Result |
|---|---|
| Modular build, JS syntax and PWA local asset list | Passed |
| Targeted v399 workspace scenarios at 320, 390, 430, 820, 1023, 1280, 1920px | Passed |
| v398 responsive matrix carried over to v399 at 320, 375, 430, 768, 820, 1023, 1280px | Passed |
| Three pickers × five display modes within the responsive matrix | Passed |
| v392/v393 instant-add and multi-select regressions at 390, 1280px | Passed |
| v397 task progress and floating Quick Actions regressions | Passed |
| Advanced Logging rendering regressions through 1920px | Passed |
| Full long-running combined save/dashboard runner | Inconclusive: emitted scenario passes but subsequently timed out |
| Production cloud/physical device/100k-title stress tests | Not performed |

The browser tests used synthetic offline state and Chromium; no production Supabase credentials or user data were used.

## 7. Version evolution

| Version | Focus |
|---|---|
| v394 | Advanced Logging overhaul |
| v395 | Recommended Title redesign |
| v396 | Unified progress and ordering reliability |
| v397 | Floating Task Progress and Quick Actions |
| v398 | Mobile and tablet UI repair across seven areas |
| **v399** | **Picker workspaces, distinct modes, and numeric per-page controls** |

## Final summary

MediaFlow v399 improves title browsing in Collections and Personal Order with clearly differentiated List/Compact/Cards/Covers/Covers+Titles modes on smaller devices, relocates controls into the user-requested sections, adds numeric page lengths, and corrects the desktop Add Collections sidebar layout defect. It preserves established selection and saving behavior and does not require a database migration.
