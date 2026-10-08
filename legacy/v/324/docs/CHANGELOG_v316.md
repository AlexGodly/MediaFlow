# MediaFlow v316 — Uncapped Time-Based XP, Streak Multipliers, Activity Statistics & Live User Rankings

**Base:** MediaFlow v315 Community Beta  
**Release date:** October 8, 2026  
**Developer:** Alex Godly  
**Status:** Community Beta

## Uncapped active-time XP

- Adds a second source of XP for time spent **actively using MediaFlow**, alongside the existing media-logging, completion and progression systems.
- Defaults: **5 XP every 10 eligible active minutes**, **no daily cap**, **streak multiplier enabled**. Every earned interval is multiplied by the same media day-streak multiplier used by existing streak XP: `v149StreakMultiplier(computeDayStreak())`.
- Rewards accumulate over successive eligible intervals and count toward the **existing total XP and Level** rather than creating an unrelated leveling system.
- Uses a dedicated **server-owned, per-account time XP ledger**. Concurrent devices and tabs share the same atomic ledger instead of each creating a separate client-authoritative reward balance.
- Detects recently active, visible, focused browser usage; hidden tabs and idle windows do not continue accruing normal XP. The server permits at most 120 credited seconds per heartbeat, rejects large gaps and limits individual RPC argument values to their supported settings range. These are safety bounds **per heartbeat**, not a daily XP cap.
- The first tracking session and lifetime statistics begin in v316. Historical time spent in earlier releases is not retroactively credited.
- The existing v312 usage heartbeat is superseded by the v316 writer so the two systems cannot double-record the same interval. Optional public activity time is updated only for users who explicitly enabled public usage sharing.
- No required account usage-sharing consent to **earn private time XP**; sharing usage statistics is a separate choice.

## XP / Level Settings integration

A new **Active Time XP** panel inside existing XP/Level Settings supports:

| Option | Default | Range |
|---|---|---|
| Enable Time-Based XP | On | On / Off |
| Minutes per reward | 10 | 1–60 |
| XP per interval | 5 | 0–500 |
| Idle timeout (minutes) | 5 | 1–30 |
| Multiply by media streak | On | On / Off |

- Displays the current media streak, corresponding multiplier, and total Time-Based XP earned.
- Reuses MediaFlow's existing Settings persistence and theme-aware form style; no additional Settings database table or cloud-sync schema version needed.
- All five Time XP defaults are part of the **factory XP/Level Settings comparison** used by the public MediaFlow Verified/Unverified indicator. Changed configuration can mark an account custom/unverified after supported profile synchronization. The badge is a **client-reported defaults comparison, not a validated anti-cheat certificate**.
- Disabling the XP/Level system also disables further Time-Based XP rewards. Historic earned XP remains in the account ledger.

## Statistics: Time spent in MediaFlow

- Adds a **Time spent in MediaFlow** Statistics component, **shown by default**.
- Uses the existing Statistics component visibility controls to **show/hide** this module without affecting the underlying XP engine.
- Shows eligible time spent **today**, **last 7 days**, **last 30 days**, and **all time since v316**; daily breakdowns use UTC dates.
- Shows cumulative Time-Based XP, active streak multiplier, current reward progress, and estimated minutes remaining before the next reward interval.
- Loads the private per-day server ledger for the current signed-in account; changes to account clear prior local values before loading the new account's data.
- Uses targeted DOM updates after new heartbeat results rather than rebuilding Statistics for each timer tick.

## Community User Rankings freshness

- Total XP and derived Level now include the authenticated user's server-awarded Time XP.
- Existing profile-publication rules continue deciding whether a user's Level and XP are eligible for Community User Rankings; privacy settings are unchanged.
- Adds a lightweight `mf_users_revision_v316()` public-data revision probe approximately every **50 seconds** when the Users page is active and visible.
- Refreshes the current Users ranking/directory data after a detected revision change or an approximately **five-minute fallback** interval. Suppresses unnecessary refresh during active search input typing.
- Revision tracking combines the existing public catalog/profile revision with the latest opted-in public activity-time updates. Public profile XP/Level updates flow through the established `mf312SyncOwnProfile()` publisher.
- The existing v312 Community Ratings refresh continues checking public title/profile revisions approximately every **45 seconds** on the visible Ratings page, so changed **previously published** title ratings can refresh without a full constant leaderboard download.
- Users' private Library and ratings data are not made public automatically.

