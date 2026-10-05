# MediaFlow v251 — Modular Project

**App release:** v251  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v251 is a focused Library display-mode polish release. It renames **Cover+Titles** to **Covers+Titles** in both Normal and Dynamic Library and gives the mode a dedicated covers-with-title-lines icon instead of the generic action-arrow fallback. All v250 persistence, cloud, PWA, update, XP, History, backup and import/export behavior is preserved.


## Main v251 changes
- Renamed **Cover+Titles** to **Covers+Titles** in both Normal and Dynamic Library.
- Replaced the generic action-arrow fallback with a dedicated semantic icon showing cover tiles plus title lines.
- Added an explicit `coversTitles` icon binding so the display mode keeps the correct icon reliably.
- Preserved all v250 persistence, cloud, backup, update and PWA behavior unchanged.

## Main v250 changes
- Rebuilt the About **Version & updates** card into a cleaner compact UI.
- Preserved the v249 separation between managed application updates and the dedicated PWA installation/diagnostics card.
- Removed the historical 1,000-entry cloud cap from Library History so the complete log is included in final cloud snapshots/merges.
- Strengthened protected Sync Now verification with current-state fingerprints for Settings, XP, Order, Library, History, Library History and completion timeline.
- Made update/reload transitions wait for the current save queue before navigating away.
- Re-audited Full Data Export/Import and kept Full Backup at Schema v29.
- Confirmed Automatic Backup uses the final v250 Full Backup builder.
- Re-audited Settings export/import and kept Settings Preset at Schema v1.
- Refreshed History CSV with current calculated session XP plus a complete `session_json` column.
- Refreshed Personal Order v4 export metadata and verified cloud-save completion after import.
- PWA generation remains release-aware and advances to the v250 app shell automatically.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v244.py
python scripts/smoke-v245.py
python scripts/smoke-v246.py
python scripts/smoke-v247.py
python scripts/smoke-v248.py
python scripts/smoke-v249.py
python scripts/smoke-v250.py
python scripts/smoke-v251.py
```

Deploy the project root to GitHub Pages as usual. MediaFlow continues using relative PWA paths for `https://alexgodly.github.io/MediaFlow/`.

See `docs/CHANGELOG_v251.md` for release details.
