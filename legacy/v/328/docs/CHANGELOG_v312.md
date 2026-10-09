# MediaFlow v312 — Community Rankings, Automatic Ratings Refresh & Shareable Collections

**Baseline:** v311 Community Beta. **PWA:** `mediaflow-pwa-v312-shell-v1`.

## Community Ratings
- Added sorting by average rating, rating count, Library count, or title. Added ASC/DESC arrow-icon toggle, provider filtering (MAL/SIMKL), minimum rating count, minimum Library count, and minimum average score.
- Global ranks are calculated server-side after metric filters and before title search/pagination. The top-three podium is reserved for the default highest-average sort.
- Lightweight indexed catalog-revision query runs every ~45 seconds *only while the Ratings page is visible*. Full leaderboard refresh runs only after a published change or after a 10-minute fallback interval. Manual refresh remains available. No continuous full leaderboard fetches.
- Opted-in public Library rows that had *already been published* can sync changed ratings, titles, statuses, covers, and totals in batches (max 35 IDs at a time) after private Workspace saves. Never automatically publishes a previously private title or Library. New content still requires explicit publication.

## Users — Discover and Rankings
- New **Find Users** and **User Rankings** tabs with four layouts: Cards, List, Compact, and Avatars (profile image, name, username).
- Database-driven search, sorting, ASC/DESC icon, verified-settings filtering, minimum level and minimum **public Library** titles, and 40-member pagination.
- Rankings by Level (total XP breaks ties), total XP, number of opt-in published Library titles, or active app time. No user is ranked by a metric they keep private. XP and usage settings are independently opt-in.
- New **MediaFlow Verified** badge for an *exact current match to MediaFlow's default leveling settings*; **Unverified** for modified settings; and **Settings not checked** for legacy profiles without comparison data. Badge appears on public profile and user cards when public XP sharing is enabled. This is a **client-reported settings-parity indicator, not an independent anti-cheat audit or identity verification**. The badge automatically updates on later private settings saves.
- Active time tracking begins **in v312**, not retroactively. Tracked only for signed-in users who explicitly opt into **Share active time using MediaFlow**, while app is visible. A server-timed heartbeat limits reported active time. Default privacy is **off**. Previously spent hours cannot be reconstructed.

## Collection sharing
- Added **Share link** in public Collection cards, public Collection details, saved Collection details, owner Workspace Collection details, and Public Profile → Collection Sharing.
- If an owned Collection is private, sharing first requires clear confirmation to make it public; no private Collection is published without that approval.
- Links use `/MediaFlow/{username}/Collections/{id}` and work for guests and signed-in users through the GitHub Pages fallback. Privacy changes / deletion still revoke public access.

## Shared sorting controls
- Replaced ASC/DESC dropdowns with arrow-icon toggle buttons in Browse Titles, Community Ratings, Public Collections directory, Public Collection details, and Users.

## Database and security
- Migration: `docs/SQL_v312_community_rankings_usage.sql` (deployed to primary project). Adds optional XP-settings badge and public active-time consent fields, private server-timed usage tracking, Users ranking RPC, configurable Ratings ranking RPC, and indexed freshness probe.
- Anonymous users cannot record time; the private usage table is RLS-protected. Public rankings only expose users' opted-in metrics.
- No destructive migration of private Workspace state. Existing Cloud Sync v201, Full Backup schema 29, and Settings Preset schema 1 unchanged.

## Testing
- Browser tests across **1440 / 390 / 320px**: v312 new features, v310 live Collections regressions, and v309 Browse/Quick Add regressions.
- Source and PWA build validated with `scripts/build.py` and `scripts/check.py`.
- Browser mocks and SQL query tests are not a substitute for live multi-account tests on GitHub Pages.
