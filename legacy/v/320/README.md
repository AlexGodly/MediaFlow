# MediaFlow v320 — Social Workspace Redesign & Statistics Navigation Repair

Built directly on **MediaFlow v319 Community Modular**, preserving the core Workspace, Community backend, XP/Level system, Cloud Sync and PWA.

## v320 changes

- **Friends:** Three fully functional tabs—Following, Followers and Mutuals—with separate per-tab searches, counts, contact cards, profile/message actions, accessible keyboard tab navigation and responsive empty states.
- **Inbox:** Redesigned two-pane conversation workspace with searchable user list, recipient header, avatar, message bubbles, composer, existing send/unsend/block/delete actions and a one-pane mobile conversation flow with a back button.
- **Statistics:** Navigating into Statistics now starts at the **top**, resetting retained Workspace scroll position without jumping on internal rerenders.
- **Collections:** The dark saved Community Collections empty box is replaced with a professional current-theme panel, bookmark symbol, explanatory text, and **Explore Collections** action.
- **Dynamic themes:** All newly designed surfaces use the selected MediaFlow theme variables (no forced light/dark appearance).
- **No SQL migration.** Existing social schemas, public visibility, XP, rankings, and data formats are unchanged.
- **Testing:** 132 dedicated browser assertions plus 244 inherited XP, Browse and Workspace/Collections regressions passed (376 total).

## Deployment

Deploy the full ZIP to GitHub Pages (not just `index.html`). Main runtime: `assets/js/mediaflow-v320.bundle.js`; React chrome: `assets/js/mediaflow-v320-react-ui.js`; social styling: `assets/css/177-v320-social-friends-inbox-collections.css`. Updated PWA cache: `mediaflow-pwa-v320-shell-v1`.

Data compatibility: Cloud Sync v201 · Full Backup v29 · Settings Presets v1 · Personal Order v5 · Collections v2.

See `docs/CHANGELOG_v320.md` for details. Earlier release notes follow below.

---

# MediaFlow v319 — Single Community Refresh Icons

Built directly from **MediaFlow v318 Community Modular**. Fixes the duplicate refresh glyph caused when legacy button-icon enhancements decorated an already-iconified Community Refresh now button.

## v319 changes

- **Browse Titles, Community Collections, People/Rankings, and Community Ratings:** all **Refresh now** buttons now show **exactly one** refresh icon followed by their label.
- **Prevent future duplication:** the existing global semantic-icon pass now skips redundant icons for these specific Community buttons even after rerenders and manual refreshes.
- **Preserved:** v318 Ratings-style full-width freshness bars, green update indicators/timestamps, responsive themes, refresh behavior, Statistics order, XP calculations, and previous user data formats.
- **No new SQL migration** or extra automatic refresh traffic.

## Deployment

Deploy the complete ZIP contents to GitHub Pages. Main JS: `assets/js/mediaflow-v319.bundle.js`; React UI: `assets/js/mediaflow-v319-react-ui.js`; new styling: `assets/css/176-v319-community-single-refresh-icon.css`. The PWA cache is `mediaflow-pwa-v319-shell-v1`, so refresh/reload installed PWAs to receive the new files.

Cloud Sync v201 · Full Backup v29 · Settings Presets v1 · Personal Order v5 · Collections v2.

See `docs/CHANGELOG_v319.md` for details; the preceding release notes follow for historical reference.

---

# MediaFlow v318 — Ratings-Style Refresh Bars & Statistics Leveling Hierarchy

Built directly from **MediaFlow v317 Community Modular**. This release is a layout-focused refinement. All v317 XP mechanics, v316 active-time accrual, public Community functionality, filters, live refresh behavior, existing profiles/Collections, and backups remain in place.

## v318 changes

- **Browse Titles, Community Collections and People & Rankings:** The v317 small heading refresh control is replaced with a **full-width Ratings-style freshness strip** beneath the relevant controls, showing the green auto-update indicator, updated time, and right-aligned Refresh now action. Responsive at desktop/tablet/mobile/narrow widths. The refresh RPCs and approx. 120-second automatic updates remain unchanged.
- **Statistics:** Main component order is **User Profile → Leveling → Time spent in MediaFlow → Lifetime Achievements**. Individual visibility settings and full XP calculations remain unchanged.
- **No new database migration** and no changes to persisted data schema.

## Deployment

