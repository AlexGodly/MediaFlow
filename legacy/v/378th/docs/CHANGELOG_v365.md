# MediaFlow v365 — Settings Center 2.0

**Release:** v365  
**Base:** MediaFlow v364 Modular, Personal Edition  
**Date:** October 10, 2026  
**Developer:** Alex Godly  
**Focus:** Professional responsive Settings navigation without losing existing controls

---

## 1. New Settings Center Home

- Replaced the old mobile horizontal section scroller and the enormous all-sections-at-once page with a dedicated **Settings home**.
- Added a professional section browser with descriptive category cards, clear icons, and a search field immediately available at the top.
- Built a dedicated category-view experience with **Back** navigation on mobile and tablet.
- Organized the desktop interface around a persistent categorized sidebar and spacious content pane, using the same actual Settings controls and data.
- Used MediaFlow's existing theme variables for cards, borders, text, accent highlights, and focus states.

## 2. Ten Logical Settings Destinations

1. **Appearance** — themes and navigation.
2. **Library & Titles** — display modes, filters, cover sizing, logging defaults, Library integrity, overview and maintenance.
3. **Categories** — category management, artwork and category maintenance.
4. **Personal Order** — direct shortcut to the original Personal Order controls, including its Queue Tools. These contextual preferences live on the Personal Order page rather than in duplicate Settings controls.
5. **Collections** — direct shortcut to existing Collection browsing, covers and management controls.
6. **Dashboard** — Dashboard preferences, daily goals and title recommendations.
7. **XP & Statistics** — progression, activity rewards and Statistics preferences.
8. **Data & Cloud** — Sync Now/cloud settings, backups, transfers, Settings presets, data actions.
9. **Account & Privacy** — direct shortcut to the Account/Profile page, where these actions already exist.
10. **App & Updates** — application updates, MediaFlow system behavior and scheduler tuning.

A total of **28 pre-existing Settings sections** remain in the newly grouped interface. Contextual destinations are intentional shortcuts to the original canonical page, not placeholders that pretend to offer missing settings.

## 3. Dedicated Category Views and Expandable Sections

- Each category opens its own focused screen, rather than forcing mobile users to browse a massive document.
- Existing Settings sections are organized into independently expandable panels.
- Closed sections do not occupy vertical space or overwhelm the screen.
- Control elements are **reparented**, not duplicated or rewritten: original input/select/button handlers and registered defaults are preserved.
- The existing per-setting and per-section default/reset controls remain available where previously supported.
- The original **Restore all defaults** operation is restored within Data & Cloud, separated as a cautionary action and retaining its original confirmation dialog.

## 4. Universal Search, Including Individual Settings

- Search all existing 28 settings sections by title, labels, descriptions, and control text.
- Find **individual controls** (e.g. first-episode XP) rather than only matching broad section headings.
- Search results include their Settings category and parent section.
- Selecting a result navigates to the corresponding category, expands its section, scrolls to the target control and briefly highlights it.
- Added a small set of related search terms for common synonyms (cover/poster/artwork, cloud/sync/backup, etc.).
- Search works from both Settings overview and individual categories.

## 5. Favorites and Recently Visited

- Pin favorite Settings **sections** using a distinct star control.
- Pin frequently used **individual controls** directly from search results.
- Pinned items appear as quick shortcuts on the Settings home.
- Favorites persist through existing MediaFlow settings state under `settings.v365SettingsCenter.favorites`.
- Recently visited sections are shown on the Settings home during navigation and kept in the same settings state object.
- No duplicate data records or separate cloud backend are required.

## 6. Desktop and Mobile Presentation

**Mobile (up to 1023 CSS px):**
- Single-column category list with readable names and descriptions.
- Compact full-width search.
- Clear Back navigation within the Settings page.
- Expand only the section currently needed.
- Existing complex controls use available width without page-level horizontal scrolling.

