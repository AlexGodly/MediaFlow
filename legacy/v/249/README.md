# MediaFlow v249 — Modular Project

**App release:** v249  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v249 corrects the scope of the managed application-update UI introduced in v248. The advanced update experience remains in **APP UPDATES / Automatic update checking**, while the separate **Install MediaFlow** PWA card is restored to its v247 layout and behavior.

## Main v249 changes
- Restored the separate PWA card to the v247-style **Install app / Reload app or Reload update / Check PWA update** controls.
- Removed the duplicated **Install update** action, managed-update progress UI, and dynamic release badge from the PWA card.
- Preserved **PWA Diagnostics**, **Run PWA Test**, and **Repair app cache**.
- Kept the v248 managed update flow in **Automatic update checking**: dynamic states, Install update, progress/success/failure, and automatic update installation.
- Kept the v248 Settings navigation responsiveness, drag scrolling, and APP UPDATES highlight fix.
- Updated the restored PWA status text to use the current release dynamically rather than a hard-coded v247 label.
- No cloud, backup, Settings Preset, Library, History, Personal Order, or XP schema changes.

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
```

Deploy the project root to GitHub Pages as usual. MediaFlow continues using relative PWA paths for `https://alexgodly.github.io/MediaFlow/`.

When an application update is detected, the managed update workflow remains in the application-update surfaces. The separate PWA card stays focused on PWA installation, reload/update activation, manual PWA checking, diagnostics, and cache repair.

See `docs/CHANGELOG_v249.md` for full release notes.
