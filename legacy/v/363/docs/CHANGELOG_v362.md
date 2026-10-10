# MediaFlow v362 — Add Collections Mobile Display & Collapsible Tools Refinement

**Release:** v362  
**Baseline:** MediaFlow v361 Modular, Personal Edition  
**Date:** October 10, 2026  
**Developer:** Alex Godly

---

## 1. Add Collections — Responsive Cards View

The v361 mobile Cards mode stretched each Collection into a full-width poster-heavy row, even where two appropriately sized cards would have fit side by side.

v362 gives Cards its own responsive mobile layout:

- Multiple columns when the viewport allows, using each card's configured cover size to determine its minimum width.
- A centred, correctly proportioned Collection poster/collage at the top.
- The Collection name and title-count metadata below the artwork, without squeezing them beside a narrow poster.
- A dedicated Add / Assigned control aligned across the bottom of the card.
- Natural row heights and constrained long-name wrapping.
- At very narrow phone widths, Cards falls back to one column rather than creating unreadable cards.

## 2. Add Collections — Covers and Covers+Titles Grid Repair

The v361 phone CSS inherited a one-column rule, causing Covers and Covers+Titles to appear as large, mostly empty full-width cards. v362 explicitly overrides this rule, **including the short-result (1–4 Collections) dialog mode**.

- **Covers:** Compact multi-column poster gallery. Collection names remain in accessibility labels/tooltips; Add buttons remain available.
- **Covers+Titles:** The same compact gallery with readable names directly under artwork.
- Gallery tiles scale with the existing **Cover size** preference (36–180px) rather than always occupying the whole dialog width.
- Collages and real cover images remain within their aspect-ratio containers.
- Add/Assigned controls remain directly under each Collection, with predictable button dimensions.
- The mobile gallery uses its available width instead of leaving broad unused horizontal space.

## 3. Mobile Filters & Sorting — Hide Display Adjusters and Per Page

On phone and tablet layouts (up to 1023 CSS px), **Filters & Sorting** is the single collapsible home for the advanced Add Collections tools:

- Filter by contained-title category.
- Filter by priority.
- Sort Collections.
- Sorting direction.
- **Text size slider (12–24px).**
- **Cover size slider (36–180px).**
- **Collections per page (10, 25, 50, 100, 200, 500).**

The five view-mode buttons stay visible outside Filters & Sorting, enabling quick switching without expanding the advanced panel. The Collection search field, assignment-category selector, and result cards also stay accessible while the disclosure is closed.

**Implementation detail:** These are the original live input elements moved between desktop and mobile containers, **not duplicate selectors**. Their event handlers and previously saved preferences remain the same. When resizing back to desktop, the controls return to their original positions.

## 4. Desktop Behavior Preserved

At 1024 CSS px and wider:

- Text and Cover sliders remain alongside the Collection display-mode buttons.
- Collections per page remains in the Collection browsing toolbar.
- Filters & Sorting continues to contain category, priority, sorting and direction.
- Existing desktop cards and wide multi-column gallery layouts are preserved.

## 5. Functionality, Persistence and Compatibility

This is a UI/presentation-focused release. The canonical Collection assignment and Personal Order queue mutation code is unchanged.

Preserved:

- All five Add Collections display modes (List, Compact, Cards, Covers, Covers+Titles).
- Independent Text / Cover slider preferences in `settings.v361CollectionPicker`.
- Independent Titles / Collections page-size preferences in `settings.v359PickerPagination`.
- Category and priority filters, Collection sorting, direction and search.
- Add/Assigned buttons and duplicate assignment protection.
- Existing Personal Order queue positions, title selections, XP awards, cloud state, import/export, and PWA functionality.

| Area | Compatibility |
|---|---|
| Cloud Sync | v201 — unchanged |
| Full Backup | Schema 29 — unchanged |
| Settings Presets | Schema 1 — unchanged |
| Personal Order export/import | Format 5 — unchanged |
| Collections export/import | Format 2 — unchanged |
| Supabase SQL migration | None required |

## 6. Source and Release Assets

- **Runtime:** `src/js/components/260-v362-collection-picker-mobile-workspace.js`
- **Styles:** `assets/css/188-v362-collection-picker-mobile-workspace.css`
- **Bundle:** `assets/js/mediaflow-v362.bundle.js`
- **Tests:** `tests/test-v362-collection-mobile-workspace.py`, `tests/test-v362-adaptive-pickers.py`, `tests/test-v362-xp-regression.py`, `tests/test-v362-all-pages.py`
- **PWA cache:** `mediaflow-pwa-v362-shell-v1`
- Release metadata updated in `VERSION`, `version.json`, `package.json`, `index.html`, `README.md`, `sw.js`.

## 7. Browser Verification

Local Chromium browser tests using synthetic library/Collection data passed at:

- 320 × 720 CSS px
- 390 × 844 CSS px
- 430 × 932 CSS px
- 820 × 1024 CSS px
- 1280 × 900 CSS px
- 1920 × 1080 CSS px

Confirmed:

- All three affected modes (Cards, Covers, Covers+Titles) render without cover/button overlap.
- At 390px, Cards forms two columns and both Covers modes form three columns at a 70px cover setting.
- Filters hide the per-page selector and both sliders when collapsed on mobile and reveal them when expanded.
- View buttons and result cards remain visible while the filter panel is collapsed.
- Adjusting cover size and changing Collections per page still use the original state and callbacks.
- A 121-Collection fixture pages correctly at 25 Collections per page, including page 2.
- Resizing from 390px to 1280px and back relocates inputs without duplicating them.
- Reopening the modal produces only one filter disclosure and one copy of each sizing/page-size control.
- No uncaught JavaScript errors or document-level horizontal overflow were observed in tested scenarios.
- Short-result compact dialogs and title-cover regressions passed.
- XP regression totals remained consistent; ten page families passed across twelve viewport widths from 320px to 1440px.
- Build syntax, static release checks and PWA asset generation passed.

**Verification limitations:** The tests use synthetic data. Live authenticated Supabase sessions, physical Android/iOS devices, GitHub Pages deployment, and installed-PWA upgrade behavior were not independently tested.

---

**v361:** Five Collection views and independent text/cover adjusters.  
**v362:** Mobile Cards and poster galleries redesigned, and advanced display/per-page controls joined Filters & Sorting on phones/tablets without duplication.
