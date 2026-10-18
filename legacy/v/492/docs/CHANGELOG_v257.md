# MediaFlow v257 — Dashboard Cloud Sync, Responsive Settings Navigation, Mobile PWA & Safer Updates

MediaFlow v257 strengthens several systems introduced across v244–v256. The release synchronizes the Dashboard time utilities through the normal cloud pipeline, fixes responsive Settings navigation interaction, improves PWA installation compatibility and guidance on mobile/tablet platforms, and adds an optional Full Backup step before managed MediaFlow updates.

## Dashboard time-tool icon polish
- Runtime Calculator now uses a semantic clock icon.
- Stopwatch keeps its stopwatch icon.
- Both header icons remain static when their accordion sections collapse or expand.
- Accordion state no longer visually rotates the Stopwatch/Runtime Calculator identity icons.

## Stopwatch + Runtime Calculator cloud synchronization
- Stopwatch state participates in the current MediaFlow snapshot pipeline.
- Runtime Calculator state participates in the current MediaFlow snapshot pipeline.
- Cloud merge chooses the newer time-tool state using modification timestamps.
- Restored cloud/local state rehydrates both utilities.
- Running Stopwatch state is resumed correctly after state loading.
- Stopwatch mutations schedule persistence/cloud saving.
- Runtime Calculator edits and calculations schedule persistence/cloud saving.
- Sync Now verification now checks Stopwatch cloud state.
- Sync Now verification now checks Runtime Calculator cloud state.
- Full Backup metadata identifies the v257 Dashboard utility coverage.
- Existing Cloud Sync compatibility remains v201.

## Responsive Settings navigation repair
- Horizontal Settings navigation no longer shows a visible scrollbar.
- Mouse/pen drag browsing remains available on horizontal desktop/tablet layouts.
- Native touch panning remains available on mobile/tablet layouts.
- Dragging no longer steals ordinary section clicks.
- Settings section buttons work consistently after responsive width changes.
- Clicking a Settings section now reliably jumps to its matching section.
- The clicked/current Settings section remains highlighted.
- APP UPDATES highlighting behavior from earlier releases remains preserved.
- Responsive Settings navigation is validated at 820px, 390px, 320px and 280px without page-level horizontal overflow.

## Mobile / tablet PWA installation compatibility
- PWA manifest remains scoped to MediaFlow with `start_url: "./"`, `scope: "./"` and `display: "standalone"`.
- Added dedicated opaque install-safe MediaFlow artwork at 192×192.
- Added dedicated opaque install-safe MediaFlow artwork at 512×512.
- The existing maskable MediaFlow icon remains available for adaptive launchers.
- Apple Touch icon support remains available.
- PWA app-shell generation now includes the install-safe icon assets.
- Android-specific installation guidance is shown when the native install event is unavailable.
- iPhone/iPad guidance explains the native Share → Add to Home Screen installation path.
- PWA diagnostics no longer treats the absence of `beforeinstallprompt` as a failure on iOS/iPadOS.
- Android diagnostics distinguish a missing browser-owned native prompt from MediaFlow's core manifest/service-worker checks.
- Existing v247 fault-tolerant app-shell caching, PWA Diagnostics and Repair app cache remain preserved.
- PWA cache advances to `mediaflow-pwa-v257-shell-v1`.

## Optional Full Backup before managed updates
- Added a new persistent **Export Full Backup before update** option.
- The option is available in the managed App Updates interface.
- The same managed-update preference is reflected in the About update card.
- The setting participates in Settings persistence and Settings Presets.
- When disabled, MediaFlow's update workflow behaves as it did before v257.
- When enabled, the managed update becomes a two-step flow:
  1. Export complete Full Backup.
  2. Install/activate the detected MediaFlow update.
- The update progress display reports the backup step and install step separately.
- Pre-update backups receive a version-aware filename containing the current and target MediaFlow versions.
- Backup metadata records the source version, target version and creation timestamp.
- MediaFlow waits for the active save queue before building the pre-update backup.
- If backup generation/export fails, update installation stops and reports an error instead of silently continuing.

## Existing systems preserved
- v256 Runtime Calculator calculation workflows and Use for minutes integration.
- v256 theme-aware cover progress bars and overlay sizing.
- v255 On cover status colors.
- v254 cover overlay controls.
- v253 History page sizing and batch management.
- v252 Seasons View and season-aware logging/imports.
- v251 Covers+Titles naming/icon polish.
- v250 cloud/persistence reliability improvements.
- v249 application-update/PWA separation.
- v247 PWA diagnostics/cache repair.
- Existing update detection, automatic update installation and update progress UX.

## Data compatibility
- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4

No Library data migration is required for v257.

## Release summary
**Release:** MediaFlow v257  
**Codename:** **Dashboard Cloud Sync, Responsive Settings Navigation, Mobile PWA & Safer Updates**  
**Base:** MediaFlow v256 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly
