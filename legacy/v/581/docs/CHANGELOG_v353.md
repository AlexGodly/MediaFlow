# MediaFlow v353 — Mobile Add Titles Picker: Collapsible Tools & More Browsing Space

**Release:** MediaFlow v353  
**Base:** MediaFlow v352 Modular  
**Date:** October 10, 2026  
**Creator:** Alex Godly  
**Edition:** Personal Edition

---

## 1. Collections → Add Titles — Mobile layout redesigned

The Add Titles popup previously devoted most of a narrow phone's height to six filters, five display-mode buttons, two sliders, and a large footer, leaving almost no space to browse titles. v353 introduces a phone/tablet-specific layout that gives the title results their own flexible scroll area.

- Keeps **Library search always visible** at the top of the picker.
- Adds a separate **Filters — Show / Hide** control. Filters are **collapsed by default** when opening the popup on mobile/tablet widths.
- Adds a separate **Display tools — Show / Hide** control for the two size adjusters. Sliders are **collapsed by default**.
- Keeps all five view modes directly accessible in a **single horizontal swipeable row**: List, Compact, Cards, Covers, Covers + Titles.
- Keeps title results visible and individually scrollable, with the bulk selection, pager, and Add Selected actions below the list.
- Uses adaptive viewport-height sizing to avoid a full-screen wall of tools.
- On very short phone viewports, expanding one tool panel closes the other to protect title browsing space; the controls remain accessible whenever needed.

## 2. Filters preserved, but no longer consume the whole popup

The new Filters panel retains the existing category selector, status, priority, rating, sorting field, and ASC/DESC direction. Its controls reuse the same underlying indexed Library candidate search and filter functions.

- Search still filters without requiring the Filters panel to be expanded.
- Opening or closing the panel does not clear filter values.
- Live filter updates and the category picker retain their existing event handlers.
- On small screens, the expanded filters can scroll internally instead of pushing the results and footer offscreen.
- Filter panel state is preserved across result rerenders during an open popup, but resets to collapsed on the next new opening.

## 3. Display options preserved and made compact

The five v352 view modes remain present, with the active view highlighted and saved exactly as before. Their controls form a swipeable row rather than wrapping into multiple tall rows on narrow phones.

The Display tools panel controls:

- **Title text size:** 12–24 CSS px (default 15px).
- **Title cover size:** 36–180 CSS px (default 72px).

The sizing controls retain live preview and existing saved preferences under `settings.v352CollectionPicker`. Closing Display tools does not reset the selected sizes or view mode. Longer title names continue wrapping in text-bearing views, and category cover fallbacks remain supported.

## 4. Results and footer made more usable

- Main title results use the remaining height of the popup and scroll independently.
- Compact selection actions retain **Select visible**, **Deselect all**, and the selected/matching count.
- Pagination retains **24 titles per page** and Previous / Next buttons.
- **Cancel** and **Add selected** remain at the bottom of the popup with touch-friendly dimensions.
- Individual title checkboxes continue working across searches, filters, view changes, and page changes.
- The existing Collection title-addition and XP reward paths are not changed.

## 5. Desktop completely preserved

The new visual rules activate **only below 1024 CSS pixels**. Desktop receives no new visible controls, no new layout sizing, and no redesigned Add Titles popup.

At a tested **1280 × 900** desktop viewport, side-by-side rendered screenshots of the v352 and v353 Add Titles popup were **pixel-identical** for the same synthetic data fixture. Existing desktop filters, full display settings, result cards, and modal footer remain where they were.

## 6. Technical implementation

- **Runtime:** `src/js/components/251-v353-mobile-collection-picker-tools.js`
- **CSS:** `assets/css/179-v353-mobile-add-titles-tools.css`
- **Browser regression:** `tests/test-v353-picker-mobile.py`
- **Bundle:** `assets/js/mediaflow-v353.bundle.js`
- **PWA cache:** `mediaflow-pwa-v353-shell-v1`
- **Metadata:** `VERSION` 353, `version.json` 353, `package.json` 353.0.0, updated `index.html`, rebuilt `sw.js`.

The extension decorates the existing v352 modal instead of replacing its search, selection, and pagination logic. Mobile-only panel state lives in transient runtime state; no new user-data schema or cloud field was introduced.

## 7. Cloud, backup, import/export, XP, and PWA compatibility

| System | Status |
|---|---|
| Cloud Sync | v201 — existing state structure preserved |
| Sync Now | Existing workflow preserved |
| Full Backup / automatic backups | Schema 29 — unchanged |
| Settings Presets | Schema 1 — unchanged |
| Full Data Export/Import | Existing workflow unchanged |
| Personal Order Import/Export | Format 5 — unchanged |
| Collections Import/Export | Format 2 — unchanged |
| Consumption/XP History exports | Existing workflow unchanged |
| XP/Universal streak calculation | Existing v348 systems unchanged |
| PWA automatic updates and cache | Rebuilt for v353 |
| Supabase SQL migration | **Not required** |

## 8. Local verification

Compiled v353 bundle tested with headless Chromium at these viewport sizes:

- **Phones:** 320 × 640, 360 × 740, 390 × 844, 430 × 932 CSS px.
- **Tablets:** 768 × 900 and 820 × 1050 CSS px.
- **Desktop:** 1024 × 800 and 1280 × 900 CSS px.

Checks passed for: modal rendering, collapsed default controls, expanded filter/dropdown accessibility, independent Show/Hide interactions, short-viewport protection, all five view buttons, persistent title selection, search, filters, size sliders, working Add Selected, responsive title area, desktop-only control exclusion, JavaScript syntax, and v353 PWA generation.

**Verification limitations:** Browser emulation is not the same as testing on the user's physical Android phone. Live GitHub Pages deployment, authenticated Supabase readback, and installed-PWA updates were not independently verified.

---

## Release summary

**v350:** Initial mobile/tablet presentation.  
**v351:** Mobile layout regression repairs.  
**v352:** Readable Add Titles picker with five display modes and two sliders.  
**v353:** **Mobile-only collapsible Filters and Display tools, swipeable view modes, compact footer, and significantly more space for Collection title browsing.**

**Deployment:** Save a Full Backup before updating; once v353 is deployed, check Add Titles on the actual phone and allow the new PWA cache to activate.
