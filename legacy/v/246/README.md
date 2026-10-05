# MediaFlow v246 — Modular Project

**App release:** v246  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v246 keeps the GitHub Pages PWA foundation from v244 and the official icon branding from v245, while extending the installed app and normal website for **tablet, mobile, very narrow phones, and tiny standalone PWA windows**.

## Main v246 changes
- Official MediaFlow icon now appears in the Install MediaFlow PWA card.
- Install app uses a dedicated install icon and remains clickable when a browser requires manual Add to Home Screen instructions.
- Reload app uses a dedicated reload icon and works even when no waiting PWA update exists.
- Check PWA update uses a semantic update/sync icon.
- Added platform-aware install guidance for iOS/iPadOS, Android, and desktop when a native install prompt is unavailable.
- Added responsive tiers for tablet, phone, <=360px tight phones, and <=310px ultra-tight widths.
- Improved mobile/PWA safe areas, bottom navigation, modals, category filters, settings, forms, and overflow handling.
- Reduced expensive visual effects on touch/coarse-pointer devices.
- PWA build/version/cache automation remains automatic for future MediaFlow releases.
- No cloud, backup, Settings Preset, History, Personal Order, or Library schema changes.

## Build
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v244.py
python scripts/smoke-v245.py
python scripts/smoke-v246.py
```

Deploy the project root to GitHub Pages as usual. The manifest and service-worker paths remain relative for `https://alexgodly.github.io/MediaFlow/`.

See `docs/CHANGELOG_v246.md` for full release notes.
