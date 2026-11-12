# MediaFlow v244 — Progressive Web App Foundation

MediaFlow v244 makes the GitHub Pages build a first-class Progressive Web App (PWA). The release adds a complete install/update lifecycle, local install icons, versioned app-shell caching, offline launch fallback, and build automation so every future MediaFlow release can keep the PWA layer synchronized with the current app version.

## Progressive Web App
- MediaFlow can now be installed from supported browsers as a standalone app.
- GitHub Pages is the primary supported hosted deployment and already provides the HTTPS requirement used by service workers.
- The PWA uses relative `start_url` and `scope` values so it works correctly from the `/MediaFlow/` GitHub Pages project path rather than assuming domain-root hosting.
- Standalone display mode removes normal browser chrome when launched from an installed app shortcut.

## Local PWA icons
- Added local 192×192 and 512×512 PNG install icons.
- Added a dedicated 512×512 maskable icon.
- Added a 180×180 Apple touch icon for iOS/iPadOS home-screen installation.
- PWA installability no longer depends on the previous remote manifest icon URL.

## GitHub Pages service worker
- Reworked `sw.js` into a versioned MediaFlow PWA service worker.
- v244 app-shell cache: `mediaflow-pwa-v244-shell-v1`.
- Current local CSS, JavaScript, manifest, version metadata and PWA icons are precached.
- Navigation uses a network-first strategy with cached `index.html` fallback so hosted releases stay fresh while an already-loaded app shell can still launch when the network is unavailable.
- `version.json` and `manifest.json` also use network-first behavior.
- Old MediaFlow/PWA caches are cleaned during service-worker activation.
- Cross-origin APIs, Supabase requests, Google Fonts and user cover-image URLs are intentionally left to their existing network behavior instead of being indiscriminately cached.

## Controlled PWA updates
- Service-worker registration now uses `updateViaCache: 'none'` so browsers do not keep an outdated service-worker script through HTTP cache.
- MediaFlow checks the service-worker registration on launch.
- It checks again after returning online and when the app becomes visible after being idle.
- A newly installed worker is allowed to wait safely instead of forcing an unexpected mid-session reload.
- **Reload update** sends `SKIP_WAITING` only when the user chooses to apply the waiting app-shell update.
- MediaFlow reloads after the new worker becomes the controller.

## Settings → App Updates PWA controls
The existing App Updates section now also includes an **Install MediaFlow** PWA card.

Depending on browser/platform state it can expose:
- **Install app**
- **Reload update**
- **Check PWA update**
- installed/offline-ready/update-ready status

Browsers that do not expose an install prompt can still use their native **Install app / Add to Home Screen** menu.

## Existing MediaFlow update checker integration
The existing hosted-version checker remains active. Checking the hosted MediaFlow version now also asks the PWA registration to check its service worker, keeping the installed app-shell path aligned with the normal web-release checker.

## PWA-aware mobile metadata
Added/updated:
- application name/description
- `mobile-web-app-capable`
- Apple standalone metadata
- Apple status-bar metadata
- Apple touch icon
- local favicon/install icon metadata

## Offline behavior
v244 caches the MediaFlow app shell so an installed build can reopen its local interface after a successful online load. Online account authentication, cloud synchronization, third-party metadata services and uncached external artwork still require their respective network services.

## Future release automation
PWA maintenance is now part of the build process rather than a manually maintained asset list.

### `scripts/pwa.py`
- reads the current `VERSION`
- discovers the current local CSS/JS entry assets from `index.html`
- verifies precache files exist
- aligns `version.json`
- refreshes manifest release-safe fields
- regenerates `sw.js`
- creates the versioned PWA cache name

### `scripts/build.py`
- now builds `assets/js/mediaflow-v<current VERSION>.bundle.js`
- updates the version meta/bundle entry in `index.html`
- automatically runs `scripts/pwa.py`

As a result, future MediaFlow releases can keep the PWA layer current simply by advancing the normal MediaFlow release version and running the build pipeline.

## Validation
- Added `scripts/smoke-v244.py` for PWA manifest/service-worker/runtime UI checks.
- `scripts/check.py` now validates the v244 bundle, local icons, manifest scope, service-worker cache/version, offline navigation fallback, controlled-update path and future PWA build automation.
- JavaScript syntax validation remains part of the normal build.

## Data compatibility
v244 adds installation/update infrastructure only. It does not alter MediaFlow user-data formats.

Compatibility remains:
- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4
