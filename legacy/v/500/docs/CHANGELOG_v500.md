# MediaFlow v500 Beta — Logging Cover Visibility & Clean Artwork Controls

v500 is a milestone-sized stabilization update for the Logging workspace. It includes the user's 2026-10-18 screenshot request: added titles' actual or missing covers have become **far too small**, and a generic **circled arrow action icon** has appeared beside/on covers in Advanced Logging and the Use Recommended Title card.

## Larger artwork without stretch

- Reserve a dedicated, explicitly sized column for the Advanced Logging poster. v499's `min(100%,74px)` was bounded by a collapsing `auto` grid track, so a cover button containing positioned artwork could shrink to just a few pixels despite retaining a nominal 2:3 ratio.
- Desktop Advanced Logging now reserves roughly **128px** default poster width (respecting a larger cover-size setting, capped to keep the card usable), with smaller but still legible tablet and mobile variants.
- Quick Logging gets a genuine, wider poster track (roughly **88px** on desktop; responsive on mobile), preserving ordering, controls and the full progress editor.
- Logging's **Use Recommended Title** card uses its own independent cover-size scaling preference, now with a readable **~100px default** and no flex collapse.
- All posters retain their aspect ratio, display the full original image with `object-fit: contain`, remain clickable to open **Title Details** and never affect title selections.
- When no valid cover exists, the category icon fills a meaningful portion of the poster. No “Missing Cover” caption or placeholder initials are introduced.
- Media queries keep grids, title labels, buttons, progress previews and reordering controls usable on narrow phones, tablets and desktops.

## Remove erroneous circular-arrow icon

- Exempt `button.mf498-logging-cover` from MediaFlow's global v225 button-icon enhancement and icon-name matching. This removes the unwanted circled arrow in Advanced Logging, Quick Logging, recommendation artwork and the Logging Library picker.
- Add explicit `data-v225-iconified` before DOM insertion, so MutationObserver enhancement cannot cause a flash of the arrow.
- Strip any previously inserted direct `.v225-btn-icon` children from existing Logging cover markup, without touching the category icon, cover photo, actual buttons or their click behavior.
- Retain keyboard focus outlines and accessible “Open title details” names. Unrelated v225 action icons remain unchanged.
- The additional CSS suppression is a scoped fallback; the source-level exemption remains authoritative.

## Checks and release

- `scripts/test-v500-poster-icons.cjs`: verifies covers are immune to the generic button icon system but unrelated action buttons are unaffected, no injected arrow, category artwork and click behavior preserved.
- `scripts/test-v500-poster-browser.cjs`: runs browser-measured geometry with a near-empty cover button and tall Advanced Logging progress-preview area; checks added and recommended covers at **340px, 600px and 1000px**, including minimum usable poster widths, 2:3/3:4 frame ratio, non-cropped artwork and overflow.
- Carries forward the entire v499 Logging/visual/recovery test suite with version-aware assertions.
- Builds PWA v500, runs repository integrity and service worker checks, archives the full project under `legacy/v/500`, merges the verified PR, deploys GitHub Pages and creates numeric Release `500` with complete modular ZIP and SHA-256 checksum.

## Next version

v501 — Further logging usability, consistent cover-size adjustment options and visual-system refinement, while preserving Legacy, Advanced and Custom themes.
