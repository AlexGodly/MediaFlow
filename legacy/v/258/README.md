# MediaFlow v258 — Modular Project

**App release:** v258  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v258 focuses on **built-in category artwork**, a clearer and larger **Add/Edit Category editor**, and another end-to-end **persistence/export/PWA audit**.

## Main v258 changes
- Added the 22 supplied MediaFlow category PNGs as built-in category icon choices.
- Built-in category artwork is packaged locally under `assets/category-icons/` and works without external image hosting.
- Enlarged and redesigned Add Category / Edit Category with clearer typography, spacing and dedicated MediaFlow icon tiles.
- Preserved the original emoji/symbol palette, saved custom icons, custom URL icons and color palette.
- Added packaged category artwork to the generated PWA app shell for offline use.
- Explicitly verifies category artwork during protected Sync Now cloud verification.
- Personal Order v4 exports current category visual metadata without changing its format version/import matching behavior.
- Re-audited Cloud Sync, Sync Now, Full + Automatic Backup, Full Data import/export, Settings Presets, managed updates, XP/progression, History CSV and Personal Order import/export.
- Compatibility remains Cloud Sync v201 / Full Backup Schema v29 / Settings Preset Schema v1 / Personal Order Export v4.
- PWA shell advances automatically to `mediaflow-pwa-v258-shell-v1`.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v258.py
```

See `docs/CHANGELOG_v258.md` for release details.
