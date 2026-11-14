# MediaFlow v228 — Library Metadata Icon Cleanup & Dynamic Row Ordering Controls

MediaFlow v228 focuses on cleaning up title metadata inside the Library and making Dynamic Library category-row ordering more flexible.

The release removes redundant category action icons from Library title information, aligns priority icons with the existing priority picker, restores direct drag controls to Dynamic category-row Settings, and introduces a persistent choice between a custom Dynamic row order and the main Categories order.

This update builds on the existing MediaFlow architecture without changing the underlying Library/user-data format.

## Library Category Metadata Icon Cleanup

Library title rows already display the category's own identity through its configured category icon or icon URL.

v228 removes the additional generic action icon that was being inserted in front of the category control.

The category pill now shows only the intended category identity and category name.

This applies to the Library title information displayed in both Normal and Dynamic Library row layouts where the shared category control is used.

## Category Icon URL Preserved

The cleanup does **not** remove the category's own configured icon.

If a category uses an icon URL, that artwork remains visible.

Only the unrelated global action icon is removed.

## Library Priority Icons Improved

Library title priority controls now use the same visual language as the existing **Set Priority** popup.

The three priority levels are visually distinct:

- **Low Priority** — downward priority indicator
- **Medium Priority** — neutral/circle indicator
- **High Priority** — upward priority indicator

This replaces the generic action icon that could previously appear beside priority text.

## Priority Picker Consistency

The Library title priority pills and the priority-selection popup now share the same Low / Medium / High icon language.

This makes priority meaning consistent before and after opening the picker.

## Dynamic Category Row Drag Controls Restored

The **Settings → Library Experience → Dynamic Category Row** configuration now includes a dedicated three-line drag handle again.

The handle uses:

> **☰**

and intentionally does not receive an additional global action icon.

Users can drag a category row directly when Dynamic Library is using its own custom order.

## Existing Position Controls Preserved

Drag-and-drop is an additional ordering method rather than a replacement.

Custom Dynamic row ordering continues supporting:

- drag handle
- exact position number
- move up
- move down

This gives users multiple ways to organize large category sets.

## New Dynamic Category Row Order Source

A new persistent Settings option has been added:

> **Dynamic category row order**

Users can choose between:

- **Custom Dynamic row order**
- **Follow Categories order**

## Custom Dynamic Row Order

This is the default behavior and preserves the existing Dynamic Library ordering system.

When selected, Dynamic Library keeps its own category-row order independently from the main Categories list.

Users can reorder it using:

- drag-and-drop
- exact position numbers
- ↑ / ↓ controls

Existing custom Dynamic row order data is preserved.

## Follow Categories Order

When:

> **Follow Categories order**

is selected, Dynamic Library automatically uses the main category order configured in MediaFlow's Categories section.

Changing the main Categories order therefore changes the Dynamic Library category row order automatically.

No duplicate manual reordering is required.

## Custom Order Is Preserved While Following Categories

Switching to Follow Categories order does not erase the user's previously configured custom Dynamic row order.

If the user later switches back to:

> **Custom Dynamic row order**

MediaFlow restores the previously saved Dynamic-specific order.

## Follow Mode Ordering Controls

When Dynamic Library is following the main Categories order, Dynamic-specific ordering controls are visually disabled because the order is owned by the Categories section.

The following remain available:

- Show / Hide
- Edit
- Clear
- Delete

Only the row-position controls become read-only in Follow mode.

## Dynamic Category Visibility Remains Independent

The new order-source setting changes ordering only.

Dynamic Library category visibility remains separately configurable.

A category can therefore follow the main category order while still being hidden specifically from the Dynamic Library category row.

## Dynamic Category Artwork Preference Preserved

The v226/v227 setting for Dynamic category-row artwork remains available:

- **No Icons**
- **Category Icon URL**

The new row-order setting works independently from the category artwork setting.

Users can therefore combine any of the following:

- custom order + no icons
- custom order + category URL icons
- follow Categories order + no icons
- follow Categories order + category URL icons

## Dynamic Library Rendering Uses the Effective Order

The visible Dynamic Library category navigation now resolves its order according to the selected order source.

When Custom is selected, MediaFlow uses the saved Dynamic order.

When Follow Categories is selected, MediaFlow uses the current main Categories order.

## Library Overview Dynamic Order Integration

Library Overview's existing **Dynamic row** ordering option now follows the actual effective Dynamic Library row order.

This includes the new Follow Categories behavior.

## Existing Dynamic Status Ordering Preserved

The new category-row order option does not modify the Dynamic status row.

Existing status ordering remains independently configurable.

## Settings Reset Integration

The new Dynamic category-row order preference participates in MediaFlow's individual Settings reset system.

Resetting the setting returns it to:

> **Custom Dynamic row order**

which preserves the behavior users had before v228.

## Settings Preset Integration

