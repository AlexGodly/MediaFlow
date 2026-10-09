# MediaFlow v227 — Icon Corrections, Dynamic Category URL Fix & Dashboard Poster Cleanup

MediaFlow v227 is a focused polish release that corrects several visual inconsistencies remaining after the v225/v226 icon overhaul while preserving the existing data and synchronization architecture.

## Dynamic Library Category URL Icons Fixed

The **Dynamic category row icons → Category icon URL** setting now correctly displays each category's configured URL icon in the Dynamic Library category row.

The issue was caused by an older high-specificity Dynamic Library rule that continued hiding category images even when the v226 setting enabled them. v227 adds the correct higher-specificity override instead of changing category data.

The existing options remain:

- **No icons**
- **Category icon URL**

## Dynamic Category Icon Selector Cleanup

The **Dynamic category row icons** selector itself no longer receives a decorative category/dropdown icon.

Its label and selected value already explain the control clearly, so the selector now remains visually simpler while keeping its standard dropdown arrow.

## Add Time / Minus Time Consistency

The Stopwatch **Minus time** action now uses a plain minus icon instead of a minus inside a circle.

This matches the existing plain plus treatment used by **Add time**.

## Priority Icons Improved

The priority chooser now uses separate semantic icons for:

- **Low** — downward priority indicator
- **Medium** — neutral/equal priority indicator
- **High** — upward priority indicator

The older text glyphs are hidden when the new SVG icon system is active so users do not see duplicate priority symbols.

## Visibility Switch Icons Fixed

Show/Hide switches that use eye/eye-off icons now reserve dedicated space for the icon.

The switch knob and visibility icon no longer overlap, so the full icon remains visible in both states.

## Automatic / Manual Mode Icons

Seasonal fresh-episode detection now gives both operating modes their own semantic icon:

- **Automatic · Jikan** — automatic/sync-style icon
- **Manual** — manual-control icon

The icons are displayed inside the existing mode pill without changing how the mode works.

## Category Choice Icon Cleanup

Category-choice controls that already display the category's own identity no longer receive an extra generic global button icon.

## Dashboard Poster Placeholder Cleanup

The poster/cover placeholders inside:

- **Rate Your Library**
- **Missing Covers**

no longer receive a generic action icon from the global v225 button-icon system.

The poster area is now reserved entirely for the title/category artwork itself.

## Existing v226 Features Preserved

v227 preserves:

- Settings → Categories layout containment
- visible category order numbers
- semantic status icons
- purpose-aware dropdown icons everywhere except the explicit Dynamic category-row selector exception
- `Cover+Titles` naming
- Normal/Dynamic Library cover sizing parity
- Normal/Dynamic Library title-size parity
- Dynamic Library category icon preference persistence

## Data Compatibility

No Library/user-data migration is required.

Compatibility remains:

> **Cloud Sync:** v201  
> **Full Backup Schema:** v29  
> **Settings Preset Schema:** v1

# v227 Release Summary

**Release:** MediaFlow v227  
**Codename:** **Icon Corrections, Dynamic Category URL Fix & Dashboard Poster Cleanup**  
**Base:** MediaFlow v226 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Fixed Dynamic Library **Category icon URL** rendering.
- Preserved text-only Dynamic categories when **No icons** is selected.
- Removed the leading icon from the Dynamic category-row icon mode selector.
- Changed **Minus time** to a plain minus icon.
- Added distinct **Low / Medium / High** priority icons.
- Removed duplicate legacy priority glyphs when new icons are active.
- Fixed Show/Hide switch icon clipping/overlap.
- Added **Automatic** mode icon.
- Added **Manual** mode icon.
- Removed redundant global icons from category-choice controls.
- Removed action-icon overlays from Rate Your Library poster placeholders.
- Removed action-icon overlays from Missing Covers poster placeholders.
- Preserved all v226 Library, Settings, sync and backup behavior.
- Kept **Cloud Sync v201**.
- Kept **Full Backup Schema v29**.
- Kept **Settings Preset Schema v1**.
- Updated MediaFlow version to **227**.
