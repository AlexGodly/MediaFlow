# MediaFlow v257 — Modular Project

**App release:** v257  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v257 focuses on **Dashboard time-tool persistence**, **responsive Settings navigation reliability**, **mobile/tablet PWA installation compatibility**, and a safer **pre-update Full Backup** workflow.

## Main v257 changes
- Runtime Calculator now uses a dedicated **clock** header icon.
- Stopwatch and Runtime Calculator header icons remain static and do not rotate when the accordion opens/closes.
- Stopwatch and Runtime Calculator state now participate in MediaFlow's cloud snapshot/merge/restore pipeline and Sync Now verification.
- Horizontal Settings navigation hides its visual scrollbar at responsive widths while keeping drag/touch browsing.
- Fixed responsive Settings section clicks so the selected section is reached and stays highlighted on desktop, tablet, mobile and very narrow widths.
- Added install-safe opaque 192×192 and 512×512 PWA icons for Chromium/Android installation while preserving the maskable MediaFlow icon.
- Added device-aware PWA guidance for Android phones/tablets and iPhone/iPad installation.
- iOS/iPadOS guidance uses the platform-native **Share → Add to Home Screen** flow.
- Added an optional **Export Full Backup before update** preference to managed MediaFlow updates.
- When enabled, update progress is explicitly split into **Step 1: Full Backup export** and **Step 2: update installation**.
- If pre-update backup export fails, the managed update is stopped instead of continuing without the requested backup.
- PWA shell advances automatically to `mediaflow-pwa-v257-shell-v1`.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v257.py
```

See `docs/CHANGELOG_v257.md` for release details.
