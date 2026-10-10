# MediaFlow v368 — Performance & Stability (Safe Index/Queue Pass)

**Current release:** v368 (October 10, 2026). Built directly from v367 Personal Edition. This release reuses the existing lightweight Library ID index for Collection title lookups, avoids repeated Collection/queue normalization during a single Personal Order render, and removes quadratic queue membership scans. It preserves all UI functionality, cloud and backup formats, XP, dynamic themes, and existing handlers. In a paired **synthetic** Chromium benchmark, the first tested 50k-title Personal Order render improved from approximately 945 ms (v367) to 372 ms (v368). Real device and live cloud performance remains to be validated. PWA shell: `mediaflow-pwa-v368-shell-v1`. **No SQL migration.** See [v368 changelog](docs/CHANGELOG_v368.md).

# MediaFlow v367 — Settings Center 2.0 First-Paint Stability

v367 fixes the split-second legacy Settings flash observed when opening the Settings page. Previously, the registered renderer inserted old Settings HTML and deferred its v365 Settings Center enhancers to a later task. **Settings enhancement now runs synchronously before first paint**, without a blank placeholder or a second set of controls. A final compatibility guard covers alternate rendering paths. Existing 28 Settings sections, v366 future-settings registry, search, Favorites, XP, themes, cloud settings, and data formats remain unchanged. PWA shell: `mediaflow-pwa-v367-shell-v1`. No SQL migration required. See [v367 changelog](docs/CHANGELOG_v367.md).

# MediaFlow v366 — Future-proof Settings Registration

v366 upgrades the v365 Settings Center 2.0 with an explicit **Settings Registration System**. All 28 existing sections have declared categories, subgroups and search keywords. Future sections can register their intended placement through `MediaFlowSettingsRegistry.registerSection(...)`; custom controls can register searchable metadata through `registerSetting(...)`. Unknown sections appear under **Uncategorized**, rather than being guessed into Library. The original controls, XP, cloud, backups and data formats are retained. No SQL migration. PWA: `mediaflow-pwa-v366-shell-v1`. See [v366 changelog](docs/CHANGELOG_v366.md) and [developer registration guide](docs/Settings_Registration_v366.md).

# MediaFlow v365 — Settings Center 2.0

Built from **v364 Personal Edition**. MediaFlow now has a responsive Settings Center with a dedicated mobile Settings home, ten clearly categorized destinations, expandable sections, a desktop navigation sidebar, search down to individual Settings controls, pinnable Favorites, and recently visited sections. The original **28 Settings sections** retain their control handlers. Personal Order, Collections, and Account link directly to settings already managed within those pages. Restores the existing Restore all defaults action in Data & Cloud and corrects old Settings refresh behavior that could drop later XP settings. No SQL migration required; Cloud Sync v201, Full Backup schema 29, Settings presets schema 1 and import/export formats remain unchanged. PWA cache: `mediaflow-pwa-v365-shell-v1`. See [v365 changelog](docs/CHANGELOG_v365.md).

# MediaFlow v364 — Personal Order Queue Cover/Layout Parity

Built on **v363 Personal Edition**, v364 restores correctly proportioned title and Collection artwork inside Personal Order Lists, displays assigned Collection collages instead of hiding them, uses the existing **1–4 Lists per row** setting for both Category/Title Orders and Collection Queues, and introduces an independent **Collection Queue title covers** adjuster inside Queue Tools for desktop/mobile Lists and Tabs. All canonical ordering, Collection assignments, XP, cloud sync, and export/backup formats remain unchanged. No SQL migration is needed. PWA cache: `mediaflow-pwa-v364-shell-v1`. See [v364 changelog](docs/CHANGELOG_v364.md).

# MediaFlow v363 — Personal Order Desktop & Mobile Workspace Overhaul

