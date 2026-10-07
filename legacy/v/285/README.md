# MediaFlow v285 — Dashboard & Logging Resume State

**App release:** v285  
**Cloud Sync:** v201 · **Full Backup:** Schema v29 · **Settings Preset:** v1 · **Personal Order Export:** v4 · **Collections Export:** v2

## v285

- Remembers whether **Stopwatch** and **Runtime Calculator** were collapsed or expanded and restores that exact presentation after refresh/reopen.
- Syncs Dashboard accordion state through MediaFlow cloud state, Full Backup and Settings Presets.
- Persists the complete **in-progress Dashboard logging workspace**: active log, selected titles, final episode/chapter progress, quantities, note, minutes/amount, current entry draft, logging mode and logging Library browser state.
- Uses an immediate per-account local resume cache so an accidental refresh can restore the draft even before a network save completes.
- Debounces the full cloud save so typing inside Logging stays responsive even with a very large Library.
- Restores an active logging draft on another device from cloud state, including its original current task context.
- Cancel/Save & Get Next Task/end-session paths mark the draft inactive so intentionally finished/discarded logs do not return later.
- PWA shell advanced to `mediaflow-pwa-v285-shell-v1`.
- No data migration required.

# MediaFlow v284 — Account Badge Cleanup & Compact Progress Alignment

**App release:** v284  
**Cloud Sync:** v201 · **Full Backup:** Schema v29 · **Settings Preset:** v1 · **Personal Order Export:** v4 · **Collections Export:** v2

## v284

- Removed the redundant **CLOUD** badge beside the signed-in username in the desktop account area.
- Repaired **Collections → Compact** progress geometry so the colored fill sits inside the same empty progress track from its top-left edge rather than looking detached.
- Preserved all v283 category modal, first-load sidebar and Collections card fixes.
- PWA shell advanced to `mediaflow-pwa-v284-shell-v1`.
- No data migration required.

# MediaFlow v282 — Category Performance, First-Load Sidebar Stability & Collections Batch Mode

**App release:** v282  
**Cloud Sync:** v201 · **Full Backup:** Schema v29 · **Settings Preset:** v1 · **Personal Order Export:** v4 · **Collections Export:** v2

## v282

- Refined **Settings → Dynamic Category Row** into a cleaner responsive control layout.
- Made Add/Edit Category open without a full page rerender and added a dedicated scrollable category editor with sticky title/actions.
- Fixed first-load sidebar collapse/expand binding so the MediaFlow brand works immediately after startup.
- Reworked **Clear Category** into a chunked non-blocking removal path with Library History deletion snapshots preserved.
- Repaired the main Collections **Compact progress** presentation.
- Ensured default navigation places **Collections directly below Library** while preserving user-customized navigation orders.
- Added **Collections Batch Mode** in every Collections browser display mode with Select visible, Deselect all and designed multi-delete confirmation.
- PWA shell advanced to `mediaflow-pwa-v282-shell-v1`.
- No data migration required.

# MediaFlow v281 — Collections Responsive Polish, Full Collection Cloud State & Library Search Reliability

**App release:** v281  
**Cloud Sync:** v201 · **Full Backup:** Schema v29 · **Settings Preset:** v1 · **Personal Order Export:** v4

## v281

- Rebuilt the **main Collections Compact progress UI** into a readable full-width progress block with percentage and completed/total information aligned to the collection copy.
- Made **Collection Card mode cover sizing responsive**: increasing Collection cover size now reduces card-column density instead of crushing or overflowing title text.
- Added responsive caps for oversized Collection covers on tablet/mobile while preserving the saved desktop preference.
- Extended Collection persistence so browser sort/search and active collection filter state are captured by **Cloud Sync / Sync Now, Full Backup and Settings Presets**.
- Upgraded dedicated **Collections Export / Import to v2** so collection display/filter settings travel with exported Collections.
- Hardened **Library live search** so fast typing survives Library rerenders without dropped characters, lost focus or a moved caret.
- Re-audited Cloud Sync, Sync Now, XP, Full Data export/import, automatic backup/export, Settings export/import, History exports, Personal Order import/export, Collections import/export and automatic updates.
- PWA shell advanced to `mediaflow-pwa-v281-shell-v1`.
- No data migration required.

# MediaFlow v280 — Collection Cover Progress, Selection & Hero Background Fixes

**App release:** v280  
**Cloud Sync:** v201 · **Full Backup:** Schema v29 · **Settings Preset:** v1 · **Personal Order Export:** v4

## v280

- Removed duplicate Collection title progress bars and attached the single progress bar to each title cover.
- Moved Collection title rating badges onto the title cover in every display mode.
- Refined Compact progress UI.
- Fixed manual one-by-one Collection selection so Remove selected enables immediately.
- Made Collection hero/background artwork substantially more visible while keeping text readable.

# MediaFlow v279 — Collections Progress, Backgrounds, Import/Export & Performance

**App release:** v279  
**Cloud Sync:** v201 · **Full Backup:** Schema v29 · **Settings Preset:** v1 · **Personal Order Export:** v4

## v279

- Redesigned Collection hero/progress readability and richer automatic backgrounds.
- Added custom Collection background image URLs.
- Added progress UI to every Collection browser/title display mode.
- Added typed titles-per-page pagination.
- Added Collection import/export.
- Added designed confirmation for single/bulk Collection title removal.
- Added click-anywhere opening for List, Compact, Cards and Showcase.
- Added semantic Collection create/open icons.
- Optimized Add Titles search and Collection editing/opening.

# MediaFlow v278 — Responsive Bottom Navigation Visual Parity

**App release:** v278  
**Base:** MediaFlow v277 Modular  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

## v278

- Fixed the 861–1080px responsive range using browser-default bordered navigation buttons.
- All responsive widths now use the same clean, borderless, theme-aware bottom-navigation design.
- Preserved the v277 mutually-exclusive sidebar/bottom-bar breakpoint contract.
- Active page accent, adaptive More capacity, safe-area support, and PWA behavior remain intact.
- No data migration required.

---

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


## MediaFlow v283

- Category Add/Edit/Save/Delete/Cancel modal lifecycle reliability.
- Clear Category Cancel closes immediately.
- First-load sidebar brand collapse uses delegated startup handling.
- Collections Cards typography and title hierarchy cleanup.
