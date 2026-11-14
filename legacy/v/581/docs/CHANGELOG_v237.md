# MediaFlow v237 — Searchable Category Filters Across Personal Order, Batch Log & Dashboard Logging

MediaFlow v237 extends the searchable, paginated, multi-select Category Filter introduced in v236 to the other Library browsers used throughout MediaFlow.

## Personal Order Add Titles

- The Categories control in **Personal Order → Add Titles** now uses the v236 searchable multi-select dropdown.
- Category selections refresh Personal Order results dynamically while keeping the category dropdown open.
- Search and category-page navigation update only the dropdown itself.
- Existing sort, direction, status, priority, title-result pagination, and Personal Order layout remain unchanged.

## Batch Log Library Browser

- Batch Log now uses the same searchable category dropdown.
- Multiple categories can be selected without reopening the control after every change.
- Category selections dynamically refresh the active Batch Log title browser.
- Existing Batch Log sorting, status, priority, title pagination, and logging behavior remain unchanged.

## Dashboard Logging Library Browser

- Dashboard logging now uses the same searchable category dropdown when choosing Library titles to log.
- Multiple categories can be selected while the dropdown remains open.
- Category changes refresh logging title suggestions without requiring the dropdown to close.
- Existing logging sort, status, priority, title-result pagination, and title search remain intact.

## Shared Category Filter Rules

All four Library-style category filters now use the same effective category configuration:

- Main Library
- Personal Order Add Titles
- Batch Log
- Dashboard logging

They continue to respect **Choice & Filter Layout → Category Filter** for category order and visibility.

## Shared Categories Per Page

The existing **Categories per page** preference now applies to all four category filters.

- Default remains **15**.
- Search is applied before pagination.
- Pagination appears only when matching/effective categories exceed the configured page size.
- If search results fit on one page, pagination disappears automatically.

## Persistent-Open Interaction

Selecting or deselecting a category no longer closes the dropdown on the new surfaces. Users can keep choosing categories until they manually close the control.

## Performance

- Search and category pagination are dropdown-only operations.
- Category-selection result refreshes are coalesced into one animation frame per surface.
- The v232 scoped-render and large-Library performance protections remain preserved.
- No new persistent data schema is required.

## Compatibility

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4

No Library/user-data migration is required.
