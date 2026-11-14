# MediaFlow v238 — Status Filter Reliability, Logging UX, Responsive Device Modes & Persistence Audit

MediaFlow v238 is a reliability, performance and responsive-UI release. It fixes the status-filter regression that could leave filters visually stuck on **Plan to Watch**, restructures Dashboard logging around what was actually logged, adds a collapsible lazy Library browser, enlarges the normal Edit Title editor, audits phone/tablet responsiveness, and adds a persistent device-layout override.

## Status Filter Reliability

- Fixed reordered native status selects losing their selected value after the Choice & Filter Layout pass.
- Status filters now preserve the actual selected value before/after option reordering.
- Fixed the visible filter being stuck on **Plan to Watch** while the underlying results did not match.
- Repair applies to every native MediaFlow status filter that uses the shared `All statuses` selector pattern, including Dashboard logging and the other Library browsers.
- Hidden/removed options safely fall back to an available visible value rather than leaving an invalid selection.

## Dashboard Logging Redesign

- Reworked Log & Complete into a clearer **What You Logged → Library → quantities/progress → save** flow.
- Added a clear **What You Logged** summary at the top of the logging form.
- Moved the Library title search/filter browser below the section showing what is already in the log.
- Added a collapsible **Library** panel that can be opened or hidden at any time.
- Library browser starts collapsed by default to reduce opening cost.
- Search/filter controls are created lazily when the Library panel is opened.
- Improved small helper text, labels, spacing and logging-field readability.
- Preserved Amount Consumed / Last Progress logging methods, multi-title logging, sorting, category search/filter, status filter, priority filter and per-page controls.

## Logging Performance

- Replaced stacked legacy Log & Complete opening wrappers with a single final v238 open path.
- Removed redundant full renders while opening the logging form.
- Deferred expensive Library browsing/sorting/filtering until the collapsible Library panel is opened.
- Logging UI updates render before slower secondary persistence work where safe.

## Edit Title Popup

- Increased the normal Add/Edit Title modal to a large desktop workspace.
- Added a dense multi-column editor layout on desktop.
- Compacted cover-art controls, repeat-history controls and rich imported metadata fields.
- Typical desktop Edit Title screens now fit without an internal modal scrollbar while retaining all editable fields.
- Smaller viewports retain safe scrolling rather than clipping controls.

## Mobile / Tablet / Desktop Responsive Audit

- Audited Dashboard, Library, Personal Order, Batch Log, Settings and Statistics at phone and tablet widths.
- Added stronger overflow protections for inputs, selects, buttons, cards and form layouts.
- Improved logging layouts on narrow screens.
- Settings navigation becomes a horizontal compact navigation row in forced phone/tablet layouts.
- Added `content-visibility`/containment hints on repeated heavy rows for lower paint cost on mobile/tablet.
- Disabled expensive backdrop filtering on key phone/tablet navigation surfaces.
- Reduced transition duration on repeated interactive UI surfaces for more responsive low-power-device interaction.

## New Device & Layout Setting

Added **Settings → Interface → Device & Layout**.

Available modes:

- **Automatic** — default; follows the current viewport/device.
- **Mobile** — forces MediaFlow's mobile presentation.
- **Tablet** — forces the tablet presentation.
- **Desktop** — forces the desktop presentation.

The setting has its own semantic device icon and participates in the existing Settings organizer/sidebar/reset system.

## Device Mode Persistence

The new device-layout preference is stored as `settings.v238DeviceLayout` with a `modifiedAt` timestamp. It participates in:

- local Settings persistence
- cloud state merge/verification
- Sync Now
- Full Data Export / Import
- Automatic Backup
- Settings Preset Export / Import
- section/control reset behavior

No schema bump is required.

## Export / Sync / Backup Audit

v238 re-audits the current persistent-state and dedicated-export paths after the large v224–v237 UI/settings expansion.

Confirmed/updated coverage includes:

- Full Data Export / Import
- Automatic Backup
- cloud state / Sync Now
- Settings Preset Export / Import
- Personal Order dedicated Export / Import
- History CSV export
- current Settings, including the v238 Device & Layout preference

Personal Order remains dedicated export **format v4**; v238 adds release-audit metadata without breaking older compatible imports.

## Compatibility

- **App release:** v238
- **Stable feature base:** v201
- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4

No Library/user-data migration is required.
