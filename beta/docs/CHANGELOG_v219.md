# MediaFlow v219 — Runtime Foundation + Active Organized Settings

## Architecture reliability
- Added a dedicated runtime-extension build slot inside the live MediaFlow application scope.
- Added `src/js/runtime-order.json`; future release modules listed there are injected before the application closure.
- Split the legacy closing fragment so the build has an explicit `999-close-app.js`.
- Added `window.MediaFlowRuntime` with an active page renderer/enhancer registry.
- Settings is the first page to use the active registry instead of a post-closure renderer override.
- Removed the broken v218 Settings organizer from the active build while preserving it in docs/history for audit.

## Settings page
- Activated the organized Settings UI that v218 intended but could not execute.
- Added a visible Settings search bar.
- Added grouped Settings navigation: Library, Interface, Appearance, MediaFlow System, Progression, Statistics, Data & Sync, and Other.
- Added quick jumps to individual Settings sections.
- Added per-setting Reset controls where MediaFlow has a canonical default.
- Expanded reset discovery to supported inputs, selects and setting buttons.
- Added Reset section controls for supported major groups.
- Rebuilt Restore all defaults from the current runtime `DEFAULT_SETTINGS`.
- Restore all defaults also resets navigation layout and legacy MAL-link preference while preserving Library, History, XP, categories and other content data.

## Verification
- Build script now fails if the runtime-extension slot is missing.
- Static checks verify the active Settings renderer is registered before the application closure.
- Added a Chromium UI smoke test that verifies the search field, Settings navigation, reset controls, runtime version and actual search filtering.
- Service-worker cache updated to v219 to prevent stale v218 assets.

## Compatibility
- Stable feature/data base: v201.
- Cloud Sync: v201.
- Full Backup schema: v29.
- Settings Preset schema: v1.
