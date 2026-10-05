# MediaFlow v245 — Modular Project

**App release:** v245  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v245 keeps the v244 GitHub Pages **Progressive Web App (PWA)** foundation and unifies MediaFlow's visible application identity around the supplied **Alex Godly transparent icon**.

## Main v245 changes
- Supplied Alex Godly `.ico` is now the canonical website favicon.
- The same icon identity is used for the PWA 192px/512px install icons.
- Apple touch icon regenerated from the supplied artwork.
- Maskable Android/PWA icon uses the same logo inside a safe maskable area.
- Favicon assets are part of the versioned offline app shell.
- PWA cache automatically advanced to the v245 release through the existing `scripts/pwa.py` pipeline.
- v244 install/update/offline behavior remains intact and future versions continue inheriting the PWA build contract.
- No Library/cloud/backup schema changes.

## Build
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v244.py
python scripts/smoke-v245.py
```

Deploy the project root to GitHub Pages as usual. Because the manifest and service-worker paths are relative, the PWA is compatible with the existing `https://alexgodly.github.io/MediaFlow/` project path.

See `docs/CHANGELOG_v245.md` for full release notes.
