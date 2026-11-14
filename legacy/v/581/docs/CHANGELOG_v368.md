# MediaFlow v368 — Performance & Stability, Safe Index/Queue Optimization

**Version:** v368  
**Base:** MediaFlow v367 Modular Personal Edition  
**Release date:** October 10, 2026  
**Developed by:** Alex Godly

---

## 1. Scope and preservation rules

v368 begins MediaFlow's application-wide performance effort with a **measured, low-risk internal optimization pass**. It does not remove any page, feature, control, theme, import/export option, queue function or cloud workflow. The intended interface is identical to v367; there is **no visual redesign** and no new Performance Mode toggle in this release.

Rather than introducing untested Web Workers, changing cloud sync semantics, or rewriting MediaFlow, this release addresses a measured high-cost path used by **Collections and Personal Order**.

## 2. Reuse the existing lightweight Library ID index

Prior to v368, `v274LibraryItem()` followed the `v274 → v270 → v241` chain. Retrieving even one Collection title could trigger construction of v241's complete Library metadata/text-search index, which is costly on 30k–50k title libraries when that index had not yet been warmed.

v368 reuses the **existing v156 Library ID index** for those lookups. This provides:

- Constant-time title lookup after index creation.
- No duplicate full-text indexing just to locate a Collection title by ID.
- Correct reuse of canonical Library item objects.
- Existing invalidation based on Library array replacement, length and the `V53_LIB.libraryToken` cache token.
- No changes to Library contents, ordering, progress, covers or Title Details.

## 3. Render-scoped Personal Order normalization

Previously, repeated render-time Collection/queue lookups could normalize the same Collection array and Personal Order queue structures over and over during a **single synchronous HTML render**.

The v368 runtime adds narrowly scoped reuse of the *already normalized objects* while generating:

- Personal Order Lists and Tabs HTML.
- Category tabs.
- Individual Collection Queue panels.

The render scope always exits through `finally`, clears its references, and never holds cached normalized queue state across independent UI interactions. Outside that synchronous render, edit/add/move/remove/import operations continue using the **original canonical normalization and persistence behavior**.

## 4. Avoid quadratic queue membership scans

The Collection Queue reconciliation routine formerly used repeated `queue.includes(token)` scans while appending missing title/Collection tokens. This could become disproportionately expensive for longer mixed title queues.

v368 replaces those membership checks with a local `Set` while retaining the existing queue sequence and deduplication rules. It does not change saved positions or Collection assignment semantics.

## 5. Measured performance comparison

A paired local Chromium benchmark used the same generated account data for **v367** and **v368**, with 12 categories, 36 assigned Collections and 800 ordered titles. Four alternating render passes included both Lists and Tabs modes.

| Test | v367 | v368 |
|---|---:|---:|
| 30,000 Library titles — initial tested render | 485 ms | 224 ms |
| 50,000 Library titles — initial tested render | 945 ms | 372 ms |
| 30,000 Library titles — next Lists render | 138 ms | 43 ms |
| 50,000 Library titles — next Lists render | 113 ms | 74 ms |

The full HTML length was identical in each paired render. These are **single-run synthetic timing measurements**, not guaranteed real-device speedups or a claim that every page received the same improvement. Actual responsiveness depends on device hardware, browser, storage, background work, user data shape, and image/network latency.

## 6. Exact rendering and state parity tests

A new comparison test runs both compiled v367 and v368 runtimes against an identical synthetic account and verifies:

- **Exact character-for-character Personal Order HTML equality** for Lists and Tabs.
- Identical Collection Queue state after each render.
- Identical number of Collection assignments.
- Same canonical title-object identity on indexed lookup.
- In-place title edit visibility.
- Correct cache invalidation after Library replacement.
- Missing IDs return no title.

Both render modes passed without browser exceptions.

## 7. Regression tests and verification

Re-run against the v368 bundle:

- Settings Center first-paint and repeated Settings navigation at **320, 390, 820, 1280 and 1920px**.
- Future Settings registration, custom categories, search, and Uncategorized fallback.
- All 28 existing Settings sections, Favorites, search and XP settings across responsive widths.
- XP action reward and breakdown totals: **141 current XP = 141 calculated XP** in the synthetic action regression.
- Ten app page families across **12 viewport widths (320–1440px)** with no detected page-level horizontal overflow.
- JavaScript syntax, release consistency, PWA generation and ZIP integrity.

**Limitations:** This release was not independently tested with the user's live authenticated Supabase account, installed PWA updates, production GitHub Pages deployment, or physical low-end Android/iOS/Windows hardware. The benchmark is not a substitute for device profiling.

## 8. Source and release files

**Updated**

- `src/js/components/221-v287-personal-order-collection-queues.js` — linear-time missing-token membership checks.
- `src/js/runtime-order.json` — registers the v368 performance module.
- `VERSION`, `version.json`, `package.json`, `index.html`, `README.md`, `sw.js` — release metadata and asset references.

**Added**

- `src/js/components/266-v368-performance-stability.js` — indexed Collection title lookup and render-scoped normalization; optional diagnostics at `window.MediaFlowV368.getDiagnostics()`.
- `tests/test-v368-performance-baseline.py` — paired synthetic timing harness.
- `tests/test-v368-render-equivalence.py` — exact v367/v368 HTML and queue-state parity.
- `tests/test-v368-settings-first-paint.py`, `tests/test-v368-future-registration.py`, `tests/test-v368-settings-center.py`, `tests/test-v368-settings-coverage.py`, `tests/test-v368-xp-regression.py`, `tests/test-v368-all-pages.py` — v368 regression copies.

**Compiled bundle:** `assets/js/mediaflow-v368.bundle.js`  
**PWA cache:** `mediaflow-pwa-v368-shell-v1`

## 9. Data format and backend compatibility

| System | v368 compatibility |
|---|---|
| Cloud Sync | v201 — unchanged |
| Full Backup | Schema 29 — unchanged |
| Settings Presets | Schema 1 — unchanged |
| Personal Order import/export | Format 5 — unchanged |
| Collections import/export | Format 2 — unchanged |
| XP / streak algorithms | Unchanged |
| Dynamic themes and existing UI | Unchanged |
| Supabase SQL migration | Not required |

## 10. What remains for future performance work

v368 is **not** a guarantee of lag-free operation on every device. Further optimization should be based on measured traces from real devices and larger account states, particularly startup hydration, Library gallery scrolling, image memory, History rendering, and online/offline sync latency. Riskier changes (such as asynchronous state saving, Web Workers or code splitting) were intentionally not introduced without dedicated data-integrity and performance evidence.

**Deployment:** Keep a Full Backup, deploy the complete v368 project, refresh the PWA, confirm the active version and test Sync Now with the live account.
