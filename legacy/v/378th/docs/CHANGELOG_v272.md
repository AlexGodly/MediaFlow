# MediaFlow v272 — Logs Title Covers & Edit Title Header Repair

MediaFlow v272 is a focused History and editor-layout release built from v271.

## History → Logs

- Logs now shows the actual consumed title cover and title instead of relying only on the text/category summary.
- Sessions containing multiple consumed titles render each title in a compact horizontal title rail.
- Real `coverUrl` artwork is used first.
- When no title cover URL exists, the title's MediaFlow category artwork/icon is used as the cover fallback.
- Automatic legacy notes that only repeat the same generated consumed-title summary are suppressed once the visual title cards are present; genuine user notes remain untouched.
- The old standalone category-icon column is removed from Logs rows so the cover/title layout stays aligned.
- Logs remains paginated and preserves filtering, selection, edit/delete, export and v270 large-data optimizations.

## New Cover Size Setting

Added an independent Settings → Cover Size Adjustment control:

- **History · Logs covers**

The value uses the existing `v181CoverSizes` settings object and therefore participates in normal local persistence, Cloud Sync, Full Backup and Settings Preset export/import without a schema bump.

## Edit Title Modal

- Fixed the **Edit title** heading and **Delete title** button overlapping/misaligning in the title editor.
- Removed inherited legacy sticky-title geometry from the nested heading.
- The title and delete action now share a stable header row on desktop and stack safely on narrow mobile layouts.
- Existing Save/Cancel/Delete behavior is unchanged.

## Compatibility

- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset Schema: v1
- Personal Order Export: v4
- PWA shell: `mediaflow-pwa-v272-shell-v1`
- No data migration required.