Built on **v362 Personal Edition**, v363 reorganizes the Personal Order Lists/Tabs interface; restores working mobile Queue Tools and missing queue controls; relocates Add Titles text/cover/page-size controls into mobile Filters & Sorting; adds **1–4 desktop category Lists per row**; restores desktop Category Display; removes redundant filter icons/Reset actions; and speeds category-tab switching by updating only the active queue. Existing queue/Collection data, XP, cloud v201, Full Backup schema 29, and import/export formats remain unchanged. **No SQL migration**. PWA: `mediaflow-pwa-v363-shell-v1`. See [v363 changelog](docs/CHANGELOG_v363.md).

# MediaFlow v362 — Collection Mobile Views & Collapsible Display Tools

v362 refines **Personal Order → Add Collections** on phones and tablets: Cards use a responsive card grid with centered covers and readable labels, while Covers and Covers+Titles show compact multi-column galleries instead of oversized one-column rows. On mobile, **Text size**, **Cover size** and **Collections per page** move into the existing **Filters & Sorting** disclosure, alongside category/priority/sort settings; five display-mode buttons stay visible. The original controls are moved, not cloned, and return to their desktop positions when the viewport expands. Existing Collection assignments, queue positions, saved display/page-size preferences, XP, Cloud Sync and exports are unchanged. PWA cache: `mediaflow-pwa-v362-shell-v1`. No SQL migration required. See [v362 changelog](docs/CHANGELOG_v362.md).

# MediaFlow v361 — Collection Views & Larger Desktop Size Controls

v361 expands **Personal Order → Add Collections** with **List, Compact, Cards, Covers and Covers+Titles** views, independently adjustable Collection text (12–24px) and cover (36–180px) sizes, and saved preferences. It also makes the desktop **Add Titles** text/cover sliders much more usable than their previous 72px tracks. The Collection browser keeps its original category assignment, sorting, filtering, pagination and action handling, including content-sized short-result dialogs on mobile. No Supabase migration required. PWA cache: `mediaflow-pwa-v361-shell-v1`. See [v361 changelog](docs/CHANGELOG_v361.md).

# MediaFlow v360 — Adaptive Personal Order Pickers

v360 adjusts the **Add Titles** Covers/Covers+Titles gallery to the actual selected poster size (a 36px cover no longer sits inside a stretched 110px tile), compacts the mobile display controls while protecting pagination and selection actions, and makes **Add Collections** dialogs content-sized for up to four results, retaining scrollable tall dialogs for larger result sets. Existing v359 independent page sizes, five title modes, category tabs, Collection sorting/assignment, XP, themes, cloud schemas and backups remain compatible. PWA cache: `mediaflow-pwa-v360-shell-v1`. No SQL migration. See [v360 changelog](docs/CHANGELOG_v360.md).

# MediaFlow v359 — Configurable Picker Pagination & Category Tabs

v359 extends the v358 Personal Order Add Titles/Add Collections redesign with **independent, saved page-size controls** for both pickers (10/25/50/100/200/500; default 50 each). Add Titles retains all five display modes and now fills the large desktop results area with more titles, while Add Collections pages large Collection libraries without creating every Collection card in the DOM. Both **Category Titles** and **Collection Queues** tabs now have a professionally spaced icon tile, name and count badge. No Personal Order/Collection data migration, XP change or export-format change is required. PWA cache: `mediaflow-pwa-v359-shell-v1`. See [v359 changelog](docs/CHANGELOG_v359.md).

# MediaFlow v358 — Personal Order Stable Full-Width Browsing

**Current release: v358 (October 10, 2026).** Built directly from v357 to correct the nested Add Titles Filters & sorting bug, eliminate the narrow desktop popup caps, introduce five Personal Order title views (List, Compact, Cards, Covers, Covers+Titles) with title/cover adjusters, display multiple title/Collection cards per row on desktop, and rebuild the searchable Collection category filter with 12 sort choices and a one-click ASC/DESC button. Cover/collage clipping, mobile card compression and filter disclosure reopening are addressed. The existing Personal Edition cloud and export formats remain in place. PWA cache: `mediaflow-pwa-v358-shell-v1`. No SQL migration required. See [v358 changelog](docs/CHANGELOG_v358.md).

