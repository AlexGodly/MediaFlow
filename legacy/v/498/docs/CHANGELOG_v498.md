# MediaFlow v498 Beta — Logging Library Readability & Category Cover Parity

v498 focuses on the two requested Logging corrections and the next controlled ambient-motion milestone. All changes are presentation-only: **Library covers, Logging drafts, History, progress, XP and cloud data remain unchanged.**

## Logging Library — readable selected titles

- Fix very low contrast after selecting titles in Logging → Library.
- The selected row now uses the active theme's panel-raised surface, accent outline, readable title text, high-contrast metadata and visible Add/Added actions rather than dark text on a dark selected background.
- The correction covers **List, Compact, Cards, Covers and Covers + Titles** because those use the same `.mf379-picker .log-suggestion` checked/picked state.
- Checkbox selections, bulk Add Selected, filtering, search, pagination, active titles and in-place selection stay intact. The layout remains responsive on desktop, tablet and narrow mobile.

## Logging — category icon when artwork is missing, in ALL modes

- **Advanced Logging**: replaces the old category icon + "Missing cover" caption with an icon-only category poster.
- **Quick Logging** (amount and progress): replaces the old title-first-letter placeholder with the same category poster.
- **Logging Library picker**: applies the same cover treatment in all five display modes, without changing the picker UI, selection or Add actions.
- **Recommended Title card in Logging**: gets the same real-cover / category-icon behavior.
- Valid saved title artwork is shown normally; blocked or failed image URLs fall back to the category icon with no caption.
- A title without its own cover always uses its **category icon** in Logging, even if a category-default cover is temporarily exposed by the v200 display-only fallback. This does not change the user's Library-wide missing-cover settings.
- **Both genuine covers and category-icon placeholders are clickable** and open the exact saved title's **Title Details**, including titles with apostrophes or unusual IDs. A cover click never adds/removes the title or logs anything.
- Clear accessible focus and descriptive labels are provided for keyboard users. Missing-cover placeholders have no visual "Missing cover" caption.
- No data writes, recovery jobs, duplicate cover URL storage, new network provider, cover polling, migration or additional image-analysis calls.

## Ambient Motion & Interactive Surface Refinement

- Add lightweight, opt-in micro-interactions to Living Themes Advanced/Custom surfaces. Hover/focus transitions use the existing protected palette and motion preferences.
- Keep visual polish subtle and reversible: no layout changes, continuous animation loops, or library-cover-driven movement in Custom manual themes.
- Legacy, Basic/Off Living Themes, touch-first devices, mobile performance preferences and reduced-motion users remain protected.

## Quality gate and version history

- New deterministic `scripts/test-v498-logging-visual-parity.cjs` covers all cover modes, simulated missing artwork, failed image fallback, exact title-ID click behavior, no draft mutation and responsive selected-row CSS.
- Keep v497 recovery/visual and v496–v483 artwork/ownership/recovery regressions.
- Build modular `assets/js/mediaflow-v498.bundle.js`, update PWA service worker and cache, run `scripts/check.py`, archive the entire project at `legacy/v/498`.
- Merge the validated feature PR to `main`, deploy GitHub Pages, publish the numeric GitHub Release **498** containing the full ZIP and SHA-256 checksum.

## Next milestone

**v499 — Logging Interaction and Fallback Audit**: verify interactive cover and selected-state usability in all responsive Logging layouts against real browser rendering, while continuing measured Living Themes refinements.
