# MediaFlow v533 Stable — History & Statistics Navigation Hotfix

## Problem
Following v532, clicking the **History** or **Statistics** navigation item could leave the user on the current page without switching. The shared media-type helpers used by both pages were installed as the last runtime extension, after their original page renderer sources. The initial tests only evaluated that module in isolation; they did not exercise the page HTML render functions.

## Fix
- Move the common media-type definitions to the early shared `src/js/utils/006-util.js` layer, before the History and Statistics renderers in the canonical bundle.
- Remove the delayed v532 helper from the runtime extension list, avoiding duplicate definitions and late initialization.
- Preserve the new History media filters: Watching, Reading, Playing, Listening, and Other.
- Preserve Statistics → Media Type Mix calculations and readable labels, skipping consumption for skipped entries and retaining an Other bucket for missing/unrecognized categories.
- No changes to history entries, saved category type IDs, title statuses (Active/Planned), XP, cloud configuration, Supabase, or backups.

## Verification
- Updated v532 helper tests to load the actual early utility location.
- Added `tests/test-v533-history-stats-pages.cjs`, a page-level test that renders the current History View Options markup, legacy History layout, and real Statistics HTML, and checks all four activity types.
- Assert that the rebuilt production bundle contains the media-type helpers **before** both page renderers, eliminating late initialization.
- Run the existing complete regression suite and PWA checks; archive the release at `legacy/v/533`, publish numeric tag `533`, and deploy GitHub Pages.

This is a UI/runtime order fix only. No data migration.
