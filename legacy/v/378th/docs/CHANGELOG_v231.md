# MediaFlow v231 — Settings Navigation, Library Mode & Layout Inheritance Polish

MediaFlow v231 focuses on making the Settings experience clearer and extending the Choice & Filter Layout system introduced in v230.

The release promotes Library Mode into its own Settings section, adds active-section highlighting to the Settings sidebar, corrects the default Set Priority order, and adds new inheritance paths for category/status controls.

No Library/user-data migration is required.

## Library Mode Settings Added to Sidebar

The existing **Default Library mode** control is now promoted into its own top-level Settings section:

> **LIBRARY MODE**

It appears inside the **Library** Settings group instead of being hidden inside Library Experience.

The section continues controlling whether the Library opens in:

- **Normal** mode
- **Dynamic** mode

The underlying `v181Library.mode` setting remains unchanged.

## Library Mode Semantic Icon

The new Library Mode Settings sidebar entry has its own semantic icon representing switching between Library experiences.

This keeps it consistent with the semantic Settings icons introduced in v226.

## Library Experience Remains Separate

Dynamic Library configuration remains under:

> **LIBRARY EXPERIENCE**

This includes Dynamic category-row ordering, category visibility, category-row artwork preferences, Dynamic status ordering, and related controls.

Library Mode and Library Experience are now separate Settings sections so the sidebar accurately reflects both areas.

## Settings Sidebar Active Highlight

The Settings sidebar now highlights the section currently being viewed.

The active state updates when:

- scrolling through Settings;
- clicking a Settings sidebar item;
- jumping to a section from the sidebar.

The active item receives a stronger background/accent treatment and `aria-current` state.

On narrow layouts, the active state also works with the horizontal Settings navigator.

## Smooth Jump Highlighting

When a Settings sidebar item is clicked, its active highlight stays locked during the smooth scroll animation.

After the jump finishes, normal scroll-based active-section detection resumes.

This avoids the highlight rapidly switching through intermediate sections during a smooth jump.

## Choice & Filter Layout Helper Copy Removed

The repeated helper sentence:

> Drag with ☰, use the number or arrows to reorder, and show/hide individual choices.

has been removed from custom Choice & Filter Layout cards.

The controls remain available and self-explanatory:

- drag handle;
- exact position number;
- move up/down arrows;
- show/hide toggle.

Inheritance-mode explanations remain visible when a surface follows another source.

## Set Priority Default Order Changed

The default Set Priority order is now:

1. **High Priority**
2. **Medium Priority**
3. **Low Priority**

This replaces the previous Low → Medium → High default.

Existing v230 configurations that still exactly match the old untouched default are migrated to the corrected v231 default.

Custom priority orders remain user-configurable.

## Set Status Inheritance Expanded

**Set Status** now supports two layout sources:

- **Own settings**
- **Follow Dynamic Status Order**

### Own settings

Set Status keeps its independent order and visibility controls.

### Follow Dynamic Status Order

Set Status uses the current Dynamic Library status order from Library Experience.

The Dynamic Status Row remains the source of truth for ordering.

Because the Dynamic Status Row currently controls order rather than per-status visibility, all statuses remain available when this inheritance mode is active.

## Category Filter Inheritance Expanded

**Category Filter** now supports:

- **Own settings**
- **Follow Category Settings**
- **Follow Dynamic Category Row**
- **Follow Set Category**

### Follow Set Category

When selected, Category Filter inherits the effective Set Category order and visibility.

This is a live relationship. If Set Category itself follows Category Settings or Dynamic Category Row, Category Filter receives that resolved order/visibility automatically.

No duplicate copy of the layout is created.

## Status Filter Inheritance Expanded

**Status Filter** now supports:

- **Own settings**
- **Follow Set Status**
- **Follow Dynamic Status Order**

### Follow Set Status

The filter inherits Set Status ordering and visibility, including any custom hidden statuses.

### Follow Dynamic Status Order

The filter directly follows the Dynamic Library status-row order.

This allows users to align status filters with Dynamic Library without requiring Set Status to be the intermediary.

## Live Inheritance Preserved

All Follow modes continue using live resolution rather than one-time copying.

Changes to a source configuration immediately affect the dependent popup/filter on the next render.

Saved custom configurations are not destroyed when switching to inheritance mode.

## Custom Layouts Remain Stored

Switching a surface from Own settings to a Follow mode does not erase its custom:

- order;
- hidden items;
- positioning.

Switching back to Own settings restores that surface's previous custom configuration.

## Set Category Options Preserved

Set Category retains its v230 sources:

- Own settings
- Follow Category Settings
- Follow Dynamic Category Row

