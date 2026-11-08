# MediaFlow v256 — Theme-Aware Cover Progress, Overlay Sizing & Runtime Calculator

MediaFlow v256 expands the cover-overlay system and adds two collapsible Dashboard time tools.

## Library cover overlays
- Cover progress bars in **Covers** and **Covers+Titles** now derive their track, fill, glow and contrast from the active MediaFlow theme (`--flow`, theme accent, panel/text variables) instead of the title category color.
- Added an independent **Size** adjuster for each On cover element:
  - Status
  - Category
  - Rating
  - Progress
- Size preferences are shared by Normal and Dynamic Library and persist through the existing Settings/cloud/Settings Preset/Full Backup paths.
- Existing visibility toggles and v255 Completed/Plan to Watch status colors are preserved.

## Stopwatch accordion
- Stopwatch is now a collapsible Dashboard section.
- Clicking the section header or its top-right chevron expands/collapses the body.
- Stopwatch timing state and existing **Use for minutes** behavior are unchanged.

## Runtime Calculator
- Added a new Dashboard section directly below Stopwatch.
- Added a Dashboard Settings visibility toggle directly below the Stopwatch toggle.
- Runtime Calculator itself is collapsible with the same header/chevron behavior.
- **Carry-forward mode:** Runtime 1 + Runtime 2 = Result.
- **Continue with result** moves Result into Runtime 1, clears Runtime 2 and continues accumulating additional runtimes.
- The calculated-count indicator tracks unique runtimes in the chain (2 after the first two runtimes, 3 after carrying the result and adding one more, etc.).
- **Previous total** restores the accumulator that was Runtime 1 in the latest calculation (Time 1 after the first calculation, the prior combined Time 3 after the next iteration, and so on).
- **Multi-row mode:** add/remove as many runtime rows as needed and calculate their sum in one operation.
- Result is displayed as Hours / Minutes / Seconds and as a full HH:MM:SS value.
- While Dashboard logging is open, **Use for minutes** copies the calculated result into the log's minutes field, matching Stopwatch integration.

## Persistence / compatibility
- Runtime Calculator Dashboard visibility is stored in the existing Dashboard settings container.
- Cover overlay size settings use the existing v254 overlay settings container.
- Calculator arithmetic rows/results are intentionally current-session UI state, like an unfinished logging draft.
- Cloud Sync remains v201.
- Full Backup remains Schema v29.
- Settings Preset remains Schema v1.
- Personal Order Export remains v4.
- PWA shell advances to `mediaflow-pwa-v256-shell-v1`.
