# MediaFlow v233 — Modular Project

**App release:** v233  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v233 promotes the Dynamic Library configuration into a dedicated **Dynamic Settings** section directly below Library Mode in Settings, and adds an independent **Title Details popup cover size** control to Cover Size Adjustment. v232 performance and persistence protections remain intact.

## Main v233 changes

- Added **Dynamic Settings** as a first-class Settings section and sidebar item.
- Placed Dynamic Settings directly below **Library Mode** and before **Categories**.
- Dynamic Settings contains Dynamic category row icons, Dynamic category row order/visibility controls, and Dynamic status order.
- Added a dedicated semantic Dynamic Settings sidebar icon.
- Added **Title Details popup cover** to **Cover Size Adjustment → Cover sizes by location**.
- Title Details cover sizing is independent from other Library/Dashboard cover surfaces.
- The new cover-size value participates in existing settings persistence, Cloud Sync, Full/Automatic Backup and Settings Presets without a schema bump.
- Preserved all v232 performance, Dynamic Status ownership, export/import and Title Details layout fixes.

## Build and validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v233.md` for the full release notes.
