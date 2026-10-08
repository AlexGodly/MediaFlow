# MediaFlow v246 — Mobile/Tablet PWA Support & Very-Tight-Width Responsiveness

MediaFlow v246 expands the v244/v245 Progressive Web App foundation so the installed app is explicitly polished for desktop, tablets, standard phones, and very narrow mobile widths.

## PWA install/update controls

- Replaced the generic Install MediaFlow mark with the official MediaFlow app icon.
- Install app now uses a dedicated install/download icon.
- Install app no longer becomes useless when the browser does not expose `beforeinstallprompt`.
- When a native install prompt is available, MediaFlow launches it normally.
- On iOS/iPadOS and browsers that do not expose a native prompt, Install app opens device-specific Add to Home Screen / install instructions.
- Reload app is now always a real action instead of a disabled placeholder.
- If a waiting service-worker update exists, Reload app activates that update first.
- If no update is waiting, Reload app refreshes the current installed/web app normally.
- Check PWA update now uses a semantic update/sync icon.
- Install, reload, and update-check controls remain touch-friendly on phones/tablets.

## Mobile / tablet / very-tight-width support

- Added a dedicated v246 responsive layer for installed PWA windows and browser use.
- Added tablet-specific wrapping and modal constraints up to 900px.
- Added phone-specific layout behavior up to 600px.
- Added very-tight phone handling at 360px and below.
- Added an ultra-tight fallback at 310px and below for tiny mobile/PWA windows.
- Improved safe-area support for notched phones and installed standalone PWAs.
- Improved mobile bottom navigation sizing and label handling.
- Improved More-menu sizing and vertical scrolling on small screens.
- Improved modal width, height, sticky actions, and safe-area padding.
- Improved searchable Category Filter panel sizing on narrow devices.
- Made form fields use mobile-safe readable sizing to reduce iOS focus zoom.
- Added general overflow guards for cards, grids, media, buttons, and fields.
- Reduced expensive blur/transition work on coarse-pointer/touch devices.
- Preserved content-visibility containment for large repeated title/history rows.

## PWA manifest

- Preserved GitHub Pages-relative `start_url` and `scope`.
- Preserved standalone display mode and any orientation.
- Added explicit language/direction metadata.
- Added `prefer_related_applications: false` so MediaFlow remains installable as its own PWA.
- Preserved official v245 MediaFlow favicon/PWA icon branding.

## Compatibility

- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset Schema: v1
- Personal Order Export: v4

No Library/user-data schema migration is required.
