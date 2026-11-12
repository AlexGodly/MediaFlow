# MediaFlow v462 Stable — Background Processes Startup Flash Fix

## Fixed
- On initial load the Background Processes widget no longer briefly flashes at bottom-right when your saved visibility is Hidden or your saved position is Left.
- Suppress recovery repaint events during authentication, cloud hydration, and the first app shell render.
- After the authenticated MediaFlow workspace has loaded, reveal the widget only if the already-saved Visibility setting calls for it (Always or Automatic with eligible jobs).
- Apply the restored Left/Right position and expanded state **before** the widget becomes visible; no visible relocation.
- Prevent late paint callbacks from an earlier login/account/boot cycle from restoring a stale widget.

## Preserved
- All existing Background Processes visibility settings, cloud persistence, manual Show/Hide shortcut, and floating placement preferences.
- Recovery workers, checkpoints, pause/resume, active jobs, provider health, and data synchronization are unaffected.
- Existing theme, desktop/tablet/mobile layouts and accessibility controls remain intact.

## Verification
- Dedicated state-machine test: pre-hydration recovery paint, last-saved Hidden, initial Left, tokenized cancelled reveal.
- Live Chromium desktop and 360px mobile browser checks (including the existing v459 recovery regression).
- Verified v462 bundle and PWA assets, full archive under `legacy/v/462`, numeric release `462` with ZIP and checksum.

Next planned feature: **v463 — MediaFlow Recommends: External Ratings Integration**.