**Desktop (1024 CSS px and wider):**
- Permanent categorized Settings sidebar.
- Two-column Settings home browser.
- One dedicated content pane for each Settings category.
- Compact expandable panels to keep advanced sections easy to locate without dominating the layout.

**Accessibility and consistency:**
- Buttons remain keyboard-operable.
- Disclosures expose `aria-expanded`; favorites expose `aria-pressed`.
- Distinct controls use meaningful icons.
- Respects reduced-motion preferences and MediaFlow's dynamic themes.

## 7. Settings Refresh & Compatibility Fix

The original v265 in-place Settings patcher used the old v221 renderer when a setting changed. That could discard later additions to the active Settings page, including XP fields added in v335 and v348.

v365 updates the v265 patcher with a safe optional Settings Center hook:

- The active v348 Settings renderer remains the canonical source on refresh.
- Settings Center category, navigation and search state are restored following the refresh.
- Expanded sections and original controls continue using the existing MediaFlow handlers.
- No Settings rewrite or new data tables are required.

## 8. Existing Data and Feature Preservation

| Component | Compatibility |
|---|---|
| Cloud Sync | 201 — unchanged |
| Full Backup | Schema 29 — unchanged |
| Settings Presets | Schema 1 — unchanged |
| Personal Order import/export | Format 5 — unchanged |
| Collections import/export | Format 2 — unchanged |
| XP and universal streak rewards | Unchanged |
| Dynamic themes | Preserved |
| Supabase migration | **None required** |

Existing Library/Collection data, Personal Order assignments, queue positions, settings controls, XP ledger, cloud sync and backups are not intentionally modified by this navigation redesign.

## 9. Implementation Files

**New:**
- `src/js/components/263-v365-settings-center.js` — Settings Center navigation, search, Favorites, context links, and original control integration.
- `assets/css/191-v365-settings-center.css` — responsive desktop/mobile design and theme-aware styling.
- `tests/test-v365-settings-center.py` — browser search, Favorites, original control presence and rerender regression.
- `tests/test-v365-settings-coverage.py` — full section/viewport coverage.

**Updated:**
- `src/js/components/199-v265-ux-stability-library-balance-sidebar.js` — opt-in Settings patch callback for the v365 canonical renderer.
- `src/js/runtime-order.json`
- `index.html`, `VERSION`, `version.json`, `package.json`, `README.md`, `sw.js` and PWA cache references.

**Bundle:** `assets/js/mediaflow-v365.bundle.js`  
**PWA shell cache:** `mediaflow-pwa-v365-shell-v1`

## 10. Local Testing

Tests run in headless Chromium using **synthetic, local account data**, not the user's live Supabase account.

- Settings Center interaction suite: **passed** at widths **320, 390, 820, 1280, 1920** CSS px.
- Verified **all 28 original Settings sections** remain available and XP settings remain present after Settings refresh.
- Tested category browsing, Favorites, individual-setting search, contextual page shortcuts and navigation persistence.
- Expanded **all 28 sections independently at each of those five widths**; no horizontal document overflow or browser exceptions reported.
- XP reward regression: **passed**; calculated XP totals matched the existing breakdown.
- App regression smoke tests: **10 page families at 12 screen widths (320–1440 CSS px) passed**.
- JavaScript build, syntax checks, release integrity and PWA generation: **passed**.

**Not independently verified:** physical iOS/Android devices, authenticated production Supabase synchronization, actual GitHub Pages deployment, and installed PWA upgrades. These should be tested after deploying a backed-up account.

---

## Version Evolution

**v363:** Personal Order desktop/mobile organization and performance.  
**v364:** Personal Order List/Collection Queue layout and cover fixes.  
**v365:** **Settings Center 2.0 — responsive Settings home, dedicated categories, individual-setting search, Favorites, desktop sidebar, and original Settings-control parity.**

**Deployment:** Keep a Full Backup, upload the complete v365 modular project, confirm the active version, then test a few saved settings, Cloud Sync and XP settings with your actual account.