# MediaFlow v357 — Personal Order Dialog Space & Collection Picker Polish

v357 builds on v356 by giving the Personal Order **Add Titles** and **Add Collections** dialogs more usable desktop space, adding a **searchable Collection category filter**, replacing Collection sort direction with **clear Ascending / Descending buttons**, expanding Collection sorting to match the main Collections browser options, aligning Tabs-mode category icons more cleanly, and assigning distinct meaningful icons to the Personal Order quick-workspace buttons. Existing title/Collection assignment behavior, queue ordering, cloud data, exports, backups and Settings-defined ordering remain unchanged. PWA cache: `mediaflow-pwa-v357-shell-v1`. No SQL migration required. See [v357 changelog](docs/CHANGELOG_v357.md).

# MediaFlow v356 — Personal Order Dialog Browsing & Readability

v356 refines the v355 **Personal Order Add Titles and Add Collections** quick-action popups for desktop and mobile: collapsible Filters & sorting, larger readable names, more room for separately scrolling results, compact phone footer controls, and theme-aware surfaces. Existing title selection, category assignment, saved queue ordering, action XP, cloud state, backup/export formats, and Settings-defined filter ordering are preserved. PWA cache: `mediaflow-pwa-v356-shell-v1`. No SQL migration required. See [v356 changelog](docs/CHANGELOG_v356.md).

# MediaFlow v355 — Personal Order UI / Theme Refinement

v355 refines the v354 Personal Order workspace on desktop and mobile using the supplied screenshots: eliminates redundant desktop action/layout controls; improves readable Add Title, Add Collection, and Category Display dialogs; adds a searchable Category Display dialog; fixes narrow-phone Collection Add button wrapping; and improves category tabs, toolbars, and active-theme responsiveness. Existing saved ordering, Settings-defined filter sequences, action XP, Cloud Sync, and export formats remain intact. See [v355 changelog](docs/CHANGELOG_v355.md).

# MediaFlow v354 — Personal Order Quick Workspace

**Current release: v354 (October 10, 2026).** Built from v353. Adds immediate Personal Order Add Title/Collection actions, List/Tab quick navigation, desktop/mobile category title and Collection queue filters/sorting, searchable Settings-ordered category and priority options, and mobile-first assignment category selection. Existing data, XP, Cloud Sync, Full Backup and PWA workflows are preserved. See `docs/CHANGELOG_v354.md` for verified details.

# MediaFlow v353 — Mobile Add Titles Picker: Collapsible Tools

Built from **v352 Modular**. Collections → Add Titles now keeps search available while hiding advanced Filters and Display sizing controls by default on mobile/tablet screens. The five saved display modes remain swipeable in one row, the title list receives its own flexible scroll area, and the selection/pager/footer are compact. Existing selections, filter settings, picker size preferences (`settings.v352CollectionPicker`), XP actions, cloud state, and data formats are preserved. At desktop widths (>=1024 CSS px), the popup retains the v352 appearance. Built PWA cache: `mediaflow-pwa-v353-shell-v1`. No SQL migration is required.

See [v353 changelog](docs/CHANGELOG_v353.md). Build from source using `python scripts/build.py`.

---

# MediaFlow v352 — Collection Add Titles Picker Views & Sizing

Built on the v351 modular baseline. The **Collections → Add titles** picker now supports **List, Compact, Cards, Covers, and Covers + Titles** views; a 12–24px title-text slider; and a 36–180px cover-size slider. The default List view renders full, readable multi-line title names instead of 10px ellipsized labels. Metadata also wraps, and both sizing controls update live. The picker preferences are saved under `settings.v352CollectionPicker` using the existing MediaFlow save/cloud state; selection, indexed searching, filters, pagination, and adding titles still use the original functional paths. No new SQL tables or migration are required.

