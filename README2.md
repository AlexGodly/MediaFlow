# MediaFlow v232 — Modular Project

**App release:** v232  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v232 is a performance/reliability and data-pipeline audit release. It removes the Library mutation-observer loop that could make large category/status interactions freeze, makes Dynamic Library status ordering independent from Set Status/Status Filter layouts, audits current backup/cloud/export paths, and redesigns Title Details for a wider icon-clean desktop layout.

## Main v232 changes

- **Library Mode** is first in the Settings → Library group, followed by Categories.
- Removed repeated inherited-source prose from Choice & Filter Layout.
- Added a meaningful icon for exact **All** actions.
- Replaced three whole-document UI observers with one scoped/batched enhancer.
- Optimized Normal Library category-filter/overview rendering for large Libraries.
- Optimized Dynamic Library category/status counting and status switching.
- Dynamic Library status order is now controlled only by **Dynamic Status Row** settings.
- Audited Cloud/Sync Now, Full + Automatic Backup, Settings Preset, Personal Order export/import, and History export.
- Personal Order dedicated export format is now **v4**.
- Title Details is wider/denser on desktop and keeps icons only on its four action buttons.
- Added `scripts/perf-v232.py`, including a synthetic **30,000-title** Library regression test.

## Build and validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v232.md` for the full release notes.
