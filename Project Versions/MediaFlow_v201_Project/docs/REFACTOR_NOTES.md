# Refactor Notes — v201 single-file → project

## What changed

- Replaced the giant inline HTML/CSS/JS document with a clean `index.html` entry point.
- Extracted and grouped all 74 inline style blocks into ordered external stylesheets.
- Split the application source into core, UI, view and feature files.
- Added a dependency-free Node build step that reconstructs the private runtime scope.
- Added a project audit that checks structure and JavaScript syntax.
- Added `manifest.json` and a deliberately non-intercepting `sw.js`, matching files already referenced by the original app without changing request behavior.
- Removed large runs of blank lines/trailing whitespace as safe code cleanup.
- Preserved the v201 version marker, Supabase loading order, SPA root, theme/font links and late CSS cascade.

## What intentionally did not change

- No page was converted to a separate browser document; views remain SPA views to preserve state/navigation behavior.
- No state schema, Supabase key/URL, scheduler formula, XP formula, import/export format or UI feature was intentionally rewritten.
- Historical override CSS was not aggressively deduplicated. In a project with this many version-layer overrides, blind deletion can cause subtle visual regressions.

## Recommended next refactor phase

Once this structure is stable, the safe next step is to replace ordered build fragments with explicit ES modules/services one subsystem at a time (state → storage → scheduler → views), backed by browser regression tests. That is intentionally separate from this behavior-preserving migration.
