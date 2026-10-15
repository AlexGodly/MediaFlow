# MediaFlow v393 — Picker Workspace, Scroll Stability & Reversible Add / Added

**Release:** v393 Modular  
**Baseline:** MediaFlow v392 Modular  
**Date:** October 12, 2026  
**Developer:** Alex Godly  
**Delivery:** Standalone modular ZIP; no GitHub operations.

## 1. Collections — expanded Add Titles workspace

- Expanded the Add Titles popup to a viewport-adaptive, near-full-screen workspace (up to 1,640px wide on large displays) matching the spacious Personal Order experience.
- Kept a stable, independently scrollable title-results pane while retaining picker search, sorting, category/status/priority/rating filters, title display settings, paging and action buttons.
- Adapted width/height and spacing for desktop, tablet and mobile; dynamic themes remain supported.

## 2. Collections — stable Multi-Select scrolling

- Eliminated the original checkbox change handler's full `v274RefreshAddModal()` rebuild.
- Selection updates are performed in place: checkbox state, selected count, Deselect All, and Add Selected controls change without destroying the list or replacing the scroll container.
- Select Visible and Deselect All use the same stable update path.
- Existing List, Compact, Cards, Covers and Covers + Titles views are retained.
- Search, sort, category/status/priority/rating and current scroll position are not reset by checkbox selection.

## 3. Personal Order — edit scroll stability

- Wrapped the Edit Title open, save and close actions with viewport capture and restoration **when editing an existing title from Personal Order**.
- Preserves the document viewport and applicable independently scrollable category/queue panels when a render replaces underlying content.
- Includes Lists and Tabs presentations, including All Titles, By Category, category-title tabs and collection queue tabs.
- Prevents mouse-induced focus scrolling when clicking a Personal Order title's Edit button; keyboard activation still works.
- Restores position after normal save, Cancel/Close and overlay-driven dismissal. The browser can naturally change position if the edited item no longer belongs to the current view.

## 4. Reversible Add / Added in three pickers

### Collections → Add Titles
- **Add** (plus) assigns the Library title to the current collection.
- **Added** (checkmark) is now clickable and removes membership from that collection.
- Keeps the picker open and prevents duplicate members.
- Does not delete the Library title, its History, progress, ratings or metadata.

### Personal Order → Add Titles
- **Add** inserts the title into the order; **Added** removes the title from Personal Order only.
- Uses the existing canonical `titleIds` queue and reconciliation/saving logic.
- Preserves the remaining titles' manual order and keeps the picker open.

### Personal Order → Add Collections
- **Add** creates a category-scoped collection assignment; **Added** removes the assignment only.
- Removes obsolete mixed-queue tokens but **never** deletes the underlying collection or its members.
- Existing multi-select still performs additive bulk operations and avoids duplicate assignments.

### Logging → Library
- **Add** adds a title to the **current unsubmitted logging draft**.
- **Added** removes the draft entry from that session; it does **not** delete saved History, committed XP, consumed progress or the Library title.
- Reuses the existing draft synchronization and rendering paths.

All new Add/Added controls use explicit plus/checkmark icons; no circular-arrow icon is used by the new toggles. They remain actionable rather than becoming disabled in the Added state.

## 5. Integration, compatibility and data protection

- No cloud-schema migration, authentication changes or backup format changes.
- Existing data models, date sorting, filtering, paging, cover customization, dynamic themes and Personal Order category/queue organization are retained.
- Collection membership writes continue through the existing v392 serialized `saveState()` path; Personal Order and Logging use their established persistence paths.
- Client-side changes appear immediately, subject to the existing save infrastructure. Cross-device racing edits, disconnected cloud writes and full rollback/conflict reconciliation are **not** independently proven by these offline tests.

## 6. Source/package changes

- **New:** `src/js/components/287-v393-picker-scroll-toggle-stability.js` — reversible membership, in-place selection, scroll preservation.
- **New:** `assets/css/208-v393-interaction-scroll-workspace.css` — expanded Collections picker, responsive design and interactive toggle states.
- **New:** `scripts/test-v393-workflows.py` — browser checks of both desktop and mobile picker operations, toggles, scrolling and draft-only Logging removal.
- **New:** `scripts/test-v393-history-compat.py`, `scripts/test-v393-library-caret-compat.py` — regression checks against the v393 bundle.
- **Updated:** `src/js/runtime-order.json`, `index.html`, `VERSION`, `version.json`, `package.json`, `README.md`, `README2.md`.
- **Rebuilt:** `assets/js/mediaflow-v393.bundle.js` and `sw.js` with v393 PWA app-shell assets.
- Previous source modules and existing data schema remain in the ZIP.

## 7. Verification results

| Check | Result |
|---|---|
| Modular bundle build + JavaScript syntax | Passed |
| PWA app-shell version and asset discovery | Passed |
| Collections toggle + multi-select, Personal Order title/collection toggles | Passed, synthetic Chromium |
| Collections checkbox selection with preserved scroll | Passed, synthetic Chromium |
| Expanded Collections popup width | Passed at 390px and 1280px |
| Personal Order Edit open, close and save viewport preservation | Passed, synthetic Chromium |
| Logging Added removal only from draft, Library size unchanged | Passed, synthetic Chromium |
| History card layout | Passed at 320, 390, 820, 1280 and 1920px |
| Library search mid-string caret behavior | Passed in seven viewport/mode scenarios |
| Authenticated Supabase synchronization | Not tested |
| Offline/cloud conflict reconciliation | Not tested |
| Physical Android/iOS/Windows device interactions | Not tested |
| Real 100,000-title responsiveness / stress benchmark | Not tested |

**Validation scope:** Browser tests use synthetic data and a mocked save transport. They cannot establish production-cloud behavior or complete regressions across every existing feature.

## 8. Delivery

Packaged as `MediaFlow_v393_Modular.zip`, including both updated README files and this changelog. No GitHub commits, pushes, branches, pull requests, releases or repository operations were performed.
