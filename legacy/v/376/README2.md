# MediaFlow — Latest Release Changelog

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
