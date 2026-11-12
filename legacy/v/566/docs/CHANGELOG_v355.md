# MediaFlow v355 — Personal Order UI/UX & Screenshot Refinements

**Base:** MediaFlow v354 Modular  
**Release date:** October 10, 2026  
**Creator:** Alex Godly  
**Edition:** Personal Edition

## Overview

v355 refines Personal Order on **both desktop and mobile**, based on the v354 screenshots. Its primary goals are readability, professional consistency, theme-aware presentation, eliminating duplicate desktop controls, and preserving every existing queue operation. This is a **presentation-only update**: the canonical Personal Order order, Collection assignments, XP and streak calculations, cloud state, and export schemas are unchanged.

## 1. Desktop Personal Order — Duplicate Controls Corrected

- The new v354 quick bar remains the single convenient location for **Add Title** and **Add Collection**.
- The redundant Lists/Tabs and advanced navigation buttons inside the quick bar are hidden at desktop sizes, because their original desktop counterparts remain in the Personal Order workspace.
- The original sidebar Add Title and Add Collection forms remain mounted for their existing event handlers and modal relocation, but are no longer displayed as duplicate full panels at desktop widths.
- Existing desktop Queue Layout, queue controls, Category Display, exports, imports, and Collections operations remain available.
- Mobile keeps the full compact quick workspace with Lists/Tabs, Category Display, and Queue Tools actions.

## 2. Add Titles Dialog — Readability Improvements

- Increased title-name typography to a readable size; long names can wrap rather than being squeezed into 10–11 px single-line labels.
- Improved metadata font sizing, row padding, input heights, and focus visibility.
- Unified row surfaces, borders, and controls using active MediaFlow theme variables.
- Kept search, category/status/priority filters, sorting, selection, pagination, and title-adding logic unchanged.
- The redesigned dialog stays within the available viewport and retains scrolling for large results.

## 3. Add Collections Dialog — Layout and Typography

- Made Collection names, descriptions, title counts, and filter labels more readable.
- Enlarged the category-assignment selector and kept its **Settings → Set Category** order and searchable choices.
- Improved the existing Collection content-category, priority, sort, and direction controls.
- Gave Collection results consistent theme-aware cards, cover thumbnails, and Add buttons.
- Fixed the narrow-phone row layout so **Add** stays beside Collection information instead of dropping beneath the cover.
- Preserved the underlying `App.v287AddCollectionAssignment` action, existing duplicate protection, Collection XP behavior, and cloud persistence.

## 4. Category Display Dialog — Clearer Management

- Increased font sizes and row heights for category names, counts, and Show/Hide actions.
- Improved icon sizing and space for longer category names, eliminating excessively tiny ellipsized labels.
- Added a **Search categories** field in the quick Category Display dialog, filtering visible rows locally without mutating saved category order or hidden-category settings.
- Added a clear no-results message for unmatched searches.
- Preserved **Use Settings order**, **Custom order**, category drag/drop and move actions, and category visibility settings.

## 5. Category Tabs, Quick Navigation & Filters

- Increased Personal Order main-tab and category-subtab readability on desktop and mobile.
- Improved category count badges, icon alignment, and active-tab contrast through theme variables.
- Removed generic auto-generated circular action icons from the quick-switch controls so they do not duplicate or conflict with navigation labels.
- Refined borders, spacing, hover/focus states, and filter text sizes in the Personal Order quick workspace.
- Preserved category ordering from Settings and the existing status and priority filtering/sorting behavior.
- Filtering and sorting remain **display-only**; saved queue positions are not rewritten.

## 6. Theme Compatibility

The new rules use MediaFlow's existing dynamic CSS properties—including `--panel`, `--panel-raised`, `--text`, `--text-mute`, `--text-dim`, `--flow`, and `--border`—rather than prescribing a single dark or light palette.

Because quick-action dialogs are reparented outside the main content container, v355 explicitly scopes their presentation to the dialog itself so category selectors and Collection filters remain correctly styled after opening. A runtime browser test confirmed dialog backgrounds respond to changes in the active theme's panel variable.

## 7. Scope and Data Safety

- Focus: **Personal Order** and the dialogs shown in the user's v354 desktop/mobile screenshots.
- Both desktop and mobile benefit, with narrower view-specific changes below 1024 CSS px.
- No intentional changes to Library, Dashboard, History, Statistics, Batch Log, or Collections' standalone browsing pages.
- No changes to Personal Order sorting semantics, collection-assignment rules, XP calculations, saved state, or cloud synchronization schemas.
- No Supabase SQL migration is required.

| Compatibility area | Version / status |
|---|---|
| Cloud Sync | 201 (unchanged) |
| Full Backup | Schema 29 (unchanged) |
| Settings Presets | Schema 1 (unchanged) |
| Personal Order Export | Format 5 (unchanged) |
| Collections Export | Format 2 (unchanged) |
| XP / universal streak multiplier | Existing v348 calculations preserved |

## 8. Application & PWA Update

- Version: **355**.
- Package version: **355.0.0**.
- Compiled bundle: `assets/js/mediaflow-v355.bundle.js`.
- New runtime component: `src/js/components/253-v355-personal-order-ui-refinement.js`.
- New stylesheet: `assets/css/181-v355-personal-order-ui-refinement.css`.
- Updated `VERSION`, `version.json`, `package.json`, `index.html`, and `README.md`.
- PWA application-shell cache: `mediaflow-pwa-v355-shell-v1`.
- Service worker regenerated with the current bundle and stylesheet paths.
- Existing offline caching, update checks and optional automatic update installation remain supported.

## 9. Verification

**Targeted browser tests passed** at 320, 390, 820, and 1280 CSS px, covering:

- Desktop quick-switch deduplication and preservation of native Lists/Tabs controls.
- Mobile quick actions remaining visible.
- Add Title, Add Collection, and Category Display dialogs.
- Readable computed title, Collection, and category-label font sizes.
- Category Display live search and no-results states.
- Settings-configured category and priority filter order.
- Searchable assignment category selection.
- Dynamic theme panel-variable inheritance inside a reparented dialog.
- No document-width overflow in the targeted fixture.

**Additional regressions passed:** v348 action-XP and XP breakdown equality; Lists-mode filtering/sorting without changing saved positions; and ten MediaFlow page families at 12 responsive widths (320–1440 CSS px) without document-width overflow or page exceptions in synthetic tests.

**Verification limitations:** Authenticated live Supabase synchronization, physical Android/iPhone rendering, deployed GitHub Pages, and installed-PWA updates were not independently tested. Browser emulation and synthetic fixtures are not substitutes for a full live-device validation.

## Version Progression

- **v352:** Five Collection Add Titles view modes and title/cover size adjustments.
- **v353:** Mobile Add Titles collapsible filters and tools.
- **v354:** Personal Order quick workspace, filters/sorting, and searchable category assignment.
- **v355:** **Professional theme-aware Personal Order refinements and screenshot-specific fixes for desktop duplicate controls, mobile Collection rows, category tabs, and readable Add Title / Add Collection / Category Display dialogs.**