Deploy the full ZIP contents (not just `index.html`) to GitHub Pages. Main JS: `assets/js/mediaflow-v318.bundle.js`; React chrome: `assets/js/mediaflow-v318-react-ui.js`; styles: `assets/css/175-v318-community-freshness-statistics.css`. PWA shell: `mediaflow-pwa-v318-shell-v1`. Reload or update the installed PWA to receive refreshed assets.

Cloud Sync v201; Full Backup v29; Settings Presets v1; Personal Order v5; Collections v2.

See `docs/CHANGELOG_v318.md` for complete details. The previous v317 release notes follow for historical reference.

---

# MediaFlow v317 — Leveling & XP Visibility, More Rewarding Starts/Logs, Statistics Layout & Live Community Refresh

Built directly on **MediaFlow v316 Community Beta**, retaining its account-level active-time XP engine, public profiles/rankings, Browse, Collections, Quick Add, history, backups, cloud sync, settings, dynamic themes, PWA, and responsive layouts.

## What's new in v317

- **Settings → Leveling & XP:** the **Active Time XP** controls finally appear in the *active* Settings page rather than a deprecated renderer. Configure time-XP enablement, minutes per reward, XP per interval, idle timeout, and streak multiplier. Default remains **5 XP per 10 eligible minutes**, with no daily cap.
- **More generous consumption XP:** the default unit reward for **one episode** increases from **10 to 20 XP**. Episode rewards remain directly customizable in Settings → Leveling & XP; other category unit rewards remain independently configurable. Existing accounts that still had the exact v316 factory default (10) upgrade to 20 once. Non-default custom episode rewards are preserved.
- **Start a title XP:** **50 XP** by default, customizable in the same Settings section (0–100,000). Awarded **once per title** upon the first actual start/first progress; not for repeated pause/resume. Existing titles are not retroactively rewarded just because the app upgrades. One-time earned values are preserved in the standard XP ledger and merged across cloud sync.
- **XP and rankings:** title-start rewards flow into the same cached XP / Level calculator as sessions, completions, streaks, ratings and saved time XP; Calculate XP Now uses the new episode value. Published user totals and ranks are synchronized through the existing v312 public-profile mechanism for accounts that enable public profile/XP visibility. The Statistics Leveling card shows Started Title XP and Active-Time XP separately so its components reconcile to lifetime XP.
- **Statistics:** the first three components are **User Profile (titles / sessions / hours consumed) → Time Spent in MediaFlow → Lifetime Achievements**, respecting existing component visibility settings.
- **Community:** Browse Titles, Community Collections, and Users/Rankings now have a **Refresh now** control that fetches fresh data without changing the current search, sort, filter, page or view. They also refresh automatically approximately every two minutes while visible and idle. Existing optimized Ratings (45-second revision) and Users (50-second revision) background checks remain enabled.

## Supabase compatibility

**No new SQL migration is necessary for v317.** The existing time-credit backend from `docs/SQL_v316_time_xp_activity.sql` must already be installed in the target Supabase project to accrue active-time XP. Ratings/Community require the existing earlier schema migrations. The one-time title-start reward is kept in the existing cloud-backed JSON state; backup/import and cloud-sync format versions do not change.

Community rankings reflect only the user's **publicly shared** XP and Level. A MediaFlow Verified badge indicates match against shipped XP configuration defaults; it is not a server-side anti-cheat certification.

## Deployment

Deploy the **full ZIP contents** to GitHub Pages, including `index.html`, `404.html`, `sw.js`, the `assets/` tree and bundled icons. Main JS is `assets/js/mediaflow-v317.bundle.js`; React chrome is `assets/js/mediaflow-v317-react-ui.js`; the v317 CSS is `assets/css/174-v317-progression-refresh.css`. Cache version: **`mediaflow-pwa-v317-shell-v1`**. Reload an installed PWA after deployment to pick up versioned assets.

## Compatibility

Cloud Sync **v201**, Full Backup **v29**, Settings Presets **v1**, Personal Order Export **v5**, Collections Export **v2**. No private user Library data is intentionally deleted or rewritten by the v317 feature upgrade.

## Validation

Dedicated Playwright/Chromium XP + Settings + Stats + Community tests pass **69 assertions** at 1440px, 390px and 320px; compatibility tests against the v317 bundle pass **82 active-time XP assertions**, **39 Browse assertions** and **54 Workspace/Collections assertions**. Tests use simulated users and database responses; a live multi-account Supabase/deployed-GitHub-Pages verification has not been performed here.

See `docs/CHANGELOG_v317.md` for full release details.
