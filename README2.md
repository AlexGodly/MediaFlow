# MediaFlow v416 Stable — Library Overview hover polish

**October 14, 2026 · Baseline: v415 Stable · Developer: Alex Godly**

- Replaced the harsh full-accent outline on category-card hover with a subtle, category-matched border and soft elevation.
- Added a thin accent shimmer across the card top, a gentle background tint and coordinated highlights for Total titles, status chips and progress bars.
- Used the category's configured accent color, with theme-aware contrast and fallbacks for custom themes.
- Restricted hover elevation to mouse/trackpad devices, preventing sticky or obstructive hover states on touch devices.
- Respects reduced-motion preferences and preserves all counts, status order, progress math and card dimensions.
- Added real production-bundle mouse-hover and touch/reduced-motion browser regression coverage across breakpoints and light/dark themes.
- No user-data, Supabase, or settings migration.

**Release assets:** MediaFlow_v416_Modular.zip and source archive at `legacy/v/416/`.

---

# MediaFlow v415 Stable — Library Overview status breakdown

**October 14, 2026 · Baseline: v414 Hotfix · Developer: Alex Godly**

- Each category Overview card now prominently displays **Total titles**, counting Library entries, not watched units or estimated episode/chapter totals.
- All five title statuses appear in the **same saved order as Settings → Dynamic Status**: Watching, On Hold, Completed, Dropped, and Plan to Watch, with accurate per-category counts including zero values.
- Status counts update automatically when titles change category or status, or when users change their Dynamic Status order. Missing status values use the existing planned/Plan to Watch convention; rare unrecognized statuses are included in an optional Other count so no titles disappear from the total.
- Preserved the existing unit/chapter completion calculation and progress bars separately from these new title counts.
- Responsive, theme-aware status chips in Normal and Dynamic Library; mobile, tablet, and desktop layouts supported.
- Read-only display enhancement: no Supabase, backup, or settings schema migration; existing dynamic status settings remain authoritative.
- Added production-bundle/browser regression tests for status ordering, totals, empty categories, updates to status settings, and card geometry.

**Release assets:** MediaFlow_v415_Modular.zip, full archived version at `legacy/v/415/`.

---

# MediaFlow v412 Hotfix — Library Overview production CSS fix

**October 14, 2026 · Baseline: v411 Stable · Developer: Alex Godly**

- Corrected the selector mismatch that made v411 ineffective: its CSS only targeted a nonexistent `#view-root`, while MediaFlow renders within `#app`.
- Made category cards responsive across desktop, tablets, and phones, with separate rows for icons/titles, counts and percentages, and progress bars.
- Added real `mf412-overview-icon` / `mf412-overview-label` spans in the Overview renderer to safely wrap long category names.
- Preserved category order, visibility, progress math, estimated totals, icon metadata, themes, and both Library modes.
- Replaced the misleading previous test fixture with production-root Chromium regression coverage across 11 viewport widths, panel-constrained layouts, zoom, and a negative control reproducing the v411 failure.
- No database schema changes or modifications to user data.

**Files:** `assets/css/224-v412-library-overview-live-layout.css`, `src/js/legacy/120-v188.js`, `scripts/test-v412-library-overview-real-root.py`, updated version/PWA assets.

---

# MediaFlow v411 — Library Overview UI Repair

**Baseline:** v410 Modular · **October 14, 2026** · **Developer:** Alex Godly
**Scope:** Normal & Dynamic Library Overview on desktop, tablet, and mobile.

- Fixed overlapping category labels, large completion totals, percentages, and progress bars on desktop/tablet.
- Rebuilt Overview container as an intrinsic responsive grid; the number of columns adapts to actual Library panel space, not just viewport width.
- Made each category a self-contained card with clear icon/title, numeric progress, and full-width progress bar. Long category names wrap and never paint over adjacent cards.
- Improved small-screen spacing and made Show/Hide and overview summary wrap cleanly.
- Kept category ordering, visibility, pagination, saved values, theme colors, percentages, and estimates unchanged.
- No changes to the Supabase schema or stored user data.

**Technical:** `assets/css/223-v411-library-overview-responsive.css`; rebuilt v411 application bundle, PWA assets, and metadata.

**Validation:** Responsive Chromium layout tests and package/build integrity.

---

# MediaFlow v410 — Mobile quick-actions dock refinement

**Baseline:** v409 Modular · **October 13, 2026** · **Developer:** Alex Godly  
**Delivery:** Local modular ZIP only — no GitHub commit, push or deployment.  
**Data migration:** None.

v409 fixed quick-action buttons clipped beyond the right edge; v410 addresses the remaining intrusive overlays seen in the next two mobile Dashboard screenshots.

