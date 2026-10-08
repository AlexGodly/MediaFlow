# MediaFlow v316 — Uncapped Active-Time XP, Statistics & Community Ranking Freshness

Built from **MediaFlow v315 Community Beta**. MediaFlow's private Workspace, Community, Browse, public Collections, Quick Add, messaging, dynamic themes and existing PWA behavior remain included.

## What's new

- **Uncapped Time-Based XP:** earn **5 XP for each 10 eligible active minutes** by default, multiplied by the current media day-streak multiplier. There is **no daily XP limit**. XP is accumulated using a per-account, server-owned heartbeat ledger to avoid duplicated rewards across tabs/devices. Hidden/idle browser time is not counted. Progress starts from v316; old app history is not converted to XP.
- **XP/Level Settings:** configure Enable Time XP (on by default), minutes per reward (1–60, default 10), XP per interval (0–500, default 5), idle minutes (1–30, default 5), and Multiply by media streak (on by default). Customizing the defaults participates in the MediaFlow Verified/Unverified settings comparison; that badge is not proof of anti-cheat integrity.
- **Statistics:** a new **Time spent in MediaFlow** component displays today, last seven days, last thirty days, total eligible time, cumulative time XP, streak multiplier, and next reward progress. This component is **shown by default** and can be hidden using the existing Statistics component visibility settings. The breakdown uses UTC dates.
- **Public ranking:** Time XP is included in the existing account's total XP and derived Level, and is published to User Rankings only where public profile/XP visibility is enabled. People/Users directory checks for revisions around every **50 seconds**, and refreshes after a detected public change or a periodic fallback. The existing v312 Community Ratings public-catalog revision check runs around every **45 seconds** while Ratings is visible.
- **Actual workspace topbar fix:** the shipped React chrome now maps internal `mf302-profile`, `mf302-friends` and `mf302-inbox` to readable **Profile, Friends, Inbox**, respective icons and descriptive subtitles. The asset is renamed to `assets/js/mediaflow-v316-react-ui.js` to avoid reuse of a cached older header script.

## Required Supabase migration

Apply `docs/SQL_v316_time_xp_activity.sql` to the Supabase instance that MediaFlow uses. **This migration has already been applied to the connected MediaFlow project**. Separate deployments using their own database must execute it before deploying the frontend.

The migration adds `mf_time_xp_v316` and `mf_time_xp_days_v316` as per-user RLS-protected, read-only-from-client ledgers. The authenticated `mf_time_xp_tick_v316` RPC calculates XP based on bounded server-time heartbeat intervals and ensures atomic awarding; `mf_users_revision_v316` returns a lightweight public rankings revision. Public time sharing stays independently opt-in. The server does **not** enforce full proof of physical user activity or a trusted streak value, so the XP system is not an anti-cheat security guarantee.

## Deployment

Deploy **all** contents (not just the index): `index.html`, `404.html`, `sw.js`, `assets/js/mediaflow-v316.bundle.js`, `assets/js/mediaflow-v316-react-ui.js`, `assets/css/173-v316-time-xp-statistics.css`, and every other existing asset folder, including Category icons. The PWA cache is **`mediaflow-pwa-v316-shell-v1`**. GitHub Pages deployment and installed PWAs may require a cache refresh before new assets appear.

## Compatibility

Cloud Sync **v201**, Full Backup **v29**, Settings Preset **v1**, Personal Order Export **v5**, Collections Export **v2**. Logging Intensity from v299/v300 remains removed. The canceled mobile History redesign remains excluded. No destructive migration of private MediaFlow Library data.

## Validation

The dedicated v316 browser suite passed **82 assertions** across desktop, 390px and 320px viewports, including a mocked RPC credit path, account-switching ledger state, visible-by-default Statistics component, Settings customization, and React header name/icons. The v315 sidebar suite passed **84 checks**, the v314 provider/rankings suite **57**, and the v313 Workspace Collections suite **54**, and the Browse/Quick Add suite **39**, against the v316 bundle. Browser tests use simulated authenticated users and database responses; live multi-account testing against deployed GitHub Pages and real Supabase users is still required.

See `docs/CHANGELOG_v316.md` for detailed release notes.
