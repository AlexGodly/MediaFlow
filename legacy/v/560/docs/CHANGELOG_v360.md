# MediaFlow v360 — Adaptive Personal Order Picker Layouts

**Release:** v360  
**Base:** MediaFlow v359 Modular (Personal Edition)  
**Date:** October 10, 2026  
**Developer:** Alex Godly

## 1. Add Titles — Covers now obey the selected cover size

- Fixed the discrepancy where a **36px cover** still occupied a roughly **110–130px tile** because the previous gallery enforced an oversized minimum grid-column width and stretched the poster to fill it.
- Both **Covers** and **Covers+Titles** use the same size-driven responsive grid. A tile now derives its width from the chosen cover size, with a minimum 62px tile for touch/checkbox usability; the actual poster remains at the chosen size.
- Changing the cover-size slider updates poster width and column density **immediately**, without rebuilding selected titles or the whole dialog.
- Gallery rows maintain their natural height and scroll inside the available results area. The selection checkbox stays available at the upper corner of each tile.
- Covers mode keeps title text visually hidden while retaining the underlying label; Covers+Titles shows the title beneath its cover.
- Works with the existing five display modes, title-text size preference, persisted cover-size preference and v359 independent Titles-per-page setting.

## 2. Add Titles — More efficient mobile controls

- Organized the view switch, text/cover sliders, results count and Titles-per-page control into a more predictable responsive flow.
- Display modes remain horizontally accessible; the two sizing sliders share a compact row on phones and tablets.
- Kept pagination and Add selected / Add shown / Deselect all action controls outside the scrollable results list.
- Avoided shrinking the results area unnecessarily when the Covers gallery shows many small tiles.

## 3. Add Collections — Height adapts to the number of results

- Added a **content-sized dialog mode** for pages with **four or fewer matching Collections**.
- Small result sets no longer reserve most of the viewport with a blank list area.
- The matching result cards, visible count and page information stay grouped together near the results.
- For larger result sets, the previous tall, independently scrolling results layout remains available, maintaining support for 10–500 Collections per page.
- Searching/filtering between one, several and many results switches dialog presentation in place; no destructive Collection or assignment changes occur.
- Both mobile and desktop follow this rule. Compact desktop Collection cards are capped at a sensible width rather than turning a single Collection into a stretched full-width card.
- Opening Filters & Sorting does not alter the stored result set. Overflow remains constrained to the dialog viewport when the controls need more height.

## 4. Preserved v359 functionality

- **Add Titles:** List, Compact, Cards, Covers, Covers+Titles, adjustable text and cover size, independent per-page counts (10/25/50/100/200/500), title selections, page controls, filters and sorting.
- **Add Collections:** searchable category filters, priority filter, 12 sort choices, ascending/descending control, independent per-page counts, result pagination, Collection assignment actions.
- **Personal Order category tabs:** existing v359 category artwork, name and badge layout retained.
- Existing Personal Order queue positions, Collection membership, action XP, streak bonuses, Cloud Sync, Settings, backups and exports are not intentionally modified.

## 5. New source files

| Component | File |
|---|---|
| Runtime extension | `src/js/components/258-v360-adaptive-personal-order-pickers.js` |
| Responsive styles | `assets/css/186-v360-adaptive-personal-order-pickers.css` |
| Compiled runtime | `assets/js/mediaflow-v360.bundle.js` |
| Direct adaptive UI regression | `tests/test-v360-adaptive-pickers.py` |
| Previous pagination/tabs regression on v360 | `tests/test-v360-pagination-tabs.py` |
| XP regression on v360 | `tests/test-v360-xp-regression.py` |
| Multi-page responsive regression on v360 | `tests/test-v360-all-pages.py` |

PWA cache is regenerated as `mediaflow-pwa-v360-shell-v1`. Release metadata and HTML/CSS/JS references are updated to v360.

## 6. Browser verification

The **compiled v360 JavaScript** was exercised with synthetic Personal Order/Collections data in Chromium at **320×720**, **390×844**, **820×1024**, **1280×900**, and **1920×1080** CSS pixels:

- At 36px, the actual cover stays approximately 36px, with a tile no wider than 70px; increasing the slider to 120px increases both actual artwork and gallery tile widths.
- Gallery columns are formed even on narrow phones; 50-item page selection and footer remain visible.
- Add Collections with three results enters content-sized layout, and the count/footer stays immediately below the cards.
- Searching to 20 results returns to the scrolling dialog; narrowing to one result returns to content-sized presentation.
- No uncaught browser JS errors or horizontal page overflow observed in the tested scenarios.

Additional tests passed:

- v359 title/Collection page sizes, pagination, selections and tabs at five viewport widths.
- XP action rewards and XP-breakdown equality.
- Ten page families across twelve responsive widths (320–1440px).
- `python scripts/build.py` syntax validation and `python scripts/check.py` source/PWA integrity checks.

**Verification limits:** tests were synthetic browser tests, not authenticated live Supabase sessions, real Android/iOS hardware, installed PWA updates or production GitHub Pages deployment. The fully deployed interface must still be checked after uploading.

## 7. Compatibility

| Component | Status |
|---|---|
| Cloud Sync | v201, unchanged |
| Full Backup | Schema v29, unchanged |
| Settings Presets | Schema v1, unchanged |
| Personal Order export/import | Format v5, unchanged |
| Collections export/import | Format v2, unchanged |
| XP / streak rules | Unchanged |
| SQL migration | None required |

**Deployment:** Upload the full v360 modular project, let the PWA cache update to `mediaflow-pwa-v360-shell-v1`, confirm the app reports v360 and validate Add Titles / Add Collections in your actual account.
