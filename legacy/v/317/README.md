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