The v352 interface is responsive on phones and desktop. MediaFlow's existing app pages are not redesigned by this release. Build using `python scripts/build.py`. See [v352 changelog](docs/CHANGELOG_v352.md).

---

# MediaFlow v351 — Mobile Regression Fixes (v350 Base)

v351 is a mobile/tablet-only correction of the Batch Log card, History filter dimensions, Collections tools and selection UI, and compact Library category/status rows. Desktop at >=1024 CSS pixels is unchanged. See [v351 changelog](docs/CHANGELOG_v351.md). No schema or Supabase migration. PWA: `mediaflow-pwa-v351-shell-v1`.

# MediaFlow v350 — Dedicated Mobile & Tablet Interface (v349 Base)

MediaFlow v350 redesigns its **phone/tablet presentation only**, based on 210 supplied mobile screenshots (12 page folders). Desktop at **1024 CSS pixels and wider** retains its existing styles and navigation. New compact controls simplify Library Tools, Personal Order queue options, Collection filters, and History filters without deleting functionality or changing the Library/Collections/Personal Order data. History tabs and filter panels no longer stick over content on narrow viewports. Settings buttons and Reset labels are protected against excessively narrow word wrapping, and responsive typography, controls, cards, charts, editors and dialogs have been refined. The new CSS (`assets/css/176-v350-mobile-native-layout.css`) uses only <=1023px media queries; the new runtime component (`src/js/components/248-v350-mobile-adaptive-ui.js`) runs its enhancements only at those widths. The adaptive disclosures are temporary UI state; no SQL changes or new cloud fields are needed. See `docs/CHANGELOG_v350.md` for the details and test coverage.

## Source basis and viewport targets

- Screenshot audit: 210 examples; 1080 x 2400 screenshot pixels; actual CSS viewport not assumed from image resolution.
- Targeted narrow widths: 320, 360, 375, 390, 412, 430, 600 CSS px, and tablet 768–1023 CSS px.
- Desktop preservation: 1024 CSS px and above. This is a viewport-based rule, not user-agent sniffing.
- Built PWA cache: `mediaflow-pwa-v350-shell-v1`.

---

# Historical release notes

v341 fixes the **Recently Viewed** tab failing to open because v340 referenced private v261 helpers. History tabs now update their content independently, Recently Viewed reuses a cached title-level index, and Library History gains visible 10/25/50/100-row pagination and action/title search. No Supabase migration or data-format change. See [v341 changelog](docs/CHANGELOG_v341.md).

# MediaFlow v340 — Consumption History & Recently Viewed Titles

v340 gives **Newer weeks / Older weeks** meaningful calendar-direction icons in Consumption History. It also turns **Recently Viewed** into a cleaner title-first timeline: individual logged titles appear with their own Library covers and names, the unrelated round action icon is removed, and a dedicated **Edit log** button opens the existing log-entry editor. Historic category-only records stay accessible under Consumption History and Logs without invented titles. No cloud migration is required. See [v340 changelog](docs/CHANGELOG_v340.md).

# MediaFlow v339 — Data, Cloud, XP & PWA Integrity

v339 audited and hardened cloud-state verification, full backups, data and settings transfers, Personal Order, Collection imports, active-time checkpoints and release/PWA metadata. See [v339 changelog](docs/CHANGELOG_v339.md).

# MediaFlow v338 — Normal Library Cover Selection Fix

v338 restores selection checkboxes on title tiles in **Normal Library** when the display is **Covers** or **Covers+Titles** and **Clean Covers is OFF**. It preserves the existing behavior in Dynamic Library and every other display mode, including hidden checkboxes while Clean Covers is ON. Supabase and all other MediaFlow features remain unchanged. See [v338 changelog](docs/CHANGELOG_v338.md).

