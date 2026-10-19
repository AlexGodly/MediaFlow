# MediaFlow v408 — The Performance & Stability Overhaul

**Version:** v408 Modular  
**Baseline:** v407 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Focus:** Responsiveness, large-library performance, Logging workspace layout, Collections category search, portability compatibility  
**Database migration:** None

---

## 1. Overview

v408 addresses several measurable sources of browser blocking in MediaFlow, prompted by Chrome's **Page Unresponsive** warning with a Library of approximately 31,459 titles. It also repairs Logging → Browse Library filter and selection layouts and introduces searchable **Show categories** multi-select checklists in two Collections locations.

This is a source-backed performance update, not a claim that every possible browser freeze has been removed. The 100,000-title test still shows substantial individual rendering work, and a real authenticated production-device trace remains necessary to verify the Chrome warning is fully resolved.

## 2. Repeat-consumption history — eliminate repeated full-Library searches

**Problem:** Repeat/reconsume History totals previously used `S.library.find(...)` to resolve the title for each session entry. When a Library has tens of thousands of titles and sessions reference many titles, this builds a multiplicative cost (approximately **O(history entries × Library size)**). A single Dashboard or statistics render could repeat the same expensive calculation.

**Fix:** In `src/js/features/rewatch/027-v81-repeat-consumption-rewatch-reread.js`, construct one `Map` indexed by the title ID for the calculation and resolve each referenced title with `get(id)`. Complexity becomes approximately **O(Library size + History entries)**. No title, consumption, session, XP, or status data is rewritten.

**Additional refinement:** Within one synchronous render/event turn, `v81RepeatTotals()` reuses its computed result when the Library, session collection, and tracked cache tokens are unchanged. The cache is cleared at the microtask boundary so later operations recompute. No persistent cache or new database field is introduced.

## 3. Logging — avoid redundant large candidate sorts

**Problem:** Consecutive Logging suggestion and picker-decoration passes can request the same complete candidate list more than once. A search with no query can sort 30,000+ Library entries for both passes even if nothing changed.

**Fix:** `logTitleCandidates` now has **same-turn memoization** keyed by the search query, Library identity/invalidation token, saved sort/filter options, active Logging membership filter, current draft IDs, and random-sort seed. A matching second call reuses the candidate array instead of sorting again. Entries are recalculated when state changes or the current microtask ends. The existing `v406` **All titles / Not added / Already added** membership semantics, ordering and Logging mutation handlers remain authoritative.

**Scope:** This improves the repeated same-turn calculation; it does not introduce persistent stale sorted indexes.

## 4. Logging → Browse Library — responsive layout reorganization

Based on screenshots of desktop and narrow mobile screens, the filter toolbar had cramped or missing labels, an oversized category selector, awkward wrapping, under-used desktop width, and poorly grouped selection actions.

Changes are scoped to `.log-form .mf383-logging-body` and implemented with container-aware CSS grids:

- **Show:** fixed readable width for the selected **All titles / Not added / Already added** label, including narrow screens.
- **Category:** balanced control width rather than stretching over most of the page.
- **Sort + direction:** grouped so the sort field and ascending/descending button remain together.
- **Status, Priority, Per page, Clear filters:** predictable responsive rows with full-height, aligned controls.
- **Results count:** occupies a complete row rather than being squeezed into a filter slot.
- **Display / Select Visible / Deselect All / Add Selected:** an organized selection-action grid that spans the full toolbar, with stacked or balanced rows on smaller screens.
- Preserves existing native dropdowns, labels, view modes, membership filters, category filters, pagination, draft selection, and action handlers.

A final browser check confirmed the selection-action toolbar spans its parent grid at **320px, 390px, 820px and 1280px**. Responsive styles adapt to the panel container width, not only the browser viewport.

## 5. Collections — searchable Show categories

In the **main Collections page** category checklist, a **Search categories…** field now appears inside the existing multi-select dropdown. Typing filters the visible checkbox rows immediately by name.

This enhancement:

- Keeps configured real category icons and names.
- Orders the existing category rows according to the canonical Settings category filter order.
- Preserves checked values when a search matches only a subset (hidden entries are **not** unchecked).
- Preserves the existing **All categories** semantics; searching itself never toggles or clears categories.
- Shows **No matching categories** for zero matches.
- Preserves the popup open/query state when relevant UI fragments are regenerated, without saving ephemeral search text to the cloud.
- Maintains the existing category checkbox and selection logic.

## 6. Collections → Add Titles — searchable Show categories

The same searchable multi-select category checklist is available inside **Collections → Add Titles**. It is a separate surface with its own ephemeral query/open state, and it uses the existing popup's category-selection handlers and data.

Selecting or removing categories remains independent of search input. The Add Titles popup's title search, sorting, pagination, title selection and add/remove operations remain unchanged.

## 7. Portable export release-stamp coherence

The compatibility regression uncovered that several export builders still assigned a hard-coded **v405** source-release stamp even after the application bundle became v408. These were corrected at the final v408 serialization layer:

