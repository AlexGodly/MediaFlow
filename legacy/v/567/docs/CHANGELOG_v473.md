# MediaFlow v473 Stable — Simkl-style Full Poster Hover, Five-Cover Showcase

## Requested corrections (strictly Collections browser > Showcase View)
- **Five displayed covers maximum.** Collection members beyond the first five remain fully present in the Collection data and its detail page; only the visual Showcase preview is capped at five. A manually selected collection cover occupies the first slot, followed by up to four other unique titles.
- **No arrow icons, no next/previous circle buttons and no Showcase carousel controls.** All the previous v471 arrow markup and old pointer-drag controls are absent from v473 Showcase rendering.
- **Whole poster visible when hovered.** The former v472 `scale(1.075)` made poster art disappear behind the clipped outer frame. v473 animates poster width *inside* its container while its uncut, fully visible cover uses `object-fit: contain`. This ensures the hover image is shown entirely, from top to bottom and side to side, even at the edges.
- **Simkl-like "opening cover" motion.** The hovered cover grows with a smooth easing curve and rises slightly; adjacent covers make space and dim subtly, while individual image shadows, beveled edges, the theme-colored card outline and dark shadow remain.
- Resting covers use cropped edge-to-edge collages, cross-fading into their full poster when hovered. No abrupt object-fit jump. Custom covers and missing art have safe fallbacks.
- On mobile/touch, no sticky desktop hover; tap/press gives transient feedback while normal collection opening works. Reduced-motion disables transitions.
- **Other display modes unchanged**, including Compact, List, Cards, Covers and the Collection detail modes. No cloud data, settings, XP, History or import/export logic modified.

## Verification
- `node scripts/test-v473-showcase.cjs`: 0 to 70 collection titles, five-cover ceiling, missing/custom covers, no arrows, full hover image layer and untouched data.
- `node scripts/test-v473-browser.cjs`: Chromium desktop/mobile regression suite v462–v469 and actual computed hover image-fit, opacity crossfade, expanded width, no page overflow or clipping.
- `node scripts/test-v473-pwa-contract.cjs`: offline cache update, interrupted update fallback.
- `scripts/build.py` regenerates JS, service worker cache, manifest and version metadata. Quality gate archives `legacy/v/473`; GitHub Pages deploy and release `473` publish full ZIP + SHA256.
