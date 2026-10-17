# MediaFlow v366 — Automatic Settings Discovery & Declarative Registration

**Release:** v366  
**Base:** v365 Modular Personal Edition  
**Date:** October 10, 2026  
**Developer:** Alex Godly

## 1. Settings Center Registration System

Added a **declarative Settings metadata registry** for future MediaFlow updates. New features can register their settings under a stable category, subgroup, and keyword list instead of relying on uncertain text-matching rules.

New public runtime API:

- `MediaFlowSettingsRegistry.registerCategory(...)`
- `MediaFlowSettingsRegistry.registerSection(...)`
- `MediaFlowSettingsRegistry.registerSetting(...)`
- `MediaFlowSettingsRegistry.refresh()`
- `MediaFlowSettingsRegistry.inspect()`

Registration metadata describes placement and search but does **not** replace the original saved settings, UI controls, handlers, or data models.

## 2. Explicit Classification for Existing Settings

All **28 existing Settings sections** now have registered metadata, including category, logical subgroup, and relevant search terms. The Settings Center no longer defaults unrecognized section names to **Library & Titles**.

The current Settings Center categories (Appearance, Library & Titles, Categories, Personal Order, Collections, Dashboard, XP & Statistics, Data & Cloud, Account & Privacy, App & Updates) are preserved. Contextual pages continue to be genuine shortcuts to their existing controls, not duplicate settings pages.

## 3. Uncategorized — Safe Fallback

An **Uncategorized** category automatically appears when an unfamiliar Settings section exists without registered metadata. Such sections remain available, functional, and searchable rather than silently being placed under the wrong category. Uncategorized stays out of the navigation when all sections have been registered.

**Important limitation:** MediaFlow cannot reliably infer the intended category from arbitrary new controls. A future feature must declare its category and subgroup to guarantee precise placement; unregistered sections go to Uncategorized instead of being guessed.

## 4. Search and Favorite Improvements

- Section and individual-control searches now also index registered **keywords**, category names and subgroups.
- Custom controls that do not follow ordinary `.field` markup can opt into search through a registered CSS selector.
- Search results continue to open the **original live control** and not a detached copy.
- Registered settings may use stable ids in Favorites; existing favorites keyed by labels remain supported.
- Original Settings navigation state and expanded sections remain intact through refreshes.

## 5. Settings Center Layout Organization

- Added small, theme-aware subgroup headings to organize related sections inside each category.
- Mobile retains the Settings home → category screen experience; desktop retains its permanent category index.
- All original 28 sections and their controls are still retained, including XP rewards and cloud maintenance controls.

## 6. Future Developer Integration

Added **`docs/Settings_Registration_v366.md`**, documenting the metadata API and how to integrate future settings with the canonical renderer. Future additions should declare their category, subgroup, keywords and stable ids when created.

## 7. Source Changes

- **New runtime:** `src/js/components/264-v366-settings-registration.js`
- **Updated v365 integration:** `src/js/components/263-v365-settings-center.js`
- **New styles:** `assets/css/192-v366-settings-registry.css`
- **New documentation:** `docs/Settings_Registration_v366.md`
- **New tests:** `tests/test-v366-future-registration.py`, `tests/test-v366-settings-center.py`, `tests/test-v366-settings-coverage.py`, `tests/test-v366-xp-regression.py`, `tests/test-v366-all-pages.py`
- **Built bundle:** `assets/js/mediaflow-v366.bundle.js`
- **PWA shell:** `mediaflow-pwa-v366-shell-v1`

## 8. Local Verification

- Browser Settings Center regression passed at **320, 390, 820, 1280 and 1920 CSS px**, preserving all 28 legacy sections, XP controls, search, Favorites and navigation state.
- New synthetic future-section tests passed at **320, 390, 1280 and 1920 CSS px**. They verified an explicitly registered Accessibility section, a nonstandard custom setting with searchable keywords, live-checkbox interactions, and correct Uncategorized fallback.
- Expanded all 28 original sections at five widths; no document-level horizontal overflow or uncaught browser exceptions occurred in the tested scenarios.
- XP rewards and progression regression passed.
- Ten application page families passed responsive smoke tests at twelve viewport widths from 320–1440 CSS px.
- JavaScript build, syntax, release checks and regenerated PWA asset list passed.

**Limits:** Browser tests use synthetic local data. Live Supabase authentication, deployed GitHub Pages updates, installed-PWA migrations, and physical Android/iOS were not independently tested.

## 9. Compatibility

| Component | v366 |
|---|---|
| Cloud Sync | 201 — unchanged |
| Full Backup | Schema 29 — unchanged |
| Settings Presets | Schema 1 — unchanged |
| Personal Order transfer | Format 5 — unchanged |
| Collections transfer | Format 2 — unchanged |
| XP & streak progression | Existing algorithms unchanged |
| Supabase SQL migration | Not required |

**Deploy the complete v366 modular release.** Back up the existing account first; after deploying, verify the new Settings Center and Sync Now in the actual account.
