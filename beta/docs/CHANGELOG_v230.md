# MediaFlow v230 — Choice & Filter Layout Control Center

MediaFlow v230 introduces a centralized Settings system for controlling the order and visibility of reusable category, status, and priority choices across MediaFlow.

## New Choice & Filter Layout Settings

A new **CHOICE & FILTER LAYOUT** section has been added under the Library Settings group, directly after Library Experience.

The section manages six surfaces:

- Set Category
- Set Status
- Set Priority
- Category Filter
- Status Filter
- Priority Filter

## Independent Ordering Controls

When a surface uses **Own settings**, every item can be reordered with:

- drag-and-drop via the dedicated `☰` handle
- exact numeric position
- move up arrow
- move down arrow

## Independent Visibility Controls

Every custom surface also has individual Show/Hide toggles plus **Show all** and **Hide all** actions.

Hiding an option removes it from that popup/filter without deleting any Library data or changing a title's stored category/status/priority.

## Set Category Sources

Set Category can use:

- **Own settings**
- **Follow Category Settings**
- **Follow Dynamic Category Row**

Following Category Settings uses the main category order and enabled/disabled state. Following Dynamic Category Row uses the effective Dynamic row order and Dynamic row visibility, including its Custom/Follow Categories mode from v228.

## Category Filter Sources

Category Filter supports the same three source modes:

- **Own settings**
- **Follow Category Settings**
- **Follow Dynamic Category Row**

The resolved order/visibility is applied to category filter controls throughout MediaFlow, including checkbox-style category filter panels and category filter selects.

## Set Status Layout

Set Status now has its own persistent order and visibility configuration.

The v229 semantic status icons remain intact while choices can now be reordered or hidden.

## Status Filter Layout

Status Filter can use:

- **Own settings**
- **Follow Set Status**

Its order/visibility is applied to reusable status filter dropdowns and the Dynamic Library status row.

## Set Priority Layout

Set Priority now has its own persistent ordering and visibility configuration while preserving the semantic Low/Medium/High priority icons.

## Priority Filter Layout

Priority Filter can use:

- **Own settings**
- **Follow Set Priority**

Its resolved order/visibility is applied to reusable priority filter dropdowns across MediaFlow.

## v229 Popup Features Preserved

Set Category keeps the v229 popup behavior:

- real category Icon URL artwork
- up to 15 categories per page
- pagination only above 15 visible choices
- no internal category-list scrolling
- current-category page detection

The new v230 order and visibility configuration is applied before pagination.

## Settings Organization

Choice & Filter Layout is integrated into the existing v221 Settings browser under **Library**, between **Library Experience** and **Logging Method**.

It receives its own Settings sidebar icon and remains searchable through Settings search.

## Reset Support

The new section participates in:

- individual source-setting reset controls
- section reset
- Restore all defaults

## Persistence

The complete v230 configuration is stored inside `S.settings.v230ChoiceLayout`.

Because MediaFlow's canonical persistence systems already include the full Settings object, v230 remains covered by:

- local settings persistence
- cloud settings persistence / Sync Now
- Full Backup
- Automatic Backup
- Settings Preset Export/Import

No schema bump is required.

## Data Compatibility

Compatibility remains:

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1

No Library/user-data migration is required.

# v230 Release Summary

**Release:** MediaFlow v230  
**Codename:** **Choice & Filter Layout Control Center**  
**Base:** MediaFlow v229 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Added **Choice & Filter Layout** to Settings.
- Added settings for Set Category.
- Added settings for Set Status.
- Added settings for Set Priority.
- Added settings for Category Filter.
- Added settings for Status Filter.
- Added settings for Priority Filter.
- Added drag-and-drop ordering.
- Added exact numeric ordering.
- Added move-up and move-down controls.
- Added per-item show/hide controls.
- Added Show All / Hide All actions.
- Added Set Category **Follow Category Settings** mode.
- Added Set Category **Follow Dynamic Category Row** mode.
- Added Category Filter **Follow Category Settings** mode.
- Added Category Filter **Follow Dynamic Category Row** mode.
- Added Status Filter **Follow Set Status** mode.
- Added Priority Filter **Follow Set Priority** mode.
- Applied Status Filter settings to Dynamic Library status navigation.
- Applied reusable filter settings across native status/priority/category filters.
- Preserved v229 Set Category pagination and Icon URL artwork.
- Added Settings search/navigation integration.
- Added section and individual reset integration.
- Preserved Cloud Sync v201.
- Preserved Full Backup Schema v29.
- Preserved Settings Preset Schema v1.
- Updated MediaFlow version to **230**.

## Version Progression

**v227** → Icon consistency fixes, Dynamic category artwork repair & Dashboard cleanup  
**v228** → Library metadata cleanup, priority icon improvements & Dynamic Row ordering modes  
**v229** → Category popup overhaul, status icon alignment & category artwork improvements  
**v230** → **Choice & filter layout control center**
