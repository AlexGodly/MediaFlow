# MediaFlow v358 — Personal Order Stability & Full-Width Picker Rebuild

**Version:** v358  
**Based on:** v357 Personal Edition  
**Release date:** October 10, 2026  
**Author:** Alex Godly

## 1. Fixed the recursive Add Titles filters bug at its source

The v356 Add Titles dialog wrapped the live filter toolbar in a new `<details>` element each time a sheet was opened. Closing a sheet restores the *same* card to the Personal Order sidebar, so reopening would wrap the already-wrapped toolbar again. This produced multiple nested copies of **Filters & sorting**, particularly visible on mobile.

- The v356 source now checks whether the actual toolbar **already has a filter disclosure ancestor** before adding one.
- Reopened sheets reuse the existing disclosure rather than creating another.
- v358 also detects and corrects unexpected leftover nested wrappers without duplicating or discarding the real picker toolbar.
- The one disclosure starts collapsed whenever Add Titles is newly opened.
- Search, filter refresh, pagination, selection, and display mode changes reuse the canonical v138/v140 Personal Order picker handlers.
- Browser test: **five complete Add Titles open/expand/filter/paginate/close cycles** at each of six screen sizes, with exactly one disclosure throughout.

## 2. Truly wide desktop dialogs

v357's modal styles capped desktop sheets at approximately 1,080–1,120 pixels even on very large monitors. v358 supersedes those limits.

- **Desktop dialog width:** up to **94% of the viewport**, capped at **1,880 CSS pixels**.
- **Desktop dialog height:** up to **93% of the dynamic viewport** (up to 1,050 CSS pixels).
- A left column holds search, category assignment and filters. The larger right column holds actual results and relevant view options.
- Scrolling is limited to the browsing results, rather than making the entire dialog cumbersome.
- At 1920×1080 in the local browser test, the modal measured ~**1805 px** wide. At 1280×900 it measured ~**1203 px** wide.
- At intermediate/phone viewports, the layout adapts to the available space without horizontal document overflow.

## 3. Five Add Titles views (previously requested for v357)

Personal Order → **Add Titles** now offers these display modes:

| Mode | Purpose |
|---|---|
| **List** | Full-width, high-readability rows |
| **Compact** | Tighter multi-column rows |
| **Cards** | Dense responsive card grid; default on larger screens |
| **Covers** | Poster-focused gallery with clickable selection checkboxes |
| **Covers+Titles** | Poster gallery with the corresponding title below |

Further improvements:

- **Title text-size slider:** 12–24 px.
- **Title cover-size slider:** 36–170 px.
- View mode, text size and cover size are stored under `settings.v358OrderPicker`, within the existing Settings state. No new SQL table is required.
- The results stay driven by existing title search, status/priority/category filtering, sorting, pagination and selection handlers.
- The active display and cover variables remain applied after results refresh.
- The Title picker dynamically uses multiple cards per row at large widths and a readable single-column layout on phones.

## 4. Add Collections — genuine grid layout

- Desktop Add Collections now uses a multi-column Collection card grid (not a widened single-column list).
- At 1024, 1280 and 1920 CSS-pixel viewport widths, the verified browser fixture displays **2, 3 and 5 columns**, respectively.
- Collection cards give the artwork, title and metadata their own space with the Add action clearly separated.
- Mobile uses compact Collection rows with a properly aligned Add button.
- Images keep their poster/collage proportions. Actual poster images use `object-fit:cover`; category-artwork fallbacks use contained sizing instead of being stretched or cut off.

## 5. Searchable category filtering — rebuilt natively into the dialog

v357's after-render native-select conversion was inconsistent and produced tiny clipped floating menus. v358 renders the new category selector **as part of the original Collection picker HTML** instead.

- Search field inside the category selector.
- All title categories and each visible configured category appear as full-width choices.
- Real MediaFlow category icons appear beside category names.
- The choices follow **Settings → Category Filter** visibility/order using `v354CategoryIds('categoryFilter')`.
- Selecting a category immediately refreshes the original Collection results.
- The menu scrolls within its own bounds without pushing a floating panel off the screen or overlapping unrelated controls.
- **Assign Collection to category** remains a separate searchable selector following Set Category ordering.