- Full Data and automatic backup: `mediaFlowVersion` and `backupVersion` = **408**.
- Settings Preset: `mediaFlowVersion` = **408**.
- Personal Order export: `mediaFlowVersion` = **408**.
- Collections export: `mediaFlowVersion` and `appVersion` = **408**.

Historical v402/v405 manifests remain historical. Import formats, schema identifiers, user data and normalizers were not changed. The new `MediaFlowV408.transferAudit()` verifies current stamps, retained cloud/backup parity, settings-preset coverage and the previously introduced floating-control preferences. This is a **local serialization audit**, not a live Supabase readback.

## 8. Technical files

**New v408 source:**

- `src/js/components/301-v408-performance-stability-ui.js` — same-turn repeat and Logging caches, searchable Collections category controls, export version normalization and v408 transfer audit.
- `assets/css/220-v408-performance-logging-category.css` — scoped Logging filter/selection grid and searchable category dropdown styling.

**Updated source:**

- `src/js/features/rewatch/027-v81-repeat-consumption-rewatch-reread.js` — indexed repeat-entry title lookup.
- `src/js/runtime-order.json` — registers the v408 runtime extension.
- `index.html` — current v408 CSS and bundle reference.
- `VERSION`, `version.json`, `package.json`, `manifest.json`, `sw.js`, generated `assets/js/mediaflow-v408.bundle.js` — v408 release assets and cache inventory.

**Regression tests:**

- `scripts/test-v408-functional.py`
- `scripts/test-v408-performance.py`
- `scripts/test-v408-transfer-contracts.py`
- `scripts/test-v408-pwa-update.py`
- `scripts/test-v408-pwa-contract.cjs`
- Retained earlier test utilities including the v407 bulk-picker regression.

**Documentation:** `README.md` Evolution section only; `README2.md` and `docs/CHANGELOG_v408.md` updated.

## 9. Measured performance

The following observations come from headless Chromium on a **synthetic 30,000-title Library with 1,200 repeat History sessions**, comparing the real compiled v407 bundle against the compiled v408 bundle. They are useful benchmarks, **not production-device traces**. Individual timings vary between runs.

| Operation | v407 example | v408 example | Results |
|---|---:|---:|---|
| Ten repeat-total requests | 1,141 ms | 20 ms | Same session/episode/title totals; major reduction in repeated full scans |
| 30,000-title `renderLibrary()` generation | 157 ms | 85 ms | Same markup character count under fixture; improvement is workload-dependent |
| Two Logging candidate requests | 33 ms | 17 ms | Same title count and first result; candidate array reused |

A second 30,000-title run measured **979 ms versus 26 ms** for ten repeat-total requests. Do not interpret either run as a universal frame-rate guarantee.

**100,000-title stress test:** v408 completed ten repeat-total requests in approximately **61 ms**, `renderLibrary()` markup generation in approximately **235 ms**, and two Logging candidate requests in approximately **63 ms** on a 2,000-session synthetic fixture. This confirms improvements **and an important remaining limitation**: full Library generation can still occupy the main thread long enough to produce a noticeable long frame, especially on lower-powered hardware.

## 10. Verification and limitations

| Test | Result |
|---|---|
| Modular build and JavaScript syntax | PASS |
| Searchable category checklist in main Collections | PASS at 320, 390, 820, 1280px, isolated real-module fixtures |
| Searchable category checklist in Collections Add Titles | PASS at same widths, isolated real-module fixtures |
| Category ordering, no-match, checkbox state unchanged by search | PASS in controlled fixtures |
| Logging Show membership options preserved | PASS |
| Logging selection toolbar spans its parent grid | PASS at four widths |
| v407 Library/Collections bulk-action picker regression | PASS |
| v407 vs v408 30K repeat totals parity and Logging candidate counts | PASS |
| 1,555-record History local JSON/cloud-snapshot/backup readback, XP non-mutation, v408 export stamps | PASS at 390px and 1280px |
| PWA shell, simulated safe update and interrupted-update rollback | PASS (175 app assets; bounded requests) |
| ZIP archive integrity | Verified during packaging |

**Not verified:** authenticated production Supabase synchronization; physical Android/iOS installed PWA updates; full end-to-end Collections checkbox mutations in a fully initialized user account; real-user Browser Performance recordings of the Chrome **Page Unresponsive** warning; universal freeze-free performance at 30K–100K titles. The complete application contains other potential blocking work. v408 substantially addresses identified hot spots, but remaining freezes should be profiled on real account workflows in a subsequent targeted pass if observed.

## 11. Compatibility and safeguards

- No Supabase schema migrations, Cloud Sync schema rewrites, or production data modifications.
- No change to XP formulas, History semantics, Logging submissions, category memberships, actual checked filters, or Personal Order/Collections structure.
- Library Normal/Dynamic, Dashboard, Logging modes, Personal Order, Collections, v407 bulk-action pickers, Alex Godly's Smart Fresh Episodes Engine, settings, backups, XP and PWA remain available.
- Release metadata updated; supported older exports remain import-compatible.
- Dynamic themes and desktop/tablet/mobile layouts retained.
- No paused media-service tracking, community or Discord integrations were reintroduced.

---

**MediaFlow v408 — The Performance & Stability Overhaul**  
*Developed by Alex Godly.*
