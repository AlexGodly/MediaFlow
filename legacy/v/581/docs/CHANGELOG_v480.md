# MediaFlow v480 Stable — Category Classes & Hierarchical Recommendation Intelligence

## Overview
Adds an **optional, default-off** Category Classes feature for MediaFlow Recommends. Users can group Seasonal Anime and Finished Anime into an Anime class, group TV Shows into Television, then balance class activity *and* category activity independently. The existing scheduler still chooses the category within the selected class, then the established title picker selects the title. **When disabled, the existing `weightedPick` runs unchanged.**

## Features
- Settings Center → **Dashboard → Recommendations → Category Classes & Hierarchical Recommendations**. Manage classes, toggle the system, change class balance strength (Gentle/Balanced/Strong), repetition penalty, neglect bonus, seasonal influence, and optional session-amount adjustments.
- Create, edit and delete custom classes with name, weight (1–5), active grouping toggle, one or more categories, icon, and color. Multiple classes supported; no hard limit imposed in the UI (defensive normalization caps to 200 classes).
- Class editor **reuses the actual existing Category icon/color picker** (`categoryModalHtml` as enhanced by v144/v258), including packaged MediaFlow icons, standard emojis, saved custom emojis, http(s) icon URLs, and saved custom colors. The same URL sanitizer and fallbacks apply.
- Each category can belong to **one primary class at a time**. Moving it to another class removes the previous assignment without changing the underlying category or its titles.
- Disabled categories remain excluded by the existing scheduler even if assigned to a class. Empty classes cannot win selection. A class with grouping switched off does not compete as a group: its categories remain individually eligible if their own categories are enabled.
- Categories without a class remain eligible as independent choices, retaining their existing scores and priorities.
- Class activity is derived read-only from actual scheduler consumption sessions (3/7/30-day and lifetime duration windows, excluding skipped sessions). A single logged session counts for its category and its class, not double against the overall consumption total. Disabled category's older sessions can still contribute to its parent class historical activity.
- Class scoring respects class weights, consumption shares, neglect, repetitions, consecutive sessions, seasonal influence, bounded penalties, and configured balancing strength. It uses the scheduler's original weighted random selection to pick **a class**, then again to pick **a category within it**; original `generateTask`, title selector, Personal Order override, freshness rules and title eligibility are kept.
- Class preferences, assignments, icons, weights and enabled state persist in canonical `S.settings.v480CategoryClasses` via `persistSettings()`, and are carried by full account backups and Settings presets. Disabling the feature preserves all classes for later.
- **No migration** and no writes to titles, category records, History, XP, progress, Collections, Personal Order or Fresh Episodes evidence. Existing external account provider logic is unchanged.

## Important behavior
- Grouping is *weighted*, not forced; heavily consumed Anime may still be recommended later, but Finished Anime can be prioritized by the native category-level scorer if Seasonal Anime was heavily consumed.
- Switching Category Classes **off** calls the original recommendation picker exactly as before; there is no hidden balancing of classes.
- The separate **Adjust session amounts by class** control starts **off**, ensuring current logging targets remain unchanged unless explicitly enabled.
- Runtime statistics show class consumption in the last 7 and 30 days; no historical records are rewritten.
- Full controls use the existing theme variables and responsive styling, including narrow mobile.

## Quality gates
- `node scripts/test-v480-category-classes.cjs` exercises disabled-by-default, legacy fallback, group selection, disabled category exclusion, past consumption accounting, class persistence and shared palette.
- `node scripts/test-v480-browser.cjs` checks the actual class modal, packaged artwork palette, emoji, URLs, colors, mobile overflow plus all earlier Chromium regressions.
- PWA build, service worker/version coherence, offline caching and interrupted update fallback; full archive in `legacy/v/480`.
- PR merge, Pages deployment and numeric `480` Stable release with full ZIP and SHA256.