- The floating Add button and Task Progress share a *single compact row* above the bottom navigation rather than a tall, stacked obstruction.
- Task Progress initially uses compact presentation on phone-sized viewports, and remains expandable using its existing control.
- The three quick actions display in a coherent, centered, safely bounded action sheet on mobile, with clear headings, large tap targets and an intentional backdrop.
- The open menu temporarily visually hides task progress without changing the active task, Logging draft, cloud data or saved preferences.
- Short and narrow viewport constraints, dynamic theme, safe-area insets, Escape/outside click close, original action handlers, and desktop fan behavior are preserved.
- New scoped style layer: `assets/css/222-v410-mobile-dock-sheet.css`; the only source-JS change is first-open compact mode on mobile.

Verification: responsive Chromium viewport checks, floating actions open/close and progress expansion, source-built JavaScript syntax, PWA assets. Full authenticated cloud sessions are not part of this offline test.

---

# MediaFlow v409 — Mobile Floating Quick Actions Repair

**Version:** v409 Modular  
**Baseline:** v408 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Database migration:** None  
**Deployment:** Not deployed, committed or pushed; local modular package only.

## Fix

1. Correct the responsive floating quick-action fan which previously appeared off the right edge of mobile screenshots, leaving only the action icons visible.
2. Position the Logging, Library and Collections action cards as a readable, tappable vertical menu anchored above and to the left of the floating Add button.
3. Keep the floating button in the right safe area even when Task Progress is active; place progress above the button and temporarily hide it while the action menu is open (no task state change).
4. Respect narrow screens (320px+), reduced-height viewports, notch/safe-area insets, keyboard access, existing theme colors, and reduced-motion preference.
5. Preserve action click handlers, outside-click / dimmer / Escape dismissal, visibility settings, cloud sync, Library, Collections, XP and Logging state.
6. Update local version metadata and PWA app-shell assets for v409.

## Files

- New: `assets/css/221-v409-mobile-floating-actions.css`
- Updated: `index.html`, `VERSION`, `version.json`, `sw.js`, `manifest.json`, `package.json`, and generated `assets/js/mediaflow-v409.bundle.js`
- No Supabase migrations, no changes to v408 data schemas or v397 action functions.

**Validation:** Source consistency, PWA shell generation, and responsive browser geometry tests (see `scripts/test-v409-mobile-fab.py`).

---

# MediaFlow v408 — Performance & Stability Overhaul

**Version:** v408 Modular  
**Baseline:** v407 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Database migration:** None  
**Status:** Local source and tested package; no production deployment.

## Changes

1. Indexed repeated consumption/rewatch History title lookups by Library ID, replacing repeated 30K-item scans for each session item. Reused repeat totals within one synchronous render event with microtask invalidation.
2. Reduced duplicate Logging candidate sorting through a short-lived keyed cache, respecting the existing v406 membership modes and filter/order inputs.
3. Reorganized Logging → Browse Library filters and selection actions with responsive, container-aware layout; the Show dropdown retains readable selected labels on mobile.
4. Added live Search categories to the main Collections multi-select checklist and Collections → Add Titles popup; selections, configured category order/icons, and the native All behavior stay intact.
5. Corrected legacy v405 export release stamps to 408 for Full Data/backups, Settings Presets, Personal Order and Collections without changing schemas or historic manifests.
6. Rebuilt v408 PWA shell/cache, app bundle and version metadata; preserved preexisting Cloud Sync and import/export formats.

## Verified and remaining limitations

- 30,000-title/1,200-session Chromium fixture: 10 repeat-total requests went from ~1,141 ms (v407) to ~20 ms (v408); identical totals. Another run yielded 979 ms versus 26 ms.
- 30K Library markup rendering improved from ~157 ms to ~85 ms in a controlled fixture; Logging candidates ~33 ms to ~17 ms for the repeated request.
- 100K Library still took ~235 ms for Library markup generation, so universal freeze-free performance cannot be claimed.
- Responsive category search and Logging filters checked at 320/390/820/1280px, preserved v407 bulk menus, data-transfer checks with 1,555 activity records and XP unchanged, and simulated PWA update tests passed.
- Live Supabase authentication, real installed PWA devices, and the user's particular Chrome hang were not reproduced in the controlled environment.

**Detailed changelog:** [docs/CHANGELOG_v408.md](docs/CHANGELOG_v408.md)

---

# MediaFlow v406 — Technical Release Notes

**Version:** v406 Modular  
**Baseline:** v405 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Database migration:** None  
**Status:** Locally packaged source update; no live deployment or production data modification.

## What's new

1. **Personal Order / Add Titles:** `Tools & Filters → Show` offers All titles, Not added, and Already added. Membership follows the live Personal Order title queue.
2. **Personal Order / Add Collections:** The same three-way Show filter, scoped to collections assigned to the currently selected Personal Order category.
3. **Logging / Library:** The same three-way Show filter, scoped to the current unsubmitted Logging draft rather than historical consumption.
4. **Library Normal + Dynamic, Collections:** Searchable bulk action pickers for Move to Category, Set Status, and Set Priority, using the real icon and saved `v230ChoiceLayout.setCategory`, `.setStatus`, and `.setPriority` orders. The original mutation handlers remain authoritative.
5. **Responsive popups:** Viewport-positioned menus, Search without focus loss, Escape and outside-click dismissal, and narrow-screen layout controls.
6. **Compatibility:** No persistent schema changes. v405 cloud, backups, PWA update and Fresh Episodes systems are preserved; v406 app shell and metadata regenerated.

