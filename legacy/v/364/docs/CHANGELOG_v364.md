# MediaFlow v364 — Personal Order Lists & Collection Queue Artwork/Layout Parity

**Release:** v364  
**Baseline:** MediaFlow v363 Modular (Personal Edition)  
**Date:** October 10, 2026  
**Developer:** Alex Godly

---

## 1. Fixed distorted title cover frames in multi-column Lists

- Corrected the interaction between older v177 order-cover scaling and the v363 Lists-per-row grid rules. Those rules had different forced cover widths and heights and could make posters look unnaturally narrow in four-column layouts.
- Applied a proportional **2:3 poster frame** to Category/Title Orders inside the desktop Lists multi-column layout.
- Artwork uses contained sizing within that frame; its source aspect ratio is preserved rather than stretching to arbitrary width/height pairs.
- Category fallback icon artwork is constrained and centered in its frame.
- Separated the position number, poster, title/metadata, and action row so they remain readable when category panels are narrow.
- Long titles wrap to a limited number of lines rather than widening the entire category card.
- The standard Ordered Title Cover Size setting remains authoritative for ordinary Personal Order titles.

## 2. Fixed assigned Collection covers and their content alignment

- Removed the v363 multi-column behavior that explicitly hid assigned Collection artwork.
- Restored actual cover images or the original Collection cover collage/fallback for Collection assignments in both regular category queues and Collection Queue blocks.
- Constrained artwork to a proportional **2:3 cover area** with appropriate contained media sizing.
- Kept position number, cover, descriptive content, rule selectors, and action buttons in separate layout regions.
- Fixed a v363 selector that forced Collection text/rules into the narrow cover column, resulting in unnaturally tall cards. The Collection body now occupies the dedicated text column.
- Preserved Collection title/name, category rule, completed-title rule, remaining and total counts, Open, Show/Hide titles, Move and Remove actions.
- Existing cover collage structure remains intact.

## 3. Desktop Collection Queues use the shared Lists-per-row grid

Previously, Category/Title Orders used v363's configurable multi-column category cards, but the Collection Queues section still stretched its group cards across the full content width.

- Collection Queue category groups now use a responsive multi-column layout aligned with regular Category/Title Orders.
- Both sections use the **same** `settings.v363PersonalOrder.listColumns` preference (1, 2, 3, or 4 lists per row).
- No second column setting was added.
- At narrower desktop widths, the effective number of columns is reduced to preserve readable content.
- Mobile and tablet Collection Queues remain single-column.
- The Collection Queues heading spans the width above the grid.
- Individual Collection Queue groups use cohesive cards, proportional direct-title covers, and distinct assigned Collection blocks.
- The canonical mixed queue token ordering is unchanged: titles and Collection blocks remain in their saved positions.

## 4. New Queue Tools cover-size setting

**Personal Order → Queue Tools → Cover Sizes → Collection Queue title covers**

- Added a separate slider and synchronized numeric input for **direct titles shown in Collection Queues**, in both Lists and Tabs modes.
- Values are percentages from **10 to 400**, with a default of **100%**. The slider presents 25–400%; the numeric input allows values down to 10%.
- Adjustments update direct title cover sizing visually without rebuilding the queue on each slider movement.
- The value is stored as `orderPlan.v288QueueView.directQueueTitleCoverScale`, passing through the existing normalization and cloud-backed Personal Order state.
- Changes are saved through v363's debounced, serialized queue-state persistence.
- The new adjustment is independent of:
  - regular ordered-title covers (existing v181 control),
  - assigned Collection cover scale (existing v289 control),
  - expanded titles inside Collection blocks (existing v289 control).
- The setting appears in the existing Queue Tools panel on desktop, tablet, and mobile.
- Dynamic theme styling and existing keyboard-accessible HTML range/number inputs are preserved.

## 5. Direct Collection Queue title rows

- Each direct-title row keeps a properly proportioned cover frame, number, name, category/status, and progress.
- Reduced wasted row width by presenting Collection Queue rows as cards inside the category panel, rather than border-only full-width table rows.
- Adapted metadata wrapping and category icon sizing for smaller cells.
- The same direct-title cover setting applies when selecting a Collection Queue within Tabs mode.

## 6. Compatibility and preservation

This update changes presentation and one independent queue-view preference. It does not change canonical title/Collection records or their ordering.

| Component | Compatibility |
|---|---|
| Cloud Sync | v201, unchanged |
| Full Backup | Schema 29, unchanged |
| Settings Presets | Schema 1, unchanged |
| Personal Order import/export | Format 5, unchanged |
| Collections import/export | Format 2, unchanged |
| XP and universal streak multipliers | Existing algorithms untouched |
| Dynamic themes | Theme-token colors preserved |
| Supabase SQL migration | Not required |

Existing Lists/Tabs navigation, desktop Category Display, mobile Queue Tools, picker views/sizing, saved queue ordering, Collection assignments, backups, Sync Now, and PWA update infrastructure remain in place.

## 7. Code and release assets

- Runtime extension: `src/js/components/262-v364-personal-order-cover-queue-parity.js`
- Responsive stylesheet: `assets/css/190-v364-personal-order-cover-queue-parity.css`
- Compiled app: `assets/js/mediaflow-v364.bundle.js`
- PWA cache: `mediaflow-pwa-v364-shell-v1`
- New browser coverage: `tests/test-v364-cover-queue-parity.py`
- Carried-forward v364 regression variants: `tests/test-v364-workspace.py`, `tests/test-v364-performance.py`, `tests/test-v364-xp-regression.py`, `tests/test-v364-all-pages.py`
- Updated source runtime order, `index.html`, `VERSION`, `version.json`, `package.json`, `README.md`, and PWA asset references.

## 8. Local verification

Browser tests use the compiled v364 runtime with synthetic account data in Chromium. Results:

- **320, 390, 820, 1280, 1920 CSS px:** passed proportional title, direct queue-title, and assigned Collection frame geometry checks; no document-level horizontal overflow in tested layouts.
- **Lists per row 1–4:** both regular Category/Title Orders and Collection Queue groups respond to one setting with no queue regeneration.
- **Collection cover UI:** verified assigned cover is visible and the Collection description/rules render in column 3 beside its artwork, not inside the poster lane.
- **Queue Tools:** verified exactly one new slider, matching numeric input, and independent state for the new Collection Queue direct-title cover scale.
- **Lists/Tabs:** verified Collection Queue title-cover presentation remains available after switching layouts.
- **v363 workspace regression:** passed at 320, 390, 820, 1280 and 1920px.
- **Multi-page responsive regression:** 10 page families passed at 12 widths from 320 to 1440px.
- **XP award regression:** existing events and breakdown totals remained consistent.
- **Large-library benchmark:** synthetic 30,000- and 50,000-title cases completed; initial HTML generation measured approximately 242ms and 341ms, respectively; 10 category/Collection switches measured approximately 17ms and 20ms in local Chromium.
- JavaScript build/syntax and release consistency validation passed.

**Not independently verified:** authenticated live Supabase synchronization, deployed GitHub Pages, installed PWA upgrades, and physical Android/iOS devices. These should be checked with a backed-up account after deploying.

---

## Version progression

**v362:** Mobile Collection display views and collapsible controls.  
**v363:** Main Personal Order Lists/Tabs workspace and large-library navigation improvements.  
**v364:** **Proportional title and assigned Collection artwork, Collection Queues sharing the Lists-per-row layout, and independent Collection Queue title-cover sizing.**

**Deployment:** Back up MediaFlow before updating, deploy the complete v364 modular project, refresh the browser/PWA, and verify personal queue artwork plus Sync Now on the live account.
