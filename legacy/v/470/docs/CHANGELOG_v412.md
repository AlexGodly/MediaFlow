# MediaFlow by Alex Godly — v412 Hotfix

**Release date:** October 14, 2026
**Baseline:** v411 Stable
**Focus:** Library Overview UI correction in the real app

## Root-cause fix

The Library Overview patch in v411 was scoped to `#view-root`. The actual application mounts under `#app`, so its responsive CSS never matched the production Overview. The old flex/three-column layouts remained active on desktop and tablet, causing category names, counts, and progress bars to paint over neighboring cards.

v412 fixes the selector mismatch, uses self-contained category cards, and keeps the title, numeric progress, and bar in separate vertical rows. Long labels and large counts wrap without clipping. The responsive grid follows available Library panel width: single-column phones, multiple columns on larger screens, and safe behavior under zoom or narrow panels.

## Reliability and compatibility

- Works in both Normal and Dynamic Library modes.
- Preserves settings, category ordering, visibility toggles, pagination, colors, icons, progress calculations, and approximate totals.
- Adds precise category title and icon spans to the renderer for predictable wrapping.
- Validates the actual `#app` container and production CSS cascade rather than a test-only `#view-root` fixture.
- Chromium checks cover 11 viewport widths in both modes, constrained containers and zoom.
- Regression negative control verifies that the former v411 CSS still reproduces the original bug without the fix.
- No Supabase, account, database, or user data migrations.

## Updated assets

- `assets/css/224-v412-library-overview-live-layout.css`
- `src/js/legacy/120-v188.js`
- `scripts/test-v412-library-overview-real-root.py`
- Version metadata, rebuilt JS bundle, PWA service worker and documentation.

**v412 Hotfix** — correct implementation and production-focused verification of Library Overview.