# MediaFlow v337 — Dual Time & XP Milestones

v337 removes the **Bonus XP earned** panel from Active Time Spent without changing the underlying reward ledger, keeps the next time milestone progress bar, adds a separate **Time XP** milestone bar for XP earned through app time, and expands the remaining activity chart to full width. All v336 date filters and analytics remain available. The v333+ Supabase configuration is unchanged. See [v337 changelog](docs/CHANGELOG_v337.md).

# MediaFlow v336 — Statistics & XP Configuration Polish

v335 fixes Statistics navigation starting scrolled down, places Lifetime Achievements directly beneath Active Time Spent, redesigns the Active Time Spent analytics card, fixes the missing XP reward settings in the active Settings renderer, and gives Runtime Calculator mode and continuation buttons a single meaningful icon. Adds an optional one-time first-episode XP reward. Uses the existing v333 Supabase project and v334 XP ledger with no new database migration. See [v335 changelog](docs/CHANGELOG_v335.md).

# MediaFlow v334 — Dashboard Navigation & Expanded XP Progression

v334 fixes Dashboard scroll restoration, improves Runtime Calculator icons and adds configurable uncapped foreground-time, first-title-start and Collection XP with a new Statistics card. The new rewards use the existing cloud-backed XP ledger and retain the v333 Supabase project. See [v334 changelog](docs/CHANGELOG_v334.md).

# MediaFlow v333 — New Supabase Backend

v333 updates the active cloud client to the new Supabase project and retains the v332 feature baseline. See [v333 changelog](docs/CHANGELOG_v333.md).

# MediaFlow v332 — Dedicated Supabase Edition (v331 baseline)

v332 retains all v331 Personal Edition features and migrates its cloud endpoint to a fresh Supabase project. See [v332 changelog](docs/CHANGELOG_v332.md).

# MediaFlow v331 — Personal Edition (v330 baseline)

v331 adds **per-title logging timestamps** to Dashboard Logging and Batch Log. The moment each title is added to a logging queue, MediaFlow remembers its own date/time; when saved, the titles retain separate times but the batch remains **one logical consumption session**. History shows the individual times. All previous Workspace functions and the v330 Personal Edition architecture remain in place. See [v331 changelog](docs/CHANGELOG_v331.md) for details.

Community development (v302–v329) remains on hold. No new Supabase schema, account migration, or paid infrastructure is needed.

---

# Archived v330 baseline (v301 feature line)

v330 is a **version-only re-release of MediaFlow v301**. The Community features from v302 through v329 are **not included**. No new features, UI redesigns, behavioral changes, database migration, or changes to the original cloud/backup schema. Only release metadata, the runtime version number, and the PWA cache / active bundle reference were updated. Previous v301 assets and historical tests remain in the package.

## Unmodified v301 release history

# MediaFlow v301 — Stable v298 Restoration + Current Rerolls Repair

**Authoritative base: MediaFlow v298 Modular.** No v299 or v300 Logging Intensity, XP multiplier, Settings toggle, or related state features are included.

## Changes
- Restores the stable v298 feature set as v301.
- Repairs Current rerolls popup scrolling blocked by the global v260 modal `overflow:hidden` rule.
- Adds a dedicated native, keyboard-accessible, touch-friendly scroll area inside the popup.
- Redesigns the modal header, spacing, recommendation rows, badges, and Edit buttons using theme variables.
- Fixes enlarged reroll history covers breaking the modal grid; proportionally scales the cover column and constrains sizes at narrow viewports.
- Displays long title names cleanly without overlap, with full title tooltip.
- Maintains Respect slot information, Edit action, current recommendation, and reroll history without altering recommendation logic.
- Updates the service worker, PWA cache, version metadata, and rebuild-safe source module.

## Compatibility
Cloud Sync v201 · Full Backup Schema v29 · Settings Preset Schema v1 · Personal Order Export v5 · Collections Export v2. No data migration required.
