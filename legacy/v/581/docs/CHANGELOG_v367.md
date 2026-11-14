# MediaFlow v367 — Settings Center 2.0 First-Paint Stability

**Release:** v367  
**Baseline:** MediaFlow v366 Modular (Personal Edition)  
**Date:** October 10, 2026  
**Developer:** Alex Godly

---

## 1. Fixed the legacy Settings design flashing before Settings Center 2.0

**Problem:** Opening Settings could briefly show the older v221 Settings layout and its navigation before the v365/v366 Settings Center replaced it. The registered Settings renderer inserted the legacy HTML, then used `setTimeout(..., 0)` to run page enhancers on a later task. The browser could paint the interim DOM between those tasks.

**Correction:** The registered page-rendering pipeline now runs the **Settings** page enhancers synchronously in the same JavaScript task as the initial HTML insertion. The v221 Settings registry and existing live controls are assembled into Settings Center 2.0 before the browser can paint the page.

- Eliminates the timer gap for Settings only.
- Preserves the original registration and reparenting of live Settings controls.
- Does not hide content behind a blank screen or loading splash.
- The final Settings home, categories, search, and navigation are ready by the time the render operation returns.
- Other MediaFlow pages continue using their established asynchronous enhancer schedule.

## 2. Guard against alternative rendering paths

A final v367 runtime wrapper checks whether Settings is still displaying the legacy layout after an alternate `renderView()` path completes. If necessary, it runs the canonical enhancer sequence synchronously.

This is a compatibility guard for render wrappers and older paths, not a second Settings implementation. The v365 `data-mf365-ready` guard prevents duplicate control relocation.

## 3. Settings refresh and theme stability

The existing v365 Settings patcher already synchronously enhanced newly replaced markup during settings updates. v367 retains that behavior and verifies it alongside the initial render fix.

- Opening and returning to Settings uses the upgraded layout immediately.
- Canonical Settings refreshes retain the active category and expanded controls.
- Changing theme variables and re-rendering does not expose the legacy design.
- Settings search, Favorites, section navigation, original handlers, and registered future settings are preserved.

## 4. Preserved Settings Center 2.0 and registry functionality

- All **28 existing Settings sections** remain accessible.
- The v366 metadata registration APIs remain available.
- Explicit category and subgroup placement, custom search keywords, and the **Uncategorized** fallback are unchanged.
- Existing Favorites, recently visited sections, search results, and contextual shortcuts remain functional.
- No duplicate controls or second Settings state store is introduced.

## 5. Source changes

**Updated:**

- `src/js/core/runtime/998-runtime-extension-foundation-v219.js` — Settings enhancer calls now run synchronously after registered page insertion.
- `src/js/runtime-order.json` — Includes the v367 compatibility module.
- `VERSION`, `version.json`, `package.json`, `index.html`, `README.md`, `sw.js` — v367 release metadata and app-shell assets.

**Added:**

- `src/js/components/265-v367-settings-first-paint.js` — Alternate-render fallback and v367 runtime registration.
- `tests/test-v367-settings-first-paint.py` — Prepaint, rerender, navigation, theme, and viewport regression.
- `tests/test-v367-settings-center.py`, `tests/test-v367-settings-coverage.py`, `tests/test-v367-future-registration.py`, `tests/test-v367-xp-regression.py`, `tests/test-v367-all-pages.py` — Re-run compatibility suites against the v367 bundle.

**Compiled runtime:** `assets/js/mediaflow-v367.bundle.js`  
**PWA cache:** `mediaflow-pwa-v367-shell-v1`

## 6. Local browser verification

Tested in Chromium with synthetic local account state at **320, 390, 820, 1280, and 1920 CSS pixels**.

### First-paint regression

- Rendered Settings through its actual registered runtime renderer, **without manually calling enhancers first**.
- Asserted that **zero legacy Settings pages** and exactly **one Settings Center** exist immediately after `renderView()` returns, before allowing a timer or animation frame.
- Checked the next two animation frames to confirm no legacy page appears.
- Repeated navigation away from and back to Settings **eight times at every viewport**.
- Verified a canonical settings patch, active category state, theme updates and XP controls.
- Detected no uncaught browser errors or page-level horizontal overflow in these tests.

### Existing Settings and app regressions

- All 28 original Settings sections, control search, favorites, registered settings and Uncategorized fallback passed.
- Expanded every Settings section at five viewport widths without detected horizontal overflow.
- XP reward and breakdown regression passed.
- Ten MediaFlow page families passed responsive smoke tests at twelve widths (320–1440 CSS px).
- JavaScript syntax, release consistency and PWA generation checks passed.

**Limitations:** Authenticated Supabase sessions, installed-PWA upgrade behavior, production GitHub Pages deployment and physical Android/iOS devices were not independently tested.

## 7. Data and backend compatibility

| Component | Compatibility |
|---|---|
| Cloud Sync | v201 — unchanged |
| Full Backup | Schema 29 — unchanged |
| Settings Presets | Schema 1 — unchanged |
| Personal Order import/export | Format 5 — unchanged |
| Collections import/export | Format 2 — unchanged |
| XP and streak rewards | Unchanged |
| Dynamic themes | Preserved |
| Supabase SQL migration | Not required |

---

**Version history:** v365 created Settings Center 2.0; v366 added declarative registration for future settings; **v367 eliminates the legacy-layout flash before Settings Center appears.**

**Deployment:** Replace the complete MediaFlow release, allow PWA assets to update and confirm that v367 is active. Verify Settings on the live account after taking a Full Backup.
