# MediaFlow v432 Beta — Root-cause Account Avatar Icon Fix

## Fixed
- Removed the persistent generic circled-chevron next to the profile image in desktop top/bottom navigation.
- Identified the actual source: the global v225 icon enhancer decorated the **Account avatar button** after its SVG was replaced by an image. v431 had protected the neighboring Level/Streak button instead.
- Prevented both v225 and v226 icon enhancers from ever decorating `.mf421-dock-account` (including first paint, refresh, rerender and navigation position changes).
- Strengthened the avatar renderer to remove stale injected icon wrappers without removing the selected image or the no-image profile fallback.
- Included the Account button in the targeted mutation cleanup and added a final theme-neutral CSS safety rule.
- Added direct code-path and real Chromium regression tests for the Account avatar, including re-enhancing and switching top/bottom navigation.
- Retained the v431 Missing Covers verified-URL auto-save functionality, dynamic styles, user account state, Library and existing recovery settings.

## Validation
All v432 Actions tests must pass before merging: compiled app, source contracts, v431 auto-save regression, v430/v424/v425/v427 recovery suites, synthetic 100k checks and Chromium desktop/mobile account-avatar diagnostics.
