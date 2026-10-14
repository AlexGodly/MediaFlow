# MediaFlow v391 — Performance Stability & History Layout Repair

**Application:** MediaFlow  
**Version:** v391 Modular  
**Baseline:** v390 Modular  
**Release date:** October 12, 2026  
**Developer:** Alex Godly  
**Release type:** Targeted performance optimization, History UI repair, large-Library benchmarks and regression testing  
**Status:** Built and locally tested

---

## 1. Scope and limitations

MediaFlow v391 addresses **measured** responsiveness bottlenecks and the reported overlapping episode details in Consumption History. The work preserves the existing Library, XP, History, Logging and cloud data models. This is a meaningful performance improvement, **not a claim that every page is now guaranteed freeze-free on every device**. The full app, authentication, cloud persistence, installed PWA and physical low-end hardware require continued field measurements.

## 2. Dynamic Library: repeated filter and sort processing

### Problem

The Dynamic Library rebuilt and sorted the matching title array on repeat calls even when the Library, category, status, priority, search, sorting and other relevant settings were unchanged. Sorting thousands of titles with locale-aware text comparison could block the main browser thread.

### Implementation

- Added a keyed **in-memory Dynamic Library result cache** in `src/js/components/285-v391-runtime-performance.js`.
- The key includes the authoritative Library cache generation, Library length/reference, selected category/status, priority, search query, sort mode, unfinished filter, random seed and Library rating mode.
- Repeated calls with unchanged inputs return the previously calculated result.
- Changes to the Library invoke the existing `v53InvalidateLibraryCache()` path and clear the cached array, preventing stale references across edits, imports, removals and cloud-state replacements.
- The existing v189 title sorter reuses one `Intl.Collator(undefined,{numeric:true,sensitivity:'base'})`, avoiding repeated collation-option setup. Sort semantics are unchanged in the tested comparisons.
- No persistent cache, new data field, new indexed service or background polling is introduced.

### Measured results

Synthetic Chromium timing for `v181DynamicRows()` only. Figures below are observed examples, **not end-to-end page load or device FPS benchmarks**; the first call includes different browser warm-up costs. `0 ms` means below timer resolution.

| Dataset | v390 first calculation | v391 first calculation | v390 repeated unchanged request | v391 repeated unchanged request |
|---|---:|---:|---:|---:|
| 3,000 titles | 47.4 ms | 22.7 ms | ~15–19 ms | ~0–0.1 ms |
| 30,000 titles | 246.2 ms | 111.7 ms | ~158–179 ms | ~0–0.1 ms |
| 100,000 titles | 770.5 ms | 299.2 ms | ~545–664 ms | ~0–0.1 ms |

The 100,000-title **search** case matched 250 synthetic records and took around 9 ms on the tested v391 environment. Repeating the same search reused the cached result in under the measured 0.1 ms granularity. These numbers describe a specific in-memory calculation, not the rendering of 100,000 visible cards. Rendering still uses MediaFlow's existing view and pagination systems.

**Correctness:** Canonical-versus-cached result parity passed for title, priority, rating, progress, total, Logging date, edit date, last-seen date, added date, random order, search, unfinished, category/status and title modification with invalidation.

## 3. Active-time XP: avoid recurring full Library/History scans

### Problem

The v334 active-time system accrues foreground-time rewards periodically (approximately every 15 seconds). The former invalidation path could mark the entire XP cache dirty. The sidebar's live Leveling display then recomputed aggregate XP using the Library and History data, even when only the active-time reward had changed.

### Implementation

- When the XP cache is already clean, identify a reward update occurring solely within the existing active-time earnings transaction.
- Recalculate the small active-time ledger totals and apply the **exact integer XP delta** to the existing live XP cache.
- Notify the v385 live XP presentation scheduler without forcing a complete Library/History aggregation.
- Fall back to canonical full invalidation for any dirty state, non-time reward change, edit/import/restore or ledger change that cannot be proven safe.
- Keep the existing XP formulas, leveling thresholds, streak calculation, active-time reward policy, History and cloud persistence behavior.

### Measured results

