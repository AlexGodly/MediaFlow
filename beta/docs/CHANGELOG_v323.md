# MediaFlow v323 — Public Profile Showcase & Profile Studio

**Version:** 323  
**Codename:** The Public Media Universe  
**Base:** v322 Community Modular  
**Release date:** October 8, 2026  
**Created by:** Alex Godly  
**Release channel:** Community Beta  
**IMPORTANT:** **Requires the new Supabase migration** `docs/SQL_v323_public_showcase.sql` in addition to older Community SQL migrations. The migration has **not** been applied to a live Supabase project by this build. Apply it to your own project before using the new publication features.

---

## 1. Overview

v323 rebuilds Community public profiles as full-size, theme-aware showcases with a cover image, avatar, biography, Level and experience, favorites, social connections and six selectable read-only media sections. Owners use the entirely redesigned **Profile Studio** to arrange visibility and order, customize their identity, and publish safe public snapshots of their account. The prior independent opt-in controls and Choose Collection selector are removed from the new Studio. Public presentation is distinct from the private Workspace; no visitor gets edit controls or private-cloud credentials.

## 2. Redesigned public-profile hero

- Editorial hero with configurable background-image URL, large avatar, display name, @username and biography.
- Followers and Following counts and profile-owner/follower actions where applicable.
- Prominent Level, cumulative XP, XP progress bar and remaining XP to the next Level.
- Favorite titles displayed as a cover gallery, with up to 36 selected from the owner's Library.
- Socials area with user-defined link name/URL and optional HTTPS custom icon; domain favicon fallback when no custom icon is supplied.
- Discord area supporting multiple usernames.
- Public categories rendered as a separate section that all visitors, including signed-out guests, can read.
- All user-supplied text is HTML-escaped; image and outbound URLs require HTTPS.

## 3. Guest and member themes

- Signed-out visitors always receive a **Profile theme** influenced by the profile's cover or avatar image. Color sampling uses a canvas when the image permits cross-origin reading; otherwise a deterministic image-URL-derived accent supplies a stable fallback. Background/panel surfaces receive a coordinated hue tint.
- Signed-in visitors default to their **MediaFlow theme**, retaining their own theme preferences.
- Signed-in visitors can switch between **MediaFlow theme** and **Profile theme** using an in-profile segmented toggle.
- Profile Studio uses the owner's current MediaFlow theme tokens, including background, border, text and accent.
- Theme switch does not rewrite theme settings for the account and doesn't alter the public profile owner data.

## 4. Six customizable read-only tabs

Owners can show/hide and reorder:

1. **Library:** paginated rows (48 per page), search, status and category filters, sorting by title/progress/rating, List/Cards/Covers presentation, covers, ratings and progress. It is a read-only public browser using the existing public Library table, **not an embedded copy of the entire editable Workspace Library toolset**.
2. **Collections:** public collection covers, descriptions, item counts, **Open** and, for signed-in nonowners, **Subscribe** actions using the existing public Collection integration. No create/edit/delete actions in visitor pages.
3. **Personal Order:** searchable, paginated display of the owner's published ordered title queue. Browsing only; no reordering or modifying title entries.
4. **Old System:** published read-only balances, conversion rules and recent transactions (most recent 100). No mutation controls.
5. **History:** paginated public consumption History, searchable by title and filterable by category, dates, amounts and minutes where included in the published records. No history modifications.
6. **Statistics:** sanitized HTML snapshot rendered inside a sandboxed no-script iframe, with interaction/mutation controls suppressed.

These are **purpose-built public read-only counterparts**, not exact functional clones of the private Workspace pages. They reuse public media data and familiar browsing patterns without exposing underlying private account state. Some advanced private Workspace tools are intentionally not reproduced. They display the **last published snapshot**, which may differ from current Workspace state until the owner saves or uses Refresh published pages.

## 5. Profile Studio redesign

- Replaces the older account Public Profile configuration with a structured MediaFlow-themed editor.
- Identity fields: public username, display name and bio.
- Artwork: HTTPS avatar URL and background-image URL; **Use Workspace avatar URL** works when that source is publicly accessible via HTTPS. Local/data URLs cannot be published and produce explanatory feedback.
- Pages, visibility and order: six per-tab visibility checkboxes with Move Up/Down controls. Changes affect which tabs the public page offers; published table visibility is also protected in SQL.
- Favorites: search the owner's local Library, select up to 36 titles, remove selections. The selected covers are published to the hero.
- Socials: add/remove arbitrarily many named HTTPS links with optional HTTPS image/icon URLs; fallback site favicons where available.
- Discord: add/remove multiple plain-text usernames.
- **View my profile** shortcut when a public username is enabled.
- **Refresh published pages** to publish current Workspace content without manually editing other profiles.
- **Save and publish** saves the Studio configuration and automatically publishes all currently visible pages; separate opt-ins and a Choose Collection selector are removed. Saving enables the owner's public profile and existing Community sharing flags (no automatic publication merely from viewing the Studio).
- Prominent notice warns that saving publishes selected content to anyone who can view the profile. Hidden tabs remain restricted by the v323 SQL policies, while prior public data remains subject to older Community features and their publication rules.

