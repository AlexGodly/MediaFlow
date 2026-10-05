# MediaFlow v240 — Modular Project

**App release:** v240  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v240 reorganizes Edit Title into a cleaner full-width editor, adds a dedicated logged-title cover-size setting, removes the unwanted profile action icon, and re-audits current persistence/export paths.

## Main v240 changes

- Edit Title now uses the desktop canvas efficiently.
- **Category + Status** are grouped together.
- **Progress + Total** are grouped together.
- Artwork/dates, priority/rating, estimated minutes/tags and repeat metadata are laid out more cleanly.
- Responsive Edit Title remains scroll-safe on short/tablet/mobile viewports.
- Added **Logged / Batch selected covers** to Cover Sizes by Location.
- Removed the extra neutral icon beside the sidebar profile/avatar control.
- Re-audited Full Data Export/Import, Automatic Backup, Cloud Sync / Sync Now, Settings Presets, Personal Order export/import and History CSV.

## Build

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v240.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v240.md` for the release notes.
