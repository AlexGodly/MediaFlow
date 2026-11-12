# MediaFlow v271 Changelog

## History → Consumption History

- Fixed Category filter popup clipping.
- Replaced Select / View Options icons with semantic icons.
- Removed generic injected action icons from poster/title cards and History tabs.
- Enlarged Latest Consumed covers.
- Improved title/cover alignment in daily History cards.
- Improved Most Consumed title-card alignment.
- Kept week date-range badges visible.
- Hid weekly category horizontal scrollbars while preserving drag scrolling.
- Improved typography/readability across Unified History.
- Improved sticky selection/filter spacing.

## New Logs tab

- Added **Logs** immediately before **Library**.
- Restores the pre-redesign paginated History interface.
- Preserves old filters, date range, per-page control, selection, edit/delete and pagination.
- Added dedicated Logs CSV export.
- Redesigned Consumption History retains its own dedicated CSV export.

## Cover Size Settings

Added independent persistent controls for:

- Consumption History · Latest consumed covers
- Consumption History · Week summary covers
- Consumption History · Daily log covers
- History · Recently viewed covers
- History · Ratings covers
- Dashboard · Recommended title cover

These settings are included in the existing Cloud Sync, Full Backup and Settings Preset settings payloads.

## Reliability / compatibility

- Preserves v270 large-History pagination/indexing optimizations.
- Preserves v268 Today’s Balance first-load fix.
- Preserves v267 Cloud Sync verification fixes.
- Preserves the permanent removal of the Sync Now version chip.
- Removes stale release numbers from the generic page-header subtitle.
- Cloud Sync remains v201.
- Full Backup remains Schema v29.
- Settings Preset remains Schema v1.
- Personal Order Export remains v4.
- PWA cache advances to `mediaflow-pwa-v271-shell-v1`.
- No data migration required.
