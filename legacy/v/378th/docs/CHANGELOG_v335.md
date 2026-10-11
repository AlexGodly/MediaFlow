# MediaFlow v335 — Statistics, Runtime Calculator & XP Settings Polish

**Release:** MediaFlow v335  
**Base:** MediaFlow v334 Modular  
**Created by:** Alex Godly  
**Supabase:** Unchanged from v333/v334 (new personal cloud backend)

## Runtime Calculator — Semantic Icons Fixed

- Removed the extra, generic circular icon that appeared alongside the v334 Carry-forward and Multi-row mode icons.
- Carry-forward now displays one representative carry/continue-arrow icon.
- Multi-row displays one stacked-rows icon.
- Continue with result now uses a forward-to-next-step icon instead of the unrelated generic icon.
- Explicitly opted these buttons out of automatic generic icon enhancement, including later redraws.
- Calculator math, modes, carry-forward history, saved state and responsive layout remain unchanged.

## Statistics — Navigation Scroll Fixed

- Entering Statistics from another page resets the page scroll to the top.
- Added a second post-render scroll reset to handle layout hydration and delayed rendering.
- Preserved scroll position during regular Statistics rerenders and interactions.
- Works with desktop and mobile navigation (`stats` route).

## Statistics — Component Order Updated

- Leveling remains the first progression component.
- Active Time Spent now appears immediately beneath Leveling (when enabled).
- Lifetime Achievements now follows Active Time Spent.
- If Active Time Spent is hidden, Lifetime Achievements follows Leveling when available.
- Preserves existing independent Statistics Components visibility preferences.

## Active Time Spent — Redesigned

- Introduced a more professional, theme-aware activity overview rather than the simple row list.
- Added a headline lifetime-time card and a prominently styled Time XP card.
- Added a compact three-metric summary for today's time, streak multiplier and XP earning rate.
- Added a seven-day foreground-time activity chart.
- Added a separate XP bonus summary for first episodes, title starts, Collection creation and Collection editing.
- Kept live time / time-XP updating via the existing v334 activity tracker.
- Added responsive mobile/tablet layouts and reduced-motion support.
- Kept no idle cap, no daily cap, background-tab exclusion and existing 10-minute cloud checkpoints.

## Leveling & XP — Missing Settings Fixed

- Corrected a v334 renderer integration issue: the reward fields were added to the old Settings HTML renderer, which the active v221 Settings page did not use.
- The fields are now inserted directly into the active **Settings → Progression → Leveling & XP** page renderer before the Settings search/navigation enhancements run.
- Added a dedicated, grouped **XP Rewards** panel under Leveling & XP.
- Configurable reward inputs:
  - **First episode XP** — 20 XP by default (new in v335).
  - **Start title XP** — 40 XP by default (v334).
  - **Create Collection XP** — 35 XP by default (v334).
  - **Edit Collection XP** — 10 XP by default (v334).
  - **Active time XP / minute** — 2 XP by default (v334; streak-multiplied).
- Values save through MediaFlow's existing `App.updateLeveling` settings handler.
- Searchable in Settings, resettable through existing per-setting / progression section resets, and backed up/synced as part of normal settings state.

## First Episode Milestone XP Added

- Episode-based titles now receive one configurable bonus when their progress changes from zero to a positive number.
- New titles started with progress directly through Dashboard logging also qualify.
- Previously started imported titles are not rewarded retroactively.
- Stored as `xpLedger.v335FirstEpisodeRewards`, keyed by title to prevent duplicate rewards.
- Included in the existing XP totals, level calculation, backup/import/export and merge flow.
- The reward respects the global Leveling enabled/disabled setting.
- It is independent of ordinary per-episode Consumption XP and first-title-start XP.

## Cloud & Compatibility

- Preserves the current v333 Supabase project, authentication and cloud-state schema.
- Keeps Cloud Sync Version **201**, Full Backup Schema **29**, and Settings Preset Schema **1**.
- v335 rewards use the existing cloud-state JSON; no new Supabase SQL migration needed.
- Retains all v334 XP, navigation, Collections and other personal features.
- Community backend remains unconfigured, as in v333/v334.

## Version, Bundle & PWA

- App version metadata updated to **335** (`VERSION`, `version.json`, `package.json`, `index.html`).
- Main bundle updated to `assets/js/mediaflow-v335.bundle.js`.
- Added runtime extension `src/js/components/233-v335-statistics-xp-calculator-polish.js`.
- Added stylesheet `assets/css/162-v335-stats-xp-calculator.css`.
- PWA app shell updated to `mediaflow-pwa-v335-shell-v1`.
- Updated service worker asset list for the v335 bundle and CSS.
- Included browser-level regression tests for XP fields, icons, achievements ordering and Statistics scroll behavior.

---

# v335 Release Summary

- Eliminated duplicate Runtime Calculator icons.
- Updated Continue with result to a meaningful forward icon.
- Fixed Statistics opening scrolled down.
- Positioned Lifetime Achievements below Active Time Spent.
- Redesigned Active Time Spent with lifetime KPIs, a seven-day chart and bonus breakdown.
- Fixed missing configurable XP rewards inside the active Settings screen.
- Added configurable first-episode XP and one-time reward tracking.
- Preserved existing MediaFlow features, data formats and Supabase connection.
- Updated app/PWA release metadata to v335.

**Version Progression:** v333 New Supabase Project → v334 Activity & Collection XP → **v335 Statistics & XP Configuration Polish**.

**Validation:** Syntax, ZIP/PWA integrity and targeted browser tests have passed. Live Supabase login/sync and GitHub Pages deployment have not yet been exercised for v335.
