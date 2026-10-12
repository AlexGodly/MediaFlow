# MediaFlow v248 — Settings Navigation & Managed App Updates

MediaFlow v248 focuses on polishing the Settings navigation experience and turning MediaFlow's existing update detection into a clear, state-aware update installation workflow.

## Settings Navigation Responsiveness

The Settings layout now adapts earlier on narrow desktop and wide-tablet widths instead of keeping a rigid sidebar until the mobile breakpoint.

On full desktop widths, the Settings rail scales with the available viewport. On narrower desktop layouts, the navigation becomes a horizontal strip so the Settings content keeps enough usable width.

## Drag-to-Scroll Horizontal Settings Menu

When the Settings navigator is horizontal, it can now be scrolled by dragging with a mouse or pen, in addition to normal touch scrolling on mobile/tablet devices.

Vertical mouse-wheel movement over the horizontal navigator is also translated into horizontal scrolling where appropriate.

The drag system suppresses accidental section activation after an actual drag gesture.

## APP UPDATES Highlight Fix

The active Settings-section calculation has been corrected for the final **APP UPDATES** section.

Previously, when the page reached its maximum scroll position, the preceding Settings section could remain highlighted because the APP UPDATES heading could not reach the old activation anchor.

v248 recognizes the final visible section at the bottom of the Settings page and correctly highlights:

> **APP UPDATES**

## Shared Dynamic Update State

About, Settings → App Updates, and Install MediaFlow now use a shared live update state rather than static action icons.

The visual state can represent:

- checking for updates
- newer version available
- ready to install
- installing
- already up to date
- installation success
- installation failure

## Dynamic Check Now Icon

The **Check now** action on the About page changes its icon/status according to the current update state.

The same state is reflected by Automatic Update Checking in Settings and by the Install MediaFlow card.

## Managed Install Update Action

When MediaFlow detects a newer hosted release or a waiting PWA service worker, a new:

> **Install update**

button becomes available.

The action requests the latest service-worker state, activates a waiting worker when appropriate, waits for the new worker to control the page, and reloads into the newest deployed MediaFlow version.

Hosted builds also have a cache-busted reload fallback when the browser does not expose a usable worker lifecycle transition.

A local `file://` build cannot replace its own files; MediaFlow reports this explicitly instead of pretending the update succeeded.

## Update Installation Progress

The update installer now exposes staged progress while MediaFlow checks, prepares, activates, and reloads the newer release.

The interface includes:

- progress bar
- percentage/progress state
- current installation phase
- success message
- failure message

## Post-Reload Success Feedback

MediaFlow stores the pending update result before reloading and restores an appropriate completion state after the newest version opens.

This allows the interface to confirm that the update reached the expected release after reload.

## Automatic Update Installation

Settings → App Updates now includes a persistent:

> **Automatically install MediaFlow updates**

option.

When enabled, MediaFlow can automatically begin the managed update installation flow after update detection indicates that a newer release is ready.

The preference participates in MediaFlow's existing Settings persistence/preset/backup paths without changing their schema versions.

## MediaFlow-Branded Update-Ready Block

The update actions now include a MediaFlow-branded status area using the official application icon.

When an update is available/ready, the block displays:

> **Install MediaFlow**  
> **Ready to install**

using the green ready-state treatment, followed by the relevant **Install update** and **Reload app** actions.

## Install MediaFlow State Polish

The Install MediaFlow PWA section keeps the official MediaFlow icon and now adds a dynamic update/status badge to it.

Its title/status can react to the current install/update state rather than remaining visually static.

The native **Install app** action remains separate from the managed **Install update** action.

## Reload App Preserved as a Separate Action

**Reload app** remains available independently from **Install update**.

This means users can simply refresh the current application without implying that an update was installed.

The existing legacy PWA reload element/API compatibility is retained so previous MediaFlow regression behavior continues to work.

## v247 PWA Reliability Preserved

The v247 reliability layer remains active, including:

- fault-tolerant per-asset app-shell caching
- `GET_DIAGNOSTICS`
- `RETRY_APP_SHELL_CACHE`
- Run PWA Test
- Repair app cache
- exact failed-asset reporting
- service-worker/cache diagnostics

## Responsive Behavior Preserved

All v246 responsive requirements remain active across:

- desktop
- narrow desktop
- tablet
- standard mobile
- very tight mobile widths
- installed standalone PWA mode

The new v248 update controls and progress UI are responsive as well.

## PWA Release Cache

The generated v248 application-shell cache is:

> **mediaflow-pwa-v248-shell-v1**

Automatic VERSION detection and PWA asset discovery remain active through the existing build pipeline.

## Persistence Compatibility

v248 does not change the existing data-schema versions.

Compatibility remains:

> **Cloud Sync:** v201  
> **Full Backup Schema:** v29  
> **Settings Preset Schema:** v1  
> **Personal Order Export:** v4

## Regression Validation

A dedicated:

> `scripts/smoke-v248.py`

checks the new Settings/update behavior, including:

- v248 runtime API exposure
- dynamic update state
- About update actions
- Settings update actions
- Install MediaFlow update actions
- APP UPDATES active navigation
- horizontal Settings navigation behavior
- local-build failure feedback
- post-reload success feedback
- absence of runtime page errors

The v246 mobile/tablet PWA and v247 diagnostics regression suites also continue to pass against the v248 build.

# v248 Release Summary

**Release:** MediaFlow v248  
**Codename:** **Settings Navigation & Managed App Updates**  
**Base:** MediaFlow v247 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Fixed Settings desktop responsiveness.
- Added horizontal Settings navigation for narrow desktop/wide tablet layouts.
- Added mouse/pen drag-scrolling to horizontal Settings navigation.
- Added wheel-to-horizontal scrolling support.
- Fixed APP UPDATES active-section highlighting.
- Added shared dynamic update-state icons.
- Added dynamic About **Check now** state.
- Added dynamic Automatic Update Checking state.
- Added dynamic Install MediaFlow update state.
- Added **Install update** when a newer release is available.
- Added staged update progress.
- Added update success/failure feedback.
- Added service-worker activation/update handling.
- Added hosted latest-release reload fallback.
- Added post-reload update confirmation.
- Added persistent **Automatically install MediaFlow updates** toggle.
- Added MediaFlow-branded **Install MediaFlow / Ready to install** update block.
- Added green ready-to-install styling.
- Kept **Reload app** separate from **Install update**.
- Preserved legacy PWA reload compatibility.
- Preserved v247 PWA diagnostics/cache repair.
- Preserved v246 mobile/tablet/tight-width responsiveness.
- Advanced PWA cache to **mediaflow-pwa-v248-shell-v1**.
- Added `scripts/smoke-v248.py`.
- Preserved Cloud Sync v201.
- Preserved Full Backup Schema v29.
- Preserved Settings Preset Schema v1.
- Preserved Personal Order Export v4.
- Updated MediaFlow version to **248**.

## Version Progression

**v244** → Progressive Web App support & GitHub Pages installability  
**v245** → Unified branding, official favicon & PWA icon refresh  
**v246** → Responsive PWA experience, mobile optimization & PWA controls repair  
**v247** → PWA install reliability, diagnostics & cache repair  
**v248** → **Settings navigation & managed app updates**