## 6. Public categories, Level and XP

- Public categories are published independent of the six tab toggles, for signed-in and signed-out visitors.
- Public Level and XP use the existing Level/XP totals and the same XP threshold formula for the progress bar.
- Previous v316 active-time XP, v317 started-title XP, and the existing calculation systems are preserved.
- No private Library or account XP engine is executed for guests; public profiles read the owner's previously published totals.

## 7. Public snapshots and publication reconciliation

- New paginated, account-owned public showcase table for categories, Personal Order and Old System.
- Library and History are published in chunks to the existing public tables.
- On republish, stale public Library and History records that are no longer in the owner's current data are removed. Published Collections no longer present privately are marked nonpublic. Snapshot page counts are trimmed for new shorter queues.
- A progress notice is displayed during publishing, and errors are reported.
- For very large Libraries, publishing can take time and uses many database requests. Do not close the page while the process is active.
- Publishing is not continuously synchronized: owners must save/refresh published pages again after changes.
- Public visitors cannot read private cloud sync state directly. Published pages use public tables with row-level access rules.

## 8. Database migration and access control

**Required migration:** `docs/SQL_v323_public_showcase.sql`.

- Adds `profile_v323` JSONB to `mf_public_profiles` for tabs, colors, artwork URLs, favorites and socials.
- Creates `mf_public_showcase_v323` with composite `(user_id, section, page)` primary key and JSON arrays capped to 150 entries per page.
- Enables RLS and authenticated owner-only create/update/delete.
- Enables public reads of categories and visible section snapshots only when the corresponding profile is public.
- Adds restrictive read policies to existing `mf_public_library`, `mf_public_history`, `mf_public_collections`, and `mf_public_statistics` to enforce tab visibility for normal table reads.
- Reuses existing Supabase authentication and older Community schema; does not introduce anonymous writes.
- These policies do not retroactively retract content from other pre-existing Community features or separate RPC endpoints that publish aggregated information. Control the account's publication and review the data before enabling it.
- **Migration must be applied manually** through the Supabase SQL editor; this package does **not** modify a live database for you.

## 9. Technical files

- New `src/js/components/247-v323-public-profile-showcase.js` (Profile Studio, read-only public profile, snapshot reads/writes and public navigation).
- New `assets/css/179-v323-public-profile-showcase.css` (hero, responsive tabs, dynamic theme palette, Editor and read-only public views).
- New SQL migration `docs/SQL_v323_public_showcase.sql`.
- New dedicated browser test `scripts/test-v323-profile-studio.py`.
- Updated runtime-order registry, `assets/js/mediaflow-v323.bundle.js`, `assets/js/mediaflow-v323-react-ui.js`, `index.html`, `404.html`, `VERSION`, `version.json`, `package.json`, `sw.js` and PWA manifest metadata.
- PWA shell cache: `mediaflow-pwa-v323-shell-v1`.
- Preserves earlier MediaFlow Workspace, Friends, Inbox, Community Ratings, User Rankings, Collections, Cloud Sync and PWA features.

## 10. Tests and limitations

- v323 dedicated Chromium UI suite: **108 passing assertions** across desktop (1440px), tablet (768px), mobile (390px) and narrow mobile (320px) with mock backend responses and publication writes.
- Carried-forward v322 route (72), v321 Friends/Collections (68), v320 Friends/Inbox (132), v317 XP/Community (69), v316 active-time XP (82), Browse (39), Workspace/Collections (54): **516 inherited assertions** previously passed against the v323 bundle.
- **624 total passing browser assertions** at the time of packaging, subject to the final rerun of the dedicated test after adjustments.
- JavaScript build, syntax, PWA file generation and ZIP integrity verification performed for this release.
- **Not verified with a live multi-account Supabase deployment.** Security policy effectiveness, collection subscriptions on the deployed site, very large Library publishing performance, image color sampling on real hosts, and publication history cleanup need integration verification before production use.

## 11. Compatibility

- Cloud Sync v201, Full Backup v29, Settings Presets v1, Personal Order v5, Collections v2: existing private backup formats unchanged.
- Public profiles are published copies; no destructive migration of private Libraries, Collections or History.
- Existing Community public-profile URLs are retained.
- **New SQL is required in v323**, unlike v322.

## 12. Version progression

**v316** → Uncapped active-time XP and ranking freshness.  
**v317** → Configurable start-title/episode XP, manual Community refresh and Statistics adjustments.  
**v318** → Unified Ratings-style freshness bars and Statistics component order.  
**v319** → Exactly one Refresh now icon per Community button.  
**v320** → Tabbed Friends and redesigned Inbox, Statistics scroll fix, theme-aware Collections empty state.  
**v321** → Semantic social-tab icons and no old Collections loading flash.  
**v322** → Sidebar identity opens own public profile safely.  
**v323** → **Public Profile Showcase, new Profile Studio, guest image-derived and member-selectable themes, six configurable read-only public media tabs, always-visible public categories and Level/XP, favorites, socials and Discord, public Collection subscriptions, and new publication/RLS infrastructure.**
