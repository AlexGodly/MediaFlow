# MediaFlow v351 — Mobile Regression Repairs

**Release:** 351  
**Base:** MediaFlow v350 Modular  
**Date:** October 10, 2026  
**Creator:** Alex Godly  
**Edition:** Personal Edition

## Summary

v351 repairs narrow-screen layout failures identified in additional screenshots taken on a physical Android phone after v350. This is a **mobile/tablet-only** presentation fix. The existing desktop UI (1024 CSS pixels and wider), saved title/Collection data, cloud synchronization, progression, backups and exports are not intentionally modified.

## 1. Batch Log — selected-title card repair

- Fixed the oversized Batch Log selected-title cover that could dominate an entire screen, especially when a large user-configured cover dimension carried over from desktop.
- Fixed single-letter vertical wrapping of the selected title's category, progress and metadata.
- Reorganized each selected-title preview into a **bounded 54 × 74 CSS px thumbnail beside a flexible text column**, while leaving the title search field above and quantity/minutes controls below.
- Supports the existing clickable title-details cover button and category fallback artwork, not just an image element.
- Preserves title name, category icon/name, progress information, Batch Log row timestamp, remove button and Batch Log submission.
- Retains user-defined cover-size settings for nonmobile views; does not overwrite or reset those settings.
- Makes title fields and two-column number inputs respect the available mobile width.

## 2. History — Consumption filter repair

- Fixed Categories, Year, Month and Period controls collapsing into tiny strips that were almost impossible to read or select.
- Replaced inherited narrow flexbox sizing with a **two-column responsive filter grid** for phone and tablet layouts.
- The category selector spans the full available row. Native year/month/period selects receive readable text and touch-friendly heights.
- Reorganized Select, View Options and Export CSV into compact, accessible actions below the filter grid.
- Keeps History filters and tools collapsible on mobile, with the existing desktop sticky layout preserved.
- Preserves Consumption History, Recently Viewed, XP History, ratings, logs, Library History, filters, pagination and exports.

## 3. Collections — tools and selection actions

- Corrected the Collection Tools **Show / Hide** behavior so closed panels actually hide display modes, advanced filters, cover-sizing and overlay settings instead of leaving some controls visible.
- Keeps title search available even with the advanced Collection Tools panel closed.
- Introduced a compact **Selection actions** disclosure for a Collection's bulk-selection toolbar on mobile.
- Shows the current selected count. When titles are selected, bulk actions remain available without requiring users to rediscover the controls.
- Preserves Select visible, Select all matching, Deselect all, repair progress, change status/priority/category and Remove selected.
- Uses two-column filter controls when tools are expanded, while adapting to narrower screens.
- Makes Collection cover overlay toggles and size sliders more compact, with readable percentages and no unintended horizontal document overflow.
- Does not alter any Collection membership, ordering, selection persistence or data export formats.

## 4. Library — compact category and status navigation

- Changed the narrow-screen category/status area from an oversized wrapping wall into **individually horizontally swipeable rows**.
- Categories and statuses remain accessible at all times, as requested.
- The currently selected category/status controls retain their existing active visual state and handlers.
- Reduced surrounding filter-dock padding and vertical spacing so titles appear sooner.
- Keeps advanced Library Tools disclosure and the existing Library selection/display features.

## 5. Desktop protection, architecture and behavior

- All v351 design rules live within `@media screen and (max-width:1023px)`.
- All added runtime DOM enhancements activate only below 1024 CSS pixels and are reverted on a desktop-width transition.
- Avoids overwriting a user's cover-size, filter or cloud preferences to achieve the mobile presentation.
- New markup groups Batch Log title data for reliable mobile flexbox sizing; the original markup is restored on desktop-width transitions.
- Uses the original Collections bulk-action buttons and change handlers rather than reimplementing or duplicating operations.
- Dynamic themes continue to provide the underlying colors and surfaces.

## 6. Versioning, PWA and compatibility

- App version, `VERSION`, `version.json`, `package.json`, `index.html` and JS bundle references updated to **v351**.
- Compiled JavaScript: `assets/js/mediaflow-v351.bundle.js`.
- New runtime component: `src/js/components/249-v351-mobile-regression-repairs.js`.
- New responsive stylesheet: `assets/css/177-v351-mobile-regression-repairs.css`.
- New browser test: `tests/test-v351-mobile-regression.py`.
- Multi-page responsive test: `tests/test-v351-all-pages.py`.
- Updated PWA shell cache: **`mediaflow-pwa-v351-shell-v1`**; regenerated `sw.js` includes the new CSS and JS.
- Existing automatic PWA update, offline caching, import/export, Sync Now, cloud save, backup and history-export implementations are preserved.

| System | Compatibility |
|---|---|
| Cloud Sync | Version 201 — unchanged |
| Full Backup | Schema 29 — unchanged |
| Settings Presets | Schema 1 — unchanged |
| Personal Order Export | Format 5 — unchanged |
| Collections Export | Format 2 — unchanged |
| XP / Universal Streak Multiplier | Existing v348 implementation preserved |
| XP History | Preserved |
| Supabase SQL migration | **Not required** |

## 7. Local verification

**Passed against the compiled v351 application:**

- Narrow mobile viewport **320 CSS px**.
- Phone viewport **390 CSS px**.
- Tablet viewport **820 CSS px**.
- Desktop viewports **1024 and 1280 CSS px**.
- Batch Log selected-title copy grouping and preservation of the clickable cover button.
- Simulated extreme saved Batch Log cover size: **480 × 690 CSS px**, constrained to mobile-safe thumbnail dimensions.
- History filter-cell readable width validation.
- Collection bulk-selection disclosure and original control access.
- Collection Tools collapsed / expanded behavior.
- Multi-page synthetic smoke test at **320, 360, 375, 390, 412, 430, 600, 768, 820, 1024, 1280 and 1440 CSS px**, across ten page families.
- No document-width overflow or browser exceptions in the synthetic smoke test.
- No v351-only mobile controls on desktop viewports.
- JavaScript syntax validation, PWA asset generation and release version/reference checks.

**Limitations:** Physical-device deployment, installed-PWA cache refresh, live GitHub Pages rendering and authenticated live Supabase synchronization have not been independently verified. Browser simulations do not guarantee identical results on every phone or browser.

---

## Version progression

**v348** — Universal streak-multiplied XP and XP History.  
**v349** — History initial scroll-position fix.  
**v350** — First mobile/tablet interface redesign.  
**v351** — **Mobile regression corrections for Batch Log, History filters, Collection tools/bulk actions and Library category/status navigation.**

**Deployment note:** Back up live data before updating; after deploying, allow MediaFlow's v351 PWA shell to install and check these four areas on your actual phone.
