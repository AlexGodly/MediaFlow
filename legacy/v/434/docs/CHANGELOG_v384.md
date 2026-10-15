# MediaFlow v384 — Theme-Colored Browse Library & Dynamic About Branding

**Application:** MediaFlow  
**Version:** v384 Modular  
**Baseline:** v383 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Type:** Visual refinement, brand consistency, dynamic release metadata  
**Status:** Built and locally tested  

## 1. Logging → Browse Library: fully theme-colored header

The v383 Library header had a refined layout but retained an overly plain, near-neutral background. v384 applies a full-width themed color treatment across the **entire clickable header**, from the icon to the right-hand counters and expand chevron. This is a complete background treatment, not a border-only or accent-only adjustment.

- Rich multi-stop gradient constructed from MediaFlow's live `--accent`, `--panel` and `--panel-raised` variables using `color-mix()`.
- Accent-rich container border, layered subtle depth and hover response.
- The icon surface, title, subtitle, counters and expand/collapse control use coordinated, contrast-conscious theme colors.
- Header stays colored while open and closed. The expanded Library body retains its separate functional workspace styling.
- Dynamic themes recolor the entire header without hardcoded brand colors or a page refresh.
- Works in **Quick Logging and Per Unit**, including narrow mobile layouts.
- Existing Library searching, sorting, filtering, selection, bulk add, Add/Added and lazy expand/collapse behavior remain unchanged.

## 2. About: actual MediaFlow logo

Replaces the generic map-like icon directly beside the large About-page MediaFlow heading with the existing packaged brand asset: `assets/icons/mediaflow-192.png`.

- Displays the authentic MediaFlow symbol without stretching or recoloring its artwork.
- Uses a proportionally sized responsive image with a theme-aware border and subtle shadow.
- Preserves the original brand asset in the package; no additional external image requests.
- Keeps the decorative hero orbit and existing About Studio layout untouched.

## 3. About: remove “Personal Edition” copy

Simplifies the About branding to **MediaFlow · By Alex Godly**.

- Hero eyebrow now reads `BY ALEX GODLY`.
- Removes “Personal Edition” from the About FAQ answer that identifies the creator.
- Preserves author attribution, update controls, About hero actions, 45 FAQs, 24 Fun Facts and the evolution timeline.
- This request applies to **the About page**; previous historical release notes and other application features were not renamed globally.

## 4. About: future-proof version indicators

Previously the About hero and stats could be correct for one release while older fixed content risked drifting. v384 uses the canonical version value from the app's `<meta name="mediaflow-version">` entry via `v161CurrentVersion()` for all current-release displays.

- Hero: `VERSION 384 · YOUR MEDIA UNIVERSE` for the current build.
- About Statistics: `v384` for the current build.
- Both derive from the **same dynamic runtime source**, not a literal release number.
- Future version builds only need their normal `VERSION` and `index.html` metadata updates: About renders the new number automatically.
- Adds `App.v384AboutCurrentVersion()` for validation and future reuse.
- Existing version/update controls remain intact.

## 5. Technical changes

| File / system | Update |
|---|---|
| `src/js/components/280-v384-theme-brand-version.js` | New About brand/version wrapper and FAQ label cleanup |
| `assets/css/201-v384-theme-brand-version.css` | Full-surface themed Logging Library header and responsive About logo |
| `src/js/runtime-order.json` | Registers v384 extension after v383 |
| `assets/js/mediaflow-v384.bundle.js` | New compiled runtime |
| `VERSION`, `version.json`, `package.json` | v384 metadata |
| `index.html` | Current bundle/CSS/version metadata |
| `sw.js`, `manifest.json` | Regenerated application shell and manifest |
| `README.md`, `README2.md`, `docs/CHANGELOG_v384.md` | Updated project and release documentation |

**PWA shell identifier:** `mediaflow-pwa-v384-shell-v1`. Existing install/update preferences and service-worker application logic remain unchanged. No new SQL migrations, Edge Functions, credentials or paid services.

## 6. Validation

Chromium browser checks passed at **320, 390, 820, 1280 and 1920 px**, covering:

- About page renders with the official packaged MediaFlow logo; image successfully loads (`192 × 192`).
- No “Personal Edition” wording remains in the rendered About page.
- Both About current-release indicators render `384` from runtime metadata.
- Simulating the future release `385` updates both About indicators with **no v384 source edit**.
- Changing the live `--accent` variable changes the *computed CSS gradient for the entire header*.
- Browse Library toggle still opens the existing workspace.
- About Studio retains all **45 FAQs**, **24 Fun Facts**, and Version & updates controls.
- No browser page errors in the tested scenarios.
- JavaScript syntax validation and ZIP integrity validation passed.

**Limits:** These are browser tests with synthetic local state, not a live hosted PWA update, Supabase account sync test, or physical-device validation. No performance percentages are claimed.

## 7. Compatibility

Logging, Library, Personal Order, Collections, XP, History, Cloud Sync, data export/import, backups, Automatic Multi-Provider, themes, PWA and About update actions remain integrated through the established v383 baseline. This release is focused on presentation and About metadata; **no XP formulas, media data structures or synchronization schemas were modified**.

## 8. Evolution

| Release | Milestone |
|---|---|
| v379 | Logging recovery and mixed title/Collection ordering |
| v380 | Five-provider episode detection and improved Logging |
| v381 | Multi-provider reliability and diagnostics |
| v382 | Direct recommended titles, XP summary and Per Unit progress outlook |
| v383 | About Studio, FAQ/Fun Facts and data-integrity audit |
| **v384** | **Full-theme Logging Library header, official About logo and dynamic version branding** |

---

**MediaFlow v384 — designed by Alex Godly.**
