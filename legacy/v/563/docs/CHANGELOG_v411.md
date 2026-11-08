# MediaFlow by Alex Godly — v411 Stable

**October 14, 2026** · **Baseline:** v410 · **Focus:** Library Overview responsive UI

## Fixed

- **Desktop and tablet:** Category names, completion counts, percentages, and progress bars no longer overlap adjacent cards.
- **Responsive columns:** Cards resize and reflow according to available Library panel width, including sidebar layouts, zoomed windows and tablets.
- **Progress presentation:** Each category gets separate space for its icon/title, numeric progress, and full-width progress bar.
- **Long labels:** Backlog names and large numbers wrap safely without clipping.
- **Mobile:** Refined card spacing, typography, overview summary, and visibility toggle.

## Compatibility

- Works in Normal and Dynamic Library modes.
- Preserves category order, filters, visibility, progress calculations, visual estimates, and pagination.
- Keeps dynamic themes and existing colors.
- No database migrations or changes to account data, sync, or exports.

## Implementation

- Added `assets/css/223-v411-library-overview-responsive.css`.
- Refreshed `VERSION`, `version.json`, `manifest.json`, `sw.js`, `index.html`, generated JS bundle, and release notes.
- Regression-tested responsive geometry and long content at multiple viewports.
