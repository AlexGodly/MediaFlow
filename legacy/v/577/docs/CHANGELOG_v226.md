# MediaFlow v226 — Semantic Icons, Category Settings Repair & Dynamic Library Parity

MediaFlow v226 focuses on correcting crowded Settings category controls, replacing generic action icons with meaning-specific interface icons, improving dropdown clarity, and bringing Dynamic Library display sizing behavior in line with Normal Library.

This release preserves the existing MediaFlow data model and synchronization contracts while extending the v225 global icon system with more precise semantics.

## Category Settings Layout Repair

The **Settings → Categories** management list has been redesigned so every category control remains inside its card and stays readable.

Improvements include:

- category order numbers are visible again
- numeric order fields use a stable readable width
- drag handles remain clear and icon-free
- Edit, Clear and Delete actions stay inside the category card
- Delete no longer overflows beyond the Settings panel
- category metadata can wrap instead of forcing actions off-screen
- narrower layouts reorganize actions onto additional rows rather than clipping controls

## Category Order Controls Preserved

Existing category ordering behavior is unchanged.

Users can still use:

- numeric position fields
- drag handles
- move up
- move down

The update changes presentation and responsiveness rather than category-order data.

## Drag Handles Remain Icon-Free

Drag/reorder handles intentionally do **not** receive the global v225 action icon.

The existing three-line grip remains the visual representation for dragging.

## Semantic Button Icon Pass

v226 extends the v225 global icon system with action-specific icons instead of allowing generic action icons to remain on specialized controls.

The runtime can now replace an already-mounted generic v225 icon when a more specific v226 semantic icon applies.

This also works for dynamically rendered buttons after navigation or re-rendering.

## Dynamic Library Icon Updated

The **Dynamic** Library mode button now uses a circular-dynamic/refresh-style icon that better represents continuously changing Library organization.

## Status Icons Updated

Dynamic Library status tabs now use separate status-specific icons:

- **Watching** — play/watching icon
- **Completed** — completed/check icon
- **On Hold** — pause icon
- **Dropped** — dropped/cancel icon
- **Plan to Watch** — bookmark/planning icon

Each status now has its own visual meaning instead of sharing a generic action symbol.

## Show / Hide Icons Updated

Show and Hide actions now use dedicated visibility icons:

- **Show** — eye icon
- **Hide** — eye-off icon

This includes applicable Show All / Hide All and inclusion/exclusion controls.

## Refresh Icon Updated

Refresh actions now use a dedicated refresh icon.

## Advanced Mode Icon Updated

The **Advanced** button now uses a controls/sliders icon that more accurately represents advanced configuration.

## Settings Sidebar Icons Redesigned

Settings navigation entries now receive icons based on the purpose of each section instead of generic action icons.

Meaning-specific icons are assigned to sections including:

- Categories
- Library Experience
- Logging Method
- Cover Size Adjustment
- Library Integrity
- Category Icons
- Missing Title Covers
- Library Overview
- Library Maintenance
- Category Maintenance
- Cover Maintenance
- Navigation
- Dashboard Settings
- Statistics Settings
- Themes & Customization
- Daily Goal
- Title Recommendations
- MediaFlow System
- Scheduler Tuning
- Leveling & XP
- Import / Export — Media Services
- Automatic Backups
- Cloud Sync
- Settings Preset
- Data
- App Updates

## Dropdown Icon Language

Native single-select dropdowns across MediaFlow now receive a purpose-aware icon while preserving their existing dropdown arrow.

Dropdown icons adapt to the control's purpose, including:

- Category
- Status
- Priority
- Sort
- Cover
- Theme
- Date / Calendar
- Pagination
- Media Type
- Service / Source
- Logging Method
- Unit
- Display Mode
- Mode / Method
- Data / Backup

The layout keeps sufficient left and right padding so the icon, text and dropdown arrow remain readable.

## Personal Order Clarity Preserved

The Personal Order Add Titles toolbar cleanup from v225 remains active.

Adding dropdown icons does not revert the spacing, labels or sorting clarity introduced in v225.

## Custom Order Icon Updated

The **Custom Order** control now uses an ordering/list icon that better represents custom sequence management.

## End Session Icon Updated

The **End Session** control now uses a dedicated exit/end-session icon.

## Stopwatch Minus Time Icon Updated

The **Minus Time** stopwatch action now uses a dedicated minus icon.

Other stopwatch controls continue using their existing action-specific icons.

# Dynamic Library Display Sizing Parity

v226 expands Library sizing controls so they work consistently in Dynamic Library as well as Normal Library.

## Cover Size Adjustment Expanded

The existing **Cover Size** adjustment now affects Dynamic Library title displays in supported modes instead of being effectively limited to Normal Library / cover-focused views.

Dynamic Library sizing support now covers:

- List
- Compact
- Cards
- Covers
- Cover+Titles

## Title Text Size Adjustment Expanded

The **Title Text Size** adjustment now applies across title-bearing display modes in Dynamic Library as well as Normal Library.

Supported title-bearing modes include:

- List
- Compact
- Cards
- Cover+Titles

## Display Mode Rename

The display label:

> **Covers + titles**

has been renamed to:

> **Cover+Titles**

