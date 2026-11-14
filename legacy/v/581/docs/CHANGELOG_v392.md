# MediaFlow v392 — Collections & Personal Order Management

| Metadata | Value |
|---|---|
| Release | v392 Modular |
| Based on | MediaFlow v391 Modular |
| Date | October 12, 2026 |
| Developer | Alex Godly |
| Delivery | Complete ZIP; manual deployment, no GitHub changes |
| Focus | Persistent instant-add pickers, Collection removal responsiveness, sorting and bulk controls |

## 1. Collections — Direct Add titles

**Problem:** Adding a title required first selecting it and then pressing Add, followed by reopening the title picker to add another title.

**Implemented:** The Collections → Add Titles picker opens in **Direct Add** mode. Each unadded title shows a plus-icon **Add** button; pressing it inserts the title into the active Collection, immediately changes the button to checkmark **Added**, and **keeps the picker open**. Previously added titles continue to appear in their existing positions and cannot be added twice. An optional **Multi-Select** toggle shows checkboxes for not-yet-added titles and an Add Selected action without closing the picker. Both modes keep the existing five display views.

Search, filters and sorting remain available. New membership filtering supports **All titles**, **Not added**, and **Already added**. The default order is **Date added → Oldest first**; picker sorting includes alphabetical, priority, rating, progress, total episodes, last edited, last logged and randomized order where corresponding Library fields are populated.

## 2. Personal Order — Direct Add titles

**Problem:** Adding one Library title to Personal Order involved separate selection and confirmation actions and repeated popup openings.

**Implemented:** Titles now show one-click Add / Added controls with meaningful plus and checkmark icons. The picker stays open after each addition and when committing Multi-Select additions. The default picker sort uses date added, oldest first, with a dedicated selector for other title dimensions. Existing category/status/priority filtering, page controls and responsive title display modes remain available. Newly added titles append to the order queue; existing manual ordering is untouched. The page is re-rendered when the user closes the sheet, preventing re-render from prematurely destroying the open picker.

## 3. Personal Order — Direct Add Collections

**Problem:** Adding a Collection to Personal Order required extra selection/confirmation and a reopened picker for subsequent Collections.

**Implemented:** Each unassigned Collection has a plus Add control. After assignment the button becomes check Added and is disabled against duplicate assignments to the same Personal Order category. Multi-Select allows batch assignment while the picker stays open. Original category choice and sorting/filtering controls remain. Initial sorting prefers **date created ascending** (oldest first). Collection contents and the rest of Personal Order are preserved.

## 4. Collections — Immediate deletion after confirmation

**Problem:** Removed titles sometimes stayed visible until navigating away or waiting for a later refresh.

**Implemented:** Single-title and Multi-Select removals require confirmation; when confirmed, the collection membership is updated locally and the current Collection page is rendered **before** the save begins. Collection title counts, membership and selection states are refreshed. Removing from a Collection never deletes the Library record or History. Persistence remains asynchronous and uses the existing serialization system; failed saves trigger an error notification.

## 5. UI responsiveness & technical details

- Keeps the title picker open after direct and bulk additions.
- Preserves focused search input for the typical single-add result refresh, including caret selection.
- Guards against duplicate inserts and stale membership button states.
- Reuses existing Library search indexes and supports membership checks via sets.
- Styles the plus/Add and check/Added controls directly, preventing older text-based icon injection from substituting a circular-arrow icon.
- Preserves List, Compact, Cards, Covers and Covers + Titles layouts on supported picker surfaces.
- Supports compact mobile sizing and responsive desktop/tablet layouts.
- Leaves v391 Library performance and History fixes in the baseline.
- Does not alter Supabase database schema, authentication or user backup formats.

## 6. Files added/updated

- `src/js/components/286-v392-collections-instant-add.js` (new)
- `src/js/runtime-order.json`
- `assets/css/207-v392-collections-personal-order-instant-add.css` (new)
- `assets/js/mediaflow-v392.bundle.js` (rebuilt)
- `index.html`, `sw.js`, `VERSION`, `version.json`, `package.json`
- `scripts/test-v392-workflows.py` (new)
- `README.md`, `README2.md`, `docs/CHANGELOG_v392.md`

## 7. Validation

| Test | Result |
|---|---|
| Modular builder and v392 bundle JavaScript syntax | Pass |
| Synthetic Chromium UI at 390 px | Pass |
| Synthetic Chromium UI at 1280 px | Pass |
| Collection Direct Add and Multi-Select | Pass |
| Personal Order title Direct Add and Multi-Select | Pass |
| Personal Order Collection Direct Add, duplicate guard | Pass |
| Picker remains open and Added state appears | Pass |
| Date added oldest-first default / alternate title ordering | Pass |
| Collection search maintains input focus | Pass |
| Confirmed single and bulk Collection removal | Pass |
| Authenticated live Supabase sync and conflict rollback | Not tested |
| Real 100,000-title end-to-end devices | Not tested |
| Installed Android/iOS PWA and desktop hardware | Not tested |

## 8. Compatibility and delivery

The update builds on MediaFlow v391 Modular. Existing Library, personal collections, History, logging, preferences, cloud data, XP, themes, imports, exports and backups are preserved by design. The v392 browser tests cover the new workflows only; they are not a claim that every older feature was exhaustively retested. The user will upload/deploy the ZIP manually. **No GitHub operations.**
