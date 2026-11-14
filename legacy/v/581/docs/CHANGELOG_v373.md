# MediaFlow v373 — Logging Sorting & Custom Order Studio

**Release:** v373 Modular — Personal Edition  
**Baseline:** MediaFlow v372 Modular  
**Date:** October 10, 2026  
**Developer:** Alex Godly  
**Focus:** Organize titles in every Dashboard Logging interface, without modifying logging calculations or the user's Library order.

## 1. Selected titles initially display in insertion order

**Previous behavior:** Logging's selected-title list had no shared sorting or manual position controls. Users could not quickly arrange their active draft by metadata or restore a personalized working order.

**v373 behavior:** Titles appear in the order they were added to the ongoing session by default. New titles are appended after existing ones; switching to another sorter never destroys the initial insertion sequence.

## 2. Shared sorting studio across all Dashboard Logging interfaces

A theme-aware **Arrange your session** toolbar appears above the selected-title cards in all three existing Logging workflows:

- **Per unit** — individual episode/chapter/issue logging.
- **Quick Logging / Amount consumed**.
- **Quick Logging / Last progress**.

Sorting fields:

| Field | Behavior |
| --- | --- |
| Added to Logging | Original session insertion order by default; recent entries first when descending |
| Current progress | Numeric Library progress |
| Total episodes / chapters | Numeric Library total; includes custom categories' unit counts |
| Priority | Low, medium, high; reverse direction for high-first |
| Alphabetical | Natural title order with ascending/descending direction |
| Last updated by logging | Existing Library logging-touch metadata |
| Last edited | Library's last-edited metadata |
| Last seen in Anime Details | Existing Title Details visit timestamp |
| Date added to Library | Original Library creation timestamp |
| Random | Deterministic order until reshuffled |
| Custom order | Stored per-draft personal sequence |

All non-random automatic sorters have an Asc/Desc control. Random has a separate **Reshuffle** action. Titles with missing history dates are kept at the end of date-based sorts. No new historic visit times are manufactured.

## 3. Three manual reordering methods

Every selected title receives:

1. A **drag handle** with pointer-based repositioning (mouse and touch).
2. **Up/down arrows**, disabled at the boundaries.
3. A **position number** input for direct placement.

Manual moves switch the view to Custom Order. The manual ID sequence is retained when another sort method is chosen, and recovered when Custom Order is selected again. Entries not yet represented in that custom sequence appear after existing custom positions.

**Important:** Visual reordering does **not** mutate the underlying `logDraft.entries` array. Existing title-index-based handlers, unsaved per-unit editor inputs, Library updates, XP previews, History and commit logic remain linked to their original entries.

## 4. Logging Library picker expanded sorting

The existing lazy-loaded Library search/picker keeps its search, filters, pagination and v242 index/cache; it now offers the corresponding Library metadata sorting fields, with ascending date-added order as its default. A current-session added-to-Logging sort is available for selected Library titles. Random has a stable shuffle seed and a Shuffle action.

Manual positions apply to **selected session titles**, not the full 30K–50K-item Library catalogue. The separate Batch Log page is unchanged.

## 5. Persistence and data integrity

- Sorting state (`sort`, `dir`, `randomSeed`) and manual IDs live in `S.logDraft.v373Ordering`.
- Title identities use `v373Key`, avoiding collisions when the same title may appear more than once in a Quick draft.
- Existing **v285 draft-resume persistence** saves these properties locally and through its existing cloud-save path when a draft is active.
- No new cloud table, SQL migration, Library schema change or History transformation is required.
- Cloud Sync v201, Full Backup schema 29, and Settings Preset schema 1 are unchanged.
- Preserved all previous v372 Settings, Collections, UI themes, PWA, XP and imported metadata functionality.

## 6. Responsive design

The toolbar and sortable controls use the active MediaFlow theme variables instead of hardcoded colors. Narrow layouts rearrange Quick Logging cards into a readable cover/title row, compact ordering actions, and a separate progress/Remove row. Per-unit title panels receive compact controls without moving any unit editors out of their original forms.

## 7. Source and release changes

- Added `src/js/components/271-v373-logging-order-studio.js`.
- Registered v373 in `src/js/runtime-order.json`, inside the existing application closure.
- Added `assets/css/193-v373-logging-order-studio.css`.
- Rebuilt `assets/js/mediaflow-v373.bundle.js` through `scripts/build.py`.
- Updated `index.html`, `VERSION`, `version.json`, `package.json`, and PWA `sw.js` cache `mediaflow-pwa-v373-shell-v1`.
- Added `tests/test-v373-logging-browser.py`.

## 8. Validation and limitations

| Verification | Result |
| --- | --- |
| JavaScript syntax | Passed |
| Full source-module/build-manifest consistency (`scripts/check.py`) | Passed |
| v369 itemized logging contract (gaps, seasons, duration, XP, cloud data checks) | Passed |
| v370 responsive Logging browser test | Passed |
| v372 Logging regression test | Passed |
| v373 selected-title sort, arrows, numbered positions and manual-order restore | Passed |
| v373 Chromium pointer drag (mouse) | Passed |
| v373 Quick Amount and Last Progress | Passed |
| v373 Per-unit display at widths 320, 390, 430, 820, 1280 px | Passed (no horizontal document overflow) |
| v373 Quick UI at widths 320, 390 and 820 px | Passed (no horizontal document overflow) |
| Live authenticated cross-device Supabase persistence | Not exercised in automated tests |
| Physical Android/iOS touchscreen drag tests | Not exercised; pointer handlers validated by Chromium mouse-drag tests |

**Benchmark note:** This release does not claim a measured percentage performance increase over v372. v372's existing fast collapse/expand and unsaved-input-preservation checks remain passing. Visual sorting has `O(n log n)` comparator cost for the selected titles and only relocates existing DOM nodes when a sort setting changes.

## 9. Version evolution and deployment

**v372 → v373:** Logging 3.0 layout → Logging 3.0 with organization controls and saved custom title order.

Deploy the contents of this complete ZIP over the existing GitHub Pages project and let the v373 PWA cache refresh. No Supabase SQL changes are necessary. Before replacing production files, keep a copy of v372 and export your MediaFlow data through its built-in backup flow.
