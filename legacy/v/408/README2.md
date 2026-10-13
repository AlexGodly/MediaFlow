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
