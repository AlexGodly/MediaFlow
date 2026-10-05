# MediaFlow v244 — Modular Project

**App release:** v244  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v244 turns the GitHub Pages build into a first-class **Progressive Web App (PWA)**. MediaFlow can be installed as a standalone app, keeps a versioned local app shell for reliable launch, exposes install/update controls in **Settings → App Updates**, and now regenerates its PWA cache/service-worker metadata as part of the normal release build.

## Main v244 changes
- GitHub Pages-safe PWA manifest using relative scope/start URL.
- Local 192px, 512px, maskable and Apple touch icons.
- Versioned service-worker app-shell cache.
- Network-first page navigation with cached app-shell fallback.
- Controlled waiting-worker update flow with **Reload update**.
- Install / update / PWA-status controls under **App Updates**.
- `scripts/pwa.py` automatically discovers current local CSS/JS assets and regenerates `sw.js`.
- `scripts/build.py` now follows `VERSION`, builds the current versioned bundle and refreshes PWA release metadata automatically.
- No Library/cloud/backup schema changes.

## Build
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v244.py
```

Deploy the project root to GitHub Pages as usual. Because the manifest and service-worker paths are relative, the PWA is compatible with the existing `https://alexgodly.github.io/MediaFlow/` project path.

See `docs/CHANGELOG_v244.md` for full release notes.
