# MediaFlow v499 Beta — Logging Cover Geometry & Interaction Audit

v499 builds on v498's source-aware Logging category-icon placeholders, readability and clickable Title Details posters. This update includes the requested fix for **stretched covers of already-added Logging titles** (reference screenshot dated 2026-10-18).

## Fixed: added titles' actual covers

- **Advanced Logging / Per Unit / Last Watched Unit / Amount Consumed:** stops the cover element from stretching vertically to the height of the status, progress-preview and control rows. Posters always maintain a **2:3 aspect-ratio frame** instead of tall/narrow strips.
- Preserves the existing `v370Itemized` cover-size setting. The image stays in its own sizing context, is aligned at the top of the title, and is no longer sized by a multi-row grid span.
- **Quick Logging / amount and progress variants:** likewise preserves a stable ratio in the row grid when title information or action controls wrap.
- **All Logging Library display modes and Logging recommendation cover:** real artwork is contained inside its poster frame without stretching or undesirable cropping; category-icon placeholders and missing URL fallback remain visually clean.
- **Narrow mobile/tablet:** constrain cover dimensions to the available grid column without turning the poster into a giant strip or causing horizontal overflow. Desktop has matching proportions.
- Clicking a valid cover or category-icon fallback still opens **that title's details**, not Add/Remove; keyboard focus and existing controls are preserved.
- No changes to Library cover URLs, category missing-cover preferences, drafts, progress, History, XP, Supabase or provider pipelines.

## Logging selection and interactions

- Adds a lightweight v499 picker audit that synchronizes presentation-only `data-mf499-selected` attributes after existing in-place Select / Select Visible / Deselect All operations.
- Improves selected-title contrast for active theme palettes without resetting Logging filters, text focus, scroll positions, pagination or selection state.
- Existing v379 checkbox state and Add/Remove mechanisms remain the authority. No duplicate event handlers for cover clicks.

## Living Themes motion correction

- Corrects v498's mis-scoped CSS selectors: `data-mf484-mode`, `data-mf484-living` and `data-mf497-motion` all live on the HTML root.
- Polishes opt-in, lightweight hover/focus surfaces in **Advanced** and **Custom** with Living Themes **Advanced** and motion enabled.
- Keeps **Legacy**, Basic/Off, optimized rendering and reduced-motion configurations out of the additional surface animations.

## Tests & release

- New `scripts/test-v499-cover-browser.cjs` + static `tests/fixtures/v499-logging-cover-geometry.html`: runs a zero-dependency Chromium/Chrome layout audit when a supported browser is installed at **340px, 600px and 1000px** widths. Checks actual poster width:height (2:3), tall progress preview independence, Quick card sizing, full artwork object-fit and horizontal overflow.
- New `scripts/test-v499-logging-interactions.cjs`: validates v499 selection mirroring after in-place checkbox and bulk-selection updates, retaining cover semantics.
- Retains v498 Logging cover click/category-icon, v497 recovery, and all existing visual, ownership and recovery regressions from prior versions.
- Full modular build, PWA cache/version integrity, `scripts/check.py`, and a complete `legacy/v/499` archive.
- After passing CI, merge to `main`, deploy GitHub Pages, and publish numeric GitHub Release tag `499`, titled **v499 Beta**, including full ZIP and SHA-256 checksum.

## Future

v500 can deepen responsive visual QA and cover composition while preserving Library performance and all three theme-generation modes.
