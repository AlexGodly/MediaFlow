# MediaFlow v326 — Native Workspace Statistics for Public Profiles

**Version:** 326  
**Codename:** Native Public Statistics Parity  
**Base:** MediaFlow v325 Community Modular  
**Release Date:** October 9, 2026  
**Created by:** Alex Godly  
**Status:** Community Beta — Requires the v326 SQL migration and owner republication

## 1. Release overview

v325 brought the real Workspace renderers to public Library, Collections, Personal Order, Old System and History. Statistics was the exception: public Statistics still used an embedded sanitized HTML snapshot. v326 removes that exception by rendering public Statistics with the **same `renderStats()` function and original component tree** used in private Workspace, supplied with **that profile owner's separately published read-only data**.

The public page includes the original User Profile, Leveling, Time Spent in MediaFlow, Lifetime Achievements, consumption summaries, category analytics, ratings, heatmap, recap, completion timeline and all other enabled original Statistics components supported by the owner's published dataset and settings. The v318 component ordering and owner's `v186ControlCenter` component visibility preferences are preserved.

## 2. Actual native Statistics, not an iframe copy

- Public Statistics now uses the original `renderStats()` at view time, rather than presenting `mf_public_statistics.snapshot_html` in the old iframe.
- The original Statistics HTML, component hierarchy, cards, charts rendered in HTML, and styling are reused within the same read-only `mf325-native` wrapper as the other five public pages.
- The page remains scoped to the profile owner's last published data, not the visitor's Workspace or a live read of the owner's private cloud state.
- The previous sanitized snapshot remains available as a fallback for profiles that have not republished using v326.
- Supported original recap, heatmap-year and completion-timeline selectors remain usable through a read-only, explicitly allowed interaction bridge.
- Edit/log/delete/import/export operations and arbitrary original event handlers are not enabled.

## 3. Owner Statistics publication and calculation

New section-scoped public records provide the source needed by the native renderer:

| Section | Purpose |
|---|---|
| `statistics` | Owner's approved Statistics settings, Level/XP, XP breakdown ledger, publication time and active-time summary |
| `statistics_titles` | Statistics-relevant title status, progress, category, ratings and lifecycle dates |
| `statistics_sessions` | Consumption sessions required for Statistics calculations; session notes omitted |
| `statistics_timeline` | Published completion timeline |
| `statistics_activity` | Sanitized activity events |

- Public Statistics title projection excludes private title notes, synopsis, descriptions and external service identifiers.
- Public Statistics session projection excludes personal session notes.
- Details such as title names, dates, categories, ratings and consumption patterns may still be publicly accessible when Statistics is enabled, because the renderer needs them. Review before publishing.
- Published Settings includes the Statistics component control center and leveling configuration.
- The publisher obtains authoritative active-time XP and daily activity from the signed-in owner's existing v316 tables at publication, when available; fallback is the account's already loaded ledger.
- Total XP is reconciled against the latest owner time-XP ledger and preserved as a published owner value. Nothing is recomputed against the visitor's private XP history.
- Large title, session, timeline and activity arrays publish in the existing maximum-150-record chunks.
- Old excessive pages and hidden Statistics data are removed by the section-based publication cleanup.

## 4. Isolation from visitor Workspace

- The existing `mf325WithState()` temporary state boundary is reused.
- Published owner state is installed only while the original renderer runs; afterward the visitor's global state, auth context, XP hooks and rendering methods are restored.
- Statistics temporarily supplies the owner's published XP total and active-time ledger to the legacy calculation functions.
- v316's deferred Statistics refresh is suppressed during public native rendering, preventing an asynchronous fetch for the visitor from overwriting owner data.
- Global time-XP painting now deliberately ignores `.mf326-statistics` containers so future background activity cannot repaint a public profile with the visitor's XP.
- Native page actions remain allowlisted and never save into the owner's or visitor's private Workspace.

## 5. Supabase migration and permissions

**New migration:** `docs/SQL_v326_native_public_statistics.sql`.

It extends the v325 table's allowed section names and updates only its public `SELECT` policy. It **does not create a second public Statistics table** or alter the private MediaFlow data schema.

- All new Statistics sections are readable only when the owner has an enabled public profile, Statistics tab visibility is enabled, and the existing `show_statistics` flag allows publication.
- Authenticated owners retain existing write policies for their own public rows.
- Anonymous visitors remain `SELECT`-only through v325's explicit table grants.
- If the Statistics tab is hidden and the owner republishes, its v326 rows are removed.
- v323 and v325 migrations remain prerequisites.

**The v326 migration is included but is NOT applied to live Supabase as part of packaging.**

## 6. UI, themes, responsiveness and compatibility

- Added `assets/css/182-v326-native-public-statistics.css` for the original cards, read-only controls, mobile grid collapse and profile-based themes.
- Guest artwork-derived Profile Theme and signed-in visitor MediaFlow/Profile Theme selection remain supported.
- Preserves the original four-part Statistics hierarchy: User Profile → Leveling → Time Spent in MediaFlow → Lifetime Achievements.
- Preserves the v320 Statistics opening-scroll correction in the private Workspace.
- Other five native v325 public tabs, Profile Studio, Friends, Inbox, Community and private Workspace stay unchanged.
- Retains Cloud Sync v201, Full Backup v29, Settings Presets v1, Personal Order v5 and Collections v2.

## 7. Technical files

- **New:** `src/js/components/250-v326-native-public-statistics.js`
- **New:** `assets/css/182-v326-native-public-statistics.css`
- **New:** `docs/SQL_v326_native_public_statistics.sql`
- **New:** `scripts/test-v326-native-public-statistics.py`
- Updated v316 time-XP rendering to prevent public Statistics repainting and unwanted asynchronous refresh.
- Updated `src/js/runtime-order.json`.
- Updated `VERSION`, `version.json` and `package.json` to v326.
- Generated `assets/js/mediaflow-v326.bundle.js` and `assets/js/mediaflow-v326-react-ui.js`.
- Updated `index.html` and GitHub Pages `404.html` to the new version.
- Regenerated PWA service worker with `mediaflow-pwa-v326-shell-v1`.
- Added v326-targeted inherited regression scripts.

## 8. Validation

- **155 native v326 browser assertions passed** at 1440px, 768px, 390px and 320px widths, including original Statistics components, owner's independent data, isolated total/time XP, read-only markup, retained recap/heatmap controls, visitor state restoration, and publication of all five v326 sections.
- **444 inherited regression assertions passed** against the v326 bundle across six suites: v320 Social UI (132), v321 Friends/Collections (68), XP/Community (69), Active Time XP (82), Browse (39), Workspace/Collections (54).
- **599 assertions total** across the completed browser suites.
- JavaScript syntax, modular build, PWA generation and final ZIP integrity verified.

**Limitations:** These are mocked-data browser and source-level checks, not full deployed multi-account Supabase verification. Native Statistics is the original renderer working from *published*, sanitized owner data; it does not execute private account services on behalf of a visitor. Future private changes require republication.

## Version progression

**v323** — Comprehensive public profile and Profile Studio with six basic public media tabs.  
**v324** — Independently designed Workspace-inspired public tabs.  
**v325** — Real Workspace renderers for Library, Collections, Personal Order, Old System and History; Statistics remained a snapshot.  
**v326** — **Original Workspace `renderStats()` for public Statistics, source-complete Statistics publication, faithful Level/XP/time data and settings, safe read-only controls, visitor-state isolation, theme parity and database visibility enforcement.**
