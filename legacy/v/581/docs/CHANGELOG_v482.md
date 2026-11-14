# MediaFlow v482 Stable — Readable Category Library Class Assignments

## Fix: Crushed class assignment labels
The v481 Category Library sidebar used 90px native selects which inherited MediaFlow's generic selector chrome, showing a grid icon plus only **A** for Anime or **U** for Unassigned. On compact widths the assignment area collapsed and the menu became unreadable.

## Improvements
- Replaces the old cramped native select with a **dedicated, full-width Class assignment control** displaying **Anime**, **Unassigned**, or the complete name of the assigned Class whenever possible. Long custom names truncate gracefully only if the button truly has no more room; hovering reveals the complete value.
- Remove extraneous generic selector icon entirely; clear label and a single dropdown chevron remain.
- Responsive Category Library rows use true CSS grid: drag handle, category artwork, category name, and the Class control. At wide sidebar widths the Class button stays on the same row; when narrow it moves to a clean second line rather than shrinking.
- A custom **viewport-positioned assignment list** (outside the scrolling sidebar) prevents Class options from being clipped by the sidebar's scroll container. Class names are shown in full and may wrap. Menus intelligently open above or below the assignment control.
- Preserves all existing actions: drag category into Class, drop to unassign, searchable sidebar, dropdown selection, native v481 assignments, disabled category handling and the one-primary-class-per-category rule.
- Keyboard/pointer accessible menu: focus, Up/Down/Home/End option navigation, Enter/Space selection, Escape closing, click-outside, and automatic closing on scroll/resize.
- Keeps the Category Classes editor, Class → Category → Title scheduler, Supabase settings persistence, historical balancing, and all existing account data untouched.

## Test and deployment
- `scripts/test-v482-category-sidebar-assignment.cjs`: verifies complete assigned/unassigned text, safe markup, no generic select, preserved drag/search code, responsive CSS and unchanged data flows.
- `scripts/test-v482-category-class-ui-regression.cjs` and `scripts/test-v482-scheduler-regression.cjs`: all previous Category Classes functionality.
- `scripts/test-v482-browser.cjs`: Chromium desktop/mobile regression plus width stress at 204, 252, 332 and 470px, verifying Anime/Unassigned/long Class labels fit their buttons without horizontal overflow.
- `scripts/test-v482-pwa-contract.cjs`: PWA offline cache and interrupted-update rollback contract.
- Full source archive in `legacy/v/482`, numeric release tag `482`, `v482 Stable`, ZIP and SHA256 after successful Pages deployment.
