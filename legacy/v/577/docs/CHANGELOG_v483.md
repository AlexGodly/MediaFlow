# MediaFlow v483 Stable — Unified Recovery Workspace Category Scroll Continuity

## User-reported issue
Selecting a category checkbox inside **Unified Recovery Workspace → Recovery scope → By Category / By Category → Status** unexpectedly scrolled the category list back to the top. The earlier v457 fix restored the outer dialog, but omitted the *nested* scrollable `.mf446-category-grid`; selection actions rebuild this inner list.

## Fix
- Preserve the **inner category grid's exact scrollTop/scrollLeft**, alongside the recovery content pane, dialog, and window scroll when a category selection triggers the existing safe re-render.
- Keep the currently selected category row visible at the same relative screen position, restore its focus using `focus({preventScroll:true})`, and avoid jumping after subsequent requestAnimationFrame layout passes.
- Preserve the open/closed category selector and expanded per-category status filters, as well as any current category/provider search text and its filtered results.
- Cover **single category toggles, Select All/Clear Selection, and category-specific status toggles** without changing the original recovery eligibility calculation, saved scope preferences, or metadata/cover/combined workflows.
- Respect deliberate mode/tab changes: scroll restoration applies only when remaining in the same active recovery mode; no forced restoration after closing the workspace.
- Scope automatic CSS overflow anchoring changes to `#mf445-workspace .mf446-category-grid`, leaving Library, Logging, Category Classes, and other scrolling behavior unchanged.

## Data protection
No changes to Library, Categories, History, settings schema, XP, accounts, Supabase, cloud saving, provider API configuration, job queues, cancellation, resume, or recovery write behavior. The existing category/status selection handlers and persistence run exactly once.

## Validation
- `node scripts/test-v483-recovery-scroll.cjs`: handler compatibility, behavior isolation, no extra persistence and nested-scroll correctness contract.
- `node scripts/test-v483-browser.cjs`: real Chromium desktop/mobile simulator builds a realistic 35-category nested recovery grid, scrolls into its middle, selects a category through a panel re-render, then verifies grid and dialog scroll stay put, the selected checkbox remains checked, and the search term and screen location are preserved. All prior UI regression probes remain in the suite.
- PWA, service worker, offline cache and rollback integrity; full source snapshot in `legacy/v/483`; numeric release tag `483`, ZIP and SHA256.