The v229 15-item pagination and real category Icon URL artwork remain preserved.

## Priority Filter Behavior Preserved

Priority Filter continues supporting:

- Own settings
- Follow Set Priority

The corrected High → Medium → Low Set Priority default naturally flows into Priority Filter when Follow Set Priority is selected.

## Settings Reset Behavior Improved

The new Library Mode section resets only:

> `v181Library.mode`

Resetting Library Experience no longer needs to reset the selected Library mode along with Dynamic Library layout configuration.

Library Experience reset continues covering its Dynamic category/status configuration fields.

## Existing v230 Ordering Controls Preserved

Own Settings mode still supports:

- drag-and-drop ordering;
- exact numeric position;
- ↑ / ↓ movement;
- individual show/hide toggles;
- Show All / Hide All.

Only the redundant explanatory sentence was removed.

## Settings Search Preserved

Library Mode is indexed by the existing Settings search system and can be found like other Settings sections.

## Settings Group Organization Preserved

The Settings hierarchy remains:

- Library
- Interface
- Appearance
- MediaFlow System
- Progression
- Data & Sync
- Updates

The Library group now begins with:

1. Categories
2. Library Mode
3. Library Experience
4. Choice & Filter Layout

followed by the existing Library settings.

## Existing Semantic Icons Preserved

The semantic icon system introduced in v225/v226 remains active throughout Settings and the rest of MediaFlow.

## Dynamic Library Configuration Preserved

The following remain unchanged:

- Custom Dynamic Row Order
- Follow Categories Order
- Dynamic category drag controls
- Dynamic category show/hide
- Dynamic Category Icon URL mode
- Dynamic Status Row order
- Dynamic Library cover/title sizing

## Set Category Popup Preserved

The v229 Set Category popup keeps:

- actual category Icon URL artwork;
- all-category support;
- 15 choices per page;
- conditional pagination above 15 visible categories;
- no internal category-list scrollbar;
- current-category-aware initial page.

## Set Status Semantic Icons Preserved

Set Status continues using the same semantic icons as Dynamic Library for:

- Plan to Watch
- Watching
- On Hold
- Completed
- Dropped

## Existing Library Data Preserved

v231 does not change the Library title data structure.

Existing titles, categories, progress, ratings, statuses, priorities, Personal Order data, History, Batch Logs, statistics, artwork URLs, and Dynamic Library configuration remain compatible.

## Persistence Integration

The new source values are stored within the existing `S.settings.v230ChoiceLayout` object.

The existing settings persistence pipeline therefore continues covering them through:

- local settings persistence;
- cloud settings merge;
- Sync Now;
- Full Backup;
- Automatic Backup;
- Settings Preset Export/Import;
- Restore All Defaults.

No persistence schema bump is required.

## Data Compatibility

Compatibility remains:

> **Cloud Sync:** v201  
> **Full Backup Schema:** v29  
> **Settings Preset Schema:** v1

# v231 Release Summary

**Release:** MediaFlow v231  
**Codename:** **Settings Navigation, Library Mode & Layout Inheritance Polish**  
**Base:** MediaFlow v230 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Added **Library Mode** as its own Settings section.
- Added Library Mode to the **Library** Settings sidebar group.
- Added a dedicated Library Mode semantic icon.
- Added active/current Settings sidebar highlighting.
- Added scroll-based Settings active-state tracking.
- Added active-state locking during smooth Settings jumps.
- Removed the repeated custom ordering helper sentence.
- Changed default Set Priority order to **High → Medium → Low**.
- Migrated untouched old Set Priority defaults to the new order.
- Added **Follow Dynamic Status Order** to Set Status.
- Added **Follow Set Category** to Category Filter.
- Added **Follow Dynamic Status Order** to Status Filter.
- Preserved **Follow Set Status** for Status Filter.
- Preserved Set Category inheritance options.
- Preserved Priority Filter → Set Priority inheritance.
- Preserved custom layouts while Follow modes are active.
- Preserved live inheritance behavior.
- Improved Library Mode / Library Experience reset separation.
- Preserved v229 Set Category popup behavior.
- Preserved semantic status/priority icons.
- Preserved Dynamic Library configuration.
- Preserved unified sorting and cover filters.
- Preserved Cloud Sync v201.
- Preserved Full Backup Schema v29.
- Preserved Settings Preset Schema v1.
- Updated MediaFlow runtime to **231**.

## Version Progression

**v228** → Library metadata cleanup, priority icon improvements & Dynamic Row ordering modes  
**v229** → Category popup overhaul, status icon alignment & category artwork improvements  
**v230** → Choice & Filter Layout Control Center  
**v231** → **Settings navigation, Library Mode & layout inheritance polish**
