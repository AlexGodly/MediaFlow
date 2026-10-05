# MediaFlow v254 — Modular Project

**App release:** v254  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v254 adds optional cover overlays to the two visual Library display modes: **Covers** and **Covers+Titles**. The feature is shared by Normal Library and Dynamic Library and provides independent show/hide controls for status, category, rating and progress without affecting List, Compact or Cards views.

## Main v254 changes
- Added a compact **On cover** control bar shown only in Covers and Covers+Titles.
- Added independent persistent toggles for **Status**, **Category**, **Rating** and **Progress**.
- Status uses the title's semantic MediaFlow status icon (Watching, Completed, On Hold, Dropped or Plan to Watch).
- Category uses the title's real configured category icon, including custom icon URLs/emoji.
- Rating is shown only when the title has a positive rating.
- Progress is rendered as a bar attached to the bottom edge of the cover and is calculated from `progress / total`.
- Overlay rendering works in both **Normal Library** and **Dynamic Library**.
- Dynamic Library cover selection remains usable; the status badge shifts away from the selection checkbox when needed.
- Overlay visibility preferences persist in Settings, Settings Presets, Full Backup and cloud settings merge behavior.
- Preserved v253 Seasons View, recommended-title logging, History batch management and all prior persistence/update/PWA behavior.
- Advanced the PWA shell to `mediaflow-pwa-v254-shell-v1`.

## Display-mode scope
The new overlay controls appear only when the current Library display mode is:
- **Covers**
- **Covers+Titles**

They are intentionally absent from:
- List
- Compact
- Cards

## Preserved compatibility
- Cloud Sync v201.
- Full Backup Schema v29 and Automatic Backup.
- Settings Preset Schema v1.
- Personal Order Export v4.
- v253 Seasons View and History batch-management behavior.
- v250 cloud/history persistence reliability.
- v249 application-update/PWA separation.
- v247 PWA diagnostics and cache repair.
- v246 desktop/tablet/mobile/very-narrow-width responsiveness.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v254.py
```

v254 smoke validation covers Normal and Dynamic Library overlays, status/category/rating/progress rendering, visibility toggling, cover-mode exclusivity, persistent settings state, and responsive layouts at 820px, 390px, 320px and 280px.

Deploy the project root to GitHub Pages as usual. MediaFlow continues using relative PWA paths for `https://alexgodly.github.io/MediaFlow/`.

See `docs/CHANGELOG_v254.md` for release details.
