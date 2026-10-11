# MediaFlow — Latest Release Changelog

## MediaFlow v378 — Tenrai Migration, Import IDs, Logging 4.0 & Personal Order

**Release:** v378 Modular — Personal Edition  
**Baseline:** v377 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Built and locally tested; not committed, pushed or deployed.

### 1. Automatic MAL Detection powered by Tenrai
Migrated MyAnimeList metadata, episode lookup, unmatched-title retries, API failure retries, and Add/Edit Title MAL verification to Tenrai's public v1 endpoints. Retains MAL-ID-first matching and trustworthy-count protection, without introducing OAuth or external account tracking.

### 2. External Media IDs in imports
Normalizes known provider identifiers in canonical Exchange Hub import flows, extracts MAL IDs from recognized URLs, preserves manually corrected IDs, rejects invalid values and presents import ID outcome counts.

### 3. Logging 4.0
Adds Collapse All/Expand All for Quick Logging and Per Unit, direct title Add, five Logging Library display modes, Clean Covers, multi-select, Select Visible, Deselect All, and one-click Add Selected. Draft entries start at zero consumption until deliberately configured.

### 4. Personal Order
Fixes narrow title position inputs (tested for 3+ digits) and includes assigned Collection blocks within Lists → All Titles, following their mixed order alongside direct titles. No existing cover presentation changes.

### 5. Icons, tests and packaging
Semantic icons for Unmatched, Retry, Verify, and External Media IDs. Built JS/PWA metadata for v378. Chromium synthetic tests at mobile/tablet/desktop widths passed; live Tenrai/cloud/physical-device testing not performed.

**Complete technical changelog:** [docs/CHANGELOG_v378.md](./docs/CHANGELOG_v378.md).

---

## MediaFlow v377 — External IDs, Reliable Jikan & Personal Order Positions

**Release:** v377 Modular — Personal Edition  
**Baseline:** v376 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Local development candidate; not deployed.

### 1. Editable external media IDs

Added dedicated, collapsible External Media IDs fields to Add/Edit Title for MAL, SIMKL, AniList, TMDB, IMDb, Trakt, Kitsu, ISBN and any additional stored provider IDs. Existing IDs are prefilled, can be changed or cleared, and manual overrides survive normalized Exchange Hub imports. Anime Details includes an **Edit external IDs** shortcut. The MAL field offers Jikan verification; other providers do not gain new automatic metadata integrations.

### 2. Automatic Jikan reliability

Jikan requests use a serialized gate (≥1.15 seconds between calls; no more than 53 attempts per sliding minute), bounded retries, 16-second timeouts, `Retry-After` handling, exponential backoff, and successful-response caching. Missing or empty episode data are treated as failures rather than valid zero counts. Partial scans preserve the previous trustworthy Detected Fresh Titles total.

### 3. Unmatched Titles manager

**View Unmatched Titles** opens a scrollable popup with actual Library covers or the existing category-icon fallback, title, current MAL ID, failure reason, Edit, and per-title Retry. **Check All Unmatched**, **Check Selected**, and **Retry API Failures** check only affected titles. Recovered episodes contribute to Detected Fresh Titles without duplicate counting once the aggregate is verified.

### 4. Add/Edit Title — Seasons View placement

Seasons View now appears at the very end of Core Details. The new External Media IDs section follows immediately afterward, before Artwork & Dates. All existing seasons data and actions remain intact.

### 5. Personal Order three-digit positions

Strengthened the numeric lane and input widths across Tabs, Lists, Collection Queues, assigned Collections, and expanded Collection rows. At least three digits remain visible at mobile and desktop widths; larger values can display safely. **Existing cover presentation and cover-size settings are unchanged.** The continuous/grouped Collection Queue behavior from v376 is preserved.

### 6. Build, validation and compatibility

- Built `mediaflow-v377.bundle.js` and regenerated v377 PWA assets.
- Chromium layout tests passed at 320, 390, 820, 1280 and 1920 px.
- Synthetic Chromium Edit Title/Jikan tests passed at 390 and 1280 px, including manually saved IDs, partial check protection, separate unmatched/API-failure reporting, and fresh-title count recalculation after retries.
- No new SQL migrations or external OAuth provider connections.
- Live Jikan availability, authenticated cloud synchronization, and physical devices were not tested.
- **GitHub:** No commits, pushes, or deployment. Owner manages the repository; numeric commit convention is `377`.

**Full technical details:** [docs/CHANGELOG_v377.md](./docs/CHANGELOG_v377.md)

---

## MediaFlow v376 — Personal Order UI Parity & Continuous Collection Queue

**Release:** v376 Modular — Personal Edition  
**Baseline:** v375 (restored v373 feature code)  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Local development candidate; not yet deployed.

### 1. Personal Order Row/Card Parity

The position badge, poster and title metadata now use a consistently protected three-column layout throughout **Tabs / Category Titles**, **Tabs / Collection Queues**, **Lists / All Titles**, **Lists / By Category**, direct titles, assigned Collection blocks, and expanded Collection contents.

### 2. Readable Positions

Position badges/inputs support **at least three digits** without overlap or clipping. The protected position lane uses 54 px at normal widths and 48 px on narrow layouts, with a natural-content-friendly label and proportional cover frame.

### 3. Continuous Collection Queue

- **Lists → All Titles:** Collection Queue items form **one continuous list**. Previously separate category cards are no longer displayed as isolated queue panels.
- **Lists → By Category:** Collection Queue items stay grouped by category, matching the Title Order grouping.
- **Tabs:** Category Titles and Collection Queues retain their focused per-category presentation.
- **Canonical data safety:** Global display numbering does **not** overwrite category-local position values. Collection assignment input remains category-local for reordering.

### 4. Responsive Collection Artwork & Expanded Details

Fixed cover/number spacing for individual titles, Collection cover/collage blocks and entries inside expanded Collection Order. Existing adjustable cover sizes, eligibility statuses, title wrapping and action controls are preserved.

### 5. Existing Features Preserved

Retains drag-and-drop, moving via arrows/numeric inputs, Edit/Remove, Open Collection, Show/Hide Titles, collection-category and completed-title rules, history, Logging, XP, Supabase cloud state and data formats. No new SQL migration; canceled v374 MAL/SIMKL authenticated tracking remains absent.

### 6. Development Validation

Compiled v376 JS and regenerated version-aware PWA assets; validated the real app in Chromium at **320, 390, 820, 1280 and 1920 px** using synthetic data and a Collection with 140 members. Full physical-device, live-account and production verification remain outstanding.

**Technical source and detailed test matrix:** [docs/CHANGELOG_v376.md](./docs/CHANGELOG_v376.md)

---

## Previous Release — v375

v375 restored the v373 application baseline after canceling the v374 external tracking experiment. Its `VERSION` and `version.json` values were updated, while v373-named frontend/PWA artifacts remained in that rollback source. v376 performs a complete fresh JavaScript/PWA build.

## Earlier Feature Baseline — v373

v373 introduced the Logging Sorting & Custom Order Studio, with session insertion order, multiple sorting fields, manual movement, and persistent custom draft arrangement. [Read v373 details](./docs/CHANGELOG_v373.md).

---

**Commit policy:** When an approved release is deployed to GitHub `main`, the commit message is **only the numeric version** (for v376, `376`). This local candidate has not been pushed or deployed.
