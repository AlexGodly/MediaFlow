# MediaFlow v233 — Dynamic Settings Navigation & Title Details Cover Sizing

MediaFlow v233 promotes the Dynamic Library configuration into a dedicated Settings section and adds an independent cover-size control for the Title Details popup.

## Dynamic Settings section

- Added **DYNAMIC SETTINGS** as a first-class Settings section.
- Added **DYNAMIC SETTINGS** to the Settings sidebar.
- Placed it directly below **LIBRARY MODE** and before **CATEGORIES** in the Library settings group.
- Added a dedicated semantic Dynamic Settings sidebar icon.
- The section owns the existing Dynamic Library configuration:
  - Dynamic category row icons (`No icons` / `Category icon URL`)
  - Dynamic category row ordering source (`Custom Dynamic row order` / `Follow Categories order`)
  - Dynamic category row order, visibility, direct position and drag controls
  - Dynamic status row order
- The old `LIBRARY EXPERIENCE` label is no longer exposed in the v233 Settings navigation/page for these controls.
- Library Mode remains a separate section and reset target.
- Dynamic Settings receives its own section reset behavior without resetting the chosen Library Mode.

## Title Details cover size

- Added **Title Details popup cover** to **Settings → Cover Size Adjustment → Cover sizes by location**.
- The new control has the same slider + unlimited numeric field behavior as the other cover locations.
- Default is **100%**.
- The size applies independently to the cover/placeholder in the Title Details popup.
- Responsive base proportions are preserved on desktop, compact desktop/tablet, and mobile.
- Existing v232 wider Title Details layout remains intact at the default 100% setting.

## Persistence and compatibility

The new cover-size value lives at:

`settings.v181CoverSizes.titleDetails`

It participates in the existing settings normalization and complete Settings payload, so it is covered by:

- local settings persistence
- Cloud Sync / Sync Now
- Full Data Export / Import
- Automatic Backup
- Settings Preset Export / Import
- Restore Defaults / Cover Size section reset

No schema bump is required.

Compatibility remains:

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order dedicated export:** v4

## Preserved v232 behavior

- Large-Library performance fixes
- Scoped/idempotent UI enhancement observer
- Dynamic Library status ownership by Dynamic Status settings only
- Choice & Filter Layout independence
- Current export/import/cloud audit protections
- Wider, denser Title Details presentation
- Title Details metadata icon cleanup

# v233 Release Summary

**Release:** MediaFlow v233  
**Codename:** **Dynamic Settings Navigation & Title Details Cover Sizing**  
**Base:** MediaFlow v232 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Added **Dynamic Settings** to the Settings page.
- Added **Dynamic Settings** to the Settings sidebar.
- Positioned Dynamic Settings directly below Library Mode.
- Positioned Categories after Dynamic Settings.
- Added a dedicated Dynamic Settings icon.
- Moved the existing Dynamic category-row icon configuration under Dynamic Settings.
- Kept Dynamic category-row order configuration under Dynamic Settings.
- Kept Dynamic category row visibility/reordering controls under Dynamic Settings.
- Kept Dynamic status order under Dynamic Settings.
- Added independent Dynamic Settings reset behavior.
- Added **Title Details popup cover** to Cover Sizes by Location.
- Added live preview of Title Details cover-size changes.
- Added responsive Title Details cover scaling.
- Added persistence/backup/preset audit metadata for the new cover surface.
- Preserved Cloud Sync v201.
- Preserved Full Backup Schema v29.
- Preserved Settings Preset Schema v1.
- Preserved Personal Order export format v4.
- Updated MediaFlow version to **233**.

## Version Progression

**v230** → Choice & Filter Layout Control Center  
**v231** → Library Mode Settings, active Settings navigation & extended inheritance controls  
**v232** → Library performance overhaul, Dynamic Status independence & Title Details redesign  
**v233** → **Dynamic Settings navigation & Title Details cover sizing**
