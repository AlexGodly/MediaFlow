# MediaFlow v325 — Native Workspace Pages for Public Profiles

**Base:** v324 Community Modular · **Release date:** October 9, 2026 · **Status:** Community Beta

The public-profile Library, Collections, Personal Order, Old System and History now call the same native Workspace rendering functions as the owner's Workspace, fed by a separate, owner-published data set. The Statistics tab continues using sanitized actual Workspace-generated Statistics markup. Read-only browsing controls are preserved where safe; all write operations remain unavailable to visitors. The visitor's own private state is always restored after a native render.

**REQUIRED:** Install `docs/SQL_v325_workspace_public_state.sql` on top of the existing v323 Supabase migration before deploying the native tab experience. Then open Public Profile → Profile Studio and click **Refresh published pages** to publish the expanded state. This release package does **not** automatically apply SQL to your live project.

Details: `docs/CHANGELOG_v325.md` and `docs/DEPLOY_v325.md`. Native runtime: `src/js/components/249-v325-native-workspace-public.js`. Styles: `assets/css/181-v325-native-workspace-public.css`. App bundle: `assets/js/mediaflow-v325.bundle.js`. PWA cache: `mediaflow-pwa-v325-shell-v1`.

---
# MediaFlow v324 — Workspace-Style Public Profile Tabs

**Base:** v323 Community Modular · **Release date:** October 8, 2026 · **Status:** Community Beta

All six public-profile tabs now use professional **Workspace-inspired, read-only page layouts** instead of v323's small generic cards. Library has status/category shortcut strips, search/filters, sorting, List/Compact/Cards/Covers views, title details and pagination; Collections has its gallery views and public Open/Subscribe; Personal Order has title positions, category grouping and assigned Collection previews; Old System offers System/View/Statistics modes; History has chronological grouped activity; Statistics uses a larger secure published snapshot viewport.

**No new SQL migration.** Your already-applied v323 public-showcase migration is sufficient. After deploying, select **Refresh published pages** in Profile Studio to publish the enriched Personal Order data. Public pages are read-only counterparts using explicitly published data; they are not exact clones of every private Workspace interaction or live state.

See `docs/CHANGELOG_v324.md` and `docs/DEPLOY_v324.md` for details, instructions, and validation.

Frontend bundle: `assets/js/mediaflow-v324.bundle.js` · CSS: `assets/css/180-v324-workspace-public-mirrors.css` · React: `assets/js/mediaflow-v324-react-ui.js` · PWA: `mediaflow-pwa-v324-shell-v1`.

---

# MediaFlow v323 — Public Profile Showcase & Profile Studio

**Base:** v322 Community Modular · **Release date:** October 8, 2026 · **Status:** Community Beta

Major public-profile redesign: cover + avatar hero, Level/XP progression, always-visible categories, favorites, socials, multiple Discord names, and six owner-selectable public read-only sections (Library, Collections, Personal Order, Old System, History and Statistics). The new Profile Studio allows editable identity/artwork, sections ordering and visibility, searchable favorite selection, social links, and automatic publication of selected sections. Guest profiles get an artwork-derived color theme; signed-in viewers can choose their own MediaFlow theme or the owner's profile theme.

**REQUIRED:** Apply `docs/SQL_v323_public_showcase.sql` to your Supabase project using the SQL editor after previously required Community migrations. This was not done automatically. **Back up existing data and review the content you are making public before Save and publish.**

Published read-only pages use snapshots rather than an exact clone of Workspace editing components. To refresh them later, use **Refresh published pages**. Screens may show stale data until republished. See `docs/CHANGELOG_v323.md` for full features, limits and test results, and `docs/DEPLOY_v323.md` for migration and deployment steps.

JavaScript: `assets/js/mediaflow-v323.bundle.js` · React: `assets/js/mediaflow-v323-react-ui.js` · CSS: `assets/css/179-v323-public-profile-showcase.css` · PWA: `mediaflow-pwa-v323-shell-v1`.

---

# MediaFlow v322 — Sidebar Avatar/Name Open Your Public Profile

Built directly on **MediaFlow v321 Community Modular**. Clicking your avatar or display name in the Workspace sidebar footer now opens **your public Community profile**, using the logged-in account's published username. **Logout** stays independent, and the private **Account** page remains available through its usual navigation.

If no public profile is enabled, MediaFlow opens **Public Profile** setup instead; it never silently enables public sharing. Profile lookup errors show a retry message.

**No Supabase migration, XP change, data schema change, or theme change.** Full browser tests cover responsive routing and the inherited v321 functionality. Main runtime: `assets/js/mediaflow-v322.bundle.js`; React shell: `assets/js/mediaflow-v322-react-ui.js`; PWA cache: `mediaflow-pwa-v322-shell-v1`.

See `docs/CHANGELOG_v322.md` for full details.

---

# MediaFlow v321 — Semantic Friends Icons & Flash-Free Saved Collections

Built directly on **MediaFlow v320 Community Modular**, retaining the Friends/Inbox redesign and all existing Community, Workspace, XP, and cloud functionality.

## v321 changes

- **Friends:** Following now uses a user-check icon, Followers a user-plus icon, and Mutuals a linked-users icon. Each icon is present on first paint and will not be replaced by the legacy generic arrow.
- **Collections:** eliminated the brief old dark loading box by making the original saved-Collections source renderer produce the same current-theme panel for both loading and empty states.
- **Dynamic themes:** the new tabs and loading state inherit existing MediaFlow theme variables.
- **Preserved:** all searches, tabs, messages, saved Collection data, Statistics scroll behavior, XP calculations, Community features, and automatic refresh mechanisms.
- **No new Supabase migration.**
- **Browser validation:** 68 dedicated v321 assertions, 132 inherited v320 social checks, and 244 XP/Browse/Workspace regression assertions passed.

## Deployment

Deploy the complete ZIP to GitHub Pages. Main JS: `assets/js/mediaflow-v321.bundle.js`, React chrome: `assets/js/mediaflow-v321-react-ui.js`, new CSS: `assets/css/178-v321-social-tabs-collections-first-paint.css`. The PWA shell is `mediaflow-pwa-v321-shell-v1`; reload installed PWAs to receive updated assets.

Data compatibility: Cloud Sync v201 · Full Backup v29 · Settings Presets v1 · Personal Order v5 · Collections v2.

See `docs/CHANGELOG_v321.md` for details. Earlier release notes follow below.

---

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
