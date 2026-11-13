# MediaFlow v245 — Unified Alex Godly App Icon Branding

MediaFlow v245 standardizes the icon identity used by the website and installed Progressive Web App.

## Main changes

- Replaced the MediaFlow browser favicon with the supplied **Alex Godly transparent icon**.
- Added the exact supplied `.ico` as the canonical root `favicon.ico`.
- Added the same canonical `.ico` under `assets/icons/mediaflow.ico`.
- Regenerated the 32×32 website PNG favicon fallback from the supplied icon.
- Regenerated the 192×192 PWA install icon from the supplied icon.
- Regenerated the 512×512 PWA install icon from the supplied icon.
- Regenerated the Apple touch icon from the supplied icon.
- Regenerated the maskable PWA icon using the same logo inside a safe maskable area.
- Kept the GitHub Pages-relative PWA manifest and scope.
- Added the favicon assets to the versioned PWA app-shell cache.
- Advanced the release-aware PWA cache to **mediaflow-pwa-v245-shell-v1**.
- Preserved the v244 install/update lifecycle and future-release PWA build automation.
- Added a focused v245 icon-branding smoke test.
- No Library, cloud, backup, settings-preset, History, or Personal Order data schema changes.

## Compatibility

- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset Schema: v1
- Personal Order Export: v4
