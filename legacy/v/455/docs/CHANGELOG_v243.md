# MediaFlow v243 — Logging Artwork Cleanup & Batch Category Filter Visibility

MediaFlow v243 is a focused UI/reliability release for logging artwork and the Batch Log Library Browser.

## Logging artwork
- A logged title with a valid Cover URL now shows **only the title cover**.
- The category icon remains available only as a fallback when the title has no usable cover artwork.
- Cover/category fallback artwork remains clickable and continues opening **Title Details**.
- The global button-icon layer continues to stay off poster artwork.

## Batch Log Category Filter
- Fixed the searchable Category Filter popover being hidden behind/clipped by the Batch Log browser and following card.
- The Batch Log browser now allows the dropdown to overflow correctly and raises its stacking layer only while the filter is open.
- Search, multi-select, pagination, configured Category Filter order/visibility, and stay-open behavior are preserved.

## Persistence / export audit
No new persistent fields are introduced. The current state remains compatible with:
- Cloud Sync / Sync Now
- Full Data Export / Import
- Full Backup / Automatic Backup
- Settings Preset Export / Import
- History CSV Export
- Personal Order Export / Import

Compatibility remains **Cloud Sync v201 · Full Backup Schema v29 · Settings Preset Schema v1 · Personal Order Export v4**.
