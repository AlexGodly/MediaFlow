# MediaFlow v247 — Modular Project

**App release:** v247  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v247 builds on the v246 mobile/tablet PWA experience with a **fault-tolerant service worker, live PWA diagnostics, exact deployed-asset testing, and app-cache repair**.

## Main v247 changes
- Service-worker installation no longer fails because one app-shell file fails to cache.
- App-shell files are cached independently with retryable failures.
- Activation retries missing cache entries automatically.
- Added **PWA Diagnostics** to the Install MediaFlow Settings card.
- Added **Run PWA Test** to verify manifest, icons, worker, scope, control state, cache and every generated local app-shell URL.
- Failed deployment paths are shown directly when an asset returns an error/404.
- Added **Repair app cache** to retry missing shell entries through the active/waiting v247 worker.
- Added worker diagnostic messages: `GET_DIAGNOSTICS` and `RETRY_APP_SHELL_CACHE`.
- Install-state text now explains whether the browser exposed a native install prompt, whether checks passed, or whether deployment needs attention.
- v246 tablet/mobile/very-tight-width responsiveness is preserved, including for the new diagnostics panel.
- v245 official favicon/PWA icon branding remains canonical.
- PWA build/version/cache automation remains automatic for future MediaFlow releases.
- No cloud, backup, Settings Preset, History, Personal Order, Library or XP schema changes.

## Build
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v244.py
python scripts/smoke-v245.py
python scripts/smoke-v246.py
python scripts/smoke-v247.py
```

Deploy the project root to GitHub Pages as usual. The manifest and service-worker paths remain relative for `https://alexgodly.github.io/MediaFlow/`.

After deployment, open **Settings → Install MediaFlow → PWA Diagnostics → Run PWA Test**. If any app-shell path failed to deploy/cache, MediaFlow will show the exact path. Use **Repair app cache** after correcting deployment or when a transient cache failure needs to be retried.

See `docs/CHANGELOG_v247.md` for full release notes.