for a shorter and more consistent display-mode name.

# Dynamic Library Category Row Icons

v226 changes how icons are displayed in the horizontal Dynamic Library category row.

## Category Row Icons Disabled by Default

The Dynamic Library category navigation row is now text-only by default.

Generic global action icons are not added to category buttons.

## New Category Row Icon Setting

A new setting has been added under **Settings → Library Experience**:

> **Dynamic category row icons**

Available options are:

- **No icons**
- **Category icon URL**

## Category URL Mode

When **Category icon URL** is enabled, the Dynamic Library category row uses the category's own configured icon URL.

Emoji/fallback icons are intentionally not substituted in this row when a URL icon is unavailable.

## Setting Persistence

The new Dynamic category row icon preference is stored inside the existing `v181Library` settings object.

It therefore participates in the existing MediaFlow settings persistence, cloud settings flow, Full Backup, Automatic Backup and Settings Preset pipelines without requiring a new data schema.

## Individual Settings Reset Support

The new Dynamic category row icon setting participates in the existing v221 individual Settings reset system.

Its default is:

> **No icons**

# Existing v225 Global Icons Preserved

The global icon system introduced in v225 remains active for ordinary action buttons.

v226 adds a semantic override layer for controls that require more specific visual meaning.

Existing v225 icon support remains for actions such as:

- Add
- Edit
- Delete
- Remove
- Confirm
- Cancel
- Save
- Import
- Export
- Restore
- Sync
- Fix
- Calculate
- Previous / Next
- Library display controls
- Account actions
- About actions

# Existing v224 Sorting Preserved

The unified sorting system remains active across:

- Normal Library
- Dynamic Library
- Dashboard Logging
- Batch Log
- Personal Order Add Titles

Sorting continues separating **Sort Field** from **ASC / DESC Direction**.

The default remains **Alphabetic + ASC** where introduced in v224.

# Existing Library Filters Preserved

The v224 Cover filter remains available in Normal and Dynamic Library:

- All Covers
- Has Cover
- Missing Cover

# Existing Page Naming Preserved

The v224 naming remains unchanged:

- **Personal Order**
- **Account**

# Existing Dashboard Controls Preserved

The Dashboard recommendation controls remain grouped beneath the recommended title:

- Edit
- Reroll
- Reroll History

# Data Compatibility

No Library/user-data migration is required.

Compatibility remains:

> **Cloud Sync:** v201  
> **Full Backup Schema:** v29  
> **Settings Preset Schema:** v1

# Runtime Architecture

v226 continues using the active runtime-extension architecture introduced in v219.

New v226 runtime modules add semantic icon replacement, dropdown enhancement, Dynamic category-row icon settings, and Dynamic Library sizing parity without replacing the stable v201 feature base.

# Validation

The v226 modular build is validated with:

- JavaScript syntax validation
- project structural checks
- Chromium UI smoke testing
- Settings organization checks
- category order/delete overflow checks
- drag-handle icon exclusion checks
- Settings navigation icon checks
- dropdown icon coverage checks
- Dynamic category icon setting checks
- Dynamic Library status-icon checks
- Dynamic Library sizing-control checks
- v224/v225 regression checks

# v226 Release Summary

**Release:** MediaFlow v226  
**Codename:** **Semantic Icons, Category Settings Repair & Dynamic Library Parity**  
**Base:** MediaFlow v225 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Fixed Settings → Categories overflow.
- Restored clear category numeric order positions.
- Kept Delete actions inside the category panel.
- Kept drag handles icon-free.
- Added a semantic replacement layer over v225 generic icons.
- Updated the Dynamic Library mode icon.
- Added dedicated Watching icon.
- Added dedicated Completed icon.
- Added dedicated On Hold icon.
- Added dedicated Dropped icon.
- Added dedicated Plan to Watch icon.
- Added meaningful Show / Hide icons.
- Added proper Refresh icons.
- Added a proper Advanced-mode icon.
- Added meaningful icons throughout the Settings sidebar.
- Added purpose-aware icons to single-select dropdowns.
- Preserved Personal Order dropdown clarity.
- Updated the Custom Order icon.
- Updated the End Session icon.
- Changed Stopwatch Minus Time to a minus icon.
- Extended cover sizing to Dynamic Library display modes.
- Extended title-text sizing to Dynamic Library display modes.
- Expanded sizing behavior across List, Compact, Cards and cover displays where applicable.
- Renamed **Covers + titles** to **Cover+Titles**.
- Removed generic icons from Dynamic Library category-row buttons.
- Added **Dynamic category row icons** setting.
- Added **No icons** mode.
- Added **Category icon URL** mode.
- Defaulted Dynamic category-row icons to **No icons**.
- Preserved Settings reset behavior for the new preference.
- Preserved Cloud Sync v201.
- Preserved Full Backup Schema v29.
- Preserved Settings Preset Schema v1.
- Updated MediaFlow version to **226**.

## Version Progression

**v223** → On This Day Dashboard visibility control  
**v224** → Library management, unified sorting & navigation cleanup  
**v225** → Global button icons, Personal Order UI cleanup & interface polish  
**v226** → **Semantic icons, Category Settings repair & Dynamic Library parity**
