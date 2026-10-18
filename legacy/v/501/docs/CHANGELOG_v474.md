# MediaFlow v474 — Showcase Hover Respects Each Cover's Natural Size

## Scope
Only **Collections → Showcase View** hover behavior changes. The maximum remains **five covers**, and there are **no carousel/circle-arrow icons**. Other collection display modes, Library, cloud, settings, XP, History, exports, PWA update settings and collection data remain untouched.

## Fix
The v473 fixed `flex-grow: 2.3` gave every hovered picture a similar-width slot, regardless of artwork shape. A tall portrait was displayed inside a too-wide rectangle, leaving gray side bars; wide landscape covers could be compressed. v474 replaces that fixed expansion with the cover's **actual intrinsic width-to-height ratio**.

- Use the existing image's browser-reported `naturalWidth/naturalHeight` and the live Showcase frame height to compute a **per-title hover width**. Portrait, square, landscape and tall covers animate to distinct widths.
- As the selected poster widens or narrows, the other four covers automatically redistribute remaining room. Keep slight layered shadows and the Simkl-inspired easing.
- Remove artificial background sidebars from the fully displayed image; retain the cropped cover as a softly blurred backing only if an exceptionally wide picture must be capped to fit a very narrow screen.
- Do not move/scale the selected cover beyond the frame. Keep `object-fit: contain` for full-image visibility.
- Recompute poster target widths when images finish loading, on hover, and when Showcase frames resize. Slow images, missing art and category fallbacks use a 2:3 default without breaking layout.
- For touch devices, keep the normal tap behavior and prevent stuck desktop hover; accessibility/reduced-motion rules remain. No more than five artwork slices displayed.

## Verification
- Read-only unit test for portrait, square, landscape, tall and narrow-container target widths, placeholder fallback, preserved v473 five-cover limit and all non-Showcase views.
- Real Chromium desktop and responsive mobile checks: natural image sizes, dynamically computed target width, complete portrait/landscape art, animated width on hover, no blank-color side bars, no overflow or clipping and no arrow UI.
- Build/PWA tests and interrupted cache-update rollback, complete archive under `legacy/v/474`, deploy Pages and numeric stable `474` release with ZIP and SHA256.
