# MediaFlow v254 — Library Cover Overlays & Visual Progress

MediaFlow v254 adds configurable information overlays to the **Covers** and **Covers+Titles** Library display modes in both Normal and Dynamic Library.

## Cover overlay controls
A new **On cover** control appears only while using Covers or Covers+Titles. Each element can be shown or hidden independently:

- **Status** — displays the semantic MediaFlow status icon for Watching, Completed, On Hold, Dropped or Plan to Watch.
- **Category** — displays the title's actual configured category icon.
- **Rating** — displays the title rating when a rating exists.
- **Progress** — attaches a progress bar to the bottom edge of the cover using the title's current progress and total.

## Normal + Dynamic Library parity
The same cover-information system is available in both Library modes. A saved visibility choice applies consistently when switching between Normal and Dynamic Library.

## Cover-mode exclusivity
The overlays and their controls are intentionally limited to:

- Covers
- Covers+Titles

List, Compact and Cards remain unchanged.

## Status-aware cover icon
The status badge automatically follows the title's current status, including Watching, Completed, On Hold, Dropped and Plan to Watch.

## Category artwork support
The category badge uses MediaFlow's normal category icon renderer, so emoji icons and configured icon URLs remain supported.

## Rating behavior
The rating badge is only rendered when the title has a valid positive rating. Titles without ratings stay visually clean.

## Attached progress bar
When a title has a known total greater than zero, MediaFlow calculates its percentage from `progress / total` and draws the bar directly along the bottom edge of the cover.

## Selection compatibility
Dynamic Library's existing cover-selection checkbox remains available. The new status icon automatically moves away from the selection control so the two controls do not overlap.

## Persistence
The four overlay visibility preferences are persistent MediaFlow Settings. They participate in existing settings/cloud/backup flows without requiring a schema bump.

Compatibility remains:

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4

## PWA
The release-specific PWA cache advances to:

> **mediaflow-pwa-v254-shell-v1**

All v247+ PWA diagnostics, repair and fault-tolerant caching behavior remain preserved.

## Preserved systems
v254 does not change the v253 Seasons View, History batch tools, recommended-title logging shortcut, managed updates, cloud reliability, XP calculations, backups, imports/exports or Personal Order behavior.

## Release summary

**Release:** MediaFlow v254  
**Codename:** **Library Cover Overlays & Visual Progress**  
**Base:** MediaFlow v253 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main changes
- Added cover overlay options to Covers and Covers+Titles.
- Added Status show/hide.
- Added Category show/hide.
- Added Rating show/hide.
- Added Progress bar show/hide.
- Added semantic status icons over title covers.
- Added configured category icons over title covers.
- Added rating badges only for rated titles.
- Added cover-attached progress bars from progress/total.
- Added Normal/Dynamic Library parity.
- Kept the feature exclusive to Covers and Covers+Titles.
- Preserved Dynamic cover selection behavior.
- Persisted overlay visibility through MediaFlow settings/cloud/backups/presets.
- Preserved Cloud Sync v201.
- Preserved Full Backup Schema v29.
- Preserved Settings Preset Schema v1.
- Preserved Personal Order Export v4.
- Advanced PWA cache to **mediaflow-pwa-v254-shell-v1**.
- Preserved v253 and earlier functionality.
- Updated MediaFlow version to **254**.

## Version progression

**v250** → About UI cleanup, persistence audit & cloud reliability  
**v251** → Library display mode naming & icon polish  
**v252** → Seasons View, season-aware logging & progress synchronization  
**v253** → Seasons UI cleanup, recommended logging shortcut & History batch management  
**v254** → **Library cover overlays & visual progress**
