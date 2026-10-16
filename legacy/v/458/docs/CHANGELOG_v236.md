# MediaFlow v236 — Searchable, Persistent-Open Category Filter

MediaFlow v236 redesigns the Normal Library Category Filter for fast multi-category filtering, especially on libraries/categories with large counts.

## Searchable Category Filter

- Added a dedicated search box inside the Library Category Filter dropdown.
- Search matches category names live without closing the dropdown or rerendering the whole application.
- Category choices continue to respect **Choice & Filter Layout → Category Filter** ordering and visibility/inheritance.

## Persistent-open multi-select workflow

- Selecting or deselecting a category immediately updates Library results.
- The Category Filter remains open across those result refreshes until the user closes it.
- Selected categories are summarized as compact chips in the closed/open filter control.
- **All** clears the category selection and returns to all categories while keeping the dropdown open.

## Category Filter pagination setting

- Added **Categories per page** to the Category Filter settings card.
- Default: **15** categories per page.
- Pagination appears only when the effective category count exceeds the configured page size.
- Search results are paginated after the search filter is applied, so small result sets do not show unnecessary pagination.
- Supported range: 1–500 categories per page.

## Performance / reliability

- Search and pagination update only the filter panel instead of rebuilding the Library page.
- Category selection refreshes are frame-coalesced to avoid duplicate renders when interactions happen quickly.
- Preserves v232 scoped UI observers and large-Library filtering/cache improvements.
- No data/schema migration is required.

## Compatibility

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4

# v236 Release Summary

**Release:** MediaFlow v236  
**Codename:** **Searchable, Persistent-Open Category Filter**  
**Base:** MediaFlow v235 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Added Category Filter search.
- Added Category Filter pagination.
- Added configurable categories-per-page setting (default 15).
- Pagination appears only above the configured limit.
- Kept Category Filter order/visibility controlled by existing settings/inheritance.
- Kept the dropdown open when selecting/deselecting categories.
- Added selected-category summary chips.
- Made search/pagination panel-local for lower UI cost.
- Coalesced category-result refreshes into one animation-frame render.
- Preserved v232 large-Library performance protections.
- Preserved Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1 and Personal Order Export v4.
- Updated MediaFlow runtime to **236**.
