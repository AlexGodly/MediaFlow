# MediaFlow v255 — Modular Project

**App release:** v255  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v255 is a small visual polish release for the **On cover** status overlay shared by Normal Library and Dynamic Library in **Covers** and **Covers+Titles**.

## Main v255 changes
- **Completed** cover status icon is now **blue**.
- **Plan to Watch** cover status icon is now **white**.
- The change is scoped only to the cover-overlay status badge; status styling elsewhere in MediaFlow is unchanged.
- Preserved all v254 overlay controls and all prior Library, Seasons View, History, cloud, backup, update and PWA behavior.
- PWA shell advances automatically to `mediaflow-pwa-v255-shell-v1`.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v255.py
```

See `docs/CHANGELOG_v255.md` for release details.
