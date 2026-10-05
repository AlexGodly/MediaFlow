# MediaFlow v259 — Modular Project

**App release:** v259  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v259 is a focused polish release for the built-in category artwork picker introduced in v258.

## Main v259 changes
- Removed the visible names/text underneath the 22 built-in MediaFlow category icons.
- Removed the extra neutral action icon that appeared above each packaged artwork tile.
- Reduced tile and image-preview sizing for a cleaner, denser category icon showcase.
- Preserved hover titles and accessible labels so the icon names are still discoverable without visual clutter.
- Preserved v258 category icon persistence, cloud/backup/export behavior and PWA offline assets.
- Compatibility remains Cloud Sync v201 / Full Backup Schema v29 / Settings Preset Schema v1 / Personal Order Export v4.
- PWA shell advances automatically to `mediaflow-pwa-v259-shell-v1`.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v259.py
```

See `docs/CHANGELOG_v259.md` for release details.
