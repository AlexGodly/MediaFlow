# MediaFlow v273

## Drag-first Latest Consumed shelf

- Added direct mouse/touch/pen drag navigation to the Consumption History **Latest Consumed** cover shelf.
- The shelf can be dragged directly from the posters rather than requiring a visible scrollbar.
- Horizontal browser scrollbars are hidden.
- Drag gestures suppress accidental title activation after movement.
- Existing cover sizes, category artwork fallback, progress labels and title opening remain unchanged.

## Whole-app responsive hardening

- Added a physical-viewport responsive guard for phones, tablets and tight-width browser windows.
- Physical narrow viewports now override the legacy forced-desktop layout path that could leave MediaFlow wider than the screen.
- At tablet/mobile widths the desktop sidebar yields to the mobile navigation shell.
- Improved shrink/wrap behavior across Dashboard, Library, Personal Order, Old System, History, Batch Log, Statistics, Account, Settings and About.
- Improved responsive page headers, toolbars, grids, modals, settings navigation and dense action rows.
- History tabs use a scrollbar-free horizontal tab shelf on very narrow screens.
- Preserved intentional inner horizontal shelves while preventing page-level horizontal overflow.

## Data / update / export audit

Revalidated the current release paths for:

- Cloud Sync / Sync Now
- XP recalculation
- Full Data export/import
- Automatic Backup / Full Backup
- Settings Preset export/import
- Managed and automatic update systems
- Logs export
- Consumption History export
- Personal Order import/export
- PWA shell generation and update metadata

Compatibility remains:

- Cloud Sync v201
- Full Backup Schema v29
- Settings Preset Schema v1
- Personal Order Export v4

No data migration is required.

## PWA

- Advanced application shell cache to `mediaflow-pwa-v273-shell-v1`.
- Version metadata, bundle references and service-worker release metadata are aligned to v273.
