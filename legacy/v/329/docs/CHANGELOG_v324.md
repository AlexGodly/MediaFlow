# MediaFlow v324 — Workspace-Style Public Pages & Read-Only Media Browsing

**Version:** 324  
**Codename:** Public Workspace Parity  
**Base:** MediaFlow v323 Community Modular  
**Release date:** October 8, 2026  
**Created by:** Alex Godly  
**Status:** Community Beta

## 1. Overview

The v323 public profiles looked like a separate, simplified catalog rather than the MediaFlow Workspace. v324 rebuilds the presentation of all six public-profile tabs using the visual vocabulary and browsing structure of the corresponding Workspace page. It retains v323's authentication-independent published public data model, and **does not render another person's private Workspace state or give visitors edit privileges**.

## 2. Library — full-width Workspace-inspired browser

- Replaces the old generic small tile list with a full page heading, four summary/insight cards, a dense toolbar, full-width Status and Category shortcut strips, and an organized results area.
- Preserves server-side, page-by-page querying instead of loading 30k–50k titles to a browser just to filter.
- Search, Category, Status, sorting by title/progress/rating, and List / Compact / Cards / Covers view modes.
- Media entries have correct cover display, title, category, status, rating, progress, percentage and a theme-colored progress bar when data exists.
- Clicking a published title opens a themed **read-only title details** dialog, with keyboard Escape and close/outside-click dismissal.
- Search keeps caret/focus after a refresh; filters and display modes no longer reset the user's browsing flow.
- Public categories finish loading before the initial Library controls render, fixing first-load missing category options.
- No Add Title, Edit, Delete, Batch Log, Set Status/Priority/Category, or private data actions.

## 3. Collections — Workspace-like gallery

- Uses MediaFlow-style full-width collection cards, list, and cover views, with metadata, descriptions, cover images, and item totals.
- Displays overview metrics, search, sorting and pagination.
- Preserves **Open Collection** and **Subscribe** actions for authorized signed-in visitors, wired to existing v310 Community operations.
- No public Collection creation, edits, deletion, or private Collection reads.

## 4. Personal Order — original ordering concepts

- Reworks the tab around the familiar Workspace Personal Order note, count/summary cards, All Titles and By Category layouts, ordered positions, search and read-only title details.
- Publication now includes title categories and priority in existing v323 JSON page records, enabling meaningful By Category browsing after republishing.
- Publishes assigned Collection queue summaries and their published ordered titles (up to 150 per assigned Collection), which can be expanded read-only by visitors.
- Preserves original direct title order as published. Assigned Collection blocks are currently shown after direct titles, rather than recreating the owner's complete cross-category drag token interleaving.
- No drag, rearrange, clear, add or editing actions.

## 5. Old System — matching modes and informative layout

- Adds System / View / Statistics submodes using a tabbed Workspace-style toolbar.
- Category balance panels with theme-aware progress bars, conversion rules and a recent activity timeline, plus an overview of published balances/rules/activity.
- Runs on explicitly published balances, rules and recent transactions; conversion actions and private simulations are disabled.

## 6. History — consumption timeline

- A polished public chronological consumption view, with grouped daily sessions and a compact alternative.
- Dedicated search, category filter, date sorting and overview metrics, with clear session duration/progress labels and pagination.
- No edits, deletions, re-logging, batch selection or export of private History information.
- Public record columns do not contain the private History row's entire set of progress/cover fields, so not all Workspace History visuals can be reproduced until a future public schema is expanded.

## 7. Statistics — Workspace snapshot presentation

- Places the existing v304 sanitized Statistics snapshot in a larger, clearly labeled, themed Workspace-style viewport.
- Retains sandboxed, no-script HTML isolation and suppresses interactive/modifying controls.
- Displays the publication timestamp. The iframe can scroll through a large snapshot without leaking a viewer's private data.
- This is a published snapshot rather than a fully live interactive private Statistics renderer.

## 8. Design, accessibility & performance

- All six tabs use consistent MediaFlow text hierarchy, action placement, toolbars, insight cards, borders and accents while allowing page-specific layouts.
- Themes respond to v323's guest profile-artwork colors and signed-in visitor MediaFlow/Profile-theme choice.
- Responsive at desktop, tablet, phone and narrow-phone sizes, including horizontal overflow checks for all public tabs.
- Title details dialog has keyboard-accessible close, Escape and click-outside dismissal. Tabs continue using existing v323 order/visibility configuration.
- Public data is escaped. Artwork links continue to use HTTPS validation.

## 9. Data & deployment

**No new Supabase SQL migration for v324.** Uses existing `mf_public_profiles`, `mf_public_library`, `mf_public_history`, `mf_public_collections`, `mf_public_statistics` and `mf_public_showcase_v323` tables, plus the already-installed v323 RLS protection. No new backend privileges or functions.

**Important:** Owners must open Profile Studio and choose **Refresh published pages** (or Save and publish) after deploying v324 to publish enriched Personal Order categories and assigned Collections. Other public views continue to reflect their **last published owner snapshot**, not private live Workspace state.

The pages are faithful **read-only presentations of published Workspace data**, not byte-for-byte reproductions of the editable Workspace DOM. Some sophisticated interactive tools rely on private state, cannot be exposed to visitors, or need data not present in the public snapshot. v324 intentionally avoids claiming otherwise.

## 10. Technical

- New runtime extension: `src/js/components/248-v324-workspace-public-mirrors.js`.
- New theme-aware stylesheet: `assets/css/180-v324-workspace-public-mirrors.css`.
- v323 Profile Studio public publisher enhanced for title category/priority and assigned Collection queue information without schema changes.
- v323 profile first-render category-load synchronization improved.
- Registered the new runtime after `247-v323-public-profile-showcase.js`.
- Updated `assets/js/mediaflow-v324.bundle.js`, version-specific React UI entrypoint, VERSION, package.json, index.html, 404.html, version.json and service worker.
- PWA shell cache: `mediaflow-pwa-v324-shell-v1`.
- Added dedicated `scripts/test-v324-workspace-mirrors.py`.

## 11. Validation

- Dedicated v324 public-Workspace browser suite: **304 assertions passed** at 1440, 768, 390 and 320 pixel widths.
- Inherited v323 public-profile browser suite: **108 assertions passed**.
- Inherited v320 social UI: **132 assertions passed**.
- Inherited v321 Friends icons/Collections: **68 assertions passed**.
- Inherited XP/Community: **69 assertions passed**.
- Inherited active-time XP: **82 assertions passed**.
- Inherited Browse: **39 assertions passed**.
- Inherited Workspace/Collections: **54 assertions passed**.
- Syntax, PWA generation, archive integrity verified.
- Automated browser testing uses mocked Community RPC results. A deployed, multi-account Supabase test is still recommended before treating public publishing as production-verified.

## 12. Release summary

**v323** → Public Profile Studio, artistically themed profiles, six selectable read-only public tabs and secure publication.  
**v324** → **All six published tabs become substantial, Workspace-inspired read-only pages rather than simplified cards: dense Library controls and title details; professional Collections gallery; true Personal Order concepts with assigned Collection previews; Old System submodes; grouped consumption History; and a more faithful Statistics snapshot viewport.**
