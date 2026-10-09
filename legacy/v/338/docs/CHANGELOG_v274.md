# MediaFlow v274 Changelog

## Collections
- Added Collections as a first-class page directly below Library.
- Added collection search, create, edit, delete and recently-viewed tracking.
- Added sorting by recently updated, alphabetic, recently added, recently viewed, title count and progress with ASC/DESC.
- Added Covers, Compact, List, Cards and Simkl-inspired Showcase collection browser modes.
- Added collection title, description and optional cover URL.
- Added automatic 1–4-title cover collage when a collection has no custom cover.
- Added collection progress bar and completion summary.
- Added automatic rotating collection background sourced from title cover URLs.
- Added Collection Tools show/hide state.
- Added mini-Library List, Compact, Cards, Covers and Covers+Titles modes.
- Added category, status, priority, rating and cover-availability filters.
- Added collection sorting by manual order, title, priority, rating, progress, total and year.
- Added Year, Running Time, Season Count, Episode Count, Limit Items and Moderator advanced filters.
- Added Library-style on-cover Status, Category, Rating and Progress overlays.
- Added 25/50/100/200 title page sizing and collection pagination; default 50.
- Added collection bulk tools for selection, status, priority, category, completed-progress repair and collection removal.
- Added Order view with drag-and-drop plus ↑/↓ controls; manual order remains the default order outside Order view.
- Added Add Titles modal with full-Library multi-select browsing, search and logging-style filters.
- Added Select Visible and Deselect All to the collection title picker.

## Persistence
- Added collections to snapshot/cloud state.
- Added deleted-collection tombstones.
- Added timestamp-aware collection merge handling for Sync Now/cloud reconciliation.
- Added collections to Full Backup and restore paths.
- Added collection UI settings to normal Settings persistence and Settings Preset handling.
- Fixed initial cloud bootstrap so existing collections load on the very first application startup.

## Library
- Added Rating filter to both Normal and Dynamic Library.
- Options: All ratings, Rated only, Unrated, 9+, 8+, 7+, 6+, 5+.

## Personal Order
- Added adjustable Add Titles panel width.
- Added adjustable Ordered Categories width.
- Added Deselect All to Add Titles selection.
- Width choices persist through normal MediaFlow settings persistence.

## Performance and responsive behavior
- Collection title lookups reuse MediaFlow’s indexed Library lookup path.
- Collection browsing renders one page at a time rather than thousands of title cards simultaneously.
- 30,000-title Library / 5,000-title collection stress test passes.
- Existing v273 tablet/mobile/tight-width responsiveness remains intact.
- Collections are responsive down to narrow mobile widths without page-level horizontal overflow.

## Platform
- Version advanced to 274.
- PWA shell advanced to `mediaflow-pwa-v274-shell-v1`.
- Cloud Sync remains v201.
- Full Backup remains Schema v29.
- Settings Preset remains Schema v1.
- Personal Order Export remains v4.
- No data migration required.
