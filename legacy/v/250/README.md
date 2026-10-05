# MediaFlow v250 — Modular Project

**App release:** v250  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v250 cleans the **About → Version & updates** UI and performs a complete current persistence/integrity audit across cloud saving, Sync Now, PWA/update transitions, Full Data export/import, Automatic Backup, Settings Presets, XP/progression, History export and Personal Order import/export.

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
```

Deploy the project root to GitHub Pages as usual. MediaFlow continues using relative PWA paths for `https://alexgodly.github.io/MediaFlow/`.

See `docs/CHANGELOG_v250.md` for release details.
