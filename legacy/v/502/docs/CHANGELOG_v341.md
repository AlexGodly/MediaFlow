# MediaFlow v341 — Recently Viewed Tab Fix & Library History Pagination

**Release:** MediaFlow v341  
**Base:** MediaFlow v340 Modular  
**Created by:** Alex Godly  
**Release date:** October 9, 2026

## Recently Viewed — Tab Activation Fixed

### Confirmed v340 Runtime Error Repaired

Investigated the actual compiled v340 JavaScript bundle and reproduced the reported problem: selecting **History → Recently viewed** threw a `ReferenceError` because the new v340 renderer tried to call `v261CategoryOptions` and `v261HistoryPager`. Those helpers had been defined inside v261's private module scope, where they were inaccessible to the v340 renderer.

**v341 provides compatible history-filter and pager helpers in the shared runtime scope.** The Recently Viewed page now renders instead of leaving the previous tab visible.

### Reliable History Tab Switching

Changed History tab activation to refresh the active History content panel without unnecessarily rebuilding the entire MediaFlow application. This makes switching between Consumption History, Recently Viewed, Ratings, Logs and Library History more responsive and reduces the chance of another unrelated page renderer blocking a History tab change.

The selected tab's visual state and accessibility metadata (`aria-selected`) now update with the content panel. Switching back and forth preserves the user's active filter choices.

### Existing Recently Viewed Features Preserved

- Actual logged title names and title-specific covers.
- Individual title cards within multi-title consumption logs.
- Dedicated **Edit log** actions linked to the correct original session.
- Existing Title Details shortcuts.
- Category and time-period filters.
- Title-name search and pagination.
- No fabricated titles for older category-only history records.

## Recently Viewed — Performance Optimization

### Cached Title-Level History Index

Recently Viewed now builds its resolved, deduplicated title activity index once per history/library data version and reuses it for subsequent page switches, searches and pagination actions.

Previously, the list of distinct recently viewed titles was rebuilt from the entire Consumption History for every page change and filter update. With the new index, subsequent operations filter or slice cached title entries rather than repeatedly resolving every logged title.

### Cache Invalidation for Changes

The index is invalidated when MediaFlow invalidates the history sort cache or Library lookup cache, and is also guarded by history and Library array identity, size, boundary records and the existing Library version token.

Edited, imported or deleted session activity will be reflected after the usual persistence/cache invalidation path.

### Correct Per-Title Recency Order

Title activity is sorted using individual logging timestamps before duplicate titles are removed. This gives priority to the genuinely latest title occurrence even when a multi-title entry's per-title timestamp differs from the parent session time.

### Targeted Recent Filter and Page Updates

Search, category/period filters and Previous/Next pagination update the Recently Viewed body directly, without a full-page MediaFlow rerender. Search retains keyboard focus and caret position while filtering.

Only the currently selected page of Recent cards is inserted into the DOM.

## Library History — Pagination Enhanced

### Existing Pager Restored as a First-Class Control

MediaFlow already had a legacy 50-entry Library History paginator from v241. v341 preserves that pagination logic and makes it easier to use in the current unified **History → Library** tab.

### Configurable Entries Per Page Added

Library History now offers page-size choices:

- **10** changes per page.
- **25** changes per page.
- **50** changes per page (default).
- **100** changes per page.

### Page Navigation Preserved

Previous and Next controls appear above and below the activity list when needed, with the current page, total pages and filtered change count displayed. The page index is clamped when the data or filter changes.

### Library History Search Added

A **Find changes** search field filters Library History by recorded action, description and stored changed-title names. Its result count is shown beside the page-size control.

Entering a new query resets the pager to the first page; the search field keeps keyboard focus during results updates.

### In-Place Library History Updates

Changing page number, page size or search updates only the Library History panel, rather than rebuilding all of MediaFlow. Only the selected slice of entries is rendered.

### Existing History Actions Preserved

The existing v241 activity-row renderer remains the source of the displayed change records. This preserves:

- Recorded action timestamps and descriptions.
- Associated title edits.
- Stored activity XP display.
- Restorable deleted-title snapshots and Restore actions.
- Undo/Redo controls.
- Existing original Library change records.

## Compatibility & Data Protection

- Consumption History entries and Library History activity records are **not modified or discarded**.
- Existing cloud sync and backup formats remain unchanged.
- No new Supabase database tables or SQL migrations.
- No changes to XP calculations or rewards.
- No changes to Personal Order, Collections, Library display modes or existing exports.
- The default v333+ Personal Edition Supabase configuration is preserved.
- New search/page-size choices are view-local interface settings, not new cloud data.

| Existing system | Version |
|---|---:|
| Cloud Sync | 201 |
| Full Backup schema | 29 |
| Settings Preset schema | 1 |
| Personal Order export format | 5 |
| Collections export format | 2 |

## Release Files & PWA

- **New runtime extension:** `src/js/components/238-v341-history-tab-pagination-performance.js`
- **New stylesheet:** `assets/css/168-v341-history-tab-pagination-performance.css`
- **New browser regression test:** `tests/test-v341-history.py`
- **Active JavaScript:** `assets/js/mediaflow-v341.bundle.js`
- **Package version:** `341.0.0`
- **Application VERSION:** `341`
- **PWA shell cache:** `mediaflow-pwa-v341-shell-v1`
- `index.html`, `version.json` and the generated service worker have been aligned with v341.

## Testing and Verification

The regression test uses the **actual compiled MediaFlow bundle**, not only isolated function mocks. Results:

- Reproduced the v340 `ReferenceError` and verified that it no longer occurs in v341.
- Recently Viewed tab activates through an actual button click.
- Multi-title History cards render and recent search filters correctly.
- Search retains input focus/value after updates.
- Library History displays 50 entries per page by default.
- Library History Previous/Next pages, configurable page size and action/title search work.
- Verified that History tab switching still works after filtering.
- With **15,000 sessions** and **18,000 Library titles**, opening Recently Viewed took roughly **0.3 seconds**, and changing a Recent results page roughly **0.01–0.02 seconds** in the local headless Chromium test. Performance may vary by device.
- v340 visual-history regression, v334 XP regression, v335/v336/v337 component smoke tests, v338 cover-selection regression and v339 transfer/Collections tests passed.
- JavaScript syntax and PWA asset generation passed.

**Note:** A v339-specific release-metadata test deliberately asserts `VERSION == 339` and is not applicable unchanged to v341; the feature-level v339 tests passed. Live GitHub Pages deployment and authenticated Supabase synchronization were not performed.

## v341 Release Summary

1. Fixed the broken Recently Viewed tab's actual scope-related JavaScript error.
2. Made History tab switching update content without rebuilding the full application.
3. Added a reusable Recent title index with correct per-title timestamp ordering.
4. Made Recent searches and pagination update quickly in place.
5. Improved Library History's existing paging with 10/25/50/100 row choices.
6. Added Library History search and filtered result counts.
7. Preserved existing Library History edits, restoration controls, cloud data and XP.
8. Regenerated all application release and PWA metadata for v341.

**Version progression:** v339 cloud/export integrity → v340 Consumption History/Recently Viewed redesign → **v341 Recently Viewed activation repair + History performance/pagination.**
