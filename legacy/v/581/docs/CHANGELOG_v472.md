# MediaFlow v472 Stable — Simkl-style Collections Showcase Cover Hover & Shadows

## Scope
Only **Collections > Showcase View** artwork and hover presentation change. All other Collection browser modes, opened Collection modes, and data workflows remain unchanged.

## Design improvements
- Added a distinct, realistic **soft drop shadow to each individual cover slice** with gentle dark bevels between adjacent covers, based on the supplied Simkl list examples.
- The poster under the mouse **rises by 3px and enlarges to 107.5%** above neighboring artwork, with a deeper cast shadow, subtle highlight and brighter artwork. The neighboring posters dim slightly to focus attention on the active one.
- The enclosing artwork frame has a layered shadow at rest and a stronger themed shadow when hovered. The collection card receives a themed accent outline and lift, echoing Simkl's highlighted card while keeping MediaFlow's dynamic accent color.
- The artwork strip now reserves small hidden-scrollbar insets so enlarged posters and their shadows do not disappear at its edges. Covers overlap by 2px to create a stacked, seamless collage instead of looking like a flat grid.
- **All covers remain present** and horizontally scrollable, with no four-cover limit. All v471 custom-cover fallback, swipe, keyboard, theme and progressive PWA behavior remains.
- Reduced-motion preferences disable animation. Touch devices retain swipe and light tap feedback without persistent hover or blocking scroll.
- No popup, additional modals, data writes, or per-poster focus trap introduced.

## Verification and release
- v472 source contracts exercise existing v471 zero-to-150-cover renderer, order/collage preservation, unchanged other view modes, read-only account state and Showcase-scoped hover/shadow CSS.
- v472 Chromium live computed-style checks validate poster shadows, inset gutters, and actual mouse-hover scale/z-index, neighbor shading and card shadows; full historic mobile/desktop regressions and 320/360/390/720px stress tests also run.
- Build synchronizes `index.html`, `version.json`, `manifest.json` and `sw.js` for PWA v472; offline cache rollback simulation included.
- Full verified source archive `legacy/v/472`, Stable numeric tag `472`, source ZIP and SHA256 following successful deployment.

## Data safety
This is strictly a visual update. Cloud sync, XP, automatic/full backups, Settings, History, Personal Order, Collections import/export and non-Showcase display modes are unchanged.
