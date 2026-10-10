# MediaFlow v263 — Library Filter Interaction Repair

MediaFlow v263 is a focused Library bug-fix release built directly over v262.

The preferred v262 Library layout remains unchanged. This release repairs the interaction layer that prevented Status and Category buttons from activating when clicked or tapped.

## Fixed

- Fixed **Status** buttons not responding in Normal Library.
- Fixed **Category** buttons not responding in Normal Library.
- Fixed **Status** buttons not responding in Dynamic Library.
- Fixed **Category** buttons not responding in Dynamic Library.
- Fixed the row-level drag-to-scroll helper capturing the pointer too early and swallowing filter clicks/taps.
- Changed desktop/pen drag behavior so pointer capture begins only after a real horizontal drag gesture crosses the movement threshold.
- Preserved native touch horizontal scrolling on phones/tablets without hijacking taps.
- Preserved horizontal drag browsing and hidden scrollbars.
- Preserved the full v262 Library layout and all v261+ Library functionality.

## Preserved

- Normal and Dynamic Library layouts from v262.
- Library Tools show/hide behavior.
- Status and Category rows directly above titles.
- Covers filter fix from v261.
- List / Compact / Cards / Covers / Covers+Titles.
- On-cover Status / Category / Rating / Progress overlays and size controls.
- Bulk actions, sorting, priorities, pagination and Clean Covers.
- Dynamic themes.
- All non-Library v262 pages and functionality.
- Cloud Sync v201.
- Full Backup Schema v29.
- Settings Preset Schema v1.
- Personal Order Export v4.
- Zero-config GitHub Pages deployment.

## PWA

PWA shell advanced to:

`mediaflow-pwa-v263-shell-v1`