The new persistent setting is stored inside:

> `settings.v181Library`

Settings Preset Export/Import already exports the complete Settings object, so the new order-source preference is included automatically.

Settings Preset remains:

> **Schema v1**

## Cloud Sync Integration

The existing v181 Library settings normalization/merge path now includes the new Dynamic category-row order mode.

The preference therefore continues through MediaFlow's existing cloud synchronization and verification architecture.

No Cloud Sync schema migration is required.

## Sync Now Integration

The existing **Sync Now** workflow continues synchronizing the complete normalized Dynamic Library settings object, including the new order-source preference.

## Full Backup Integration

The new setting is part of the existing Settings object already included by Full Backup.

v228 also extends backup-manifest metadata so backups explicitly report the Dynamic category order mode.

Full Backup remains:

> **Schema v29**

## Automatic Backup Integration

Automatic Backup continues using the same Full Backup pipeline, so the new setting is covered automatically.

## Existing Data Preserved

v228 does not change Library title data or require a migration.

Existing:

- Library titles
- category configuration
- category icon URLs
- category order
- Dynamic custom category order
- Dynamic visibility configuration
- Personal Order
- History
- Batch Logs
- ratings
- priorities
- statistics
- XP/progression

remain compatible.

## Existing v227 Fixes Preserved

v227 improvements remain active, including:

- working Dynamic category URL icons
- plain Minus Time icon
- Show/Hide switch icon spacing
- Automatic / Manual icons
- Dashboard poster cleanup
- semantic priority picker icons

## Existing v226 Dynamic Library Improvements Preserved

v226 functionality remains intact, including:

- Dynamic category icon preference
- Normal/Dynamic Library size-control parity
- Cover+Titles naming
- semantic status icons
- Settings category layout containment

## Existing v225 Global Icon Architecture Preserved

The runtime-wide button icon system remains active.

v228 adds targeted exclusions and priority mappings rather than replacing the icon architecture.

## Unified Sorting Preserved

The v224 unified sorting architecture remains unchanged.

Sorting continues using:

> **Sort Field + ASC/DESC**

with **Alphabetic + ASC** as the standardized default where applicable.

## Data Compatibility

No Library/user-data migration is required.

Compatibility remains:

> **Cloud Sync:** v201  
> **Full Backup Schema:** v29  
> **Settings Preset Schema:** v1

# v228 Release Summary

**Release:** MediaFlow v228  
**Codename:** **Library Metadata Icon Cleanup & Dynamic Row Ordering Controls**  
**Base:** MediaFlow v227 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Removed the redundant generic action icon from Library category metadata pills.
- Preserved each category's own configured icon/icon URL.
- Added meaningful Low Priority icon treatment to Library title rows.
- Added meaningful Medium Priority icon treatment to Library title rows.
- Added meaningful High Priority icon treatment to Library title rows.
- Matched Library priority icons with the existing priority-selection popup language.
- Restored the three-line drag handle to Dynamic category-row Settings.
- Kept drag handles free of additional global icons.
- Added drag-and-drop reordering for the custom Dynamic category row.
- Preserved exact numeric Dynamic row positioning.
- Preserved ↑ / ↓ Dynamic row controls.
- Added **Dynamic category row order** setting.
- Added **Custom Dynamic row order** mode.
- Added **Follow Categories order** mode.
- Made Custom mode the default for backward compatibility.
- Preserved a user's custom Dynamic row order while Follow mode is active.
- Restored the saved custom order when switching back from Follow mode.
- Disabled Dynamic-specific position controls while following Categories order.
- Preserved Dynamic-specific Show/Hide behavior in Follow mode.
- Preserved Edit / Clear / Delete category actions in Follow mode.
- Made Dynamic Library category navigation use the effective selected order source.
- Updated Library Overview's Dynamic-row order to use the effective Dynamic order.
- Preserved Dynamic status-row ordering.
- Added individual Settings reset support for the new order-source preference.
- Preserved Dynamic category URL / No Icons preference.
- Preserved Settings organization.
- Preserved cloud synchronization and Sync Now.
- Preserved Full Backup and Automatic Backup.
- Extended backup manifest metadata for the new Dynamic order mode.
- Preserved Settings Preset support.
- Preserved existing import/export behavior.
- Preserved existing Library and category data.
- Preserved modular project architecture.
- Kept **Cloud Sync v201**.
- Kept **Full Backup Schema v29**.
- Kept **Settings Preset Schema v1**.
- Updated MediaFlow version to **228**.

## Version Progression

**v225** → Global button icons, Personal Order UI cleanup & interface polish  
**v226** → Category management fixes, semantic icons & Dynamic Library display improvements  
**v227** → Icon consistency fixes, Dynamic category artwork repair & Dashboard cleanup  
**v228** → **Library metadata icon cleanup & Dynamic row ordering controls**