A synthetic fixture with **30,000 Library titles and 13,000 History sessions** recorded one clean active-time update at **1.1 ms**, versus **113 ms** for a canonical forced full recalculation in the same test. The first cold XP calculation took approximately **138 ms**. The fast result, forced full recomputation, and canonical aggregate produced identical tested XP totals; dirty fallback also passed.

This optimization does not alter the rate at which active-time XP is earned and does not affect other XP sources.

## 4. Consumption History: itemized episode detail layout repair

### Problem

History cards were styled as a horizontal flex row, with the main title button occupying `width:100%` and the itemized episode `<details>` section competing beside it. This left almost no horizontal room for the unit number, timestamp and duration. In multi-column History layouts, text overlapped and cards stretched awkwardly.

### Implementation

Added `assets/css/206-v391-history-unit-layout.css`:

- Stack the title summary and individual-entry panel **vertically inside the same card**.
- Keep the action menu in a consistent top-right location.
- Give itemized details the full card width and allow timestamps and episode labels to wrap naturally.
- Use an adaptive grid for individual unit name, original timestamp and duration; narrow cards place the timestamp on a second line.
- Preserve the **original recorded time and duration values**, without changing their timezone, format, rounding or stored content.
- Ensure neighboring History cards align to their own content height rather than always stretching to the tallest detailed card.
- Preserve expand/collapse, Edit log, Delete log and selection behaviors, with dynamic-theme colors derived from the existing theme.

**Validation:** Real itemized History HTML generated from five synthetic episode records was checked in Chromium at **320, 390, 820, 1280 and 1920 px**. Episode/timestamp/duration geometry did not overlap, and the detail panel stayed within the card boundaries.

## 5. Data and feature compatibility

- Existing Library, Logging, History, XP, streak, Personal Order, Collections, Seasons, Statistics, dashboard, import/export and backup schemas are unchanged.
- No Supabase tables, RLS policies, secrets, Edge Functions or authentication settings were modified.
- The v388 Logging/save navigation tests passed at 390 and 1280 px against the v391 bundle: Cancel Logging, Quick/Per Unit submissions, progress updates, Add/Edit Title, and invalid media-ID validation.
- The v390 Library search caret suite passed at seven mobile/tablet/desktop Library-mode combinations, including mid-word edits, selection, blur and focus preservation.
- The v391 Dynamic Library cache parity and XP delta/fallback tests passed.
- JavaScript syntax checks and v391 asset/PWA shell generation passed.

## 6. Technical source changes

| File | Change |
|---|---|
| `src/js/components/285-v391-runtime-performance.js` | New Dynamic Library result cache, active-time XP delta fast path and performance audit counters |
| `src/js/pages/library/121-v189-library-sorting-unfinished-filter-dynamic.js` | Reuse locale-aware collator |
| `src/js/runtime-order.json` | Register v391 runtime component |
| `assets/css/206-v391-history-unit-layout.css` | Fix Consumption History card and itemized entry overflow |
| `index.html` | Reference v391 script and History stylesheet |
| `assets/js/mediaflow-v391.bundle.js` | Rebuilt runtime |
| `VERSION`, `version.json`, `package.json`, `manifest.json`, `sw.js` | v391 release metadata and PWA assets |
| `scripts/test-v391-*.py` | Benchmark, correctness and compatibility coverage |
| `README.md`, `README2.md`, `docs/CHANGELOG_v391.md` | Release documentation |

PWA application-shell cache: `mediaflow-pwa-v391-shell-v1`. There are no data migrations.

## 7. What has **not** been established

- This release does not benchmark every page, every sort/data combination or full 100,000-title DOM rendering.
- Zero freezes on all devices, especially low-memory phones, cannot be guaranteed.
- Authenticated real-account Supabase latency, multi-device sync, network failures and physical-device installed-PWA behavior were not tested.
- End-to-end application load, full-UI animation frame rates, memory leak lifetime profiling and low-end CPU throttling require further profiling.

The measured findings support **two specific application-wide performance bottlenecks** and the History UI repair. Further profiling can drive later optimizations safely rather than applying unverified changes broadly.

---

**MediaFlow v391 — Developed by Alex Godly**  
*Reuse what is already computed. Keep XP live. Make History readable.*
