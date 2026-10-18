# MediaFlow v385 — Live Leveling, Full-Color Logging Library & About Alignment

**Application:** MediaFlow  
**Version:** v385 Modular  
**Baseline:** v384 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Release type:** Interface refinement, data-reactivity repair and save-status accuracy  
**Status:** Built and tested locally

---

## 1. Logging → Browse Library: complete theme-colored workspace

**Problem:** After the v384 header update, the expanded Library panel could still appear pale/gray next to the active theme's colored Logging panels, particularly with a blue accent.

**Implementation:**

- The entire `.mf383-logging-library` shell, summary **and expanded `.mf383-logging-body`** now use complementary gradients derived from the active `--accent`, `--panel` and `--panel-raised` CSS variables.
- Coordinated borders, soft depth, search section and form-control surface treatments make the Library workspace look like a single themed component.
- Inputs retain readable contrast; accent changes recolor both the header and expanded Library body without a reload.
- The styling applies to Quick Logging and Per Unit. All existing Library search, filters, multi-select, five display modes and draft-add behavior remain inherited and unchanged.

## 2. About: optical alignment of logo and wordmark

**Problem:** In the About Studio hero, the official MediaFlow logo was positioned relative to the combined heading and version subtitle, making it appear low beside **MediaFlow.**

**Implementation:**

- The brand lockup now uses an explicit two-row grid. The real MediaFlow logo and **MediaFlow.** heading share the first row; the version subtitle occupies the row beneath the heading.
- The official packaged `assets/icons/mediaflow-192.png` logo is preserved at its original aspect ratio and visual quality.
- Responsive grid dimensions and font sizing prevent overlap on small screens.
- The simplified **By Alex Godly** branding and canonical, dynamically sourced About version information remain unchanged.

## 3. Sidebar and Statistics: live XP/level/streak updates

**Problem:** The app's normal view render refreshed the main content but often left the sidebar Leveling block unchanged until a full page refresh. Statistics could similarly lag behind updates made elsewhere.

**Implementation:**

- A shared, event-driven XP presentation updater refreshes the **sidebar Leveling** card and **Statistics → Leveling** card together.
- Sidebar fields: level, total lifetime XP, level XP, level progress bar, XP remaining, day streak and streak multiplier.
- Statistics fields: level, lifetime XP, consumption XP, Library XP, level XP, percentage, remaining XP and progress bar.
- The updater reuses canonical `mediaFlowLevelInfo()`, the existing v150 live XP cache, `libraryXPTotal()`, and the established streak formula. It **does not alter XP awards, ledger contents, streak rules, History or level thresholds**.
- Relevant XP invalidation, app rendering, cloud state loading and persistence actions request updates automatically.
- Rapid events are coalesced into a single ~75 ms deferred update. Only the affected text and progress-bar elements are patched; **the full Statistics page, Library list and sidebar are not rebuilt**.
- Statistics is patched only when it is the active page. Navigation remains intact, and no polling loop was introduced.

## 4. Cloud save indicator: do not claim an unverified save

**Problem:** The sidebar previously displayed “Saved to cloud storage” as fixed copy, even when no cloud write had been confirmed.

**Implementation:**

- **Cloud status not verified** — before an observed successful save.
- **Sync pending** — when a permitted cloud save has started and remains queued/in progress.
- **Saved to cloud storage** — only after the existing `saveState()` chain resolves without a reported failure.
- **Cloud save failed** — when the existing pipeline reports an unsuccessful save.
- The indicator observes the current save queue; it does **not** create additional cloud writes or falsely treat local-only state as a verified cloud save.
- The underlying Supabase upload, retry, offline recovery and Sync Now systems remain unchanged.

## 5. Implementation and build

| Artifact | Change |
|---|---|
| `src/js/components/281-v385-live-leveling-themed-library.js` | New live XP UI updater, save feedback observer and render/invalidation integration |
| `assets/css/202-v385-themed-library-leveling.css` | Theme-colored full Logging Library and About hero alignment |
| `src/js/runtime-order.json` | Registers the v385 extension after v384 |
| `assets/js/mediaflow-v385.bundle.js` | Rebuilt modular bundle |
| `index.html` | New stylesheet and v385 release/bundle metadata |
| `VERSION`, `version.json`, `package.json` | v385 release metadata |
| `sw.js`, `manifest.json` | Regenerated current PWA shell |
| `scripts/test-v385-ui.py` | Chromium UI, live XP and simulated save-status test harness |
| `README.md`, `README2.md`, `docs/CHANGELOG_v385.md` | Updated documentation |

**PWA cache:** `mediaflow-pwa-v385-shell-v1`.

No database schema changes, Supabase migrations, Edge Functions, new credentials or paid services were introduced.

## 6. Testing results

| Validation | Result |
|---|---|
| Modular JavaScript syntax (`node --check`) | Passed |
| Chrom(ium) browser UI at 320, 390, 820, 1280, 1920 px | Passed at all five widths |
| About hero icon/wordmark centerline alignment | Passed |
| Library header **and expanded body** recolor on theme change | Passed |
| XP change updates sidebar without navigation/reload | Passed |
| XP change updates active Statistics Leveling without navigation/reload | Passed |
| Cloud indicator starts unverified rather than falsely saved | Passed |
| Simulated successful save updates indicator | Passed |
| Simulated failed save updates indicator | Passed |
| Compiled bundle references and ZIP integrity | Checked in package audit |

Tests used synthetic user state, real Chromium rendering and controlled cloud-save success/failure stubs. **Actual authenticated Supabase synchronization, real account-scale performance, multiple device reconciliation and installed PWA upgrades were not verified.** No numerical production performance improvement is claimed.

## 7. Compatibility and regression protection

The release preserves MediaFlow's Library and Logging modes, pending drafts, Personal Order, Collections, XP/History, Automatic Multi-Provider, category ordering, dynamic themes, existing export/import and backup formats, Cloud Sync and PWA controls. v385 adds no persistent data fields and no XP formulas.

## 8. Version evolution

| Version | Major focus |
|---|---|
| v379 | Logging recovery and mixed Personal Order queues |
| v380 | Five-provider anime episode detection |
| v381 | Provider reliability and diagnostics |
| v382 | Recommended title direct addition and Per Unit progress outlook |
| v383 | About Studio, FAQs and persistence audit |
| v384 | Themed Logging header and official About branding |
| **v385** | **Full themed Logging Library, About alignment, live XP/Statistics and true save feedback** |

---

**Developed by Alex Godly · MediaFlow v385**
