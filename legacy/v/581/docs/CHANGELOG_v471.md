# MediaFlow v471 Stable — Unlimited Responsive Collections Showcase

## Scope
**Only the Showcase mode of the main Collections browser changes.** Compact, List, Cards, Covers, the opened collection's Library-style display modes, dashboard, cloud, XP, History and Personal Order are not changed.

## New Showcase presentation
- Replace the hardcoded v276 four-cover preview with **every available Collection title cover** in its saved order. No `slice(0,4)` and no arbitrary title-count limit.
- Edge-to-edge poster collage like the supplied screenshot references: adjacent vertical slices, zero internal gaps/borders and centered `object-fit:cover` crops. The rounded border belongs only to the outside frame.
- Adapt to desktop and tablet in wide, side-by-side collection rows; phones use the **full collection card width above its information and actions** instead of squeezing the collage to an 85px column.
- The strip fills its frame when there are only a few titles. When there are many, posters retain a readable minimum width and remain **horizontally scrollable** rather than disappearing or becoming single-pixel slivers.
- Swipe horizontally on touch devices, use Left/Right arrow keys with the focused strip, or use accessible arrow controls on desktop (only when there is actual overflow). Mouse-drag also scrolls.
- A custom Collection cover is shown as the first featured poster *alongside* the member covers rather than hiding the whole collage; a duplicate of the identical URL is skipped.
- Missing/broken art renders a MediaFlow category icon fallback; empty collections show the existing placeholder-like state.
- Respect current theme colors, borders, responsive layout and reduced-motion settings.

## Safety and compatibility
- Uses only existing Library/Collection data and the existing read-only helpers.
- No database schema change, new settings, cloud writes, XP recalculation, history mutation, reordering or changes to export/import schemas.
- Keep existing collection metadata, progress, title count, creation/update dates, Open and Edit buttons and collection keyboard opening.
- v470 PWA, cloud and transfer enhancements remain in place.

## Tests and release
- v471 deterministic contracts: 0, 1, 2, 3, 4, 5, 6, 8, 12, 100 and 150 posters; no truncation, missing covers, custom/duplicate cover handling, escaping, untouched other display modes, no writes.
- v471 Chromium browser regression: prior v462–v469 controls plus Showcase collage edge-to-edge/scroll/full width/no overflow on desktop and mobile; stress at 320, 360, 390 and 720px.
- Build via `scripts/build.py` for v471 JS, service worker, cache namespace, `version.json`, and manifest. Complete source archived under `legacy/v/471`.
- Merge, deploy Pages and publish numeric Stable release `471` with ZIP and SHA256 checksum.
