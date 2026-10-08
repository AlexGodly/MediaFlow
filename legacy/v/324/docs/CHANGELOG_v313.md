# MediaFlow v313 — Community Design, Users Rankings & Workspace Collections Repair

**Base:** MediaFlow v312 Community Beta  
**Release date:** 2026-10-08  
**Created by:** Alex Godly

## Workspace Collections
- **Fixed owned Collection opening.** The v310 renderer always returned the collection browser even when an owned Collection was selected. v313 restores `v274RenderCollectionsPage` for selected owned Collection IDs, keeping existing editing and detail tools.
- Redesigned the Collections page with a clear heading and a unified action toolbar.
- **Together** mode displays owned Collections and saved Community Collections on one page; filter by **All Collections**, **My Collections**, or **Community Collections**.
- **Separate tabs** mode offers distinct **My Collections** and **Community Collections** tabs.
- Layout and scope choices are stored in existing Workspace settings; the original Collection sorting, views, searches, and editing remain present.
- **Refresh saved** moved into the top action toolbar, beside **Explore Community** and **New Collection**; removed redundant bottom Refresh button.
- Saved collections remain read-only live references with creator profile links and privacy checks.

## Community Users & Ratings UI
- Reorganized search, sort and filter controls into grouped, responsive tool panels for easier scanning at desktop/tablet/mobile widths.
- Replaced misleading **Avatars** play icon with a portrait/avatar SVG.
- Redesigned User Rankings with a responsive, highlighted **Top 3 podium** for descending rankings (when at least three results are present), clear rank numbers, profile photos, display names, usernames, chosen metric, verification badge, and profile links.
- Rankings other than the podium remain numbered list/card/compact/avatar layouts. Existing sorting, filters, asc/desc arrows, verification and privacy remain intact.
- Improved active view-mode indicators.

## Browse Titles
- Show exact Community title count independently of current result page or filters.
- Count eligible *distinct* public MAL/SIMKL provider-ID groups, including unrated titles; the same media represented under both services can count twice until provider IDs are reconciled.
- Cache total for five minutes and never re-count solely on view-mode changes.
- New read-only Supabase function `mf_community_title_count_v313()` restricted to eligible public profile/public Library contributions.

## Public Profile Sharing
- Added **Share profile link** to published public profiles, visible to visitors whether signed in or guests.
- Added **Copy public profile link** to the owner's public-profile settings when their profile is enabled.
- Link format: `https://alexgodly.github.io/MediaFlow/<username>`; honors the existing public-profile access policy.
- Clipboard support uses the existing copy-with-fallback helper.
- Removed the phrase `(tracked from v312 onward)` from public-profile sharing Settings. Actual active-time tracking still starts from v312.

## Compatibility
- Preserves v312 Ratings freshness and Usage/Verification systems, v311 Ratings podium, v310 live saved Collections, v309 Browse/Quick Add, v308 dynamic Community themes, and v307 auth routing.
- No destructive private-data migration. `Cloud Sync v201`, `Full Backup Schema v29`, `Settings Preset Schema v1` unchanged.
- `assets/css/170-v313-community-workspace-polish.css` and `src/js/components/238-v313-community-collections-ui.js` added.
- JavaScript bundle/version/PWA/service worker updated to v313.

## Testing limitations
- Regression tests use Chromium with simulated users and database responses. Test opened and returned from a private owned Collection, switched modes/tabs/source filters, loaded total count, and checked share controls at 1440px, 390px, and 320px.
- Real multi-account and deployed GitHub Pages testing remains necessary.
