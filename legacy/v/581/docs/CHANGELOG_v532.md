# MediaFlow v532 Stable — Universal Media Types in History & Statistics

## Fixed
The History **View Options → Media type** dropdown still offered only Video and Reading, and Statistics → **Media Type Mix** displayed raw stored codes (video, reading, other). Those renderers had not been updated during the v527 universal media expansion.

All active History renderers (modern consumption workspace, enhanced History, and classic History) now share a single selector:
- **All media types**
- **Watching** (stored as `video`)
- **Reading** (`reading`)
- **Playing** (`playing`)
- **Listening** (`listening`)
- **Other** (deleted categories or unrecognized media types)

Each selection filters the underlying History session list and preserves existing year, month, date, category, paging, and CSV controls. **Other** makes older entries with removed or unrecognized categories filterable instead of losing them.

Statistics → **Media Type Mix** now presents Watching, Reading, Playing and Listening separately, even when a type has no consumption yet (0). It adds Other only when such sessions exist. Totals still sum non-skipped logged **minutes** exactly as before. The statistics calculation uses a category index rather than repeatedly scanning the category array.

## Scope and compatibility
- No modifications to stored `video`, `reading`, `playing`, `listening` identifiers.
- No changes to saved sessions, XP, category definitions, personal ordering, Supabase, exports, or backups.
- Existing category Add/Edit activity type labels remain Watching / Reading / Playing / Listening.
- Central UI helper `src/js/components/379-v532-media-type-history-statistics.js` is packaged through the canonical runtime build.
- Added direct regression coverage of dropdown selection, each active filter including Other, mixed-minutes calculations, missing categories, skipped entries, and legacy UI render sources.
- The normal PWA build/checks and v514-v531 suite remain active.

Release workflow archives the complete project at `legacy/v/532`, publishes numeric GitHub tag `532` (**v532 Stable**), and deploys GitHub Pages.
