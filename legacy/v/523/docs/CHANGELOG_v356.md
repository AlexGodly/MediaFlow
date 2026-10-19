# MediaFlow v356 — Personal Order Add Titles & Add Collections Dialog Refinement

**Release:** v356  
**Base:** MediaFlow v355 Modular  
**Date:** October 10, 2026  
**Created by:** Alex Godly  
**Edition:** Personal Edition

---

## 1. Personal Order — Unified Dialog Browsing Layout

- Refined the **Add Titles** and **Add Collections** quick-action dialogs together, based on the v355 desktop and mobile screenshots.
- Changed the layout so header, search, filtering, and browsing results each have a predictable role.
- Results use a **flexible independently scrollable area**, rather than letting large toolbars push them below the viewport.
- Existing picker elements are **moved, not recreated**: the original handlers for title search, selecting, pagination, filtering, sorting, adding titles, and assigning Collections remain wired.
- Dialog design follows the active MediaFlow theme (`--panel`, `--panel-raised`, `--border`, `--text`, `--text-mute`, `--flow`).

## 2. Add Titles — Collapsible Filters & Sorting

- Added a clearly labeled **Filters & sorting** disclosure inside the Personal Order Add Titles dialog.
- The detailed filter controls are **collapsed by default on desktop and mobile**; users can open them whenever needed.
- Library search remains visible regardless of filter state.
- Existing category, sort field, sort direction, status, priority, reset, and match-count controls remain accessible.
- Expanded tools have a height limit and their own scrolling on short viewports, so they cannot permanently crowd out the title results.
- Filter changes preserve the open/closed state because the original filter-result refresh replaces the contents *inside* the disclosure, not the disclosure itself.
- Existing configured order and logic are preserved; no new competing category/priority filter implementations were introduced.

## 3. Add Titles — Readability & Selection

- Improved title-name size and wrapping in Add Titles result rows (15px desktop, 14px phone).
- Improved metadata readability, including category/icon, status, and progress.
- Refined checkbox, cover, and title-copy alignment, with a compact cover preview.
- Preserved multi-selection while changing filters and opening/closing the disclosure.
- Preserved **Add selected**, **Add shown**, **Deselect all**, and page navigation.
- Reorganized the phone selection footer into a compact row of actions, leaving more room for results.
- The existing Personal Order page-size, selection and pagination logic remains authoritative.

## 4. Add Collections — More Room for Results

- Retained **Assign Collection to category** near the top of the dialog, followed by Collection search.
- Kept searchable assignment-category selection and Settings-defined **Set Category** order.
- Made **Collection filters & sorting** collapsed by default on **desktop and mobile**, while preserving all controls.
- Preserved filtering Collections by contained-title category and priority, and sorting by name, size or recently edited, with direction control.
- Moved emphasis to the independently scrolling Collection results instead of the descriptive header.
- Shortened mobile presentation by hiding the redundant explanatory paragraph (the selector and actions remain visible).
- Increased readable Collection name and description typography while preserving compact cover and adjacent **Add** buttons.
- Existing Collection assignment, duplicate-protection, ordering, and XP calculation handlers are unchanged.

## 5. Desktop and Mobile Presentation

- **Desktop:** Wider, taller dialog workspace with more room for title and Collection results; filtered controls available on demand.
- **Phones:** Compact toolbar, mobile bottom-sheet layout and one visible search field; browsing results take most of the remaining height.
- **Tablets:** The same flexible dialog structure adjusts to available viewport dimensions.
- Avoids displaying the on-screen keyboard automatically on mobile when opening the picker; tapping the search field still opens it normally.
- Supports reduced-motion preferences and visible keyboard-focus states.
- No intentional redesign of other MediaFlow pages or the main desktop Personal Order workspace.

## 6. Preservation and Compatibility

- Existing Personal Order title and Collection assignment data are unchanged.
- Existing Personal Order Lists/Tabs, queue filters, Settings-based ordering and Category Display remain intact.
- No changes to the XP award calculations, universal streak multiplier or XP History.
- No changes to the cloud data model or migrations.
- Existing Full Backup, automatic backups, Settings presets, export/import, cloud sync and Sync Now workflows remain in place.

| Component | Version / compatibility |
|---|---|
| Cloud Sync | 201, unchanged |
| Full Backup | Schema 29, unchanged |
| Settings Presets | Schema 1, unchanged |
| Personal Order export/import | Format 5, unchanged |
| Collections export/import | Format 2, unchanged |
| Supabase migration | Not required |

## 7. Implementation and Release Assets

- **Runtime module:** `src/js/components/254-v356-personal-order-dialog-browse-layout.js`
- **Theme-aware styles:** `assets/css/182-v356-personal-order-dialog-browse-layout.css`
- **Bundle:** `assets/js/mediaflow-v356.bundle.js`
- **New regression test:** `tests/test-v356-personal-order-dialogs.py`
- Updated application metadata in `VERSION`, `version.json`, `package.json`, `index.html`, and `README.md`.
- **PWA cache:** `mediaflow-pwa-v356-shell-v1`
- Regenerated `sw.js` and application-shell asset references.

## 8. Local Browser Verification

The compiled v356 bundle passed tests at **320×640, 390×844, 430×932, 820×1050, and 1280×900** CSS pixels covering:

- Dialog opening, closing and results rendering.
- Both Filters disclosure behaviors and their default collapsed state.
- Title checkbox selection and persistence through filtering.
- Existing priority filter updates inside the Add Titles dialog.
- Existing Collection sorting updates inside the Add Collections dialog.
- A minimum usable results-area height in both dialogs.
- Mobile and desktop theme-variable changes.
- No detected horizontal document overflow or uncaught exceptions.

Additional compiled-v356 regression passes:

- Previous v355 Personal Order and category dialog tests.
- Lists sorting and preserved saved queue order.
- v348 action XP rewards and XP-breakdown equality.
- Ten page families tested across twelve viewport widths from 320 to 1440 CSS pixels.
- JavaScript syntax and PWA generation.

**Verification limits:** Physical Android/iOS behavior, authenticated live Supabase synchronization, installed-PWA updates, and live GitHub Pages deployment were **not independently tested**.

---

## Version Progression

**v353:** Collections Add Titles mobile tools and browsing-space improvements.  
**v354:** Personal Order quick workspace and settings-aware filtering/sorting.  
**v355:** Professional theme-aware Personal Order UI refinements.  
**v356:** **Collapsible and compact Personal Order Add Titles/Add Collections dialogs, improved readability, larger results areas and consistent mobile/desktop styling.**

**Deployment:** Deploy the complete v356 release together; retain a Full Backup and check the live update and Sync Now after deployment.
