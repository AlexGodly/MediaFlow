# MediaFlow v386 — Real Theme-Color Repair for Logging Browse Library

**Application:** MediaFlow  
**Version:** v386 Modular  
**Baseline:** v385 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Release type:** Targeted UI bug fix, regression-test improvement, PWA refresh  
**Status:** Built and locally tested

---

## 1. Problem: Browse Library stayed gray

v384 and v385 attempted to give the **Logging → Browse Library** header and expanded container a rich theme-dependent color. On actual MediaFlow themes, the container could remain gray, as reported after v385.

**Root cause found in the source:** The v383–v385 CSS used the variable `--accent`. MediaFlow's broadly available, user-configured theme accent is **`--flow`**. The `--accent` variable is defined only under certain legacy/native light-theme conditions. Where it was undefined, CSS `var(--accent)` made complete gradient declarations invalid, so the browser fell back to earlier neutral/gray styles.

**Why older tests passed:** v384/v385 local UI tests explicitly injected a test-only `--accent` value into the root element before checking gradient changes. That bypassed the failure seen in normal use.

## 2. Fix: Use MediaFlow's canonical theme accent

Added `assets/css/203-v386-logging-library-theme-repair.css` after the previous stylesheets.

- The Browse Library component now derives its primary theme color from `--flow`, the existing MediaFlow theme color token.
- A component-scoped `--accent: var(--flow, #438cff)` alias also makes older component rules valid, without changing the theme variables globally or affecting unrelated pages.
- The outer Library panel, **entire clickable header**, and **expanded Library body** now use coordinated, visibly colored gradients.
- Library icon, statistic chips, chevron, supporting title controls, field borders, and focus states use related theme colors.
- Light, dark, and custom theme settings continue to determine the final appearance automatically.
- Text, inputs and panels keep distinct surfaces for legibility; the fix does **not** apply one overwhelming flat fill to every control.
- The Library header and body preserve existing mobile padding and reduced-motion behavior.

## 3. Scope and data integrity

This change applies only to **Logging → Browse Library**, in **Quick Logging** and **Per Unit**. It preserves:

- Expand and collapse behavior;
- Search, filters, sorting, five title display modes, multi-selection, and bulk addition;
- Logging drafts, Library titles and progress, History, XP and streak calculations;
- Personal Order and Collections;
- Supabase Cloud Sync, backup/export/import formats and settings;
- About page branding and live XP improvements introduced in v385.

No application data schema, Supabase migration, XP calculation, or new API service was required.

## 4. Regression testing — real theme values

The new test script `scripts/test-v386-theme.py` uses the **actual compiled v386 application renderer and actual application stylesheets**. Unlike the earlier tests, it **does not invent `--accent` on the page root**.

| Test | Result |
|---|---|
| Browse Library created through `renderLogForm()` | Passed |
| No globally injected `--accent` | Verified |
| Theme change through real `--flow` | Passed |
| Header background uses a valid colored gradient | Passed |
| Expanded Library body uses a valid colored gradient | Passed |
| Real rendered header pixels are visibly blue with blue theme | Passed |
| Blue → pink theme recoloring | Passed |
| Quick Logging and Per Unit | Passed |
| Open/close and search control preservation | Passed |
| Light-theme sample | Passed |
| Chromium viewport widths 320, 390, 820, 1280, 1920 px | Passed |
| JavaScript syntax/build | Passed |

Example local screenshots included in the project:

- `docs/v386-header-blue-390.png`
- `docs/v386-header-blue-1280.png`
- `docs/v386-header-blue-light-1280.png`

The test deliberately checks screenshot pixels, not only computed CSS strings, to avoid repeating the false-positive validation that occurred in v385.

## 5. Release assets and PWA

Updated the application version to **386**, including `VERSION`, `version.json`, `package.json` and the HTML release metadata. Regenerated:

- `assets/js/mediaflow-v386.bundle.js`
- `sw.js` / PWA app-shell asset list
- PWA cache name `mediaflow-pwa-v386-shell-v1`

The new v386 CSS is loaded after v385 and included in the application's PWA asset set. This helps prevent an earlier gray-style asset from being served as the current release after an update, though installed-PWA update behavior on real devices still needs verification.

## 6. Limitations

Local Chromium tests establish that the delivered v386 theme CSS works with MediaFlow's real `--flow` variable, real Logging renderer, and simulated theme settings. **They do not establish that a currently deployed website or an installed PWA has been updated**, and cannot independently verify the user's specific stored theme, authenticated cloud sync or physical-device behavior. In a PWA still running older cached assets, the updated CSS will only appear once its application update is active.

No production-scale performance benchmark or percentage improvement is claimed, since this is a targeted style repair.

---

## 7. Version evolution

| Version | Primary change |
|---|---|
| v383 | Browse Library header and About Studio redesign |
| v384 | Attempted full theme-color header; About branding and version updates |
| v385 | Attempted full theme-color container; live XP/statistics updates |
| **v386** | **Root-cause fix: canonical `--flow` color, fully themed container, screenshot-verified regression tests** |

**MediaFlow v386 — The Browse Library finally follows the actual active theme, instead of falling back to gray.**
