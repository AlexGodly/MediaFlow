# MediaFlow v248 — Modular Project

**App release:** v248  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v248 builds on the v247 PWA reliability layer with a **responsive/draggable Settings navigator and a managed application-update experience** across About, App Updates, and Install MediaFlow.

## Main v248 changes
- Fixed Settings sidebar responsiveness on desktop and narrow-desktop layouts.
- When Settings navigation becomes horizontal, it supports native touch scrolling plus mouse/pen click-drag scrolling.
- Fixed **APP UPDATES** highlighting so the previous Settings section no longer remains selected at the bottom of the page.
- Added shared dynamic update icons for checking, update available, ready to install, installing, up to date, success, and failure states.
- Updated **Check now** on About, Automatic Update Checking in Settings, and the Install MediaFlow area to use the live update state.
- Added **Install update** when a newer hosted/PWA release is detected.
- Added staged update progress, success/failure feedback, service-worker activation, and a hosted refresh fallback.
- Added a persistent **Automatically install MediaFlow updates** toggle.
- Added a MediaFlow-branded update-ready block with the official app icon and green **Install MediaFlow / Ready to install** state above Install update / Reload app actions.
- Kept **Reload app** separate from **Install update** while preserving the legacy PWA reload control ID/API for regression compatibility.
- Preserved v247 PWA diagnostics and app-cache repair.
- Preserved v246 phone, very-tight-width mobile, tablet, desktop, and standalone-PWA responsiveness.
- No cloud, backup, Settings Preset, Library, History, Personal Order, or XP schema changes.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v244.py
python scripts/smoke-v245.py
python scripts/smoke-v246.py
python scripts/smoke-v247.py
python scripts/smoke-v248.py
```

Deploy the project root to GitHub Pages as usual. MediaFlow continues using relative PWA paths for `https://alexgodly.github.io/MediaFlow/`.

When an update is detected, **About**, **Settings → App Updates**, and **Install MediaFlow** expose the current update state. Hosted/PWA builds can install/apply the latest deployed release; a local `file://` copy cannot replace its own files and reports that limitation explicitly.

See `docs/CHANGELOG_v248.md` for full release notes.