## Tested locally

- Build/Node syntax validation; four responsive headless-browser fixture widths (320, 390, 820, 1280).
- Exact custom ordering for categories, statuses, priorities; Search filtering; all three membership-filter semantics.
- Collections bulk controls; inherited v405 1,555-record synthetic transfer test without XP mutations.
- These are isolated fixture and compatibility checks, **not** authenticated live Supabase synchronization or a full installed-PWA test. Full Library page mounting requires authenticated state and was not established in this isolated fixture.

**Detailed changelog:** [docs/CHANGELOG_v406.md](docs/CHANGELOG_v406.md)

---

# MediaFlow v407 — Bulk Action Dropdown Refinement

**Version:** v407 Modular  
**Baseline:** v406 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Database migration:** None  
**Status:** Locally built and packaged; no live deployment or production data modification.

## What changed

1. **Set Status** (Library Normal, Library Dynamic, Collections): removed the search box, prevented the global icon enhancer from adding a second icon, and left-aligned status icons and labels with consistent row spacing.
2. **Set Priority** (same locations): removed the search box and redundant circular-arrow icon, preserving the single correct priority icon with left-aligned rows.
3. **Move to Category** (same locations): retained live search and the actual saved category icon, but removed the extra circular-arrow and consistently left-aligned entries.
4. **Settings ordering/visibility:** all three pickers still read `v230VisibleIds('setCategory'/'setStatus'/'setPriority')`. No duplicate preferences or new persistence fields were introduced.
5. **Bulk actions:** the existing Library and Collections mutation handlers remain unchanged. Personal Order and Logging membership filters introduced in v406 are preserved.
6. **PWA and release resources:** v407 runtime, stylesheet, bundle, service worker/cache, and version metadata were generated together.

## Implementation

- `src/js/components/300-v407-bulk-picker-cleanup.js` — update shared picker markup, opt out of automatic generic icon decoration, preserve action dispatch.
- `assets/css/219-v407-bulk-picker-cleanup.css` — explicit left-aligned icon/label grid, appropriate spacing and narrow-screen row sizing.
- `scripts/test-v407-bulk-picker-cleanup.py` — targeted browser interaction, layout, icon count, custom order, search, and handler delegation tests.
- `scripts/test-v407-regression-v406-smart-filters.py` — inherited membership and v406 action-picker fixture tests.
- `scripts/test-v407-pwa-update.py` and `scripts/test-v407-pwa-contract.cjs` — simulated cache/asset lifecycle tests for v407.

## Verification scope

- v407 build and JavaScript syntax: pass.
- Isolated Chromium UI tests at **320, 390, 820, and 1280 px**, for Library and Collections controls: pass.
- Correct icon count, semantic left alignment, custom Settings order, category search and bulk-action handler delegation: pass.
- v406 membership regression and v405 synthetic 1,555-History-record transfer contract: pass.
- v407 generated app-shell asset inventory and simulated interrupted update recovery: pass.
- **Limitations:** Tests use isolated browser fixtures rather than authenticated full-application workflows. Live Supabase, real multi-device behavior, and installed Android/iOS PWA updates were not tested.

**Detailed changelog:** [docs/CHANGELOG_v407.md](docs/CHANGELOG_v407.md)

---

## Prior technical release notes

- [v405 — The Data Integrity & Experience Update](docs/CHANGELOG_v405.md)


- [v404 — The Smart Engine & Refinement Update](docs/CHANGELOG_v404.md)

- [v403 — Evidence-qualified single-source verification](docs/CHANGELOG_v403.md)
- [v402 — Comprehensive verification and data-integrity improvements](docs/CHANGELOG_v402.md)
- [v401 — Automatic all-provider verification and recommendations](docs/CHANGELOG_v401.md)
- [v400 — Independent timestamps and picker workspace](docs/CHANGELOG_v400.md)

### MediaFlow v413 — Library Overview isolated layout repair
- Fixes continued overlap by removing the shared `.overview-row` and `.card` classes from category cards entirely.
- Keeps category names, completion counts and progress bars in vertically separated sections at every screen width.
- Adds real-renderer browser regression checks; no data migration or cloud schema change.

### MediaFlow v414 — Normal Library Overview final-renderer hotfix
**Baseline:** v413 Modular · **October 14, 2026** · **Developer:** Alex Godly

Fixed the real Normal Library rendering path, which was still emitting the original `overview-row` HTML even after previous v411–v413 component changes. It now shares the same v188/v413 responsive Overview component as Dynamic Library. Tested the final bundled `renderLibrary()` output, not a hand-built card fixture, at mobile/tablet/desktop sizes. No user data, cloud schema or existing title records are modified.
