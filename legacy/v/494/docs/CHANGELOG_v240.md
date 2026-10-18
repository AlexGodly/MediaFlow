# MediaFlow v240 — Edit Title Layout Polish, Logged Cover Sizing & Profile Cleanup

MediaFlow v240 improves the Edit Title editor so related fields are grouped logically and the full desktop canvas is used efficiently. Category now sits beside Status, Progress sits beside Total, artwork and dates share a balanced row, and repeat/imported metadata sections use the available width instead of leaving large empty areas.

## Edit Title
- Reorganized the editor into a 12-column desktop layout.
- Grouped **Category + Status** together.
- Grouped **Progress + Total** together.
- Kept **Priority + Rating** together.
- Expanded the Cover Art area and aligned Start/Finish dates beside it.
- Made Estimated Minutes + Tags use the remaining row cleanly.
- Expanded Rewatch/Reread and imported metadata sections across the full editor width.
- Preserved safe scrolling on short, tablet and mobile viewports.
- Refined input/select/textarea styling, spacing, focus states and responsive behavior.

## Cover sizes by location
- Added **Logged / Batch selected covers** as a first-class cover-size surface.
- Controls Dashboard logged-title cards and Batch Log selected-title artwork.
- Defaults to 100% and supports the existing unlimited numeric cover-size system.
- Included in Settings persistence, cloud sync verification, Full Backup, Automatic Backup and Settings Presets.

## Profile cleanup
- Removed the neutral action icon that appeared beside the profile picture/name in the sidebar account area.
- Profile avatar, display name, Cloud badge and Log out remain unchanged.

## Persistence / export audit
- Re-audited Full Data Export/Import, Automatic Backup, Cloud Sync/Sync Now, Settings Presets, Personal Order export/import and History CSV export.
- No schema bump is required.

**Compatibility:** Cloud Sync v201 · Full Backup Schema v29 · Settings Preset Schema v1 · Personal Order Export v4.
