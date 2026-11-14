# MediaFlow v361 — Personal Order Desktop Sizing & Collection Picker Views

**Release:** v361  
**Base:** MediaFlow v360 Modular (Personal Edition)  
**Date:** October 10, 2026  
**Developer:** Alex Godly

---

## 1. Add Titles — Larger desktop text and cover size adjusters

- Removed the cramped **72px** desktop slider tracks in **Personal Order → Add Titles**.
- Reorganized desktop controls so the five view buttons, sizing fields, and items-per-page counter each have a clearly readable place.
- Both **Text** and **Cover** now have a full, responsive slider field with visible labels, accessible range controls, and live pixel readings.
- At 1280px browser width, the compiled-browser screenshot measured approximately **300px per slider track**, instead of the earlier 72px.
- The existing title-size range (12–24px), cover-size range (36–170px), saved view mode, search, filters, selection and independent pagination are retained.
- Mobile keeps compact slider controls rather than forcing the desktop layout onto a phone.

## 2. Add Collections — Five display views

Added a new display-mode switch directly above the existing Add Collections results:

| View | Behavior |
|---|---|
| **List** | Spacious full-width Collection row with cover, metadata and Add/Assigned action |
| **Compact** | Denser Collection rows with smaller artwork and inline actions |
| **Cards** | Responsive multi-column Collection cards with artwork, metadata and a dedicated Add/Assigned action |
| **Covers** | Cover-first gallery; the action remains accessible on each tile while titles are available as accessibility labels/tooltips |
| **Covers+Titles** | Responsive cover gallery with readable title labels and a direct Add/Assigned action |

- Each view uses the **existing Collection artwork** and live Collection records.
- Responsive CSS changes column density according to the viewport and selected cover size.
- Covers and Covers+Titles use **real adjustable cover widths**, rather than enlarging tiny covers into oversized cards.
- Existing Collection **Add**, **Assigned**, and assignment-category functions remain connected to their canonical handlers.

## 3. Add Collections — Independent size adjusters

Added two adjustable controls to the Collection browser:

- **Text size:** 12–24px.
- **Cover size:** 36–180px.

Both apply immediately to the displayed Collection cards without rebuilding the entire dialog, resetting filters, or resetting pagination. Settings are stored separately under:

```json
{
  "settings": {
    "v361CollectionPicker": {
      "mode": "cards",
      "text": 15,
      "cover": 78
    }
  }
}
```

*The example above shows the new desktop defaults. A fresh narrow-screen view defaults to List and a 52px cover to better fit compact results. User changes override those defaults and are saved.*

- MediaFlow's existing Settings save/cloud-state pipeline stores the three preferences.
- Add Titles sizing remains independent under the existing `settings.v358OrderPicker` entry.
- The v359 **Collections per page** setting is preserved independently.

## 4. Results, pagination and Collection assignment compatibility

- Display preferences remain applied after Collection search, filtering, changing the sorting method or direction, switching pages, and reopening the popup.
- The v359 Collection per-page sizes **10, 25, 50, 100, 200 and 500** remain available.
- Results continue to render **only the current page's Collection cards**.
- The Add/Assigned buttons are retained in **all five display modes**, including the two cover galleries.
- Every Collection action receives a meaningful accessible label with the Collection name.
- No saved Personal Order queue positions, Collection membership, sorting settings, category assignments, XP actions or cloud data are deliberately changed.

## 5. Responsive and theme refinements

- Full-width desktop Add Titles slider fields replace narrow controls.
- Desktop Collection cards use the available multi-column results area.
- Mobile Collection view tabs remain horizontally scrollable, with compact text/cover sliders underneath.
- The mobile Collection page-size label shortens to **Per page** to keep the toolbar on one row; the selector retains its full accessible name.
- For four or fewer Collection results, v360's **content-sized mobile popup** is preserved. The redundant inner **ADD COLLECTION** label is hidden in this compact case to avoid extra vertical scrolling.
- Category artwork collages preserve their proportions, using contained fallback artwork rather than stretching individual icons.
- All new controls inherit MediaFlow's theme colors, borders, active states and keyboard-focus styles.

## 6. Code, release assets and compatibility

**New runtime module:** `src/js/components/259-v361-collection-picker-views-sizing.js`  
**New stylesheet:** `assets/css/187-v361-collection-picker-views-sizing.css`  
**Compiled bundle:** `assets/js/mediaflow-v361.bundle.js`  
**New browser regression tests:**

- `tests/test-v361-picker-views.py`
- `tests/test-v361-adaptive-pickers.py`
- `tests/test-v361-xp-regression.py`
- `tests/test-v361-all-pages.py`

**PWA cache:** `mediaflow-pwa-v361-shell-v1`.

| Component | v361 compatibility |
|---|---|
| Cloud Sync | v201, unchanged |
| Full Backup | Schema v29, unchanged |
| Settings Presets | Schema v1, unchanged |
| Personal Order import/export | Format v5, unchanged |
| Collections import/export | Format v2, unchanged |
| XP / streak calculations | Unchanged |
| Supabase SQL migration | **Not required** |

## 7. Local verification

- Compiled Chromium tests at **320, 390, 820, 1280 and 1920 CSS pixels**.
- Verified every Collection mode renders with working Add/Assigned buttons and retained pagination.
- Verified live 120px cover sizing and 22px title sizing, saved settings, reopen behavior and filter controls.
- Verified the desktop Add Titles sliders have real usable width rather than the former 72px limit.
- Verified content-sized dialogs for three Collections, short-list search changes, and original v360 Covers behavior.
- XP action awards and derived breakdown totals match.
- Ten app page families passed responsive smoke tests at twelve widths (320–1440px).
- `scripts/build.py` JavaScript syntax checks and `scripts/check.py` release checks passed.

**Verification limits:** Tests use synthetic data. Authenticated live Supabase sync, deployed GitHub Pages, installed PWA updates and physical Android/iOS devices were not independently verified.

---

**Version evolution**  
**v358:** Full-width dialogs, five Add Titles modes, Collection filter/sort improvements.  
**v359:** Independent per-page settings, refined category tabs.  
**v360:** Proportional title covers and compact Collection dialogs.  
**v361:** Larger desktop Add Titles adjusters; five Collection modes and independent Collection text/cover sizing.

**Deployment:** Upload the complete v361 modular release and verify the live PWA and cloud Sync Now after deployment. Keep a Full Backup before upgrading.
