# MediaFlow v229 — Category & Status Popup Polish

MediaFlow v229 focuses on the Library's **Set Category** and **Set Status** popups and on the Dynamic Library category-icon preference control.

The release makes category selection scale cleanly to large category collections, uses the category artwork users actually configured, and makes status selection visually match the Dynamic Library status row.

This update does not change the Library/user-data format or any persistent schema.

## Set Category Uses Real Category Icon URLs

The Set Category popup previously rendered the category's fallback `icon` field directly. Categories using an `iconUrl` could therefore appear as the generic image emoji instead of their real artwork.

v229 now renders category identity through MediaFlow's existing `v144CategoryIconHtml(...)` pipeline.

When a category has a valid HTTP/HTTPS Icon URL, its real image is displayed. When no valid URL exists, MediaFlow falls back to the category emoji exactly as the existing category-icon system expects.

## All Categories Are Available

Set Category previously filtered the popup to categories whose `enabled` value was not false.

v229 now includes **every current category in `S.categories`**.

Disabled categories remain identifiable in their secondary metadata but can still be selected when the user explicitly wants to move a title there.

## No Inner Category Scrollbar

The category choice list no longer uses the legacy `.choice-list` internal scrollbar.

For up to 15 categories, the popup shows the entire available choice page without requiring the user to scroll inside the category list.

The modal itself remains responsive to the browser viewport.

## 15 Categories Per Page

Set Category uses a page size of:

> **15 categories**

This keeps large category collections readable without creating an extremely tall list.

## Pagination Only When Needed

Pagination appears only when the Library has:

> **More than 15 categories**

Collections with 15 or fewer categories show no pagination controls at all.

When pagination is required, the popup provides:

- Previous
- current page / total pages
- total category count
- Next

## Current Category Page Awareness

When a title's currently assigned category is on a later page, Set Category opens on the page containing that current category by default.

This prevents the selected category from appearing to be missing simply because it lives after the first 15 choices.

## Responsive Category Choice Layout

The Set Category popup can expand wider than the previous modal width.

Small category collections remain simple, while larger pages can use a two-column layout so all 15 choices remain visible and readable without an inner category scrollbar.

On narrower screens the layout falls back to one column.

## Category Choice Metadata Preserved

Each category choice continues showing:

- category name
- unit type
- minutes per unit
- selected-state checkmark

Disabled categories additionally indicate that state in the secondary text.

## Set Status Semantic Icons

Set Status now uses the same semantic SVG icon language as the Dynamic Library status row.

The five statuses use dedicated icons for:

- **Plan to Watch**
- **Watching**
- **On Hold**
- **Completed**
- **Dropped**

## Duplicate Status Action Icon Removed

The global v225/v226 action-button decorator no longer adds a second generic leading icon to `.status-choice` rows.

Each status option therefore shows one intentional status icon plus its selected-state checkmark.

## Dynamic Library Status Parity

The popup and Dynamic Library status row now communicate the same status using the same icon vocabulary.

This makes status meaning consistent whether users are viewing a title or changing it.

## Category Icon URL Selector Icon Restored

The **Dynamic category row icons** selector was intentionally left icon-free in v227.

v229 changes that specific decision and gives the selector an artwork/image icon so the purpose of **Category Icon URL** is immediately visible.

The selector values remain:

- **No icons**
- **Category icon URL**

No setting value or persistence behavior changes.

## v228 Dynamic Row Ordering Preserved

v229 preserves:

- Custom Dynamic row order
- Follow Categories order
- Dynamic drag handles
- exact row positions
- ↑ / ↓ ordering controls
- independent Dynamic visibility

## v227 Category Artwork Fix Preserved

The CSS-precedence repair that allows Dynamic Library category URL artwork to appear remains active.

## v226 Dynamic Library Display Parity Preserved

Dynamic Library cover/title sizing and `Cover+Titles` behavior remain unchanged.

## v225 Global Icon System Preserved

The global button icon architecture remains active. v229 adds a focused exclusion for status-choice rows so the semantic status icon is not duplicated.

## Unified Sorting Preserved

The v224 Sort Field + ASC/DESC architecture remains unchanged.

## Data Compatibility

No Library/user-data migration is required.

Compatibility remains:

> **Cloud Sync:** v201  
> **Full Backup Schema:** v29  
> **Settings Preset Schema:** v1

# v229 Release Summary

**Release:** MediaFlow v229  
**Codename:** **Category & Status Popup Polish**  
**Base:** MediaFlow v228 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Set Category now displays each category's real Icon URL when configured.
- Preserved emoji fallback when no valid Icon URL exists.
- Set Category now includes all current categories.
- Removed the inner category-list scrollbar.
- Added a 15-category page size.
- Added category pagination only when more than 15 categories exist.
- Added Previous / Next category-page navigation.
- Added current page / total pages / category-count feedback.
- Opens the category popup on the page containing the title's current category.
- Added a wider responsive category popup.
- Added two-column category choices when useful.
- Set Status now uses the same five semantic status icons as Dynamic Library.
- Removed duplicate generic action icons from status choices.
- Restored an artwork/image icon to the Dynamic category-row Icon URL selector.
- Preserved Dynamic row ordering modes and drag controls.
- Preserved Dynamic category URL artwork behavior.
- Preserved cloud synchronization and Sync Now.
- Preserved Full Backup and Automatic Backup.
- Preserved Settings Preset support.
- Preserved modular project architecture.
- Kept **Cloud Sync v201**.
- Kept **Full Backup Schema v29**.
- Kept **Settings Preset Schema v1**.
- Updated MediaFlow version to **229**.

## Version Progression

**v226** → Category management fixes, semantic icons & Dynamic Library display improvements  
**v227** → Icon consistency fixes, Dynamic category artwork repair & Dashboard cleanup  
**v228** → Library metadata icon cleanup & Dynamic row ordering controls  
**v229** → **Category & status popup polish**