## 6. Collection sort options and direction

Add Collections now provides **12** sort choices, each using existing Collection data or derived values from the Collection's titles:

1. Name
2. Date created
3. Last edited
4. Number of titles
5. Completed titles
6. Completion percentage
7. Average rating
8. Total progress
9. Recently active (based on existing per-title session history when present)
10. Category (based on contained titles and category ordering)
11. Manual order (original Collection array order)
12. Recently viewed

- **Direction** is a single **Ascending / Descending toggle button**, with one appropriate arrow icon.
- Numeric/timestamp/rating sorts use real data and handle missing values without inventing numbers or timestamps; missing metrics sort last.
- Browsing direction changes do **not** rewrite the manually saved Collection order, Collection membership or Personal Order assignments.
- The v357 postprocessing that silently replaced expanded sorting choices with an older six-option list is prevented from altering this v358 selector.

## 7. Icon and mobile UI fixes

- Personal Order quick navigation retains **one semantic icon per button**, without generic icon injection alongside it: Lists, Tabs, Category display, Queue tools, Add title and Add Collection.
- Category-tab icon/name/count spacing continues to use its corrected separate alignment lanes.
- Add Titles title/poster rows and Add Collections collage art no longer compress vertically to fit a results viewport. The rows retain their intrinsic height; **the results container scrolls**.
- Mobile dialog options remain accessible in a compact layout. Filters are collapsed when the dialog is first opened and can be expanded on demand.
- Interactive elements inherit the current MediaFlow `--flow`, `--panel`, `--border` and text theme values.

## 8. Compatibility / unchanged data contracts

| Component | Status |
|---|---|
| Supabase / Cloud Sync | Existing Personal Edition, Cloud Sync v201 |
| Full Backup | Schema v29 |
| Settings Presets | Schema v1 |
| Personal Order import/export | Format v5 |
| Collections import/export | Format v2 |
| Existing XP and streak multiplier | No reward algorithm changes |
| Supabase SQL migration | **None needed** |
| PWA service-worker cache | `mediaflow-pwa-v358-shell-v1` |

The original Personal Order position, assignment, title membership, action, import/export and cloud persistence handlers remain in place.

## 9. Source, build and verification

**Source changes**

- Patched `src/js/components/254-v356-personal-order-dialog-browse-layout.js` to make disclosure wrapping idempotent.
- New `src/js/components/256-v358-personal-order-rebuild.js` contains title view controls, Collection filter rendering, sorting, and dialog enhancements.
- New `assets/css/184-v358-personal-order-rebuild.css` implements desktop width, responsive grids, display modes, scrolling, and artwork scaling.
- Runtime extensions list, HTML CSS references and release metadata updated.
- New browser tests: `tests/test-v358-real-dialogs.py`, `tests/test-v358-xp-regression.py`, `tests/test-v358-all-pages.py`.

**Verified locally**

- JavaScript build succeeded; `node --check` passed.
- Release asset consistency check passed.
- Six interactive browser viewport sizes: **320×720, 390×844, 820×1000, 1024×820, 1280×900, 1920×1080**.
- For each viewport: five disclosure reopen cycles, working title selections, all five title modes, category search, 12 sort choices, direction toggle, results rendering and no uncaught page errors or horizontal document overflow.
- Existing XP action event / streak source tests passed; XP breakdown total matched the computed total.
- Existing 10-page-family, 12-viewport responsive smoke test passed.

**Not covered:** Live authenticated Supabase syncing, hardware Android/iOS behavior, GitHub Pages deployment and installed-PWA update migration were not independently exercised in these offline fixtures. Deploy the complete v358 package and confirm the live PWA refresh, sync and backup from your account.

---

**v358 fixes the failures visible in your v357 screenshots instead of declaring those issues resolved without regression coverage.**
