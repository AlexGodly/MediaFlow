# MediaFlow v272 — Logs Title Covers & Edit Title Header Repair

**App release:** v272  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v272 builds on v271 with a focused Logs and Edit Title polish pass.

## Highlights

- **History → Logs** now shows consumed title covers + names.
- Real title `coverUrl` is used when available; otherwise the title's MediaFlow category artwork/icon becomes the cover fallback.
- Multi-title sessions render all consumed titles in a compact horizontal rail.
- Removes the obsolete standalone category-icon column from Logs rows and keeps cover/title alignment organized.
- Adds **History · Logs covers** to Settings → Cover Size Adjustment.
- The new cover-size preference flows through the normal local settings, Cloud Sync, Full Backup and Settings Preset paths.
- Repairs the **Edit title** / **Delete title** header layout so the two controls never overlap or inherit the old sticky-title positioning.
- Preserves v270/v271 History pagination/performance, all five History tabs, exports, Sync Now and dynamic themes.
- PWA shell advances to `mediaflow-pwa-v272-shell-v1`.
- No data migration or schema bump is required.

## Validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v272.py
python scripts/perf-v272.py
```

The v272 smoke suite validates Logs cover/title rendering, category-artwork fallbacks, independent Logs cover sizing through cloud/settings snapshots, desktop/mobile overflow, and the repaired Edit Title header geometry. The performance suite retains the v270/v271 synthetic 30,000-title / 5,000-history-log stress test.