## Corrected social Workspace header labels and icons

- Fixes the root cause of technical header names shown as `Mf302-profile`, `Mf302-friends`, `Mf302-inbox`: the old prebuilt React header asset still rendered those IDs.
- The **actual shipped React app chrome** maps the pages to **Profile**, **Friends**, and **Inbox**, with semantic profile/friends/message icons and relevant subtitles. Community gets a readable heading too.
- Creates release-specific `assets/js/mediaflow-v316-react-ui.js` to avoid loading an older cached React asset. The `index.html`, `404.html` and PWA cache reference the new asset.
- Keeps the matching v315 fallback header repair but avoids a second competing header DOM observer (which caused feedback during testing).

## Database & security

- New private `public.mf_time_xp_v316` table stores credited seconds, cumulative awarded time XP, reward-interval remainder and heartbeat timestamp per account.
- New private `public.mf_time_xp_days_v316` table stores daily eligible seconds and earned XP per account.
- Both tables enforce RLS. Authenticated users have read access only to their own rows; direct client writes are denied.
- `public.mf_time_xp_tick_v316()` awards Time-Based XP using server timestamps, atomic row locks and bounded heartbeat increments. Only authenticated callers may execute it.
- `public.mf_users_revision_v316()` makes a small public timestamp response available to guests and members for efficient Users page refresh.
- Public usage-time publication remains opt-in and separate from XP eligibility.
- The migration `docs/SQL_v316_time_xp_activity.sql` was applied to the connected MediaFlow Supabase project. **Other Supabase installations must apply the bundled SQL before using v316.** No private Library data must be migrated or deleted.
- The heartbeat protects against duplicate credit from multiple concurrent callers, but **a browser-based client activity signal and client-reported streak setting are not strong anti-cheat attestations**. This is a gamified reward system, not proof of historical activity.

## Source and PWA updates

- New JavaScript component: `src/js/components/241-v316-time-xp-community-refresh.js`.
- New CSS: `assets/css/173-v316-time-xp-statistics.css`.
- React workspace header source updated: `src-v260/components/AppChrome.tsx`; the active prebuilt React asset is `assets/js/mediaflow-v316-react-ui.js`.
- Expanded `DEFAULT_SETTINGS.leveling.timeXP`; Statistics component default `timeSpent=true`, with label and visibility control.
- v315 header fallback changed to **Profile** for consistency.
- Updated bundle: `assets/js/mediaflow-v316.bundle.js`, `VERSION=316`, `version.json`, `index.html`, `404.html`, `sw.js`.
- PWA shell: **`mediaflow-pwa-v316-shell-v1`**. Restored all inherited Category icons and reference PNG assets from the v315 baseline to keep the release complete.

## Validation

- Dedicated v316 Playwright test: **82 assertions passed** at 1440px, 390px, and 320px. Includes default configuration, configurable rate/multiplier, visible-by-default Statistics module, show/hide, simulated server heartbeat credit, total XP integration, account isolation, social header labels/icons and active React header asset.
- v315 sidebar regression: **84 assertions passed**.
- v314 media-source & rankings regression: **57 assertions passed**.
- v313 Workspace Collections regression: **54 assertions passed**.
- Browse/Quick Add regression: **39 assertions passed** (test harness selects the v309 catalog RPC rather than the unrelated v313 total-count RPC).
- Tests are isolated with simulated authentication/database results. **Live account, activity accrual, cloud synchronization and multiple-device testing are still required after deployment.**

## Compatibility and inherited features

- Private Workspace: Dashboard, Library, Personal Order, History, Statistics, Collections, Settings, Themes, PWA and cloud synchronization preserved.
- Community: Browse Titles, Ratings, eight eligible provider types, quick importing, Users directory, XP/Library/time rankings, creator profiles, public Collection sharing, saved Community Collections, Friends, Inbox and chat preserved.
- Community Navigation Settings, mobile More and sidebar scroll/fixed account area from v315 preserved.
- **Cloud Sync v201**, **Full Backup Schema v29**, **Settings Preset Schema v1**, **Personal Order Export v5**, **Collections Export v2**.
- Experimental Logging Intensity from v299–v300 remains excluded; canceled mobile History redesign remains excluded.
