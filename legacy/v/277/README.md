# MediaFlow v277 — Collections Mini‑Library

**App release:** v274  
**Base:** MediaFlow v273 Modular  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v274 adds a full **Collections** system directly under Library. A collection is not a simple bookmark list: it behaves as a focused mini‑Library with its own browsing modes, filters, bulk tools, cover overlays, ordering, title picker, artwork, progress, automatic backgrounds and responsive layouts.

## Highlights

- New **Collections** page under Library.
- Search, create, edit and delete collections.
- Collection browser sorting: recently updated, alphabetic, recently added, recently viewed, title count and progress, with ASC/DESC.
- Collection browser display modes: **Covers, Compact, List, Cards and Showcase**.
- Optional collection cover URL; otherwise MediaFlow builds a 1–4 title-cover collage.
- Collection progress bar and completed-title summary.
- Automatic collection background rotates from title covers while the collection is open.
- Collection detail behaves like a mini Library with **List, Compact, Cards, Covers and Covers+Titles**.
- **Order view** supports drag reorder and ↑/↓ ordering; the manual order remains the default browsing order when Order view is off.
- **Add Titles** opens a full-Library multi-select browser with search, category, status, priority, rating and sort filters.
- Collection Tools can be shown/hidden and include category/status/priority/rating/cover filters, sorting, advanced year/runtime/season/episode/limit/moderator filters and on-cover overlays.
- Collection bulk tools include select visible, select all matching, deselect all, set status, set priority, move category, fix completed progress and remove from collection.
- Collection browsing is paginated (25/50/100/200 titles per page; default 50) to remain responsive for very large collections.
- Added **Rating** filter to both Normal and Dynamic Library.
- Personal Order now has adjustable **Add Titles width** and **Ordered Categories width** plus **Deselect all** in Add Titles.
- Collections and Personal Order layout settings participate in the existing cloud/full-backup/settings persistence paths.
- PWA shell advanced to `mediaflow-pwa-v274-shell-v1`.

## Data behavior

Collections store title IDs only; titles remain owned by the main Library. Removing a title from a collection does **not** delete it from the Library. Deleting a collection also leaves every Library title intact.

Collections are included in MediaFlow snapshot/cloud state, full backups, imports and cloud merge conflict handling. Deleted collections use tombstones so older cloud copies cannot silently resurrect them after synchronization.

## Validation

```bash
python scripts/build.py
python scripts/smoke-v274.py
python scripts/smoke-v273-on-v274.py
python scripts/perf-v273-on-v274.py
python scripts/perf-v274-collections.py
python scripts/audit-v274.py
python scripts/check.py
```

The v274 test suite covers collection CRUD, all five browser modes, collection detail tools, cover collages, automatic backgrounds, advanced filters, rating filters, Add Titles selection/deselection, Order view, Personal Order sizing, cloud/full-backup/settings persistence, 360px responsive behavior and existing v273 responsive/History regressions. A dedicated stress test uses a **30,000-title Library with a 5,000-title collection** and verifies that only one 50-title collection page is rendered at a time.


## MediaFlow v275

- Personal Order width sliders removed; Add Titles and ordered-category widths are now adjusted directly by dragging their panel edges with the cursor on desktop.
- The Collections Add Titles library browser now opens at the intended wide size, keeps filters readable, and scrolls its result grid internally without clipping the category popup.
- Collection detail now has a dedicated **Back to Collections** button above the collection hero.
- Existing v274 collection/cloud/backup data remains compatible; no migration is required.


## v277
- Fixed the v276 regression that exposed the mobile bottom navigation on desktop widths.
- Desktop sidebar and responsive bottom navigation are now mutually exclusive.
- Completed the v273 1080px responsive breakpoint by making the mobile bar fixed and compact from 1080px downward.
- Prevented bottom-navigation items from stretching into full-height vertical columns.
